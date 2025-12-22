from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from backend.database.database import get_db
from backend.database import crud
from backend.services.question_service import get_daily_question_for_user, get_simple_question_for_user, get_spheres_for_rating_after_questions
from backend.api.users import get_current_user, get_admin_user
from pydantic import BaseModel

router = APIRouter(prefix="/api/questions", tags=["questions"])


class QuestionResponse(BaseModel):
    id: int
    sphere: str
    text: str
    type: str
    is_active: Optional[bool] = None
    
    class Config:
        from_attributes = True


class QuestionCreate(BaseModel):
    sphere: str
    text: str
    type: str = "text"
    is_active: bool = True


class QuestionUpdate(BaseModel):
    sphere: Optional[str] = None
    text: Optional[str] = None
    type: Optional[str] = None
    is_active: Optional[bool] = None


@router.get("/daily", response_model=QuestionResponse)
async def get_daily_question(
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    question = await get_daily_question_for_user(db, user.id)
    if not question:
        raise HTTPException(status_code=404, detail="No question available")
    return question


@router.get("/simple", response_model=QuestionResponse)
async def get_simple_question(
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    question = await get_simple_question_for_user(db, user.id)
    if not question:
        raise HTTPException(status_code=404, detail="No question available")
    return question


@router.get("/{question_id}", response_model=QuestionResponse)
async def get_question(
    question_id: int,
    db: AsyncSession = Depends(get_db)
):
    question = await crud.get_question_by_id(db, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    return question


# Админские endpoints для управления вопросами
@router.get("/admin/all", response_model=List[QuestionResponse])
async def get_all_questions_admin(
    active_only: bool = False,
    admin = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Получить все вопросы (только для админов)"""
    questions = await crud.get_all_questions(db, active_only=active_only)
    return questions


@router.post("/admin/", response_model=QuestionResponse)
async def create_question_admin(
    question_data: QuestionCreate,
    admin = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Создать новый вопрос (только для админов)"""
    question = await crud.create_question(
        db,
        sphere=question_data.sphere,
        text=question_data.text,
        type=question_data.type,
        is_active=question_data.is_active
    )
    return question


@router.put("/admin/{question_id}", response_model=QuestionResponse)
async def update_question_admin(
    question_id: int,
    question_data: QuestionUpdate,
    admin = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Обновить вопрос (только для админов)"""
    question = await crud.update_question(
        db,
        question_id=question_id,
        sphere=question_data.sphere,
        text=question_data.text,
        type=question_data.type,
        is_active=question_data.is_active
    )
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    return question


@router.delete("/admin/{question_id}")
async def delete_question_admin(
    question_id: int,
    admin = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Удалить вопрос (только для админов)"""
    success = await crud.delete_question(db, question_id)
    if not success:
        raise HTTPException(status_code=404, detail="Question not found")
    return {"message": "Question deleted successfully"}


@router.get("/spheres-for-rating", response_model=List[str])
async def get_spheres_for_rating(
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Заглушка: получает список сфер (1 или 2) для оценки после окончания вопросов.
    Возвращает сферы, которые пользователь проходил за период.
    """
    spheres = await get_spheres_for_rating_after_questions(db, user.id)
    return spheres

