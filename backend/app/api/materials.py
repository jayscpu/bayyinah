import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, UploadFile, File, BackgroundTasks
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.database import get_db
from app.core.exceptions import NotFoundError, ForbiddenError, BadRequestError
from app.core.permissions import get_current_user, require_role
from app.models.user import User
from app.models.course import Course
from app.models.material import Material
from app.schemas.material import MaterialResponse

router = APIRouter(prefix="/api/courses/{course_id}/materials", tags=["materials"])


async def _verify_course_owner(course_id: str, user: User, db: AsyncSession) -> Course:
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()
    if not course:
        raise NotFoundError("Course not found")
    if course.teacher_id != user.id:
        raise ForbiddenError("You do not own this course")
    return course


@router.post("", response_model=MaterialResponse)
async def upload_material(
    course_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(require_role("teacher")),
    db: AsyncSession = Depends(get_db),
):
    await _verify_course_owner(course_id, current_user, db)

    # Validate file type
    original_name = file.filename or "unknown"
    ext = original_name.rsplit(".", 1)[-1].lower() if "." in original_name else ""
    if ext not in ("pdf", "pptx"):
        raise BadRequestError("Only PDF and PPTX files are supported")

    # Save file
    filename = f"{uuid.uuid4()}.{ext}"
    file_path = Path(settings.UPLOAD_DIR) / filename
    content = await file.read()

    if len(content) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise BadRequestError(f"File exceeds {settings.MAX_UPLOAD_SIZE_MB}MB limit")

    file_path.write_bytes(content)

    material = Material(
        course_id=course_id,
        uploaded_by=current_user.id,
        filename=filename,
        original_name=original_name,
        file_type=ext,
        file_path=str(file_path),
        file_size_bytes=len(content),
        processing_status="pending",
    )
    db.add(material)
    await db.commit()
    await db.refresh(material)

    # Trigger background RAG ingestion
    background_tasks.add_task(_process_material, material.id, str(file_path), course_id, ext)

    return material


async def _process_material(material_id: str, file_path: str, course_id: str, file_type: str):
    """Background task to process uploaded material through RAG pipeline."""
    from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession as AS
    from app.config import settings
    from app.rag.ingestion import ingest_document

    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    session_factory = async_sessionmaker(engine, class_=AS, expire_on_commit=False)
    async with session_factory() as db:
        try:
            result = await db.execute(select(Material).where(Material.id == material_id))
            material = result.scalar_one_or_none()
            if not material:
                await engine.dispose()
                return

            material.processing_status = "processing"
            await db.commit()

            chunk_count = await ingest_document(file_path, file_type, course_id, material_id)

            material.processing_status = "completed"
            material.chunk_count = chunk_count
            await db.commit()
            print(f"Material {material_id} processed: {chunk_count} chunks")
        except Exception as e:
            try:
                material.processing_status = "failed"
                await db.commit()
            except Exception:
                pass
            import traceback
            print(f"Material processing failed: {e}")
            traceback.print_exc()
    await engine.dispose()


@router.get("", response_model=list[MaterialResponse])
async def list_materials(
    course_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Material).where(Material.course_id == course_id))
    return result.scalars().all()


@router.get("/{material_id}", response_model=MaterialResponse)
async def get_material(
    course_id: str,
    material_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Material).where(Material.id == material_id, Material.course_id == course_id)
    )
    material = result.scalar_one_or_none()
    if not material:
        raise NotFoundError("Material not found")
    return material


@router.delete("/{material_id}")
async def delete_material(
    course_id: str,
    material_id: str,
    current_user: User = Depends(require_role("teacher")),
    db: AsyncSession = Depends(get_db),
):
    await _verify_course_owner(course_id, current_user, db)

    result = await db.execute(
        select(Material).where(Material.id == material_id, Material.course_id == course_id)
    )
    material = result.scalar_one_or_none()
    if not material:
        raise NotFoundError("Material not found")

    # Remove from vector store
    from app.rag.vector_store import get_vector_store
    vs = get_vector_store()
    vs.delete_by_material(course_id, material_id)

    # Remove file
    file_path = Path(material.file_path)
    if file_path.exists():
        file_path.unlink()

    await db.delete(material)
    return {"message": "Material deleted"}
