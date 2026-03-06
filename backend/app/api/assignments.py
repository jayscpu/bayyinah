from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import NotFoundError, ForbiddenError, BadRequestError
from app.core.permissions import get_current_user, require_role
from app.models.user import User
from app.models.assignment import Assignment, AssignmentSubmission, AssignmentDialogueMessage, AssignmentReview
from app.models.course import Course, CourseEnrollment
from app.schemas.assignment import (
    AssignmentCreate,
    AssignmentUpdate,
    AssignmentResponse,
    SubmissionResponse,
    AssignmentDialogueMessageResponse,
    AssignmentDialogueRespond,
    AssignmentReviewSubmit,
    AssignmentReviewResponse,
)
from app.services.assignment_service import extract_text_from_file

router = APIRouter(tags=["assignments"])


# ─── Teacher: Assignment CRUD ────────────────────────────────────────────────

@router.post("/api/assignments", response_model=AssignmentResponse)
async def create_assignment(
    data: AssignmentCreate,
    current_user: User = Depends(require_role("teacher")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Course).where(Course.id == data.course_id))
    course = result.scalar_one_or_none()
    if not course or course.teacher_id != current_user.id:
        raise ForbiddenError("You do not own this course")

    assignment = Assignment(
        course_id=data.course_id,
        created_by=current_user.id,
        title=data.title,
        description=data.description,
    )
    db.add(assignment)
    await db.flush()
    return assignment


@router.get("/api/assignments", response_model=list[AssignmentResponse])
async def list_assignments(
    course_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Assignment).where(Assignment.course_id == course_id)
    if current_user.role == "student":
        query = query.where(Assignment.status == "published")
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/api/assignments/{assignment_id}", response_model=AssignmentResponse)
async def get_assignment(
    assignment_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Assignment).where(Assignment.id == assignment_id))
    assignment = result.scalar_one_or_none()
    if not assignment:
        raise NotFoundError("Assignment not found")
    return assignment


@router.put("/api/assignments/{assignment_id}", response_model=AssignmentResponse)
async def update_assignment(
    assignment_id: str,
    data: AssignmentUpdate,
    current_user: User = Depends(require_role("teacher")),
    db: AsyncSession = Depends(get_db),
):
    assignment = await _get_assignment_for_teacher(assignment_id, current_user, db)
    if data.title is not None:
        assignment.title = data.title
    if data.description is not None:
        assignment.description = data.description
    await db.flush()
    return assignment


@router.delete("/api/assignments/{assignment_id}")
async def delete_assignment(
    assignment_id: str,
    current_user: User = Depends(require_role("teacher")),
    db: AsyncSession = Depends(get_db),
):
    assignment = await _get_assignment_for_teacher(assignment_id, current_user, db)
    await db.delete(assignment)
    await db.flush()
    return {"message": "Assignment deleted"}


@router.post("/api/assignments/{assignment_id}/publish", response_model=AssignmentResponse)
async def publish_assignment(
    assignment_id: str,
    current_user: User = Depends(require_role("teacher")),
    db: AsyncSession = Depends(get_db),
):
    assignment = await _get_assignment_for_teacher(assignment_id, current_user, db)
    if assignment.status != "draft":
        raise BadRequestError("Only draft assignments can be published")
    assignment.status = "published"
    assignment.published_at = datetime.now(timezone.utc)
    await db.flush()
    return assignment


@router.post("/api/assignments/{assignment_id}/close", response_model=AssignmentResponse)
async def close_assignment(
    assignment_id: str,
    current_user: User = Depends(require_role("teacher")),
    db: AsyncSession = Depends(get_db),
):
    assignment = await _get_assignment_for_teacher(assignment_id, current_user, db)
    assignment.status = "closed"
    await db.flush()
    return assignment


