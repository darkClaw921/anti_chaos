from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from backend.database import crud
from backend.database.models import Question, UserFocusSphere


async def get_daily_question_for_user(db: AsyncSession, user_id: int) -> Optional[Question]:
    """
    Получает вопрос дня для пользователя на основе его фокус-сфер
    Если нет вопросов для фокус-сфер, использует fallback на простой вопрос
    """
    # Получаем фокус-сферы пользователя
    focus_spheres = await crud.get_user_focus_spheres(db, user_id)
    
    # Если есть фокус-сферы, пробуем получить вопрос для них
    if focus_spheres:
        for focus_sphere in focus_spheres:
            question = await crud.get_random_question_by_sphere(
                db, 
                focus_sphere.sphere, 
                user_id
            )
            if question:
                return question
    
    # Fallback: если нет вопросов для фокус-сфер или нет фокус-сфер,
    # используем простой вопрос из любой сферы
    return await get_simple_question_for_user(db, user_id)


async def get_simple_question_for_user(db: AsyncSession, user_id: int) -> Optional[Question]:
    """
    Получает упрощенный вопрос для пользователя
    """
    # Получаем все активные вопросы
    all_spheres = ["health", "relationships", "money", "energy", "career", "other"]
    
    import random
    random.shuffle(all_spheres)
    
    for sphere in all_spheres:
        question = await crud.get_random_question_by_sphere(db, sphere, user_id)
        if question:
            return question
    
    return None

