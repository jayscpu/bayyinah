import uuid
from typing import Optional
from datetime import datetime

from sqlalchemy import String, Text, Integer, Float, DateTime, ForeignKey, JSON, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Assignment(Base):
    __tablename__ = "assignments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    course_id: Mapped[str] = mapped_column(String(36), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="draft")  # draft, published, closed
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    closes_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    course = relationship("Course", back_populates="assignments")
    submissions = relationship("AssignmentSubmission", back_populates="assignment", cascade="all, delete-orphan")


class AssignmentSubmission(Base):
    __tablename__ = "assignment_submissions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    assignment_id: Mapped[str] = mapped_column(String(36), ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending, in_progress, scored, validated
    extracted_text: Mapped[Optional[str]] = mapped_column(Text)
    original_filename: Mapped[Optional[str]] = mapped_column(String(255))
    dialogue_turns_completed: Mapped[int] = mapped_column(Integer, default=0)
    ai_score: Mapped[Optional[float]] = mapped_column(Float)
    ai_score_reasoning: Mapped[Optional[dict]] = mapped_column(JSON)
    submitted_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    __table_args__ = (UniqueConstraint("assignment_id", "student_id"),)

    # Relationships
    assignment = relationship("Assignment", back_populates="submissions")
    student = relationship("User")
    dialogue_messages = relationship(
        "AssignmentDialogueMessage",
        back_populates="submission",
        cascade="all, delete-orphan",
        order_by="AssignmentDialogueMessage.turn_number",
    )
    teacher_review = relationship(
        "AssignmentReview",
        back_populates="submission",
        uselist=False,
        cascade="all, delete-orphan",
    )


class AssignmentDialogueMessage(Base):
    __tablename__ = "assignment_dialogue_messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    submission_id: Mapped[str] = mapped_column(String(36), ForeignKey("assignment_submissions.id", ondelete="CASCADE"), nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(10))  # agent, student
    content: Mapped[str] = mapped_column(Text, nullable=False)
    turn_number: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationship
    submission = relationship("AssignmentSubmission", back_populates="dialogue_messages")


class AssignmentReview(Base):
    __tablename__ = "assignment_reviews"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    submission_id: Mapped[str] = mapped_column(String(36), ForeignKey("assignment_submissions.id", ondelete="CASCADE"), nullable=False, unique=True)
    reviewed_by: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    final_grade: Mapped[Optional[float]] = mapped_column(Float)
    feedback: Mapped[Optional[str]] = mapped_column(Text)
    internal_notes: Mapped[Optional[str]] = mapped_column(Text)
    action_taken: Mapped[str] = mapped_column(String(20), default="approved")  # approved, overridden
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationship
    submission = relationship("AssignmentSubmission", back_populates="teacher_review")
