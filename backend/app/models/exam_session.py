import uuid
from datetime import datetime

from sqlalchemy import String, Integer, Float, DateTime, ForeignKey, JSON, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ExamSession(Base):
    __tablename__ = "exam_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    exam_id: Mapped[str] = mapped_column(String(36), ForeignKey("exams.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(20), default="in_progress")  # in_progress, completed, scored, validated
    started_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime)

    # AI preliminary score (0-100)
    ai_score: Mapped[float | None] = mapped_column(Float)
    # Per-criterion AI scores as JSON
    ai_criterion_scores: Mapped[dict | None] = mapped_column(JSON)

    current_question_index: Mapped[int] = mapped_column(Integer, default=0)
    # Student's chosen question order as JSON array of question IDs
    question_order: Mapped[dict | None] = mapped_column(JSON)

    __table_args__ = (UniqueConstraint("exam_id", "student_id"),)

    # Relationships
    exam = relationship("Exam", back_populates="sessions")
    student = relationship("User", back_populates="exam_sessions")
    answers = relationship("StudentAnswer", back_populates="session", cascade="all, delete-orphan")
    grade = relationship("TeacherGrade", back_populates="session", uselist=False, cascade="all, delete-orphan")
