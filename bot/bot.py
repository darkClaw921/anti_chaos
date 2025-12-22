import asyncio
import sys
import os
from pathlib import Path
from threading import Thread

# Добавляем корневую директорию в путь для импортов
sys.path.insert(0, str(Path(__file__).parent.parent))

from telegram import Bot, Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, ContextTypes
from bot.config import BOT_TOKEN, FRONTEND_URL
from bot.services.notification_service import NotificationService


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик команды /start"""
    keyboard = [
        [InlineKeyboardButton(
            "Открыть АнтиChaos",
            web_app=WebAppInfo(url=FRONTEND_URL)
        )]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        "Привет! Я АнтиChaos — бот, который приносит ясность через 1 вопрос в день.\n\n"
        "Нажми на кнопку ниже, чтобы начать:",
        reply_markup=reply_markup
    )


def run_notification_service():
    """Запускает сервис уведомлений в отдельном потоке"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    async def start_service():
        notification_service = NotificationService()
        await notification_service.start()
    
    try:
        loop.run_until_complete(start_service())
    except KeyboardInterrupt:
        pass
    finally:
        loop.close()


def main():
    """Запуск бота"""
    # Запускаем сервис уведомлений в отдельном потоке
    notification_thread = Thread(target=run_notification_service, daemon=True)
    notification_thread.start()
    
    application = Application.builder().token(BOT_TOKEN).build()
    
    application.add_handler(CommandHandler("start", start))
    
    print("Бот запущен...")
    print("Сервис уведомлений запущен в фоновом режиме")
    application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()

