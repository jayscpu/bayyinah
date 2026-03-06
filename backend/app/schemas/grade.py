from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, field_validator


class GradeSubmit(BaseModel):
    final_grade: int
    feedback: str | None = None
    internal_notes: str | None = None
    action_taken: str  # approved, overridden, re_dialogue_requested
    question_grades: dict[str, float] | None = None  # {question_id: grade}
    total_points: float | None = None

    @field_validator("final_grade")
    @classmethod
    def validate_grade(cls, v: int) -> int:
        if v < 0 or v > 5:
            raise ValueError("Grade must be between 0 and 5")
        return v

    @field_validator("action_taken")
    @classmethod
    def validate_action(cls, v: str) -> str:
        if v not in ("approved", "overridden", "re_dialogue_requested"):
            raise ValueError("Invalid action")
        return v


class GradeResponse(BaseModel):
    id: str
    session_id: str
    graded_by: str
    final_grade: int
    feedback: str | None
    action_taken: str
    question_grades: dict | None = None
    total_points: float | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
