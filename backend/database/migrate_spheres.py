"""
Миграция для создания таблицы spheres и добавления начальных данных
"""
import asyncio
import aiosqlite
import sys
import os
from datetime import datetime

# Добавляем корневую директорию проекта в путь
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from backend.config import settings


async def migrate():
    """Создает таблицу spheres и добавляет начальные данные"""
    db_path = settings.database_url.replace("sqlite+aiosqlite:///", "")
    
    # Если путь относительный, делаем его абсолютным относительно корня проекта
    if not os.path.isabs(db_path):
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        db_path = os.path.join(project_root, db_path)
    
    async with aiosqlite.connect(db_path) as db:
        # Проверяем существование таблицы
        cursor = await db.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='spheres'"
        )
        table_exists = await cursor.fetchone()
        
        if not table_exists:
            # Создаем таблицу spheres
            await db.execute("""
                CREATE TABLE spheres (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    key TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    color TEXT NOT NULL,
                    created_at TIMESTAMP NOT NULL,
                    updated_at TIMESTAMP NOT NULL
                )
            """)
            await db.execute("CREATE INDEX idx_spheres_key ON spheres(key)")
            print("Таблица spheres создана")
            
            # Добавляем начальные данные
            initial_spheres = [
                ('health', 'Здоровье', '#52c41a'),
                ('relationships', 'Отношения', '#1890ff'),
                ('money', 'Деньги', '#faad14'),
                ('energy', 'Энергия', '#fa8c16'),
                ('career', 'Карьера', '#722ed1'),
                ('other', 'Другое', '#eb2f96')
            ]
            
            now = datetime.utcnow().isoformat()
            for key, name, color in initial_spheres:
                await db.execute(
                    """
                    INSERT INTO spheres (key, name, color, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (key, name, color, now, now)
                )
            print(f"Добавлено {len(initial_spheres)} начальных сфер")
        else:
            # Проверяем, есть ли уже данные
            cursor = await db.execute("SELECT COUNT(*) FROM spheres")
            count = (await cursor.fetchone())[0]
            
            if count == 0:
                # Добавляем начальные данные, если таблица пустая
                initial_spheres = [
                    ('health', 'Здоровье', '#52c41a'),
                    ('relationships', 'Отношения', '#1890ff'),
                    ('money', 'Деньги', '#faad14'),
                    ('energy', 'Энергия', '#fa8c16'),
                    ('career', 'Карьера', '#722ed1'),
                    ('other', 'Другое', '#eb2f96')
                ]
                
                now = datetime.utcnow().isoformat()
                for key, name, color in initial_spheres:
                    # Проверяем, не существует ли уже сфера с таким ключом
                    check_cursor = await db.execute(
                        "SELECT id FROM spheres WHERE key = ?",
                        (key,)
                    )
                    exists = await check_cursor.fetchone()
                    
                    if not exists:
                        await db.execute(
                            """
                            INSERT INTO spheres (key, name, color, created_at, updated_at)
                            VALUES (?, ?, ?, ?, ?)
                            """,
                            (key, name, color, now, now)
                        )
                print(f"Добавлены начальные сферы")
            else:
                print(f"Таблица spheres уже содержит {count} записей")
        
        await db.commit()
        print("Миграция завершена успешно")


if __name__ == "__main__":
    asyncio.run(migrate())

