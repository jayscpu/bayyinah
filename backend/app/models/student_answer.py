import uuid
from typing import Optional
from datetime import datetime

from sqlalchemy import String, Text, Float, DateTime, ForeignKey, JSON, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class StudentAnswer(Base):
    __tablename__ = "student_answers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id: Mapped[str] = mapped_column(String(36), ForeignKey("exam_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id: Mapped[str] = mapped_column(String(36), ForeignKey("exam_questions.id", ondelete="CASCADE"), nullable=False)

    # Essay: the full text answer. MCQ: NULL (selections in mcq_selections)
    answer_text: Mapped[Optional[str]] = mapped_column(Text)

    # MCQ selections with justifications as JSON
    # e.g. [{"key": "A", "justification": "Because..."}, {"key": "C", "justification": "..."}]
    mcq_selections: Mapped[Optional[dict]] = mapped_column(JSON)

    # Per-question AI score
    ai_question_score: Mapped[Optional[float]] = mapped_column(Float)
    ai_score_breakdown: Mapped[Optional[dict]] = mapped_column(JSON)

    # Dialogue status tracking
    dialogue_turns_completed: Mapped[int] = mapped_column(default=0)

    answered_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    __table_args__ = (UniqueConstraint("session_id", "question_id"),)

    # Relationships
    session = relationship("ExamSession", back_populates="answers")
    question = relationship("ExamQuestion", back_populates="answers")
    dialogue_messages = relationship("DialogueMessage", back_populates="answer", cascade="all, delete-orphan", order_by="DialogueMessage.turn_number")
