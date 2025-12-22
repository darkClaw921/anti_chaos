from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from datetime import datetime
from backend.database import crud
from backend.database.models import Question, UserFocusSphere


async def get_daily_question_for_user(db: AsyncSession, user_id: int) -> Optional[Question]:
    """
    Получает вопрос дня для пользователя на основе его фокус-сфер и расписания.
    Вопросы идут из расписания рандомно.
    Если выбрана 1 фокус-сфера - вопросы только из этой сферы.
    Если выбраны 2 фокус-сферы - сначала все вопросы из первой сферы, потом все из второй.
    """
    # Получаем фокус-сферы пользователя
    focus_spheres = await crud.get_user_focus_spheres(db, user_id)
    
    if not focus_spheres:
        # Если нет фокус-сфер, используем fallback
        return await get_simple_question_for_user(db, user_id)
    
    # TODO: Реализовать логику работы с расписанием вопросов
    # Пока используем текущую логику с рандомным выбором
    # Когда расписание будет заполнено, здесь будет выбор из расписания
    
    # Если выбрана 1 сфера - вопросы только из этой сферы
    if len(focus_spheres) == 1:
        question = await crud.get_random_question_by_sphere(
            db, 
            focus_spheres[0].sphere, 
            user_id
        )
        if question:
            return question
    
    # Если выбраны 2 сферы - сначала все вопросы из первой, потом все из второй
    # TODO: Добавить логику отслеживания текущей сферы и переключения на вторую
    # Пока используем первую сферу
    if len(focus_spheres) >= 2:
        # Пробуем получить вопрос из первой сферы
        question = await crud.get_random_question_by_sphere(
            db, 
            focus_spheres[0].sphere, 
            user_id
        )
        if question:
            return question
        
        # Если вопросов из первой сферы нет, пробуем вторую
        question = await crud.get_random_question_by_sphere(
            db, 
            focus_spheres[1].sphere, 
            user_id
        )
        if question:
            return question
    
    # Fallback: если нет вопросов для фокус-сфер,
    # используем простой вопрос из любой сферы
    return await get_simple_question_for_user(db, user_id)


async def get_spheres_for_rating_after_questions(db: AsyncSession, user_id: int) -> List[str]:
    """
    Заглушка: определяет сферы для оценки после окончания вопросов.
    Возвращает список сфер (1 или 2), которые пользователь проходил за период.
    """
    # TODO: Реализовать логику определения сфер для оценки
    # Пока возвращаем фокус-сферы пользователя
    focus_spheres = await crud.get_user_focus_spheres(db, user_id)
    return [fs.sphere for fs in focus_spheres]


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

