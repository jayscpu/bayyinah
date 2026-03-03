import uuid
from datetime import datetime

from sqlalchemy import String, Text, Integer, DateTime, ForeignKey, JSON, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ExamQuestion(Base):
    __tablename__ = "exam_questions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    exam_id: Mapped[str] = mapped_column(String(36), ForeignKey("exams.id", ondelete="CASCADE"), nullable=False, index=True)
    question_type: Mapped[str] = mapped_column(String(20), nullable=False)  # 'essay' or 'mcq'
    question_text: Mapped[str] = mapped_column(Text, nullable=False)

    # For MCQ: options as JSON array e.g. [{"key": "A", "text": "Option A"}, ...]
    mcq_options: Mapped[dict | None] = mapped_column(JSON)

    # RAG context chunks used to generate this question
    source_chunks: Mapped[dict | None] = mapped_column(JSON)

    display_order: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    exam = relationship("Exam", back_populates="questions")
    answers = relationship("StudentAnswer", back_populates="question", cascade="all, delete-orphan")
