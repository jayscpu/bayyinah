import json

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.llm_client import chat_completion
from app.ai.prompts.evaluation import EVALUATION_PROMPT
from app.models.exam_session import ExamSession
from app.models.exam import Exam
from app.models.student_answer import StudentAnswer
from app.models.question import ExamQuestion
from app.models.dialogue import DialogueMessage
from app.rag.retriever import retrieve_chunks, format_chunks_as_context


async def evaluate_session(session_id: str, db: AsyncSession):
    """Evaluate a completed exam session using AI."""
    result = await db.execute(select(ExamSession).where(ExamSession.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        return

    result = await db.execute(select(Exam).where(Exam.id == session.exam_id))
    exam = result.scalar_one_or_none()
    if not exam:
        return

    # Build full transcript
    transcript_parts = []
    result = await db.execute(
        select(StudentAnswer).where(StudentAnswer.session_id == session_id)
    )
    answers = result.scalars().all()

    for answer in answers:
        result = await db.execute(select(ExamQuestion).where(ExamQuestion.id == answer.question_id))
        question = result.scalar_one()

        transcript_parts.append(f"## Question {question.display_order}: {question.question_text}")
        transcript_parts.append(f"**Type**: {question.question_type}")

        if answer.answer_text:
            transcript_parts.append(f"**Student Answer**: {answer.answer_text}")
        if answer.mcq_selections:
            for sel in answer.mcq_selections:
                transcript_parts.append(f"**MCQ Selection**: {sel.get('key')} — Justification: {sel.get('justification', 'N/A')}")

        # Add dialogue
        result = await db.execute(
            select(DialogueMessage)
            .where(DialogueMessage.answer_id == answer.id)
            .order_by(DialogueMessage.turn_number, DialogueMessage.created_at)
        )
        messages = result.scalars().all()
        for msg in messages:
            role_label = "Examiner" if msg.role == "agent" else "Student"
            transcript_parts.append(f"**{role_label}**: {msg.content}")
        transcript_parts.append("")

    transcript = "\n".join(transcript_parts)

    # Get RAG context
    chunks = retrieve_chunks(exam.course_id, "overall course assessment", n_results=5)
    rag_context = format_chunks_as_context(chunks)

    prompt = EVALUATION_PROMPT.format(
        weight_conceptual=exam.weight_conceptual,
        weight_interconnection=exam.weight_interconnection,
        weight_application=exam.weight_application,
        weight_reasoning=exam.weight_reasoning,
        rag_context=rag_context,
        transcript=transcript,
    )

    response = chat_completion(
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=2000,
    )

    try:
        response_text = response.strip()
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
        evaluation = json.loads(response_text)

        session.ai_score = evaluation.get("overall_score", 0)
        session.ai_criterion_scores = {
            "conceptual": evaluation.get("conceptual", {}),
            "interconnection": evaluation.get("interconnection", {}),
            "application": evaluation.get("application", {}),
            "reasoning": evaluation.get("reasoning", {}),
            "summary": evaluation.get("summary", ""),
        }
        session.status = "scored"
        await db.commit()
    except json.JSONDecodeError:
        print(f"Failed to parse evaluation response: {response[:200]}")
