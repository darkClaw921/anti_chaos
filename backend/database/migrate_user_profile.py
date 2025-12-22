"""
Миграция для добавления новых колонок в таблицу users
"""
import asyncio
import aiosqlite
import sys
import os

# Добавляем корневую директорию проекта в путь
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from backend.config import settings


async def migrate():
    """Добавляет новые колонки в таблицу users"""
    db_path = settings.database_url.replace("sqlite+aiosqlite:///", "")
    
    # Если путь относительный, делаем его абсолютным относительно корня проекта
    if not os.path.isabs(db_path):
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        db_path = os.path.join(project_root, db_path)
    
    async with aiosqlite.connect(db_path) as db:
        # Проверяем существование колонок
        cursor = await db.execute("PRAGMA table_info(users)")
        columns = await cursor.fetchall()
        existing_columns = [col[1] for col in columns]
        
        # Добавляем новые колонки, если их нет
        if "name" not in existing_columns:
            await db.execute(
                "ALTER TABLE users ADD COLUMN name TEXT"
            )
            print("Добавлена колонка name")
        
        if "gender" not in existing_columns:
            await db.execute(
                "ALTER TABLE users ADD COLUMN gender TEXT"
            )
            print("Добавлена колонка gender")
        
        if "birth_date" not in existing_columns:
            await db.execute(
                "ALTER TABLE users ADD COLUMN birth_date DATETIME"
            )
            print("Добавлена колонка birth_date")
        
        await db.commit()
        print("Миграция профиля пользователя завершена успешно")


if __name__ == "__main__":
    asyncio.run(migrate())