@router.get("/api/assignments/{assignment_id}/submissions", response_model=list[SubmissionResponse])
async def list_submissions(
    assignment_id: str,
    current_user: User = Depends(require_role("teacher")),
    db: AsyncSession = Depends(get_db),
):
    await _get_assignment_for_teacher(assignment_id, current_user, db)

    result = await db.execute(
        select(AssignmentSubmission).where(AssignmentSubmission.assignment_id == assignment_id)
    )
    submissions = result.scalars().all()

    # Enrich with student names and assignment title
    result2 = await db.execute(select(Assignment).where(Assignment.id == assignment_id))
    assignment = result2.scalar_one()

    enriched = []
    for sub in submissions:
        result3 = await db.execute(select(User).where(User.id == sub.student_id))
        student = result3.scalar_one_or_none()
        d = {
            "id": sub.id,
            "assignment_id": sub.assignment_id,
            "student_id": sub.student_id,
            "student_name": getattr(student, "full_name", None) or getattr(student, "name", None) or (student.email if student else None),
            "assignment_title": assignment.title,
            "status": sub.status,
            "original_filename": sub.original_filename,
            "dialogue_turns_completed": sub.dialogue_turns_completed,
            "ai_score": sub.ai_score,
            "ai_score_reasoning": sub.ai_score_reasoning,
            "submitted_at": sub.submitted_at,
            "completed_at": sub.completed_at,
            "created_at": sub.created_at,
        }
        enriched.append(d)
    return enriched


# ─── Student: File Upload ─────────────────────────────────────────────────────

