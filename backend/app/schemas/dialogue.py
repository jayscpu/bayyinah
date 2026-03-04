from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class AnswerSubmit(BaseModel):
    question_id: str
    answer_text: str | None = None  # For essay
    mcq_selections: list[dict] | None = None  # For MCQ: [{"key": "A", "justification": "..."}]


class DialogueResponse(BaseModel):
    student_response: str


class DialogueMessageResponse(BaseModel):
    id: str
    role: str
    content: str
    turn_number: int
    created_at: datetime

    model_config = {"from_attributes": True}


class AnswerResponse(BaseModel):
    id: str
    session_id: str
    question_id: str
    answer_text: str | None
    mcq_selections: list[dict] | None
    dialogue_turns_completed: int
    ai_question_score: float | None
    answered_at: datetime

    model_config = {"from_attributes": True}


class AnswerWithQuestionResponse(BaseModel):
    id: str
    session_id: str
    question_id: str
    question_text: str
    answer_text: str | None
    mcq_selections: list[dict] | None
    dialogue_turns_completed: int

    model_config = {"from_attributes": True}


class SessionResponse(BaseModel):
    id: str
    exam_id: str
    student_id: str
    status: str
    started_at: datetime
    completed_at: datetime | None
    ai_score: float | None
    ai_criterion_scores: dict | None
    current_question_index: int
    question_order: list | None

    model_config = {"from_attributes": True}
