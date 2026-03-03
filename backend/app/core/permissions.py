from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_token
from app.core.exceptions import UnauthorizedError, ForbiddenError
from app.models.user import User
from app.models.course import Course, CourseEnrollment
from app.models.exam_session import ExamSession

security_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    payload = decode_token(credentials.credentials)
    if payload is None or payload.get("type") != "access":
        raise UnauthorizedError("Invalid or expired token")

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id, User.is_active == True))
    user = result.scalar_one_or_none()
    if user is None:
        raise UnauthorizedError("User not found")
    return user


def require_role(role: str):
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role != role:
            raise ForbiddenError(f"Requires {role} role")
        return current_user
    return role_checker


async def require_course_owner(
    course_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Course:
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()
    if course is None:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("Course not found")
    if course.teacher_id != current_user.id:
        raise ForbiddenError("You do not own this course")
    return course


async def require_enrollment(
    course_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CourseEnrollment:
    result = await db.execute(
        select(CourseEnrollment).where(
            CourseEnrollment.course_id == course_id,
            CourseEnrollment.student_id == current_user.id,
        )
    )
    enrollment = result.scalar_one_or_none()
    if enrollment is None:
        raise ForbiddenError("You are not enrolled in this course")
    return enrollment


async def require_session_owner(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ExamSession:
    result = await db.execute(select(ExamSession).where(ExamSession.id == session_id))
    session = result.scalar_one_or_none()
    if session is None:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("Session not found")
    if session.student_id != current_user.id:
        raise ForbiddenError("You do not own this session")
    return session
