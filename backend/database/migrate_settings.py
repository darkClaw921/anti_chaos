"""
Миграция для добавления новых колонок в таблицу user_settings
"""
import asyncio
import aiosqlite
import sys
import os

# Добавляем корневую директорию проекта в путь
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from backend.config import settings


async def migrate():
    """Добавляет новые колонки в таблицу user_settings"""
    db_path = settings.database_url.replace("sqlite+aiosqlite:///", "")
    
    # Если путь относительный, делаем его абсолютным относительно корня проекта
    if not os.path.isabs(db_path):
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        db_path = os.path.join(project_root, db_path)
    
    async with aiosqlite.connect(db_path) as db:
        # Проверяем существование колонок
        cursor = await db.execute("PRAGMA table_info(user_settings)")
        columns = await cursor.fetchall()
        existing_columns = [col[1] for col in columns]
        
        # Добавляем новые колонки, если их нет
        if "weekly_report_frequency" not in existing_columns:
            await db.execute(
                "ALTER TABLE user_settings ADD COLUMN weekly_report_frequency TEXT DEFAULT 'weekly'"
            )
            print("Добавлена колонка weekly_report_frequency")
        
        if "reminder_frequency" not in existing_columns:
            await db.execute(
                "ALTER TABLE user_settings ADD COLUMN reminder_frequency TEXT DEFAULT 'weekly'"
            )
            print("Добавлена колонка reminder_frequency")
        
        if "dark_theme" not in existing_columns:
            await db.execute(
                "ALTER TABLE user_settings ADD COLUMN dark_theme INTEGER DEFAULT 0"
            )
            print("Добавлена колонка dark_theme")
        
        if "admin_test_notifications" not in existing_columns:
            await db.execute(
                "ALTER TABLE user_settings ADD COLUMN admin_test_notifications INTEGER DEFAULT 0"
            )
            print("Добавлена колонка admin_test_notifications")
        
        await db.commit()
        print("Миграция завершена успешно")


if __name__ == "__main__":
    asyncio.run(migrate())

