import json
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.llm_client import chat_completion
from app.ai.prompts.assignment import (
    ASSIGNMENT_SOCRATIC_SYSTEM_PROMPT,
    ASSIGNMENT_SOCRATIC_FOLLOWUP,
    ASSIGNMENT_EVALUATION_PROMPT,
)
from app.models.assignment import AssignmentSubmission, AssignmentDialogueMessage, Assignment
from app.models.course import Course
from app.rag.retriever import retrieve_chunks, format_chunks_as_context


def extract_text_from_file(file_bytes: bytes, filename: str) -> str:
    """Extract text from uploaded file. Supports PDF, TXT, DOCX."""
    filename_lower = filename.lower()
    try:
        if filename_lower.endswith(".pdf"):
            import fitz  # pymupdf
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            parts = []
            for page in doc:
                parts.append(page.get_text())
            doc.close()
            text = "\n".join(parts)
        elif filename_lower.endswith(".txt"):
            text = file_bytes.decode("utf-8", errors="replace")
        elif filename_lower.endswith(".docx"):
            import docx
            import io
            doc = docx.Document(io.BytesIO(file_bytes))
            text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
        else:
            text = file_bytes.decode("utf-8", errors="replace")
    except Exception as e:
        print(f"Text extraction failed for {filename}: {e}")
        text = "[Could not extract text from file]"

    # Truncate to 8000 chars to fit LLM context window
    return text.strip()[:8000]


async def generate_assignment_socratic_question(
    submission_id: str,
    turn_number: int,
    db: AsyncSession,
) -> AssignmentDialogueMessage:
    """Generate a Socratic question about the student's uploaded assignment."""

    result = await db.execute(select(AssignmentSubmission).where(AssignmentSubmission.id == submission_id))
    submission = result.scalar_one()

    result = await db.execute(select(Assignment).where(Assignment.id == submission.assignment_id))
    assignment = result.scalar_one()

    result = await db.execute(select(Course).where(Course.id == assignment.course_id))
    course = result.scalar_one()

    # Retrieve RAG context
    query = f"{assignment.title} {(submission.extracted_text or '')[:200]}"
    chunks = retrieve_chunks(assignment.course_id, query, n_results=3)
    rag_context = format_chunks_as_context(chunks)

    # Build system prompt
    system_prompt = ASSIGNMENT_SOCRATIC_SYSTEM_PROMPT.format(
        course_title=course.title,
        assignment_title=assignment.title,
        assignment_description=assignment.description or "(No description provided)",
        student_file_text=submission.extracted_text or "(No text extracted)",
        rag_context=rag_context,
    )

    # Build message history
    messages = [{"role": "system", "content": system_prompt}]

    # Add previous dialogue turns
    result = await db.execute(
        select(AssignmentDialogueMessage)
        .where(AssignmentDialogueMessage.submission_id == submission_id)
        .order_by(AssignmentDialogueMessage.turn_number, AssignmentDialogueMessage.created_at)
    )
    previous_messages = result.scalars().all()

    for msg in previous_messages:
        role = "assistant" if msg.role == "agent" else "user"
        messages.append({"role": role, "content": msg.content})

    # Add instruction
    if turn_number == 1:
        messages.append({
            "role": "user",
            "content": "Begin the Socratic examination of the student's submission. Ask your first probing question. Output ONLY the question."
        })
    else:
        messages.append({"role": "user", "content": ASSIGNMENT_SOCRATIC_FOLLOWUP})

    # Generate question
    response = await chat_completion(messages=messages, temperature=0.7, max_tokens=200)
    content = response.strip()
    if not content:
        response = await chat_completion(messages=messages, temperature=0.9, max_tokens=200)
        content = response.strip() or "Can you elaborate on the main argument in your submission?"

    # Store agent message
    agent_message = AssignmentDialogueMessage(
        submission_id=submission_id,
        role="agent",
        content=content,
        turn_number=turn_number,
    )
    db.add(agent_message)
    await db.flush()

    return agent_message


async def evaluate_assignment_submission(submission_id: str, db: AsyncSession) -> None:
    """AI-evaluate a completed assignment submission and score 0-100."""

    result = await db.execute(select(AssignmentSubmission).where(AssignmentSubmission.id == submission_id))
    submission = result.scalar_one_or_none()
    if not submission:
        return

    result = await db.execute(select(Assignment).where(Assignment.id == submission.assignment_id))
    assignment = result.scalar_one_or_none()
    if not assignment:
        return

    result = await db.execute(select(Course).where(Course.id == assignment.course_id))
    course = result.scalar_one_or_none()

    # Build dialogue transcript
    result = await db.execute(
        select(AssignmentDialogueMessage)
        .where(AssignmentDialogueMessage.submission_id == submission_id)
        .order_by(AssignmentDialogueMessage.turn_number, AssignmentDialogueMessage.created_at)
    )
    messages = result.scalars().all()

    transcript_parts = []
    for msg in messages:
        label = "Examiner" if msg.role == "agent" else "Student"
        transcript_parts.append(f"**{label}**: {msg.content}")
    transcript = "\n".join(transcript_parts)

    # Get RAG context
    chunks = retrieve_chunks(assignment.course_id, assignment.title, n_results=5)
    rag_context = format_chunks_as_context(chunks)

    prompt = ASSIGNMENT_EVALUATION_PROMPT.format(
        assignment_title=assignment.title,
        assignment_description=assignment.description or "(No description provided)",
        student_file_text=submission.extracted_text or "(No text extracted)",
        rag_context=rag_context,
        dialogue_transcript=transcript,
    )

    response = await chat_completion(
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=1000,
    )

    try:
        response_text = response.strip()
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
        evaluation = json.loads(response_text)

        submission.ai_score = evaluation.get("overall_score", 0)
        submission.ai_score_reasoning = {
            "comprehension": evaluation.get("comprehension", {}),
            "critical_thinking": evaluation.get("critical_thinking", {}),
            "application": evaluation.get("application", {}),
            "summary": evaluation.get("summary", ""),
        }
        submission.status = "scored"
        submission.completed_at = datetime.now(timezone.utc)
        await db.commit()
    except json.JSONDecodeError:
        print(f"Failed to parse assignment evaluation response: {response[:200]}")
