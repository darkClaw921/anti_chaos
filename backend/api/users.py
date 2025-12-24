from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import random
from datetime import datetime
from backend.database.database import get_db
from backend.database import crud
from backend.services.telegram_auth import validate_telegram_init_data
from backend.config import settings
from pydantic import BaseModel

router = APIRouter(prefix="/api/users", tags=["users"])


class UserCreate(BaseModel):
    telegram_id: int
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    telegram_id: int
    username: Optional[str]
    first_name: Optional[str]
    last_name: Optional[str]
    name: Optional[str] = None
    gender: Optional[str] = None
    birth_date: Optional[str] = None
    created_at: str
    
    class Config:
        from_attributes = True


class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    gender: Optional[str] = None
    birth_date: Optional[str] = None  # Формат: YYYY-MM-DD или DD.MM.YYYY


def get_client_ip(request: Request) -> str:
    """Получает IP адрес клиента из заголовков запроса или напрямую из request"""
    # Приоритет: X-Real-IP -> X-Forwarded-For -> request.client.host
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.split(",")[0].strip()
    
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    
    if request.client:
        return request.client.host
    
    return "unknown"


async def get_current_user(
    request: Request,
    init_data: Optional[str] = Header(None, alias="X-Telegram-Init-Data"),
    guest_user_id: Optional[str] = Header(None, alias="X-Guest-User-Id"),
    db: AsyncSession = Depends(get_db)
):
    # Если есть Telegram init data, используем его
    if init_data:
        user_data = validate_telegram_init_data(init_data)
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid Telegram init data")
        
        user = await crud.get_user_by_telegram_id(db, user_data['telegram_id'])
        if not user:
            # Создаем нового пользователя
            user = await crud.create_user(
                db,
                user_data['telegram_id'],
                user_data.get('username'),
                user_data.get('first_name'),
                user_data.get('last_name')
            )
        
        return user
    
    # Если нет Telegram, используем гостевой режим
    if guest_user_id:
        try:
            guest_id = int(guest_user_id)
            # Пытаемся найти пользователя по ID
            user = await crud.get_user_by_id(db, guest_id)
            if user:
                return user
        except (ValueError, TypeError):
            pass
    
    # Получаем IP адрес клиента
    ip_address = get_client_ip(request)
    
    # Ищем существующего гостя по IP адресу
    user = await crud.get_user_by_ip(db, ip_address)
    if user:
        return user
    
    # Создаем нового гостевого пользователя с тестовыми данными
    user = await crud.create_guest_user_with_test_data(db, ip_address)
    
    return user


@router.get("/me", response_model=UserResponse)
async def get_me(user = Depends(get_current_user)):
    return user


async def get_admin_user(
    user = Depends(get_current_user)
):
    """Проверяет, является ли пользователь админом"""
    admin_ids = settings.get_admin_ids()
    if user.telegram_id not in admin_ids:
        raise HTTPException(status_code=403, detail="Access denied. Admin only.")
    return user


@router.get("/is-admin")
async def check_is_admin(user = Depends(get_current_user)):
    """Проверяет, является ли текущий пользователь админом"""
    admin_ids = settings.get_admin_ids()
    return {"is_admin": user.telegram_id in admin_ids}


@router.put("/me/profile", response_model=UserResponse)
async def update_profile(
    profile_data: UserProfileUpdate,
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Обновить профиль пользователя"""
    birth_date = None
    if profile_data.birth_date:
        # Поддерживаем форматы DD.MM.YYYY и YYYY-MM-DD
        try:
            if '.' in profile_data.birth_date:
                birth_date = datetime.strptime(profile_data.birth_date, "%d.%m.%Y")
            else:
                birth_date = datetime.strptime(profile_data.birth_date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use DD.MM.YYYY or YYYY-MM-DD")
    
    updated_user = await crud.update_user_profile(
        db,
        user.id,
        name=profile_data.name,
        gender=profile_data.gender,
        birth_date=birth_date
    )
    
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return updated_user


@router.get("/me/export")
async def export_user_data(
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Экспорт данных пользователя"""
    # Получаем все данные пользователя
    user_spheres = await crud.get_user_spheres(db, user.id)
    answers = await crud.get_user_answers(db, user.id)
    focus_spheres = await crud.get_user_focus_spheres(db, user.id)
    settings = await crud.get_user_settings(db, user.id)
    
    # Формируем JSON для экспорта
    export_data = {
        "user": {
            "id": user.id,
            "telegram_id": user.telegram_id,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "name": user.name,
            "gender": user.gender,
            "birth_date": user.birth_date.isoformat() if user.birth_date else None,
            "created_at": user.created_at.isoformat() if user.created_at else None
        },
        "spheres": [
            {
                "sphere": sphere.sphere,
                "rating": sphere.rating,
                "date": sphere.date.isoformat() if sphere.date else None
            }
            for sphere in user_spheres
        ],
        "answers": [
            {
                "question_id": answer.question_id,
                "answer": answer.answer,
                "date": answer.date.isoformat() if answer.date else None
            }
            for answer in answers
        ],
        "focus_spheres": [sphere.sphere for sphere in focus_spheres],
        "settings": {
            "notification_time": settings.notification_time if settings else None,
            "language": settings.language if settings else None,
            "is_paused": settings.is_paused if settings else None,
            "weekly_report_frequency": settings.weekly_report_frequency if settings else None,
            "reminder_frequency": settings.reminder_frequency if settings else None,
            "dark_theme": settings.dark_theme if settings else None
        }
    }
    
    return export_data


@router.get("/onboarding-status")
async def get_onboarding_status(
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Проверяет, завершен ли онбординг пользователя"""
    is_completed = await crud.check_onboarding_completed(db, user.id)
    return {"onboarding_completed": is_completed}


@router.delete("/me")
async def delete_account(
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Удалить аккаунт пользователя и все его данные"""
    success = await crud.delete_user_account(db, user.id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "Account deleted successfully"}


@router.post("/me/generate-test-data")
async def generate_test_data(
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Генерирует тестовые данные для гостевого пользователя"""
    # Проверяем, что пользователь является гостем (telegram_id < 0)
    if user.telegram_id >= 0:
        raise HTTPException(status_code=403, detail="This endpoint is only available for guest users")
    
    success = await crud.generate_test_data_for_user(db, user.id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to generate test data")
    
    return {"message": "Test data generated successfully"}

