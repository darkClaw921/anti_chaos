from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from backend.database import crud
from backend.database.models import UserSphere


async def calculate_progress(db: AsyncSession, user_id: int) -> Dict:
    """
    Рассчитывает прогресс пользователя за период между предыдущей и последней оценкой сфер
    """
    # Получаем последние оценки
    latest_spheres = await crud.get_latest_user_spheres(db, user_id)
    if not latest_spheres:
        return {
            'current_ratings': {},
            'previous_ratings': {},
            'grown_spheres': [],
            'declined_spheres': [],
            'period_days': 0,
            'period_start': None,
            'period_end': None
        }
    
    latest_ratings = {s.sphere: s.rating for s in latest_spheres}
    latest_dates = {s.sphere: s.date for s in latest_spheres}
    
    # Получаем предыдущие оценки
    previous_spheres = await crud.get_previous_user_spheres(db, user_id)
    previous_ratings = {s.sphere: s.rating for s in previous_spheres}
    previous_dates = {s.sphere: s.date for s in previous_spheres}
    
    # Определяем период: находим самую раннюю предыдущую дату и самую позднюю текущую дату
    period_start = None
    period_end = None
    
    if previous_dates:
        period_start = min(previous_dates.values())
    if latest_dates:
        period_end = max(latest_dates.values())
    
    # Если нет предыдущих оценок, используем последние как начальные
    if not period_start and period_end:
        period_start = period_end
    
    # Вычисляем количество дней в периоде
    period_days = 0
    if period_start and period_end:
        period_days = (period_end.date() - period_start.date()).days
        # Минимум 1 день, если оценки в один день
        if period_days == 0:
            period_days = 1
    
    # Если нет предыдущих оценок, используем последние как начальные для сравнения
    if not previous_ratings:
        previous_ratings = latest_ratings.copy()
    
    # Определяем выросшие и просевшие сферы
    grown_spheres = []
    declined_spheres = []
    
    for sphere_name, current_rating in latest_ratings.items():
        if sphere_name in previous_ratings:
            previous_rating = previous_ratings[sphere_name]
            if current_rating > previous_rating:
                grown_spheres.append({
                    'sphere': sphere_name,
                    'growth': current_rating - previous_rating
                })
            elif current_rating < previous_rating:
                declined_spheres.append({
                    'sphere': sphere_name,
                    'decline': previous_rating - current_rating
                })
    
    return {
        'current_ratings': latest_ratings,
        'previous_ratings': previous_ratings,
        'grown_spheres': grown_spheres,
        'declined_spheres': declined_spheres,
        'period_days': period_days,
        'period_start': period_start.date().isoformat() if period_start else None,
        'period_end': period_end.date().isoformat() if period_end else None
    }


async def get_weekly_summary(db: AsyncSession, user_id: int) -> Dict:
    """
    Получает итоги недели
    """
    progress = await calculate_progress(db, user_id)
    
    # Получаем фокус-сферы
    focus_spheres = await crud.get_user_focus_spheres(db, user_id)
    focus_sphere_names = [fs.sphere for fs in focus_spheres]
    
    # Получаем количество ответов за период
    period_days = progress.get('period_days', 7)
    answers = await crud.get_user_answers(db, user_id, days=period_days if period_days > 0 else 7)
    
    return {
        'progress': progress,
        'focus_spheres': focus_sphere_names,
        'answers_count': len(answers),
        'period_start': progress.get('period_start'),
        'period_end': progress.get('period_end')
    }


async def get_monthly_report(db: AsyncSession, user_id: int) -> Dict:
    """
    Получает месячный отчёт
    """
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
    
    # Получаем текущие оценки
    latest_spheres = await crud.get_latest_user_spheres(db, user_id)
    current_ratings = {s.sphere: s.rating for s in latest_spheres}
    
    # Определяем выросшие и просевшие сферы на основе сравнения начальных и текущих оценок
    grown_spheres = []
    declined_spheres = []
    
    for sphere_name, current_rating in current_ratings.items():
        if sphere_name in initial_ratings:
            initial_rating = initial_ratings[sphere_name]
            if current_rating > initial_rating:
                grown_spheres.append({
                    'sphere': sphere_name,
                    'growth': current_rating - initial_rating
                })
            elif current_rating < initial_rating:
                declined_spheres.append({
                    'sphere': sphere_name,
                    'decline': initial_rating - current_rating
                })
    
    # Создаем объект progress с правильными данными для месячного отчета
    progress = {
        'current_ratings': current_ratings,
        'grown_spheres': grown_spheres,
        'declined_spheres': declined_spheres,
        'period_days': 30
    }
    
    return {
        'progress': progress,
        'focus_spheres': focus_sphere_names,
        'answers_count': len(answers),
        'initial_ratings': initial_ratings,
        'current_ratings': current_ratings,
        'month_start': (datetime.utcnow() - timedelta(days=30)).date(),
        'month_end': datetime.utcnow().date()
    }

