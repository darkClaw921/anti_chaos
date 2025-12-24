from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, delete
from typing import List, Optional
from datetime import datetime, timedelta
import random
from backend.database.models import (
    User, UserSphere, Question, Answer, 
    UserFocusSphere, Subscription, UserSettings, Sphere, QuestionSchedule
)


# User CRUD
async def get_user_by_id(db: AsyncSession, user_id: int) -> Optional[User]:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def get_user_by_telegram_id(db: AsyncSession, telegram_id: int) -> Optional[User]:
    result = await db.execute(select(User).where(User.telegram_id == telegram_id))
    return result.scalar_one_or_none()


async def get_user_by_ip(db: AsyncSession, ip_address: str) -> Optional[User]:
    """Находит гостевого пользователя по IP адресу (только пользователи с отрицательным telegram_id)"""
    result = await db.execute(
        select(User).where(
            and_(
                User.ip_address == ip_address,
                User.telegram_id < 0  # Только гости
            )
        ).order_by(User.created_at.desc()).limit(1)  # Берем самого последнего созданного
    )
    return result.scalar_one_or_none()


async def create_user(db: AsyncSession, telegram_id: int, username: Optional[str] = None,
                     first_name: Optional[str] = None, last_name: Optional[str] = None,
                     name: Optional[str] = None, gender: Optional[str] = None,
                     birth_date: Optional[datetime] = None, ip_address: Optional[str] = None) -> User:
    user = User(
        telegram_id=telegram_id,
        username=username,
        first_name=first_name,
        last_name=last_name,
        name=name,
        gender=gender,
        birth_date=birth_date,
        ip_address=ip_address
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


async def get_random_question_by_sphere(
    db: AsyncSession, 
    sphere: str, 
    user_id: int, 
    since_date: Optional[datetime] = None
) -> Optional[Question]:
    """
    Получает случайный вопрос по сфере, на который пользователь еще не отвечал.
    
    Args:
        db: Сессия базы данных
        sphere: Ключ сферы
        user_id: ID пользователя
        since_date: Дата начала периода для проверки ответов. Если не указана, проверяются ответы за сегодня.
    """
    # Определяем дату начала периода для проверки ответов
    if since_date is None:
        # По умолчанию проверяем ответы за сегодня
        check_date = datetime.combine(datetime.utcnow().date(), datetime.min.time())
    else:
        check_date = since_date
    
    # Получаем вопросы, на которые пользователь уже отвечал за период
    answered_questions_result = await db.execute(
        select(Answer.question_id)
        .where(and_(
            Answer.user_id == user_id,
            Answer.date >= check_date
        ))
    )
    answered_question_ids = [row[0] for row in answered_questions_result.all()]
    
    # Пробуем найти вопрос, на который еще не отвечали за период
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
    
    # Если все вопросы отвечены за период, возвращаем None (все вопросы уже отвечены)
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


async def can_change_focus_spheres(db: AsyncSession, user_id: int) -> bool:
    """
    Проверяет, можно ли изменить фокус-сферы пользователя.
    Возвращает True, если все вопросы по текущим фокус-сферам отвечены
    за период с момента последнего изменения фокус-сфер.
    """
    # Получаем текущие фокус-сферы пользователя
    focus_spheres = await get_user_focus_spheres(db, user_id)
    
    # Если фокус-сфер нет, можно менять
    if not focus_spheres:
        return True
    
    # Определяем дату последнего изменения фокус-сфер (минимальная selected_at)
    min_selected_at = min(fs.selected_at for fs in focus_spheres)
    
    # Для каждой фокус-сферы проверяем, что все активные вопросы отвечены
    for focus_sphere in focus_spheres:
        # Получаем все активные вопросы для этой сферы
        questions = await get_questions_by_sphere(db, focus_sphere.sphere, active_only=True)
        
        # Если вопросов нет, пропускаем эту сферу
        if not questions:
            continue
        
        # Для каждого вопроса проверяем, есть ли ответ после даты изменения фокус-сфер
        for question in questions:
            # Проверяем, есть ли ответ на этот вопрос после даты изменения фокус-сфер
            answer_result = await db.execute(
                select(Answer)
                .where(
                    and_(
                        Answer.user_id == user_id,
                        Answer.question_id == question.id,
                        Answer.date >= min_selected_at
                    )
                )
                .limit(1)
            )
            answer = answer_result.scalar_one_or_none()
            
            # Если на вопрос нет ответа, нельзя менять фокус-сферы
            if not answer:
                return False
    
    # Все вопросы отвечены, можно менять
    return True


async def check_onboarding_completed(db: AsyncSession, user_id: int) -> bool:
    """Проверяет, завершен ли онбординг пользователя"""
    # Получаем список всех сфер жизни из базы данных
    all_spheres_list = await get_all_spheres(db)
    all_spheres_keys = {sphere.key for sphere in all_spheres_list}
    
    # Проверяем, есть ли оценки для всех сфер
    latest_spheres = await get_latest_user_spheres(db, user_id)
    rated_spheres = {sphere.sphere for sphere in latest_spheres}
    
    # Проверяем, что все сферы оценены
    all_spheres_rated = all(sphere_key in rated_spheres for sphere_key in all_spheres_keys)
    
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


# QuestionSchedule CRUD (заглушки)
async def get_questions_from_schedule(db: AsyncSession, day_number: int, sphere: Optional[str] = None) -> List[Question]:
    """
    Заглушка: получает вопросы из расписания для указанного дня.
    Позже будет реализована полная логика работы с расписанием.
    """
    # TODO: Реализовать получение вопросов из таблицы question_schedule
    # Пока возвращаем пустой список
    return []


async def create_question_schedule_entry(
    db: AsyncSession,
    day_number: int,
    question_id: int,
    sphere: str
):
    """
    Заглушка: создает запись в расписании вопросов.
    Позже будет использоваться для заполнения расписания.
    """
    # TODO: Реализовать создание записи в таблице question_schedule
    # Пока просто pass
    pass


# Sphere CRUD
async def get_all_spheres(db: AsyncSession) -> List[Sphere]:
    """Получить все сферы"""
    result = await db.execute(select(Sphere).order_by(Sphere.key))
    return list(result.scalars().all())


async def get_sphere_by_key(db: AsyncSession, key: str) -> Optional[Sphere]:
    """Получить сферу по ключу"""
    result = await db.execute(select(Sphere).where(Sphere.key == key))
    return result.scalar_one_or_none()


async def create_sphere(db: AsyncSession, key: str, name: str, color: str) -> Sphere:
    """Создать новую сферу"""
    sphere = Sphere(key=key, name=name, color=color)
    db.add(sphere)
    await db.commit()
    await db.refresh(sphere)
    return sphere


async def update_sphere(
    db: AsyncSession,
    sphere_id: int,
    name: Optional[str] = None,
    color: Optional[str] = None
) -> Optional[Sphere]:
    """Обновить сферу"""
    sphere = await db.get(Sphere, sphere_id)
    if not sphere:
        return None
    
    if name is not None:
        sphere.name = name
    if color is not None:
        sphere.color = color
    
    sphere.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(sphere)
    return sphere


async def delete_sphere(db: AsyncSession, sphere_id: int) -> bool:
    """Удалить сферу и все связанные данные"""
    sphere = await db.get(Sphere, sphere_id)
    if not sphere:
        return False
    
    sphere_key = sphere.key
    
    # Удаляем все оценки сфер пользователей
    await db.execute(
        delete(UserSphere).where(UserSphere.sphere == sphere_key)
    )
    
    # Удаляем все фокус-сферы пользователей
    await db.execute(
        delete(UserFocusSphere).where(UserFocusSphere.sphere == sphere_key)
    )
    
    # Удаляем все записи из расписания вопросов
    await db.execute(
        delete(QuestionSchedule).where(QuestionSchedule.sphere == sphere_key)
    )
    
    # Получаем все вопросы этой сферы для удаления (ответы удалятся автоматически благодаря каскаду)
    questions_result = await db.execute(
        select(Question).where(Question.sphere == sphere_key)
    )
    questions = questions_result.scalars().all()
    for question in questions:
        await db.delete(question)
    
    # Удаляем саму сферу
    await db.delete(sphere)
    await db.commit()
    return True


async def create_guest_user_with_test_data(db: AsyncSession, ip_address: str) -> User:
    """
    Создает гостевого пользователя с тестовыми данными:
    - Оценки всех сфер жизни (случайные от 5 до 8)
    - Выбор 1-2 фокус-сфер (случайно)
    - Несколько тестовых ответов на вопросы (5-10 ответов за последние 3-7 дней)
    - Настройки пользователя
    """
    # Генерируем случайный отрицательный telegram_id для гостя
    guest_telegram_id = -random.randint(1000000, 9999999)
    
    # Создаем пользователя с IP адресом
    user = await create_user(
        db,
        telegram_id=guest_telegram_id,
        username=f"guest_{guest_telegram_id}",
        first_name="Гость",
        last_name=None,
        ip_address=ip_address
    )
    
    # Получаем все сферы жизни
    all_spheres = await get_all_spheres(db)
    if not all_spheres:
        return user
    
    sphere_keys = [sphere.key for sphere in all_spheres]
    
    today = datetime.utcnow()
    
    # Создаем старые оценки всех сфер (35-40 дней назад) для "Было" в месячном отчете
    # Используем более низкие оценки (2-5) для показа прогресса
    old_date = today - timedelta(days=random.randint(35, 40))
    for sphere_key in sphere_keys:
        old_rating = random.randint(2, 5)
        old_user_sphere = UserSphere(
            user_id=user.id,
            sphere=sphere_key,
            rating=old_rating,
            date=old_date
        )
        db.add(old_user_sphere)
    
    # Создаем текущие оценки всех сфер (сегодня) для "Стало" в месячном отчете
    # Используем более высокие оценки (5-8) для показа прогресса
    for sphere_key in sphere_keys:
        rating = random.randint(5, 8)
        user_sphere = UserSphere(
            user_id=user.id,
            sphere=sphere_key,
            rating=rating,
            date=today
        )
        db.add(user_sphere)
    
    # Выбираем 1-2 фокус-сферы (случайно)
    num_focus_spheres = random.randint(1, 2)
    focus_spheres = random.sample(sphere_keys, min(num_focus_spheres, len(sphere_keys)))
    
    # Создаем фокус-сферы
    for sphere_key in focus_spheres:
        focus_sphere = UserFocusSphere(
            user_id=user.id,
            sphere=sphere_key,
            selected_at=today - timedelta(days=random.randint(3, 7))  # Выбраны 3-7 дней назад
        )
        db.add(focus_sphere)
    
    # Создаем тестовые ответы на вопросы (5-10 ответов за последние 3-7 дней)
    num_answers = random.randint(5, 10)
    test_answers = [
        "Хорошо, спасибо за вопрос",
        "Сегодня был продуктивный день",
        "Чувствую себя отлично",
        "Есть над чем поработать",
        "Всё идет по плану",
        "Делаю небольшие шаги вперед",
        "Стараюсь быть лучше",
        "Вижу прогресс",
        "Работаю над собой",
        "Двигаюсь к цели"
    ]
    
    # Получаем вопросы по фокус-сферам
    questions_by_sphere = {}
    for sphere_key in focus_spheres:
        questions = await get_questions_by_sphere(db, sphere_key, active_only=True)
        if questions:
            questions_by_sphere[sphere_key] = questions
    
    # Создаем ответы, распределенные по дням
    days_ago = random.randint(3, 7)
    answers_created = 0
    
    for day_offset in range(days_ago, 0, -1):
        if answers_created >= num_answers:
            break
        
        answer_date = today - timedelta(days=day_offset)
        # Создаем 1-2 ответа в день
        answers_per_day = random.randint(1, 2)
        
        for _ in range(answers_per_day):
            if answers_created >= num_answers:
                break
            
            # Выбираем случайную сферу из фокус-сфер
            if not questions_by_sphere:
                break
            
            sphere_key = random.choice(list(questions_by_sphere.keys()))
            questions = questions_by_sphere[sphere_key]
            
            if not questions:
                continue
            
            # Выбираем случайный вопрос
            question = random.choice(questions)
            
            # Выбираем случайный ответ
            answer_text = random.choice(test_answers)
            
            answer = Answer(
                user_id=user.id,
                question_id=question.id,
                answer=answer_text,
                date=answer_date
            )
            db.add(answer)
            answers_created += 1
    
    await db.commit()
    await db.refresh(user)
    return user


async def generate_test_data_for_user(db: AsyncSession, user_id: int) -> bool:
    """
    Генерирует тестовые данные для существующего пользователя:
    - Удаляет существующие оценки сфер, фокус-сферы и ответы
    - Создает старые оценки всех сфер (35-40 дней назад, оценки 2-5)
    - Создает текущие оценки всех сфер (сегодня, оценки 5-8)
    - Выбирает 1-2 фокус-сферы (случайно)
    - Создает 5-10 тестовых ответов на вопросы за последние 3-7 дней
    """
    # Проверяем, что пользователь существует
    user = await get_user_by_id(db, user_id)
    if not user:
        return False
    
    # Получаем все сферы жизни
    all_spheres = await get_all_spheres(db)
    if not all_spheres:
        return False
    
    sphere_keys = [sphere.key for sphere in all_spheres]
    
    # Удаляем существующие данные пользователя
    await db.execute(delete(UserSphere).where(UserSphere.user_id == user_id))
    await db.execute(delete(UserFocusSphere).where(UserFocusSphere.user_id == user_id))
    await db.execute(delete(Answer).where(Answer.user_id == user_id))
    
    today = datetime.utcnow()
    
    # Создаем старые оценки всех сфер (35-40 дней назад) для "Было" в месячном отчете
    # Используем более низкие оценки (2-5) для показа прогресса
    old_date = today - timedelta(days=random.randint(35, 40))
    for sphere_key in sphere_keys:
        old_rating = random.randint(2, 5)
        old_user_sphere = UserSphere(
            user_id=user.id,
            sphere=sphere_key,
            rating=old_rating,
            date=old_date
        )
        db.add(old_user_sphere)
    
    # Создаем текущие оценки всех сфер (сегодня) для "Стало" в месячном отчете
    # Используем более высокие оценки (5-8) для показа прогресса
    for sphere_key in sphere_keys:
        rating = random.randint(5, 8)
        user_sphere = UserSphere(
            user_id=user.id,
            sphere=sphere_key,
            rating=rating,
            date=today
        )
        db.add(user_sphere)
    
    # Выбираем 1-2 фокус-сферы (случайно)
    num_focus_spheres = random.randint(1, 2)
    focus_spheres = random.sample(sphere_keys, min(num_focus_spheres, len(sphere_keys)))
    
    # Создаем фокус-сферы
    for sphere_key in focus_spheres:
        focus_sphere = UserFocusSphere(
            user_id=user.id,
            sphere=sphere_key,
            selected_at=today - timedelta(days=random.randint(3, 7))  # Выбраны 3-7 дней назад
        )
        db.add(focus_sphere)
    
    # Создаем тестовые ответы на вопросы (5-10 ответов за последние 3-7 дней)
    num_answers = random.randint(5, 10)
    test_answers = [
        "Хорошо, спасибо за вопрос",
        "Сегодня был продуктивный день",
        "Чувствую себя отлично",
        "Есть над чем поработать",
        "Всё идет по плану",
        "Делаю небольшие шаги вперед",
        "Стараюсь быть лучше",
        "Вижу прогресс",
        "Работаю над собой",
        "Двигаюсь к цели"
    ]
    
    # Получаем вопросы по фокус-сферам
    questions_by_sphere = {}
    for sphere_key in focus_spheres:
        questions = await get_questions_by_sphere(db, sphere_key, active_only=True)
        if questions:
            questions_by_sphere[sphere_key] = questions
    
    # Создаем ответы, распределенные по дням
    days_ago = random.randint(3, 7)
    answers_created = 0
    
    for day_offset in range(days_ago, 0, -1):
        if answers_created >= num_answers:
            break
        
        answer_date = today - timedelta(days=day_offset)
        # Создаем 1-2 ответа в день
        answers_per_day = random.randint(1, 2)
        
        for _ in range(answers_per_day):
            if answers_created >= num_answers:
                break
            
            # Выбираем случайную сферу из фокус-сфер
            if not questions_by_sphere:
                break
            
            sphere_key = random.choice(list(questions_by_sphere.keys()))
            questions = questions_by_sphere[sphere_key]
            
            if not questions:
                continue
            
            # Выбираем случайный вопрос
            question = random.choice(questions)
            
            # Выбираем случайный ответ
            answer_text = random.choice(test_answers)
            
            answer = Answer(
                user_id=user.id,
                question_id=question.id,
                answer=answer_text,
                date=answer_date
            )
            db.add(answer)
            answers_created += 1
    
    await db.commit()
    return True

