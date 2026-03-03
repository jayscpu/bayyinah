from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import NotFoundError, ForbiddenError, ConflictError
from app.core.permissions import get_current_user, require_role
from app.models.user import User
from app.models.course import Course, CourseEnrollment
from app.models.exam import Exam
from app.models.exam_session import ExamSession
from app.schemas.course import CourseCreate, CourseUpdate, CourseResponse, EnrollmentResponse
from app.schemas.auth import UserResponse

router = APIRouter(prefix="/api/courses", tags=["courses"])


@router.post("", response_model=CourseResponse)
async def create_course(
    data: CourseCreate,
    current_user: User = Depends(require_role("teacher")),
    db: AsyncSession = Depends(get_db),
):
    course = Course(teacher_id=current_user.id, title=data.title, description=data.description)
    db.add(course)
    await db.flush()
    return CourseResponse(
        id=course.id,
        teacher_id=course.teacher_id,
        title=course.title,
        description=course.description,
        created_at=course.created_at,
        teacher_name=current_user.full_name,
    )


@router.get("", response_model=list[CourseResponse])
async def list_courses(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role == "teacher":
        result = await db.execute(select(Course).where(Course.teacher_id == current_user.id))
    else:
        result = await db.execute(
            select(Course).join(CourseEnrollment).where(CourseEnrollment.student_id == current_user.id)
        )
    courses = result.scalars().all()

    response = []
    for course in courses:
        count_result = await db.execute(
            select(func.count()).select_from(CourseEnrollment).where(CourseEnrollment.course_id == course.id)
        )
        student_count = count_result.scalar()
        response.append(
            CourseResponse(
                id=course.id,
                teacher_id=course.teacher_id,
                title=course.title,
                description=course.description,
                created_at=course.created_at,
                student_count=student_count,
            )
        )
    return response


@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(
    course_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()
    if not course:
        raise NotFoundError("Course not found")
    return CourseResponse(
        id=course.id,
        teacher_id=course.teacher_id,
        title=course.title,
        description=course.description,
        created_at=course.created_at,
    )


@router.put("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: str,
    data: CourseUpdate,
    current_user: User = Depends(require_role("teacher")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()
    if not course:
        raise NotFoundError("Course not found")
    if course.teacher_id != current_user.id:
        raise ForbiddenError("You do not own this course")

    if data.title is not None:
        course.title = data.title
    if data.description is not None:
        course.description = data.description
    await db.flush()

    return CourseResponse(
        id=course.id,
        teacher_id=course.teacher_id,
        title=course.title,
        description=course.description,
        created_at=course.created_at,
    )


@router.delete("/{course_id}")
async def delete_course(
    course_id: str,
    current_user: User = Depends(require_role("teacher")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()
    if not course:
        raise NotFoundError("Course not found")
    if course.teacher_id != current_user.id:
        raise ForbiddenError("You do not own this course")
    await db.delete(course)
    return {"message": "Course deleted"}


@router.get("/{course_id}/stats")
async def get_course_stats(
    course_id: str,
    current_user: User = Depends(require_role("teacher")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()
    if not course or course.teacher_id != current_user.id:
        raise ForbiddenError("You do not own this course")

    # Student count
    count_result = await db.execute(
        select(func.count()).select_from(CourseEnrollment).where(CourseEnrollment.course_id == course_id)
    )
    student_count = count_result.scalar() or 0

    # Enrolled students
    result = await db.execute(
        select(User).join(CourseEnrollment).where(CourseEnrollment.course_id == course_id)
    )
    students = [{"id": u.id, "full_name": u.full_name, "email": u.email} for u in result.scalars().all()]

    # Exams with session counts
    result = await db.execute(select(Exam).where(Exam.course_id == course_id))
    exams = result.scalars().all()

    exam_stats = []
    for exam in exams:
        result = await db.execute(select(ExamSession).where(ExamSession.exam_id == exam.id))
        sessions = result.scalars().all()
        total_sessions = len(sessions)
        completed = sum(1 for s in sessions if s.status in ("completed", "scored", "validated"))
        pending_review = sum(1 for s in sessions if s.status in ("completed", "scored"))
        validated = sum(1 for s in sessions if s.status == "validated")

        exam_stats.append({
            "id": exam.id,
            "title": exam.title,
            "status": exam.status,
            "total_sessions": total_sessions,
            "completed": completed,
            "pending_review": pending_review,
            "validated": validated,
        })

    # Pending review sessions across all exams
    pending_sessions = []
    for exam in exams:
        result = await db.execute(
            select(ExamSession).where(
                ExamSession.exam_id == exam.id,
                ExamSession.status.in_(["completed", "scored"]),
            )
        )
        for session in result.scalars().all():
            # Get student name
            student_result = await db.execute(select(User).where(User.id == session.student_id))
            student = student_result.scalar_one_or_none()
            pending_sessions.append({
                "session_id": session.id,
                "exam_id": exam.id,
                "exam_title": exam.title,
                "student_name": student.full_name if student else "Unknown",
                "student_id": session.student_id,
                "status": session.status,
                "ai_score": session.ai_score,
                "completed_at": session.completed_at.isoformat() if session.completed_at else None,
            })

    return {
        "course": {"id": course.id, "title": course.title, "description": course.description},
        "student_count": student_count,
        "students": students,
        "exam_stats": exam_stats,
        "pending_reviews": pending_sessions,
    }


@router.post("/{course_id}/enroll", response_model=EnrollmentResponse)
async def enroll_in_course(
    course_id: str,
    current_user: User = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
):
    # Check course exists
    result = await db.execute(select(Course).where(Course.id == course_id))
    if not result.scalar_one_or_none():
        raise NotFoundError("Course not found")

    # Check not already enrolled
    result = await db.execute(
        select(CourseEnrollment).where(
            CourseEnrollment.course_id == course_id,
            CourseEnrollment.student_id == current_user.id,
        )
    )
    if result.scalar_one_or_none():
        raise ConflictError("Already enrolled in this course")

    enrollment = CourseEnrollment(course_id=course_id, student_id=current_user.id)
    db.add(enrollment)
    await db.flush()
    return enrollment


@router.get("/{course_id}/students", response_model=list[UserResponse])
async def list_students(
    course_id: str,
    current_user: User = Depends(require_role("teacher")),
    db: AsyncSession = Depends(get_db),
):
    # Verify ownership
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()
    if not course or course.teacher_id != current_user.id:
        raise ForbiddenError("You do not own this course")

    result = await db.execute(
        select(User).join(CourseEnrollment).where(CourseEnrollment.course_id == course_id)
    )
    return result.scalars().all()
