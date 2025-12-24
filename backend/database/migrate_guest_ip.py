"""
Миграция для добавления поля ip_address в таблицу users
"""
import asyncio
import aiosqlite
import sys
import os

# Добавляем корневую директорию проекта в путь
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from backend.config import settings


async def migrate():
    """Добавляет поле ip_address в таблицу users и создает индекс"""
    db_path = settings.database_url.replace("sqlite+aiosqlite:///", "")
    
    # Если путь относительный, делаем его абсолютным относительно корня проекта
    if not os.path.isabs(db_path):
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        db_path = os.path.join(project_root, db_path)
    
    async with aiosqlite.connect(db_path) as db:
        # Проверяем существование колонки
        cursor = await db.execute("PRAGMA table_info(users)")
        columns = await cursor.fetchall()
        existing_columns = [col[1] for col in columns]
        
        # Добавляем колонку ip_address, если её нет
        if "ip_address" not in existing_columns:
            await db.execute(
                "ALTER TABLE users ADD COLUMN ip_address TEXT"
            )
            print("Добавлена колонка ip_address")
        
        # Проверяем существование индекса
        cursor = await db.execute(
            "SELECT name FROM sqlite_master WHERE type='index' AND name='ix_users_ip_address'"
        )
        index_exists = await cursor.fetchone()
        
        # Создаем индекс, если его нет
        if not index_exists:
            await db.execute(
                "CREATE INDEX ix_users_ip_address ON users(ip_address)"
            )
            print("Создан индекс ix_users_ip_address")
        
        await db.commit()
        print("Миграция завершена успешно")


if __name__ == "__main__":
    asyncio.run(migrate())

