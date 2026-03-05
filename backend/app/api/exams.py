from datetime import datetime, timezone

from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.exceptions import NotFoundError, ForbiddenError, BadRequestError
from app.core.permissions import get_current_user, require_role
from app.models.user import User
from app.models.course import Course, CourseEnrollment
from app.models.exam import Exam
from app.models.question import ExamQuestion
from app.models.exam_session import ExamSession
from app.schemas.exam import ExamCreate, ExamUpdate, ExamResponse
from app.schemas.question import QuestionResponse
from app.schemas.dialogue import SessionResponse

router = APIRouter(prefix="/api/exams", tags=["exams"])


@router.post("", response_model=ExamResponse)
async def create_exam(
    data: ExamCreate,
    current_user: User = Depends(require_role("teacher")),
    db: AsyncSession = Depends(get_db),
):
    # Verify course ownership
    result = await db.execute(select(Course).where(Course.id == data.course_id))
    course = result.scalar_one_or_none()
    if not course or course.teacher_id != current_user.id:
        raise ForbiddenError("You do not own this course")

    exam = Exam(
        course_id=data.course_id,
        created_by=current_user.id,
        title=data.title,
        description=data.description,
        weight_conceptual=data.weight_conceptual,
        weight_interconnection=data.weight_interconnection,
        weight_application=data.weight_application,
        weight_reasoning=data.weight_reasoning,
    )
    db.add(exam)
    await db.flush()

    return exam


def _generate_questions(exam_id: str, course_id: str):
    """Background task to generate exam questions via RAG + LLM."""
    import asyncio
    from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
    from app.config import settings
    from app.services.question_generation_service import generate_exam_questions

    async def run():
        engine = create_async_engine(settings.DATABASE_URL, echo=False)
        session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        async with session_factory() as db:
            try:
                await generate_exam_questions(exam_id, course_id, db)
                await db.commit()
                print(f"Questions generated for exam {exam_id}")
            except Exception as e:
                import traceback
                print(f"Question generation failed for exam {exam_id}: {e}")
                traceback.print_exc()
        await engine.dispose()

    asyncio.run(run())


@router.get("", response_model=list[ExamResponse])
async def list_exams(
    course_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Exam).where(Exam.course_id == course_id)
    if current_user.role == "student":
        query = query.where(Exam.status == "published")
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{exam_id}", response_model=ExamResponse)
async def get_exam(
    exam_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Exam).where(Exam.id == exam_id))
    exam = result.scalar_one_or_none()
    if not exam:
        raise NotFoundError("Exam not found")
    return exam


@router.get("/{exam_id}/questions", response_model=list[QuestionResponse])
async def get_exam_questions(
    exam_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ExamQuestion).where(ExamQuestion.exam_id == exam_id).order_by(ExamQuestion.display_order)
    )
    return result.scalars().all()


@router.put("/{exam_id}", response_model=ExamResponse)
async def update_exam(
    exam_id: str,
    data: ExamUpdate,
    current_user: User = Depends(require_role("teacher")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Exam).where(Exam.id == exam_id))
    exam = result.scalar_one_or_none()
    if not exam:
        raise NotFoundError("Exam not found")

    # Verify ownership
    result = await db.execute(select(Course).where(Course.id == exam.course_id))
    course = result.scalar_one_or_none()
    if not course or course.teacher_id != current_user.id:
        raise ForbiddenError("You do not own this exam's course")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(exam, field, value)
    await db.flush()
    return exam


@router.post("/{exam_id}/publish", response_model=ExamResponse)
async def publish_exam(
    exam_id: str,
    current_user: User = Depends(require_role("teacher")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Exam).where(Exam.id == exam_id))
    exam = result.scalar_one_or_none()
    if not exam:
        raise NotFoundError("Exam not found")

    # Check questions exist
    q_result = await db.execute(select(ExamQuestion).where(ExamQuestion.exam_id == exam_id))
    if not q_result.scalars().all():
        raise BadRequestError("Cannot publish exam without questions")

    exam.status = "published"
    exam.published_at = datetime.now(timezone.utc)
    await db.flush()
    return exam


@router.post("/{exam_id}/close", response_model=ExamResponse)
async def close_exam(
    exam_id: str,
    current_user: User = Depends(require_role("teacher")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Exam).where(Exam.id == exam_id))
    exam = result.scalar_one_or_none()
    if not exam:
        raise NotFoundError("Exam not found")
    exam.status = "closed"
    await db.flush()
    return exam


@router.post("/{exam_id}/questions")
async def add_question(
    exam_id: str,
    data: dict,
    current_user: User = Depends(require_role("teacher")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Exam).where(Exam.id == exam_id))
    exam = result.scalar_one_or_none()
    if not exam:
        raise NotFoundError("Exam not found")
    if exam.status != "draft":
        raise BadRequestError("Can only add questions to draft exams")

    question = ExamQuestion(
        exam_id=exam_id,
        question_type=data.get("question_type", "essay"),
        question_text=data.get("question_text", ""),
        mcq_options=data.get("mcq_options"),
        display_order=data.get("display_order", 1),
    )
    db.add(question)
    await db.flush()
    return {"message": "Question added", "id": question.id}


