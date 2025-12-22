from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from backend.database.database import get_db
from backend.database import crud
from backend.api.users import get_current_user
from backend.config import settings as app_settings
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/settings", tags=["settings"])


class SettingsUpdate(BaseModel):
    notification_time: Optional[str] = None
    language: Optional[str] = None
    is_paused: Optional[bool] = None
    weekly_report_frequency: Optional[str] = None
    reminder_frequency: Optional[str] = None
    dark_theme: Optional[bool] = None
    admin_test_notifications: Optional[bool] = None  # Только для админов


class SettingsResponse(BaseModel):
    notification_time: Optional[str]
    language: str
    is_paused: bool
    weekly_report_frequency: str
    reminder_frequency: str
    dark_theme: bool
    admin_test_notifications: bool  # Только для админов
    
    class Config:
        from_attributes = True


@router.get("/", response_model=SettingsResponse)
async def get_settings(
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    settings = await crud.get_user_settings(db, user.id)
    if not settings:
        settings = await crud.update_user_settings(db, user.id)
    return settings


@router.put("/", response_model=SettingsResponse)
async def update_settings(
    settings_data: SettingsUpdate,
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Проверяем, является ли пользователь админом, если пытается изменить admin_test_notifications
    admin_ids = app_settings.get_admin_ids()
    is_admin = user.telegram_id in admin_ids
    
    # Если пытается установить admin_test_notifications, но не админ - запрещаем
    if settings_data.admin_test_notifications is not None and not is_admin:
        raise HTTPException(status_code=403, detail="Access denied. Admin only.")
    
    update_params = {
        'notification_time': settings_data.notification_time,
        'language': settings_data.language,
        'is_paused': settings_data.is_paused,
        'weekly_report_frequency': settings_data.weekly_report_frequency,
        'reminder_frequency': settings_data.reminder_frequency,
        'dark_theme': settings_data.dark_theme
    }
    
    # Добавляем admin_test_notifications только если пользователь админ
    if is_admin and settings_data.admin_test_notifications is not None:
        update_params['admin_test_notifications'] = settings_data.admin_test_notifications
    
    settings = await crud.update_user_settings(db, user.id, **update_params)
    return settings

