from pydantic_settings import BaseSettings
from pydantic import model_validator
from typing import Optional, List
import os
import logging

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    telegram_bot_token: str
    telegram_bot_secret_key: Optional[str] = None
    database_url: str = "sqlite+aiosqlite:///./antichaos.db"
    frontend_url: str = "http://localhost:5173"
    backend_url: str = "http://localhost:8000"
    environment: str = "development"
    admins: str = ""  # Список telegram_id админов через запятую
    
    @model_validator(mode='after')
    def set_secret_key(self):
        # Если секретный ключ не указан, используем токен бота
        if self.telegram_bot_secret_key is None:
            self.telegram_bot_secret_key = self.telegram_bot_token
        return self
    
    @model_validator(mode='after')
    def normalize_database_url(self):
        """Нормализует путь к БД, преобразуя относительные пути в абсолютные"""
        if self.database_url.startswith("sqlite+aiosqlite:///"):
            db_path = self.database_url.replace("sqlite+aiosqlite:///", "")
            original_path = db_path
            
            # Если путь относительный, делаем его абсолютным относительно корня проекта
            if not os.path.isabs(db_path):
                # Получаем корень проекта (на уровень выше backend/)
                # config.py находится в backend/, поэтому поднимаемся на 2 уровня вверх
                current_file = os.path.abspath(__file__)
                backend_dir = os.path.dirname(current_file)
                project_root = os.path.dirname(backend_dir)
                # Убираем ./ или . из начала пути
                clean_path = db_path.lstrip("./")
                db_path = os.path.join(project_root, clean_path)
                logger.info(f"Нормализация пути БД: '{original_path}' -> '{db_path}'")
            
            # Создаем директорию для БД, если её нет
            db_dir = os.path.dirname(db_path)
            if db_dir and not os.path.exists(db_dir):
                os.makedirs(db_dir, exist_ok=True)
                logger.info(f"Создана директория для БД: {db_dir}")
            
            # Проверяем, не является ли путь директорией
            if os.path.exists(db_path) and os.path.isdir(db_path):
                raise ValueError(f"Путь к БД указывает на директорию, а не на файл: {db_path}")
            
            # Проверяем права на запись в директорию
            if db_dir:
                if not os.access(db_dir, os.W_OK):
                    logger.warning(f"Нет прав на запись в директорию: {db_dir}")
                else:
                    logger.info(f"Права на запись в директорию подтверждены: {db_dir}")
            
            # Для абсолютных путей в SQLite нужно использовать 4 слеша
            # Формат: sqlite+aiosqlite:////absolute/path (путь начинается с /)
            if os.path.isabs(db_path):
                # Для абсолютных путей используем 4 слеша: sqlite+aiosqlite:////path
                # Путь уже начинается с /, поэтому добавляем еще один слеш после :///
                self.database_url = f"sqlite+aiosqlite:///{db_path}"
            else:
                # Для относительных путей используем 3 слеша
                self.database_url = f"sqlite+aiosqlite:///{db_path}"
            
            logger.info(f"Итоговый database_url: {self.database_url}")
            logger.info(f"Абсолютный путь к файлу БД: {os.path.abspath(db_path)}")
        
        return self
    
    def get_admin_ids(self) -> List[int]:
        """Возвращает список ID админов"""
        if not self.admins:
            return []
        try:
            return [int(admin_id.strip()) for admin_id in self.admins.split(',') if admin_id.strip()]
        except ValueError:
            return []
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()

