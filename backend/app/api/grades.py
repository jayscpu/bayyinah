from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import NotFoundError, ForbiddenError, BadRequestError
from app.core.permissions import get_current_user, require_role
from app.models.user import User
from app.models.exam_session import ExamSession
from app.models.exam import Exam
from app.models.course import Course
from app.models.grade import TeacherGrade
from app.schemas.grade import GradeSubmit, GradeResponse
from app.schemas.dialogue import SessionResponse

router = APIRouter(prefix="/api/sessions/{session_id}", tags=["grading"])


@router.get("/evaluation", response_model=SessionResponse)
async def get_evaluation(
    session_id: str,
    current_user: User = Depends(require_role("teacher")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(ExamSession).where(ExamSession.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise NotFoundError("Session not found")
    return session


@router.post("/grade", response_model=GradeResponse)
async def submit_grade(
    session_id: str,
    data: GradeSubmit,
    current_user: User = Depends(require_role("teacher")),
    db: AsyncSession = Depends(get_db),
):
    # Verify session exists and is scored
    result = await db.execute(select(ExamSession).where(ExamSession.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise NotFoundError("Session not found")
    if session.status not in ("completed", "scored"):
        raise BadRequestError("Session is not ready for grading")

    # Verify teacher owns the exam's course
    result = await db.execute(select(Exam).where(Exam.id == session.exam_id))
    exam = result.scalar_one_or_none()
    result = await db.execute(select(Course).where(Course.id == exam.course_id))
    course = result.scalar_one_or_none()
    if not course or course.teacher_id != current_user.id:
        raise ForbiddenError("You do not own this course")

    # Check for existing grade
    result = await db.execute(select(TeacherGrade).where(TeacherGrade.session_id == session_id))
    if result.scalar_one_or_none():
        raise BadRequestError("Grade already submitted. Use PUT to update.")

    grade = TeacherGrade(
        session_id=session_id,
        graded_by=current_user.id,
        final_grade=data.final_grade,
        feedback=data.feedback,
        internal_notes=data.internal_notes,
        action_taken=data.action_taken,
    )
    db.add(grade)
    session.status = "validated"
    await db.flush()
    return grade


@router.put("/grade", response_model=GradeResponse)
async def update_grade(
    session_id: str,
    data: GradeSubmit,
    current_user: User = Depends(require_role("teacher")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(TeacherGrade).where(TeacherGrade.session_id == session_id))
    grade = result.scalar_one_or_none()
    if not grade:
        raise NotFoundError("No grade found for this session")

    grade.final_grade = data.final_grade
    grade.feedback = data.feedback
    grade.internal_notes = data.internal_notes
    grade.action_taken = data.action_taken
    await db.flush()
    return grade


@router.get("/grade", response_model=Optional[GradeResponse])
async def get_grade(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify access
    result = await db.execute(select(ExamSession).where(ExamSession.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise NotFoundError("Session not found")

    # Students can only see grade after validation
    if current_user.role == "student":
        if session.student_id != current_user.id:
            raise ForbiddenError("Not your session")
        if session.status != "validated":
            return None  # Grade not yet visible

    result = await db.execute(select(TeacherGrade).where(TeacherGrade.session_id == session_id))
    grade = result.scalar_one_or_none()

    # Strip internal notes for students
    if grade and current_user.role == "student":
        grade.internal_notes = None

    return grade
