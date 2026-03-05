import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import String, Boolean, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    name_en: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    name_ar: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    role: Mapped[str] = mapped_column(String(20), nullable=False)  # 'student' or 'teacher'
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    courses_taught = relationship("Course", back_populates="teacher", cascade="all, delete-orphan")
    enrollments = relationship("CourseEnrollment", back_populates="student", cascade="all, delete-orphan")
    exam_sessions = relationship("ExamSession", back_populates="student", cascade="all, delete-orphan")
    grades_given = relationship("TeacherGrade", back_populates="graded_by_user", cascade="all, delete-orphan")
