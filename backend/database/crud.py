from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Optional
from datetime import datetime, timedelta
from backend.database.models import (
    User, UserSphere, Question, Answer, 
    UserFocusSphere, Subscription, UserSettings
)


# User CRUD
async def get_user_by_id(db: AsyncSession, user_id: int) -> Optional[User]:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def get_user_by_telegram_id(db: AsyncSession, telegram_id: int) -> Optional[User]:
    result = await db.execute(select(User).where(User.telegram_id == telegram_id))
    return result.scalar_one_or_none()


async def create_user(db: AsyncSession, telegram_id: int, username: Optional[str] = None,
                     first_name: Optional[str] = None, last_name: Optional[str] = None,
                     name: Optional[str] = None, gender: Optional[str] = None,
                     birth_date: Optional[datetime] = None) -> User:
    user = User(
        telegram_id=telegram_id,
        username=username,
        first_name=first_name,
        last_name=last_name,
        name=name,
        gender=gender,
        birth_date=birth_date
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    # Создаем настройки по умолчанию
    settings = UserSettings(user_id=user.id)
    db.add(settings)
    
    # Создаем бесплатную подписку
    subscription = Subscription(user_id=user.id, plan="free")
    db.add(subscription)
    
    await db.commit()
    return user


async def update_user_profile(
    db: AsyncSession,
    user_id: int,
    name: Optional[str] = None,
    gender: Optional[str] = None,
    birth_date: Optional[datetime] = None
) -> Optional[User]:
    """Обновить профиль пользователя"""
    user = await get_user_by_id(db, user_id)
    if not user:
        return None
    
    if name is not None:
        user.name = name
    if gender is not None:
        user.gender = gender
    if birth_date is not None:
        user.birth_date = birth_date
    
    await db.commit()
    await db.refresh(user)
    return user


# UserSphere CRUD
async def create_user_sphere(db: AsyncSession, user_id: int, sphere: str, rating: int) -> UserSphere:
    user_sphere = UserSphere(user_id=user_id, sphere=sphere, rating=rating)
    db.add(user_sphere)
    await db.commit()
    await db.refresh(user_sphere)
    return user_sphere


async def get_user_spheres(db: AsyncSession, user_id: int, date: Optional[datetime] = None) -> List[UserSphere]:
    query = select(UserSphere).where(UserSphere.user_id == user_id)
    if date:
        query = query.where(UserSphere.date == date)
    result = await db.execute(query.order_by(UserSphere.date.desc()))
    return list(result.scalars().all())


async def get_latest_user_spheres(db: AsyncSession, user_id: int) -> List[UserSphere]:
    # Получаем последние оценки по каждой сфере
    # Получаем все оценки пользователя, отсортированные по дате
    result = await db.execute(
        select(UserSphere)
        .where(UserSphere.user_id == user_id)
        .order_by(UserSphere.date.desc(), UserSphere.id.desc())
    )
    all_spheres = list(result.scalars().all())
    
    if not all_spheres:
        return []
    
    # Группируем по сферам и берем последнюю оценку для каждой сферы
    spheres_dict = {}
    for sphere in all_spheres:
        if sphere.sphere not in spheres_dict:
            spheres_dict[sphere.sphere] = sphere
    
    return list(spheres_dict.values())


# Question CRUD
async def get_question_by_id(db: AsyncSession, question_id: int) -> Optional[Question]:
    result = await db.execute(select(Question).where(Question.id == question_id))
    return result.scalar_one_or_none()


async def get_questions_by_sphere(db: AsyncSession, sphere: str, active_only: bool = True) -> List[Question]:
    query = select(Question).where(Question.sphere == sphere)
    if active_only:
        query = query.where(Question.is_active == True)
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_random_question_by_sphere(db: AsyncSession, sphere: str, user_id: int) -> Optional[Question]:
    # Получаем вопросы, на которые пользователь еще не отвечал сегодня
    today = datetime.utcnow().date()
    
    answered_questions_result = await db.execute(
        select(Answer.question_id)
        .where(and_(
            Answer.user_id == user_id,
            Answer.date >= datetime.combine(today, datetime.min.time())
        ))
    )
    answered_question_ids = [row[0] for row in answered_questions_result.all()]
    
    # Сначала пробуем найти вопрос, на который еще не отвечали сегодня
    query = select(Question).where(
        and_(
            Question.sphere == sphere,
            Question.is_active == True,
            ~Question.id.in_(answered_question_ids) if answered_question_ids else True
        )
    )
    result = await db.execute(query)
    questions = list(result.scalars().all())
    
    # Если есть неотвеченные вопросы, возвращаем случайный
    if questions:
        import random
        return random.choice(questions)
    
    # Если все вопросы отвечены, возвращаем любой активный вопрос из этой сферы
    fallback_query = select(Question).where(
        and_(
            Question.sphere == sphere,
            Question.is_active == True
        )
    )
    fallback_result = await db.execute(fallback_query)
    fallback_questions = list(fallback_result.scalars().all())
    
    if fallback_questions:
        import random
        return random.choice(fallback_questions)
    
    return None


async def get_all_questions(db: AsyncSession, active_only: bool = False) -> List[Question]:
    """Получить все вопросы (для админов)"""
    query = select(Question)
    if active_only:
        query = query.where(Question.is_active == True)
    result = await db.execute(query.order_by(Question.sphere, Question.id))
    return list(result.scalars().all())


async def create_question(
    db: AsyncSession,
    sphere: str,
    text: str,
    type: str = "text",
    is_active: bool = True
) -> Question:
    """Создать новый вопрос"""
    question = Question(
        sphere=sphere,
        text=text,
        type=type,
        is_active=is_active
    )
    db.add(question)
    await db.commit()
    await db.refresh(question)
    return question


async def update_question(
    db: AsyncSession,
    question_id: int,
    sphere: Optional[str] = None,
    text: Optional[str] = None,
    type: Optional[str] = None,
    is_active: Optional[bool] = None
) -> Optional[Question]:
    """Обновить вопрос"""
    question = await get_question_by_id(db, question_id)
    if not question:
        return None
    
    if sphere is not None:
        question.sphere = sphere
    if text is not None:
        question.text = text
    if type is not None:
        question.type = type
    if is_active is not None:
        question.is_active = is_active
    
    await db.commit()
    await db.refresh(question)
    return question


async def delete_question(db: AsyncSession, question_id: int) -> bool:
    """Удалить вопрос"""
    question = await get_question_by_id(db, question_id)
    if not question:
        return False
    
    await db.delete(question)
    await db.commit()
    return True


# Answer CRUD
async def create_answer(db: AsyncSession, user_id: int, question_id: int, answer: str) -> Answer:
    answer_obj = Answer(user_id=user_id, question_id=question_id, answer=answer)
    db.add(answer_obj)
    await db.commit()
    await db.refresh(answer_obj)
    return answer_obj


async def get_user_answers(db: AsyncSession, user_id: int, days: Optional[int] = None) -> List[Answer]:
    query = select(Answer).where(Answer.user_id == user_id)
    if days:
        start_date = datetime.utcnow() - timedelta(days=days)
        query = query.where(Answer.date >= start_date)
    result = await db.execute(query.order_by(Answer.date.desc()))
    return list(result.scalars().all())


async def has_user_answered_today(db: AsyncSession, user_id: int) -> bool:
    """Проверяет, ответил ли пользователь сегодня на вопрос"""
    today = datetime.utcnow().date()
    result = await db.execute(
        select(Answer)
        .where(
            and_(
                Answer.user_id == user_id,
                Answer.date >= datetime.combine(today, datetime.min.time())
            )
        )
        .limit(1)
    )
    return result.scalar_one_or_none() is not None


# UserFocusSphere CRUD
async def set_user_focus_spheres(db: AsyncSession, user_id: int, spheres: List[str]) -> List[UserFocusSphere]:
    # Удаляем старые фокус-сферы
    await db.execute(
        select(UserFocusSphere).where(UserFocusSphere.user_id == user_id)
    )
    result = await db.execute(select(UserFocusSphere).where(UserFocusSphere.user_id == user_id))
    old_spheres = result.scalars().all()
    for sphere in old_spheres:
        await db.delete(sphere)
    
    # Создаем новые
    new_spheres = []
    for sphere in spheres:
        focus_sphere = UserFocusSphere(user_id=user_id, sphere=sphere)
        db.add(focus_sphere)
        new_spheres.append(focus_sphere)
    
    await db.commit()
    for sphere in new_spheres:
        await db.refresh(sphere)
    return new_spheres


async def get_user_focus_spheres(db: AsyncSession, user_id: int) -> List[UserFocusSphere]:
    result = await db.execute(
        select(UserFocusSphere).where(UserFocusSphere.user_id == user_id)
    )
    return list(result.scalars().all())


async def check_onboarding_completed(db: AsyncSession, user_id: int) -> bool:
    """Проверяет, завершен ли онбординг пользователя"""
    # Список всех сфер жизни
    all_spheres = ["health", "relationships", "money", "energy", "career", "other"]
    
    # Проверяем, есть ли оценки для всех сфер
    latest_spheres = await get_latest_user_spheres(db, user_id)
    rated_spheres = {sphere.sphere for sphere in latest_spheres}
    
    # Проверяем, что все сферы оценены
    all_spheres_rated = all(sphere in rated_spheres for sphere in all_spheres)
    
    # Проверяем, есть ли хотя бы одна фокус-сфера
    focus_spheres = await get_user_focus_spheres(db, user_id)
    has_focus_spheres = len(focus_spheres) > 0
    
    return all_spheres_rated and has_focus_spheres


# UserSettings CRUD
async def get_user_settings(db: AsyncSession, user_id: int) -> Optional[UserSettings]:
    result = await db.execute(select(UserSettings).where(UserSettings.user_id == user_id))
    return result.scalar_one_or_none()


async def update_user_settings(
    db: AsyncSession, 
    user_id: int, 
    notification_time: Optional[str] = None,
    language: Optional[str] = None,
    is_paused: Optional[bool] = None,
    weekly_report_frequency: Optional[str] = None,
    reminder_frequency: Optional[str] = None,
    dark_theme: Optional[bool] = None,
    admin_test_notifications: Optional[bool] = None
) -> UserSettings:
    settings = await get_user_settings(db, user_id)
    if not settings:
        settings = UserSettings(user_id=user_id)
        db.add(settings)
    
    if notification_time is not None:
        settings.notification_time = notification_time
    if language is not None:
        settings.language = language
    if is_paused is not None:
        settings.is_paused = is_paused
    if weekly_report_frequency is not None:
        settings.weekly_report_frequency = weekly_report_frequency
    if reminder_frequency is not None:
        settings.reminder_frequency = reminder_frequency
    if dark_theme is not None:
        settings.dark_theme = dark_theme
    if admin_test_notifications is not None:
        settings.admin_test_notifications = admin_test_notifications
    
    await db.commit()
    await db.refresh(settings)
    return settings


# Subscription CRUD
async def get_user_subscription(db: AsyncSession, user_id: int) -> Optional[Subscription]:
    result = await db.execute(select(Subscription).where(Subscription.user_id == user_id))
    return result.scalar_one_or_none()


async def update_subscription(
    db: AsyncSession,
    user_id: int,
    plan: str,
    expires_at: Optional[datetime] = None
) -> Subscription:
    subscription = await get_user_subscription(db, user_id)
    if not subscription:
        subscription = Subscription(user_id=user_id, plan=plan, expires_at=expires_at)
        db.add(subscription)
    else:
        subscription.plan = plan
        if expires_at:
            subscription.expires_at = expires_at
    
    await db.commit()
    await db.refresh(subscription)
    return subscription


async def delete_user_account(db: AsyncSession, user_id: int) -> bool:
    """Удалить все данные пользователя из базы данных"""
    user = await get_user_by_id(db, user_id)
    if not user:
        return False
    
    # Благодаря cascade="all, delete-orphan" в моделях, все связанные данные
    # (spheres, answers, focus_spheres, settings, subscription) удалятся автоматически
    await db.delete(user)
    await db.commit()
    return True