@router.post("/api/assignments/{assignment_id}/submit", response_model=SubmissionResponse)
async def submit_assignment(
    assignment_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Assignment).where(Assignment.id == assignment_id))
    assignment = result.scalar_one_or_none()
    if not assignment or assignment.status != "published":
        raise NotFoundError("Assignment not found or not published")

    # Verify enrollment
    result = await db.execute(
        select(CourseEnrollment).where(
            CourseEnrollment.course_id == assignment.course_id,
            CourseEnrollment.student_id == current_user.id,
        )
    )
    if not result.scalar_one_or_none():
        raise ForbiddenError("You are not enrolled in this course")

    # Check if already submitted
    result = await db.execute(
        select(AssignmentSubmission).where(
            AssignmentSubmission.assignment_id == assignment_id,
            AssignmentSubmission.student_id == current_user.id,
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        return {
            "id": existing.id,
            "assignment_id": existing.assignment_id,
            "student_id": existing.student_id,
            "assignment_title": assignment.title,
            "status": existing.status,
            "original_filename": existing.original_filename,
            "dialogue_turns_completed": existing.dialogue_turns_completed,
            "ai_score": None,
            "ai_score_reasoning": None,
            "submitted_at": existing.submitted_at,
            "completed_at": existing.completed_at,
            "created_at": existing.created_at,
        }

    file_bytes = await file.read()
    extracted_text = extract_text_from_file(file_bytes, file.filename or "upload")

    submission = AssignmentSubmission(
        assignment_id=assignment_id,
        student_id=current_user.id,
        status="pending",
        extracted_text=extracted_text,
        original_filename=file.filename,
        submitted_at=datetime.now(timezone.utc),
    )
    db.add(submission)
    await db.flush()

    return {
        "id": submission.id,
        "assignment_id": submission.assignment_id,
        "student_id": submission.student_id,
        "assignment_title": assignment.title,
        "status": submission.status,
        "original_filename": submission.original_filename,
        "dialogue_turns_completed": submission.dialogue_turns_completed,
        "ai_score": None,
        "ai_score_reasoning": None,
        "submitted_at": submission.submitted_at,
        "completed_at": submission.completed_at,
        "created_at": submission.created_at,
    }


@router.get("/api/assignments/{assignment_id}/submissions/me", response_model=SubmissionResponse)
async def get_my_submission(
    assignment_id: str,
    current_user: User = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AssignmentSubmission).where(
            AssignmentSubmission.assignment_id == assignment_id,
            AssignmentSubmission.student_id == current_user.id,
        )
    )
    submission = result.scalar_one_or_none()
    if not submission:
        raise NotFoundError("No submission found")

    result2 = await db.execute(select(Assignment).where(Assignment.id == assignment_id))
    assignment = result2.scalar_one_or_none()

    # Never expose AI scores to students
    return {
        "id": submission.id,
        "assignment_id": submission.assignment_id,
        "student_id": submission.student_id,
        "assignment_title": assignment.title if assignment else None,
        "status": submission.status,
        "original_filename": submission.original_filename,
        "dialogue_turns_completed": submission.dialogue_turns_completed,
        "ai_score": None,
        "ai_score_reasoning": None,
        "submitted_at": submission.submitted_at,
        "completed_at": submission.completed_at,
        "created_at": submission.created_at,
    }


# ─── Dialogue ─────────────────────────────────────────────────────────────────

@router.get("/api/assignment-submissions/{submission_id}", response_model=SubmissionResponse)
async def get_submission(
    submission_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    submission = await _get_submission_for_user(submission_id, current_user, db)
    result = await db.execute(select(Assignment).where(Assignment.id == submission.assignment_id))
    assignment = result.scalar_one_or_none()

    # Never expose AI scores to students
    show_ai = current_user.role == "teacher"
    return {
        "id": submission.id,
        "assignment_id": submission.assignment_id,
        "student_id": submission.student_id,
        "assignment_title": assignment.title if assignment else None,
        "status": submission.status,
        "original_filename": submission.original_filename,
        "dialogue_turns_completed": submission.dialogue_turns_completed,
        "ai_score": submission.ai_score if show_ai else None,
        "ai_score_reasoning": submission.ai_score_reasoning if show_ai else None,
        "submitted_at": submission.submitted_at,
        "completed_at": submission.completed_at,
        "created_at": submission.created_at,
    }


@router.post("/api/assignment-submissions/{submission_id}/dialogue/start", response_model=AssignmentDialogueMessageResponse)
async def start_assignment_dialogue(
    submission_id: str,
    current_user: User = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
):
    import traceback
    submission = await _get_submission_for_user(submission_id, current_user, db)

    # Idempotent: if a message already exists, return it
    result = await db.execute(
        select(AssignmentDialogueMessage)
        .where(AssignmentDialogueMessage.submission_id == submission_id)
        .order_by(AssignmentDialogueMessage.created_at)
        .limit(1)
    )
    existing = result.scalar_one_or_none()
    if existing:
        return existing

    submission.status = "in_progress"
    await db.flush()

    from app.services.assignment_service import generate_assignment_socratic_question
    try:
        message = await generate_assignment_socratic_question(submission_id, turn_number=1, db=db)
    except Exception as e:
        traceback.print_exc()
        raise BadRequestError(f"AI error: {type(e).__name__}: {str(e)}")
    return message


@router.post("/api/assignment-submissions/{submission_id}/dialogue", response_model=AssignmentDialogueMessageResponse)
async def respond_to_assignment_dialogue(
    submission_id: str,
    data: AssignmentDialogueRespond,
    current_user: User = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
):
    submission = await _get_submission_for_user(submission_id, current_user, db)

    result = await db.execute(
        select(AssignmentDialogueMessage)
        .where(AssignmentDialogueMessage.submission_id == submission_id)
        .order_by(AssignmentDialogueMessage.turn_number.desc(), AssignmentDialogueMessage.created_at.desc())
    )
    messages = result.scalars().all()

    if not messages:
        raise BadRequestError("Dialogue not started yet")

    last_message = messages[0]
    if last_message.role != "agent":
        raise BadRequestError("Waiting for agent question, not student response")

    current_turn = last_message.turn_number

    # Save student response
    student_msg = AssignmentDialogueMessage(
        submission_id=submission_id,
        role="student",
        content=data.student_response,
        turn_number=current_turn,
    )
    db.add(student_msg)
    await db.flush()

    # Check if dialogue is complete
    if current_turn >= 2:
        submission.dialogue_turns_completed = 2
        await db.flush()
        from app.services.assignment_service import evaluate_assignment_submission
        await evaluate_assignment_submission(submission_id, db)
        return student_msg

    # Generate next question
    from app.services.assignment_service import generate_assignment_socratic_question
    next_message = await generate_assignment_socratic_question(submission_id, turn_number=current_turn + 1, db=db)
    submission.dialogue_turns_completed = current_turn
    await db.flush()
    return next_message


@router.get("/api/assignment-submissions/{submission_id}/dialogue", response_model=list[AssignmentDialogueMessageResponse])
async def get_assignment_dialogue(
    submission_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _get_submission_for_user(submission_id, current_user, db)
    result = await db.execute(
        select(AssignmentDialogueMessage)
        .where(AssignmentDialogueMessage.submission_id == submission_id)
        .order_by(AssignmentDialogueMessage.turn_number, AssignmentDialogueMessage.created_at)
    )
    return result.scalars().all()


# ─── Teacher: Review ──────────────────────────────────────────────────────────

@router.get("/api/assignment-submissions/{submission_id}/evaluation", response_model=SubmissionResponse)
async def get_assignment_evaluation(
    submission_id: str,
    current_user: User = Depends(require_role("teacher")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AssignmentSubmission).where(AssignmentSubmission.id == submission_id))
    submission = result.scalar_one_or_none()
    if not submission:
        raise NotFoundError("Submission not found")

    result2 = await db.execute(select(Assignment).where(Assignment.id == submission.assignment_id))
    assignment = result2.scalar_one_or_none()

    return {
        "id": submission.id,
        "assignment_id": submission.assignment_id,
        "student_id": submission.student_id,
        "assignment_title": assignment.title if assignment else None,
        "status": submission.status,
        "original_filename": submission.original_filename,
        "dialogue_turns_completed": submission.dialogue_turns_completed,
        "ai_score": submission.ai_score,
        "ai_score_reasoning": submission.ai_score_reasoning,
        "submitted_at": submission.submitted_at,
        "completed_at": submission.completed_at,
        "created_at": submission.created_at,
    }


@router.post("/api/assignment-submissions/{submission_id}/review", response_model=AssignmentReviewResponse)
async def submit_assignment_review(
    submission_id: str,
    data: AssignmentReviewSubmit,
    current_user: User = Depends(require_role("teacher")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AssignmentSubmission).where(AssignmentSubmission.id == submission_id))
    submission = result.scalar_one_or_none()
    if not submission:
        raise NotFoundError("Submission not found")
    if submission.status not in ("scored", "completed", "validated"):
        raise BadRequestError("Submission is not ready for review")

    # Verify teacher owns course
    result = await db.execute(select(Assignment).where(Assignment.id == submission.assignment_id))
    assignment = result.scalar_one_or_none()
    result = await db.execute(select(Course).where(Course.id == assignment.course_id))
    course = result.scalar_one_or_none()
    if not course or course.teacher_id != current_user.id:
        raise ForbiddenError("You do not own this course")

    # Check for existing review
    result = await db.execute(select(AssignmentReview).where(AssignmentReview.submission_id == submission_id))
    if result.scalar_one_or_none():
        raise BadRequestError("Review already submitted. Use PUT to update.")

    review = AssignmentReview(
        submission_id=submission_id,
        reviewed_by=current_user.id,
        final_grade=data.final_grade,
        feedback=data.feedback,
        internal_notes=data.internal_notes,
        action_taken=data.action_taken,
    )
    db.add(review)
    submission.status = "validated"
    await db.flush()
    return review


@router.put("/api/assignment-submissions/{submission_id}/review", response_model=AssignmentReviewResponse)
async def update_assignment_review(
    submission_id: str,
    data: AssignmentReviewSubmit,
    current_user: User = Depends(require_role("teacher")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AssignmentReview).where(AssignmentReview.submission_id == submission_id))
    review = result.scalar_one_or_none()
    if not review:
        raise NotFoundError("No review found for this submission")

    review.final_grade = data.final_grade
    review.feedback = data.feedback
    review.internal_notes = data.internal_notes
    review.action_taken = data.action_taken
    await db.flush()
    return review


@router.get("/api/assignment-submissions/{submission_id}/review", response_model=Optional[AssignmentReviewResponse])
async def get_assignment_review(
    submission_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AssignmentSubmission).where(AssignmentSubmission.id == submission_id))
    submission = result.scalar_one_or_none()
    if not submission:
        raise NotFoundError("Submission not found")

    if current_user.role == "student":
        if submission.student_id != current_user.id:
            raise ForbiddenError("Not your submission")
        if submission.status != "validated":
            return None

    result = await db.execute(select(AssignmentReview).where(AssignmentReview.submission_id == submission_id))
    review = result.scalar_one_or_none()

    if review and current_user.role == "student":
        review.internal_notes = None

    return review


# ─── Helpers ──────────────────────────────────────────────────────────────────

async def _get_assignment_for_teacher(assignment_id: str, user: User, db: AsyncSession) -> Assignment:
    result = await db.execute(select(Assignment).where(Assignment.id == assignment_id))
    assignment = result.scalar_one_or_none()
    if not assignment:
        raise NotFoundError("Assignment not found")

    result = await db.execute(select(Course).where(Course.id == assignment.course_id))
    course = result.scalar_one_or_none()
    if not course or course.teacher_id != user.id:
        raise ForbiddenError("You do not own this assignment")

    return assignment


async def _get_submission_for_user(submission_id: str, user: User, db: AsyncSession) -> AssignmentSubmission:
    result = await db.execute(select(AssignmentSubmission).where(AssignmentSubmission.id == submission_id))
    submission = result.scalar_one_or_none()
    if not submission:
        raise NotFoundError("Submission not found")

    if user.role == "student" and submission.student_id != user.id:
        raise NotFoundError("Submission not found")

    return submission
