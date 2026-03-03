from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.courses import router as courses_router
from app.api.materials import router as materials_router
from app.api.exams import router as exams_router
from app.api.dialogue import router as dialogue_router
from app.api.grades import router as grades_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(courses_router)
api_router.include_router(materials_router)
api_router.include_router(exams_router)
api_router.include_router(dialogue_router)
api_router.include_router(grades_router)
