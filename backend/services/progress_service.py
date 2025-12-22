from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict
from datetime import datetime, timedelta
from backend.database import crud
from backend.database.models import UserSphere


async def calculate_progress(db: AsyncSession, user_id: int, days: int = 7) -> Dict:
    """
    Рассчитывает прогресс пользователя за указанное количество дней
    """
    # Получаем оценки сфер за период
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Получаем все оценки за период
    all_spheres = await crud.get_user_spheres(db, user_id)
    period_spheres = [s for s in all_spheres if s.date >= start_date]
    
    # Группируем по сферам
    spheres_data = {}
    for sphere in period_spheres:
        if sphere.sphere not in spheres_data:
            spheres_data[sphere.sphere] = []
        spheres_data[sphere.sphere].append({
            'rating': sphere.rating,
            'date': sphere.date
        })
    
    # Рассчитываем средние значения
    average_ratings = {}
    for sphere_name, ratings in spheres_data.items():
        if ratings:
            average_ratings[sphere_name] = sum(r['rating'] for r in ratings) / len(ratings)
    
    # Получаем последние оценки для сравнения
    latest_spheres = await crud.get_latest_user_spheres(db, user_id)
    latest_ratings = {s.sphere: s.rating for s in latest_spheres}
    
    # Определяем выросшие и просевшие сферы
    grown_spheres = []
    declined_spheres = []
    
    for sphere_name, current_rating in latest_ratings.items():
        if sphere_name in average_ratings:
            previous_avg = average_ratings[sphere_name]
            if current_rating > previous_avg:
                grown_spheres.append({
                    'sphere': sphere_name,
                    'growth': current_rating - previous_avg
                })
            elif current_rating < previous_avg:
                declined_spheres.append({
                    'sphere': sphere_name,
                    'decline': previous_avg - current_rating
                })
    
    return {
        'current_ratings': latest_ratings,
        'average_ratings': average_ratings,
        'grown_spheres': grown_spheres,
        'declined_spheres': declined_spheres,
        'period_days': days
    }


async def get_weekly_summary(db: AsyncSession, user_id: int) -> Dict:
    """
    Получает итоги недели
    """
    progress = await calculate_progress(db, user_id, days=7)
    
    # Получаем фокус-сферы
    focus_spheres = await crud.get_user_focus_spheres(db, user_id)
    focus_sphere_names = [fs.sphere for fs in focus_spheres]
    
    # Получаем количество ответов за неделю
    answers = await crud.get_user_answers(db, user_id, days=7)
    
    return {
        'progress': progress,
        'focus_spheres': focus_sphere_names,
        'answers_count': len(answers),
        'week_start': (datetime.utcnow() - timedelta(days=7)).date(),
        'week_end': datetime.utcnow().date()
    }


async def get_monthly_report(db: AsyncSession, user_id: int) -> Dict:
    """
    Получает месячный отчёт
    """
    progress = await calculate_progress(db, user_id, days=30)
    
    # Получаем фокус-сферы
    focus_spheres = await crud.get_user_focus_spheres(db, user_id)
    focus_sphere_names = [fs.sphere for fs in focus_spheres]
    
    # Получаем количество ответов за месяц
    answers = await crud.get_user_answers(db, user_id, days=30)
    
    # Получаем начальные оценки (30 дней назад)
    start_date = datetime.utcnow() - timedelta(days=30)
    all_spheres = await crud.get_user_spheres(db, user_id)
    initial_spheres = [s for s in all_spheres if s.date < start_date]
    
    initial_ratings = {}
    if initial_spheres:
        # Берем последние оценки до начала периода
        latest_before_period = {}
        for sphere in initial_spheres:
            if sphere.sphere not in latest_before_period or sphere.date > latest_before_period[sphere.sphere].date:
                latest_before_period[sphere.sphere] = sphere
        initial_ratings = {s.sphere: s.rating for s in latest_before_period.values()}
    
    return {
        'progress': progress,
        'focus_spheres': focus_sphere_names,
        'answers_count': len(answers),
        'initial_ratings': initial_ratings,
        'current_ratings': progress['current_ratings'],
        'month_start': (datetime.utcnow() - timedelta(days=30)).date(),
        'month_end': datetime.utcnow().date()
    }

