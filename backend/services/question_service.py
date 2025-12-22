from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from datetime import datetime
from backend.database import crud
from backend.database.models import Question, UserFocusSphere


async def get_daily_question_for_user(db: AsyncSession, user_id: int, current_sphere: Optional[str] = None) -> Optional[Question]:
    """
    Получает вопрос дня для пользователя на основе его фокус-сфер и расписания.
    Вопросы идут из расписания рандомно.
    Если выбрана 1 фокус-сфера - вопросы только из этой сферы.
    Если выбраны 2 фокус-сферы - сначала все вопросы из первой сферы, потом все из второй.
    Не показывает вопросы, на которые пользователь уже ответил за период с момента последнего изменения фокус-сфер.
    
    Args:
        db: Сессия базы данных
        user_id: ID пользователя
        current_sphere: Текущая сфера для вопросов (если указана, используется она)
    """
    # Получаем фокус-сферы пользователя
    focus_spheres = await crud.get_user_focus_spheres(db, user_id)
    
    if not focus_spheres:
        # Если нет фокус-сфер, используем fallback
        return await get_simple_question_for_user(db, user_id)
    
    # Определяем дату последнего изменения фокус-сфер (минимальная selected_at)
    min_selected_at = min(fs.selected_at for fs in focus_spheres)
    
    # TODO: Реализовать логику работы с расписанием вопросов
    # Пока используем текущую логику с рандомным выбором
    # Когда расписание будет заполнено, здесь будет выбор из расписания
    
    # Если указана текущая сфера, используем её
    if current_sphere:
        # Проверяем, что текущая сфера является одной из фокус-сфер
        sphere_keys = [fs.sphere for fs in focus_spheres]
        if current_sphere in sphere_keys:
            question = await crud.get_random_question_by_sphere(
                db, 
                current_sphere, 
                user_id,
                since_date=min_selected_at
            )
            if question:
                return question
    
    # Если выбрана 1 сфера - вопросы только из этой сферы
    if len(focus_spheres) == 1:
        question = await crud.get_random_question_by_sphere(
            db, 
            focus_spheres[0].sphere, 
            user_id,
            since_date=min_selected_at
        )
        if question:
            return question
    
    # Если выбраны 2 сферы - сначала все вопросы из первой, потом все из второй
    if len(focus_spheres) >= 2:
        # Определяем текущую сферу: если не указана, используем первую
        target_sphere_index = 0
        if current_sphere:
            # Если указана текущая сфера, находим её индекс
            for idx, fs in enumerate(focus_spheres):
                if fs.sphere == current_sphere:
                    target_sphere_index = idx
                    break
        
        # Пробуем получить вопрос из текущей сферы
        question = await crud.get_random_question_by_sphere(
            db, 
            focus_spheres[target_sphere_index].sphere, 
            user_id,
            since_date=min_selected_at
        )
        if question:
            return question
        
        # Если вопросов из текущей сферы нет, пробуем вторую сферу (если это была первая)
        if target_sphere_index == 0 and len(focus_spheres) >= 2:
            question = await crud.get_random_question_by_sphere(
                db, 
                focus_spheres[1].sphere, 
                user_id,
                since_date=min_selected_at
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
    Получает упрощенный вопрос для пользователя.
    Используется когда у пользователя нет фокус-сфер.
    Проверяет только ответы за сегодня.
    """
    # Получаем все активные вопросы
    all_spheres = ["health", "relationships", "money", "energy", "career", "other"]
    
    import random
    random.shuffle(all_spheres)
    
    # Для простых вопросов проверяем только ответы за сегодня (since_date=None)
    for sphere in all_spheres:
        question = await crud.get_random_question_by_sphere(db, sphere, user_id, since_date=None)
        if question:
            return question
    
    return None

