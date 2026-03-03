from datetime import datetime

from pydantic import BaseModel


class MaterialResponse(BaseModel):
    id: str
    course_id: str
    filename: str
    original_name: str
    file_type: str
    file_size_bytes: int | None
    processing_status: str
    chunk_count: int
    created_at: datetime

    model_config = {"from_attributes": True}
