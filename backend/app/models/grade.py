import uuid
from typing import Optional
from datetime import datetime

from sqlalchemy import String, Text, Integer, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class TeacherGrade(Base):
    __tablename__ = "teacher_grades"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id: Mapped[str] = mapped_column(String(36), ForeignKey("exam_sessions.id", ondelete="CASCADE"), nullable=False, unique=True)
    graded_by: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    final_grade: Mapped[int] = mapped_column(Integer, nullable=False)  # 1-5
    feedback: Mapped[Optional[str]] = mapped_column(Text)
    internal_notes: Mapped[Optional[str]] = mapped_column(Text)  # Teacher-only, not visible to student
    action_taken: Mapped[str] = mapped_column(String(20), nullable=False)  # approved, overridden, re_dialogue_requested
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    session = relationship("ExamSession", back_populates="grade")
    graded_by_user = relationship("User", back_populates="grades_given")
