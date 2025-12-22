from pydantic_settings import BaseSettings
from pydantic import model_validator
from typing import Optional, List


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

