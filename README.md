# АнтиChaos Telegram Mini App

Telegram Mini App для саморазвития, который помогает отслеживать прогресс в различных сферах жизни через ежедневные вопросы.

## Установка
есть возможность использовать Docker Compose для запуска проекта.
```bash
docker-compose up -d --build
```

Или можно запустить проект локально.

### Требования
- Python 3.10+
- Node.js 18+
- Telegram Bot Token

### Backend

1. Установите зависимости:
```bash
uv sync
```

2. Создайте файл `.env` в корне проекта:
```bash
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_BOT_SECRET_KEY=your_secret_key_here  # Опционально, если не указан, используется токен бота
DATABASE_URL=sqlite+aiosqlite:///./antichaos.db
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:8000
ENVIRONMENT=development
```

3. Заполните переменные окружения в `.env` (минимум нужен `TELEGRAM_BOT_TOKEN`)

4. Запустите backend (из корневой директории):
```bash
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8100
```

Или если используете uv:
```bash
uv run uvicorn backend.main:app --reload --host 0.0.0.0 --port 8100
```

### Frontend

1. Установите зависимости (из корневой директории проекта):
```bash
npm install
```

2. Создайте файл `.env` в папке `frontend/` (опционально):
```bash
VITE_API_URL=http://localhost:8000
```

3. Запустите dev сервер (из корневой директории):
```bash
npm run dev
```

Примечание: Vite настроен на работу из корневой директории с `root: './frontend'`, поэтому запускайте команды из корня проекта.

### Bot

1. Запустите бота (из корневой директории):
```bash
python bot/bot.py
```

Или если используете uv:
```bash
uv run python bot/bot.py
```

## Использование

1. Запустите бота в Telegram
2. Отправьте команду `/start`
3. Нажмите на кнопку "Открыть АнтиChaos"
4. Пройдите онбординг: оцените сферы жизни, выберите фокус-сферы
5. Начните отвечать на ежедневные вопросы

## Структура проекта

Подробное описание архитектуры в файле `architecture.md`

