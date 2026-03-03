from pydantic import BaseModel


class QuestionResponse(BaseModel):
    id: str
    exam_id: str
    question_type: str
    question_text: str
    mcq_options: list | None
    display_order: int

    model_config = {"from_attributes": True}
