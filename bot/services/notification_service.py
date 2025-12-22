import asyncio
import sys
from pathlib import Path
from datetime import datetime, time
from typing import List
from telegram import Bot, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.error import TelegramError

# Добавляем корневую директорию в путь для импортов
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from backend.database.database import AsyncSessionLocal
from backend.database import crud
from backend.services.question_service import get_daily_question_for_user
from backend.config import settings as app_settings
from bot.config import BOT_TOKEN, FRONTEND_URL


class NotificationService:
    """Сервис для отправки уведомлений пользователям"""
    
    def __init__(self):
        self.bot = Bot(token=BOT_TOKEN)
        self.running = False
    
    async def get_users_for_notification(self) -> List[dict]:
        """Получает список пользователей, которым нужно отправить уведомление"""
        async with AsyncSessionLocal() as db:
            # Получаем всех пользователей с положительным telegram_id (не гостей)
            from sqlalchemy import select
            from backend.database.models import User, UserSettings
            
            result = await db.execute(
                select(User, UserSettings)
                .join(UserSettings, User.id == UserSettings.user_id, isouter=True)
                .where(User.telegram_id > 0)
            )
            
            users_to_notify = []
            current_time = datetime.now().time()
            
            rows = result.all()
            admin_ids = app_settings.get_admin_ids()
            
            for row in rows:
                user, settings = row
                # Пропускаем пользователей без настроек
                if not settings:
                    continue
                
                # Пропускаем пользователей на паузе
                if settings.is_paused:
                    continue
                
                is_admin = user.telegram_id in admin_ids
                should_notify = False
                
                # Для админов с включенным admin_test_notifications - отправляем каждую минуту
                if is_admin and settings.admin_test_notifications:
                    should_notify = True
                else:
                    # Для обычных пользователей проверяем время уведомления
                    if not settings.notification_time:
                        continue
                    
                    # Парсим время уведомления
                    try:
                        notify_hour, notify_minute = map(int, settings.notification_time.split(':'))
                        notify_time = time(notify_hour, notify_minute)
                        
                        # Проверяем, наступило ли время уведомления (с точностью до минуты)
                        if (current_time.hour == notify_time.hour and 
                            current_time.minute == notify_time.minute):
                            should_notify = True
                    except (ValueError, AttributeError):
                        # Пропускаем пользователей с некорректным форматом времени
                        continue
                
                if should_notify:
                    # Проверяем, ответил ли пользователь сегодня (только если не админ в тестовом режиме)
                    if not (is_admin and settings.admin_test_notifications):
                        has_answered = await crud.has_user_answered_today(db, user.id)
                        if has_answered:
                            continue
                    
                    # Получаем вопрос дня для пользователя
                    question = await get_daily_question_for_user(db, user.id)
                    question_id = question.id if question else None
                    
                    users_to_notify.append({
                        'telegram_id': user.telegram_id,
                        'user_id': user.id,
                        'first_name': user.first_name or 'Пользователь',
                        'question_id': question_id,
                        'is_test': is_admin and settings.admin_test_notifications
                    })
            
            return users_to_notify
    
    async def send_notification(self, telegram_id: int, first_name: str, question_id: int = None, is_test: bool = False):
        """Отправляет уведомление пользователю"""
        try:
            # Формируем ссылку на вопрос дня
            if question_id:
                # Если есть ID вопроса, добавляем прямую ссылку на ответ
                daily_url = f"{FRONTEND_URL}/daily"
                answer_url = f"{FRONTEND_URL}/answer/{question_id}"
            else:
                # Если вопроса нет, просто ссылка на страницу вопроса дня
                daily_url = f"{FRONTEND_URL}/daily"
                answer_url = daily_url
            
            keyboard = [
                [InlineKeyboardButton(
                    "Ответить на вопрос",
                    web_app=WebAppInfo(url=daily_url)
                )]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            # Формируем сообщение с прямой ссылкой
            message = (
                f"Привет, {first_name}! 👋\n\n"
            )
            
            if is_test:
                message += "🧪 [ТЕСТОВЫЙ РЕЖИМ] "
            
            message += "Пора ответить на вопрос дня и продолжить свой путь к ясности.\n\n"
            
            if question_id:
                message += f"🔗 <a href=\"{answer_url}\">Перейти к вопросу дня</a>\n\n"
            else:
                message += f"🔗 <a href=\"{daily_url}\">Перейти к вопросу дня</a>\n\n"
            
            message += "Или нажми на кнопку ниже, чтобы открыть приложение:"
            
            await self.bot.send_message(
                chat_id=telegram_id,
                text=message,
                reply_markup=reply_markup,
                parse_mode='HTML',
                disable_web_page_preview=False
            )
            return True
        except TelegramError as e:
            print(f"Ошибка при отправке уведомления пользователю {telegram_id}: {e}")
            return False
    
    async def send_notifications(self):
        """Отправляет уведомления всем пользователям, которым нужно"""
        users = await self.get_users_for_notification()
        
        for user in users:
            await self.send_notification(
                user['telegram_id'],
                user['first_name'],
                user.get('question_id'),
                user.get('is_test', False)
            )
            # Небольшая задержка между отправками, чтобы не превысить лимиты API
            await asyncio.sleep(0.1)
    
    async def check_and_send_notifications(self):
        """Проверяет время и отправляет уведомления при необходимости"""
        while self.running:
            try:
                await self.send_notifications()
            except Exception as e:
                print(f"Ошибка при проверке уведомлений: {e}")
            
            # Проверяем каждую минуту
            await asyncio.sleep(60)
    
    async def start(self):
        """Запускает сервис уведомлений"""
        self.running = True
        print("Сервис уведомлений запущен")
        await self.check_and_send_notifications()
    
    async def stop(self):
        """Останавливает сервис уведомлений"""
        self.running = False
        print("Сервис уведомлений остановлен")

