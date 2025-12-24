from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from backend.config import settings
from backend.api import users, questions, answers, progress, settings as settings_api, spheres
from backend.database.database import engine, Base, AsyncSessionLocal
from backend.database.models import Question
from sqlalchemy import select
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Управление жизненным циклом приложения"""
    # Startup
    logger.info("Запуск приложения...")
    logger.info(f"Database URL: {settings.database_url}")
    
    # Импортируем все модели для регистрации в Base.metadata
    from backend.database.models import (
        User, UserSphere, Sphere, Answer, UserFocusSphere,
        Subscription, UserSettings, QuestionSchedule
    )
    
    # Создаем таблицы БД
    logger.info("Создание таблиц БД...")
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Таблицы БД созданы успешно")
    except Exception as e:
        logger.error(f"Ошибка при создании таблиц БД: {e}", exc_info=True)
        raise
    
    # Выполняем миграции для существующих таблиц
    logger.info("Выполнение миграций...")
    from backend.database.migrate_settings import migrate as migrate_settings
    from backend.database.migrate_user_profile import migrate as migrate_user_profile
    from backend.database.migrate_spheres import migrate as migrate_spheres
    from backend.database.migrate_guest_ip import migrate as migrate_guest_ip
    try:
        await migrate_settings()
        await migrate_user_profile()
        await migrate_spheres()
        await migrate_guest_ip()
        logger.info("Миграции выполнены успешно")
    except Exception as e:
        logger.warning(f"Ошибка при выполнении миграций (может быть нормально, если миграции уже выполнены): {e}")
    
    # Создаем вопросы по умолчанию, если их нет
    logger.info("Проверка вопросов по умолчанию...")
    async with AsyncSessionLocal() as session:
        try:
            # Проверяем, есть ли вопросы
            result = await session.execute(select(Question))
            questions = result.scalars().all()
            
            if not questions:
                logger.info("Создание вопросов по умолчанию...")
                default_questions = [
                    # Здоровье
                    {"sphere": "health", "text": "Как ты себя чувствуешь сегодня физически?", "type": "text"},
                    {"sphere": "health", "text": "Что ты сделал для своего здоровья сегодня?", "type": "text"},
                    {"sphere": "health", "text": "Какой уровень энергии у тебя сегодня?", "type": "text"},
                    {"sphere": "health", "text": "Что помогает тебе поддерживать здоровье?", "type": "text"},
                    # Отношения
                    {"sphere": "relationships", "text": "Как складываются твои отношения с близкими?", "type": "text"},
                    {"sphere": "relationships", "text": "Что ты сделал для улучшения отношений сегодня?", "type": "text"},
                    {"sphere": "relationships", "text": "С кем ты провел время сегодня?", "type": "text"},
                    {"sphere": "relationships", "text": "Как ты поддерживаешь связь с важными людьми?", "type": "text"},
                    # Деньги
                    {"sphere": "money", "text": "Как ты оцениваешь свое финансовое состояние?", "type": "text"},
                    {"sphere": "money", "text": "Что ты сделал для улучшения финансов сегодня?", "type": "text"},
                    {"sphere": "money", "text": "Как ты управляешь своими финансами?", "type": "text"},
                    {"sphere": "money", "text": "Что важно для твоего финансового благополучия?", "type": "text"},
                    # Энергия
                    {"sphere": "energy", "text": "Насколько ты полон энергии сегодня?", "type": "text"},
                    {"sphere": "energy", "text": "Что дает тебе энергию?", "type": "text"},
                    {"sphere": "energy", "text": "Что забирает у тебя энергию?", "type": "text"},
                    {"sphere": "energy", "text": "Как ты восстанавливаешь силы?", "type": "text"},
                    # Карьера
                    {"sphere": "career", "text": "Как продвигается твоя карьера?", "type": "text"},
                    {"sphere": "career", "text": "Что ты сделал для развития карьеры сегодня?", "type": "text"},
                    {"sphere": "career", "text": "Что важно для твоего профессионального роста?", "type": "text"},
                    {"sphere": "career", "text": "Какие навыки ты развиваешь?", "type": "text"},
                    # Другое
                    {"sphere": "other", "text": "Что важного произошло в твоей жизни сегодня?", "type": "text"},
                    {"sphere": "other", "text": "За что ты благодарен сегодня?", "type": "text"},
                    {"sphere": "other", "text": "Что ты узнал нового сегодня?", "type": "text"},
                    {"sphere": "other", "text": "Какой момент дня был самым ярким?", "type": "text"},
                ]
                
                for q_data in default_questions:
                    question = Question(**q_data)
                    session.add(question)
                
                await session.commit()
                logger.info(f"Создано {len(default_questions)} вопросов по умолчанию")
            else:
                logger.info(f"Вопросы уже существуют ({len(questions)} шт.)")
        except Exception as e:
            logger.error(f"Ошибка при создании вопросов по умолчанию: {e}", exc_info=True)
            await session.rollback()
    
    logger.info("Приложение готово к работе")
    
    yield
    
    # Shutdown
    logger.info("Завершение работы приложения...")
    await engine.dispose()
    logger.info("Приложение остановлено")


app = FastAPI(title="АнтиChaos Telegram Mini App API", lifespan=lifespan)

# CORS middleware
# Для локальной разработки добавляем localhost
allowed_origins = [
    settings.frontend_url,
    "https://web.telegram.org",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# Добавляем все origins из настроек, если их несколько
if "," in settings.frontend_url:
    allowed_origins.extend([origin.strip() for origin in settings.frontend_url.split(",")])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем роутеры
app.include_router(users.router)
app.include_router(questions.router)
app.include_router(answers.router)
app.include_router(progress.router)
app.include_router(settings_api.router)
app.include_router(spheres.router)




@app.get("/")
async def root():
    return {"message": "АнтиChaos Telegram Mini App API"}


@app.get("/health")
async def health():
    return {"status": "ok"}

