from datetime import datetime

from pydantic import BaseModel, field_validator


class ExamCreate(BaseModel):
    course_id: str
    title: str
    description: str | None = None
    weight_conceptual: int = 30
    weight_interconnection: int = 25
    weight_application: int = 25
    weight_reasoning: int = 20

    @field_validator("weight_reasoning")
    @classmethod
    def validate_weights_sum(cls, v, info):
        total = (
            info.data.get("weight_conceptual", 30)
            + info.data.get("weight_interconnection", 25)
            + info.data.get("weight_application", 25)
            + v
        )
        if total != 100:
            raise ValueError(f"Criteria weights must sum to 100, got {total}")
        return v


class ExamUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    weight_conceptual: int | None = None
    weight_interconnection: int | None = None
    weight_application: int | None = None
    weight_reasoning: int | None = None


class ExamResponse(BaseModel):
    id: str
    course_id: str
    created_by: str
    title: str
    description: str | None
    status: str
    question_count: int
    socratic_turns: int
    weight_conceptual: int
    weight_interconnection: int
    weight_application: int
    weight_reasoning: int
    published_at: datetime | None
    closes_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}
