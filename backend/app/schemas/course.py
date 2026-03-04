from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class CourseCreate(BaseModel):
    title: str
    description: str | None = None


class CourseUpdate(BaseModel):
    title: str | None = None
    description: str | None = None


class CourseResponse(BaseModel):
    id: str
    teacher_id: str
    title: str
    description: str | None
    created_at: datetime
    teacher_name: str | None = None
    student_count: int | None = None

    model_config = {"from_attributes": True}


class EnrollmentResponse(BaseModel):
    id: str
    course_id: str
    student_id: str
    enrolled_at: datetime

    model_config = {"from_attributes": True}