@router.delete("/{exam_id}")
async def delete_exam(
    exam_id: str,
    current_user: User = Depends(require_role("teacher")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Exam).where(Exam.id == exam_id))
    exam = result.scalar_one_or_none()
    if not exam:
        raise NotFoundError("Exam not found")

    # Delete questions
    q_result = await db.execute(select(ExamQuestion).where(ExamQuestion.exam_id == exam_id))
    for q in q_result.scalars().all():
        await db.delete(q)

    await db.delete(exam)
    return {"message": "Exam deleted"}


@router.put("/{exam_id}/questions/{question_id}")
async def update_question(
    exam_id: str,
    question_id: str,
    data: dict,
    current_user: User = Depends(require_role("teacher")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ExamQuestion).where(ExamQuestion.id == question_id, ExamQuestion.exam_id == exam_id)
    )
    question = result.scalar_one_or_none()
    if not question:
        raise NotFoundError("Question not found")

    if "question_text" in data:
        question.question_text = data["question_text"]
    if "question_type" in data:
        question.question_type = data["question_type"]
    if "mcq_options" in data:
        question.mcq_options = data["mcq_options"]
    await db.flush()
    return {"message": "Question updated"}


@router.delete("/{exam_id}/questions/{question_id}")
async def delete_question(
    exam_id: str,
    question_id: str,
    current_user: User = Depends(require_role("teacher")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ExamQuestion).where(ExamQuestion.id == question_id, ExamQuestion.exam_id == exam_id)
    )
    question = result.scalar_one_or_none()
    if not question:
        raise NotFoundError("Question not found")
    await db.delete(question)
    return {"message": "Question deleted"}


@router.post("/{exam_id}/regenerate-questions")
async def regenerate_questions(
    exam_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_role("teacher")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Exam).where(Exam.id == exam_id))
    exam = result.scalar_one_or_none()
    if not exam:
        raise NotFoundError("Exam not found")
    if exam.status != "draft":
        raise BadRequestError("Can only regenerate questions for draft exams")

    # Delete existing questions
    result = await db.execute(select(ExamQuestion).where(ExamQuestion.exam_id == exam_id))
    for q in result.scalars().all():
        await db.delete(q)
    await db.flush()

    background_tasks.add_task(_generate_questions, exam_id, exam.course_id)
    return {"message": "Question regeneration started"}


# --- Exam Sessions ---

@router.post("/{exam_id}/sessions", response_model=SessionResponse)
async def start_session(
    exam_id: str,
    current_user: User = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
):
    # Verify exam is published
    result = await db.execute(select(Exam).where(Exam.id == exam_id))
    exam = result.scalar_one_or_none()
    if not exam or exam.status != "published":
        raise BadRequestError("Exam is not available")

    # Verify enrollment
    result = await db.execute(
        select(CourseEnrollment).where(
            CourseEnrollment.course_id == exam.course_id,
            CourseEnrollment.student_id == current_user.id,
        )
    )
    if not result.scalar_one_or_none():
        raise ForbiddenError("You are not enrolled in this course")

    # Check for existing session
    result = await db.execute(
        select(ExamSession).where(
            ExamSession.exam_id == exam_id,
            ExamSession.student_id == current_user.id,
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        return existing

    session = ExamSession(exam_id=exam_id, student_id=current_user.id)
    db.add(session)
    await db.flush()
    return session


@router.get("/{exam_id}/sessions", response_model=list[SessionResponse])
async def list_sessions(
    exam_id: str,
    current_user: User = Depends(require_role("teacher")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(ExamSession).where(ExamSession.exam_id == exam_id))
    sessions = result.scalars().all()

    # Collect student IDs and fetch names
    student_ids = list({s.student_id for s in sessions})
    user_result = await db.execute(select(User).where(User.id.in_(student_ids)))
    users = {u.id: u for u in user_result.scalars().all()}

    enriched = []
    for s in sessions:
        user = users.get(s.student_id)
        name = None
        if user:
            name = user.name_en or user.name_ar or user.full_name
        data = {c.key: getattr(s, c.key) for c in s.__table__.columns}
        data["student_name"] = name
        enriched.append(data)
    return enriched


@router.get("/{exam_id}/sessions/me", response_model=SessionResponse)
async def get_my_session(
    exam_id: str,
    current_user: User = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ExamSession).where(
            ExamSession.exam_id == exam_id,
            ExamSession.student_id == current_user.id,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise NotFoundError("No session found")
    return session


@router.put("/{exam_id}/sessions/{session_id}/question-order", response_model=SessionResponse)
async def set_question_order(
    exam_id: str,
    session_id: str,
    question_order: list[str],
    current_user: User = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ExamSession).where(ExamSession.id == session_id, ExamSession.student_id == current_user.id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise NotFoundError("Session not found")

    session.question_order = question_order
    await db.flush()
    return session
