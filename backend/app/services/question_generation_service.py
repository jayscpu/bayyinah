import json

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.llm_client import chat_completion
from app.ai.prompts.question_gen import QUESTION_GENERATION_PROMPT
from app.models.exam import Exam
from app.models.question import ExamQuestion
from app.rag.retriever import retrieve_chunks, format_chunks_as_context


async def generate_exam_questions(exam_id: str, course_id: str, db: AsyncSession):
    """Generate exam questions using RAG + LLM."""
    result = await db.execute(select(Exam).where(Exam.id == exam_id))
    exam = result.scalar_one_or_none()
    if not exam:
        return

    # Retrieve diverse chunks from course materials
    chunks = retrieve_chunks(course_id, "key concepts and topics", n_results=10)
    context = format_chunks_as_context(chunks)

    if context == "No course material context available.":
        print(f"No course materials found for course {course_id}. Upload materials before generating questions.")
        return

    prompt = QUESTION_GENERATION_PROMPT.format(
        question_count=exam.question_count,
        course_material=context,
    )

    response = await chat_completion(
        messages=[
            {"role": "system", "content": "You are an exam question generator. Always respond with valid JSON arrays only."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
        max_tokens=4000,
    )

    # Parse JSON response
    print(f"LLM response length: {len(response)}")
    print(f"LLM response preview: {response[:500]}")
    try:
        # Try to extract JSON from the response
        response_text = response.strip()
        if response_text.startswith("```"):
            lines = response_text.split("```")
            response_text = lines[1] if len(lines) > 1 else response_text
            if response_text.startswith("json"):
                response_text = response_text[4:]
        # Try to find JSON array in the response
        if "[" in response_text:
            start = response_text.index("[")
            end = response_text.rindex("]") + 1
            response_text = response_text[start:end]
        questions_data = json.loads(response_text)
    except (json.JSONDecodeError, ValueError) as e:
        print(f"Failed to parse question generation response: {e}")
        print(f"Response was: {response[:500]}")
        return

    # Create question records
    for q_data in questions_data[:exam.question_count]:
        question = ExamQuestion(
            exam_id=exam_id,
            question_type=q_data.get("question_type", "essay"),
            question_text=q_data.get("question_text", ""),
            mcq_options=q_data.get("mcq_options"),
            source_chunks=[c.get("id") for c in chunks[:3]],
            display_order=q_data.get("display_order", 1),
        )
        db.add(question)

    await db.commit()
