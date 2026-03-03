from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.llm_client import chat_completion
from app.ai.prompts.socratic import SOCRATIC_SYSTEM_PROMPT, SOCRATIC_FOLLOWUP_INSTRUCTION
from app.models.student_answer import StudentAnswer
from app.models.exam_session import ExamSession
from app.models.exam import Exam
from app.models.question import ExamQuestion
from app.models.course import Course
from app.models.dialogue import DialogueMessage
from app.rag.retriever import retrieve_chunks, format_chunks_as_context


async def generate_socratic_question(
    answer: StudentAnswer,
    turn_number: int,
    db: AsyncSession,
) -> DialogueMessage:
    """Generate a Socratic question for the given turn."""

    # Load related data
    result = await db.execute(select(ExamQuestion).where(ExamQuestion.id == answer.question_id))
    question = result.scalar_one()

    result = await db.execute(select(ExamSession).where(ExamSession.id == answer.session_id))
    session = result.scalar_one()

    result = await db.execute(select(Exam).where(Exam.id == session.exam_id))
    exam = result.scalar_one()

    result = await db.execute(select(Course).where(Course.id == exam.course_id))
    course = result.scalar_one()

    # Get student's answer text
    student_answer_text = answer.answer_text or ""
    if answer.mcq_selections:
        selections = answer.mcq_selections
        parts = []
        for sel in selections:
            parts.append(f"Selected: {sel.get('key', '?')} — Justification: {sel.get('justification', 'N/A')}")
        student_answer_text = "\n".join(parts)

    # Retrieve RAG context
    query = f"{question.question_text} {student_answer_text}"
    chunks = retrieve_chunks(exam.course_id, query, n_results=3)
    rag_context = format_chunks_as_context(chunks)

    # Build system prompt
    system_prompt = SOCRATIC_SYSTEM_PROMPT.format(
        course_title=course.title,
        weight_conceptual=exam.weight_conceptual,
        weight_interconnection=exam.weight_interconnection,
        weight_application=exam.weight_application,
        weight_reasoning=exam.weight_reasoning,
        rag_context=rag_context,
        question_text=question.question_text,
        student_answer=student_answer_text,
    )

    # Build message history
    messages = [{"role": "system", "content": system_prompt}]

    # Add previous dialogue turns
    result = await db.execute(
        select(DialogueMessage)
        .where(DialogueMessage.answer_id == answer.id)
        .order_by(DialogueMessage.turn_number, DialogueMessage.created_at)
    )
    previous_messages = result.scalars().all()

    for msg in previous_messages:
        role = "assistant" if msg.role == "agent" else "user"
        messages.append({"role": role, "content": msg.content})

    # Add instruction
    if turn_number == 1:
        messages.append({"role": "user", "content": "Begin the Socratic examination. Ask your first probing question about the student's answer. Output ONLY the question."})
    else:
        messages.append({"role": "user", "content": SOCRATIC_FOLLOWUP_INSTRUCTION})

    # Generate Socratic question
    response = chat_completion(
        messages=messages,
        temperature=0.7,
        max_tokens=200,
    )

    # Store the agent's message
    agent_message = DialogueMessage(
        answer_id=answer.id,
        role="agent",
        content=response.strip(),
        turn_number=turn_number,
        rag_chunks_used=[c.get("id") for c in chunks],
    )
    db.add(agent_message)
    await db.flush()

    return agent_message
