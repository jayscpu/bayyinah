from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import NotFoundError, BadRequestError
from app.core.permissions import get_current_user
from app.models.user import User
from app.models.student_answer import StudentAnswer
from app.models.exam_session import ExamSession
from app.models.question import ExamQuestion
from app.models.dialogue import DialogueMessage
from app.schemas.dialogue import AnswerSubmit, AnswerResponse, DialogueResponse, DialogueMessageResponse

router = APIRouter(tags=["dialogue"])


# --- Answer Submission ---
@router.post("/api/sessions/{session_id}/answers", response_model=AnswerResponse)
async def submit_answer(
    session_id: str,
    data: AnswerSubmit,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify session ownership
    result = await db.execute(select(ExamSession).where(ExamSession.id == session_id))
    session = result.scalar_one_or_none()
    if not session or session.student_id != current_user.id:
        raise NotFoundError("Session not found")
    if session.status != "in_progress":
        raise BadRequestError("Exam session is not in progress")

    # Verify question belongs to this exam
    result = await db.execute(
        select(ExamQuestion).where(ExamQuestion.id == data.question_id, ExamQuestion.exam_id == session.exam_id)
    )
    question = result.scalar_one_or_none()
    if not question:
        raise NotFoundError("Question not found in this exam")

    # Check for existing answer
    result = await db.execute(
        select(StudentAnswer).where(
            StudentAnswer.session_id == session_id,
            StudentAnswer.question_id == data.question_id,
        )
    )
    if result.scalar_one_or_none():
        raise BadRequestError("Already answered this question")

    answer = StudentAnswer(
        session_id=session_id,
        question_id=data.question_id,
        answer_text=data.answer_text,
        mcq_selections=data.mcq_selections,
    )
    db.add(answer)
    await db.flush()
    return answer


@router.get("/api/sessions/{session_id}/answers", response_model=list[AnswerResponse])
async def get_answers(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(StudentAnswer).where(StudentAnswer.session_id == session_id))
    return result.scalars().all()


# --- Socratic Dialogue ---
@router.post("/api/answers/{answer_id}/dialogue/start", response_model=DialogueMessageResponse)
async def start_dialogue(
    answer_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    answer = await _get_answer_for_user(answer_id, current_user, db)

    if answer.dialogue_turns_completed > 0:
        raise BadRequestError("Dialogue already started")

    # Generate first Socratic question
    from app.services.dialogue_service import generate_socratic_question
    message = await generate_socratic_question(answer, turn_number=1, db=db)
    return message


@router.post("/api/answers/{answer_id}/dialogue", response_model=DialogueMessageResponse)
async def respond_to_dialogue(
    answer_id: str,
    data: DialogueResponse,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    answer = await _get_answer_for_user(answer_id, current_user, db)

    # Determine current turn
    result = await db.execute(
        select(DialogueMessage)
        .where(DialogueMessage.answer_id == answer_id)
        .order_by(DialogueMessage.turn_number.desc(), DialogueMessage.created_at.desc())
    )
    messages = result.scalars().all()

    if not messages:
        raise BadRequestError("Dialogue not started yet")

    last_message = messages[0]
    if last_message.role != "agent":
        raise BadRequestError("Waiting for agent question, not student response")

    current_turn = last_message.turn_number

    # Save student response
    student_msg = DialogueMessage(
        answer_id=answer_id,
        role="student",
        content=data.student_response,
        turn_number=current_turn,
    )
    db.add(student_msg)
    await db.flush()

    # Check if dialogue is complete (3 turns)
    if current_turn >= 3:
        answer.dialogue_turns_completed = 3
        await db.flush()
        # Check if all questions answered and dialogues complete
        await _check_exam_completion(answer.session_id, db)
        return student_msg

    # Generate next Socratic question
    from app.services.dialogue_service import generate_socratic_question
    next_message = await generate_socratic_question(answer, turn_number=current_turn + 1, db=db)
    answer.dialogue_turns_completed = current_turn
    await db.flush()
    return next_message


@router.get("/api/answers/{answer_id}/dialogue", response_model=list[DialogueMessageResponse])
async def get_dialogue(
    answer_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(DialogueMessage)
        .where(DialogueMessage.answer_id == answer_id)
        .order_by(DialogueMessage.turn_number, DialogueMessage.created_at)
    )
    return result.scalars().all()


async def _get_answer_for_user(answer_id: str, user: User, db: AsyncSession) -> StudentAnswer:
    result = await db.execute(select(StudentAnswer).where(StudentAnswer.id == answer_id))
    answer = result.scalar_one_or_none()
    if not answer:
        raise NotFoundError("Answer not found")

    # Verify ownership
    result = await db.execute(select(ExamSession).where(ExamSession.id == answer.session_id))
    session = result.scalar_one_or_none()
    if not session or session.student_id != user.id:
        raise NotFoundError("Answer not found")
    return answer


async def _check_exam_completion(session_id: str, db: AsyncSession):
    """Check if all 5 questions have completed dialogues, trigger scoring if so."""
    result = await db.execute(select(ExamSession).where(ExamSession.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        return

    result = await db.execute(
        select(StudentAnswer).where(StudentAnswer.session_id == session_id)
    )
    answers = result.scalars().all()

    # Check if all answers have completed dialogues
    from app.models.exam import Exam
    result = await db.execute(select(Exam).where(Exam.id == session.exam_id))
    exam = result.scalar_one_or_none()
    if not exam:
        return

    if len(answers) >= exam.question_count and all(a.dialogue_turns_completed >= 3 for a in answers):
        from datetime import datetime, timezone
        session.status = "completed"
        session.completed_at = datetime.now(timezone.utc)
        await db.flush()

        # Trigger AI evaluation
        from app.services.evaluation_service import evaluate_session
        await evaluate_session(session_id, db)
