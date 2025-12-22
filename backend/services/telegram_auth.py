import hmac
import hashlib
import json
from urllib.parse import parse_qsl
from typing import Optional, Dict
from backend.config import settings


def validate_telegram_init_data(init_data: str) -> Optional[Dict]:
    """
    Проверяет и парсит initData от Telegram Web App
    """
    try:
        # Парсим данные
        parsed_data = dict(parse_qsl(init_data))
        
        # Извлекаем hash и данные
        received_hash = parsed_data.pop('hash', None)
        if not received_hash:
            return None
        
        # Создаем строку для проверки
        data_check_string = '\n'.join(
            f"{key}={value}" 
            for key, value in sorted(parsed_data.items())
        )
        
        # Вычисляем секретный ключ
        secret_key = hmac.new(
            "WebAppData".encode(),
            settings.telegram_bot_token.encode(),
            hashlib.sha256
        ).digest()
        
        # Вычисляем hash
        calculated_hash = hmac.new(
            secret_key,
            data_check_string.encode(),
            hashlib.sha256
        ).hexdigest()
        
        # Проверяем hash
        if calculated_hash != received_hash:
            return None
        
        # Парсим user данные
        user_data = json.loads(parsed_data.get('user', '{}'))
        
        return {
            'telegram_id': user_data.get('id'),
            'username': user_data.get('username'),
            'first_name': user_data.get('first_name'),
            'last_name': user_data.get('last_name'),
            'auth_date': parsed_data.get('auth_date'),
            'query_id': parsed_data.get('query_id'),
        }
    except Exception:
        return None

