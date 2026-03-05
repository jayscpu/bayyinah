from __future__ import annotations
from typing import Optional, Any
from datetime import datetime
from pydantic import BaseModel


class AssignmentCreate(BaseModel):
    course_id: str
    title: str
    description: Optional[str] = None


class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None


class AssignmentResponse(BaseModel):
    id: str
    course_id: str
    created_by: str
    title: str
    description: Optional[str]
    status: str
    published_at: Optional[datetime]
    closes_at: Optional[datetime]
    created_at: datetime
    model_config = {"from_attributes": True}


class SubmissionResponse(BaseModel):
    id: str
    assignment_id: str
    student_id: str
    student_name: Optional[str] = None
    assignment_title: Optional[str] = None
    status: str
    original_filename: Optional[str]
    dialogue_turns_completed: int
    ai_score: Optional[float]
    ai_score_reasoning: Optional[dict[str, Any]]
    submitted_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime
    model_config = {"from_attributes": True}


class AssignmentDialogueMessageResponse(BaseModel):
    id: str
    role: str
    content: str
    turn_number: int
    created_at: datetime
    model_config = {"from_attributes": True}


class AssignmentDialogueRespond(BaseModel):
    student_response: str


class AssignmentReviewSubmit(BaseModel):
    final_grade: float
    feedback: Optional[str] = None
    internal_notes: Optional[str] = None
    action_taken: str  # approved, overridden


class AssignmentReviewResponse(BaseModel):
    id: str
    submission_id: str
    reviewed_by: str
    final_grade: Optional[float]
    feedback: Optional[str]
    action_taken: str
    created_at: datetime
    model_config = {"from_attributes": True}
