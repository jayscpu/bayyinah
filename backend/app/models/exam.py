import uuid
from typing import Optional
from datetime import datetime

from sqlalchemy import String, Text, Integer, DateTime, ForeignKey, JSON, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Exam(Base):
    __tablename__ = "exams"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    course_id: Mapped[str] = mapped_column(String(36), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="draft")  # draft, published, closed
    question_count: Mapped[int] = mapped_column(Integer, default=5)
    socratic_turns: Mapped[int] = mapped_column(Integer, default=3)

    # Evaluation criteria weights (must sum to 100)
    weight_conceptual: Mapped[int] = mapped_column(Integer, default=30)
    weight_interconnection: Mapped[int] = mapped_column(Integer, default=25)
    weight_application: Mapped[int] = mapped_column(Integer, default=25)
    weight_reasoning: Mapped[int] = mapped_column(Integer, default=20)

    # Optional additional teacher-defined criteria
    custom_criteria: Mapped[Optional[dict]] = mapped_column(JSON, default=list)

    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    closes_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    course = relationship("Course", back_populates="exams")
    questions = relationship("ExamQuestion", back_populates="exam", cascade="all, delete-orphan")
    sessions = relationship("ExamSession", back_populates="exam", cascade="all, delete-orphan")
