from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database.database import Base


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(Integer, unique=True, index=True, nullable=False)
    username = Column(String, nullable=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    name = Column(String, nullable=True)  # Имя пользователя (может отличаться от first_name)
    gender = Column(String, nullable=True)  # male, female
    birth_date = Column(DateTime, nullable=True)  # Дата рождения
    created_at = Column(DateTime, default=datetime.utcnow)
    
    spheres = relationship("UserSphere", back_populates="user", cascade="all, delete-orphan")
    answers = relationship("Answer", back_populates="user", cascade="all, delete-orphan")
    focus_spheres = relationship("UserFocusSphere", back_populates="user", cascade="all, delete-orphan")
    settings = relationship("UserSettings", back_populates="user", uselist=False, cascade="all, delete-orphan")
    subscription = relationship("Subscription", back_populates="user", uselist=False, cascade="all, delete-orphan")


class UserSphere(Base):
    __tablename__ = "user_spheres"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    sphere = Column(String, nullable=False)  # health, relationships, money, energy, career, other
    rating = Column(Integer, nullable=False)  # 1-10
    date = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    user = relationship("User", back_populates="spheres")


class Question(Base):
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True, index=True)
    sphere = Column(String, nullable=False)
    text = Column(Text, nullable=False)
    type = Column(String, default="text")  # text, short_answer
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    answers = relationship("Answer", back_populates="question")


class Answer(Base):
    __tablename__ = "answers"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    answer = Column(Text, nullable=False)
    date = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    user = relationship("User", back_populates="answers")
    question = relationship("Question", back_populates="answers")


class UserFocusSphere(Base):
    __tablename__ = "user_focus_spheres"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    sphere = Column(String, nullable=False)
    selected_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    user = relationship("User", back_populates="focus_spheres")


class Subscription(Base):
    __tablename__ = "subscriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    plan = Column(String, nullable=False)  # free, premium
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="subscription")


class UserSettings(Base):
    __tablename__ = "user_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    notification_time = Column(String, nullable=True)  # HH:MM format
    language = Column(String, default="ru")
    is_paused = Column(Boolean, default=False)
    weekly_report_frequency = Column(String, default="weekly")  # weekly, biweekly, monthly
    reminder_frequency = Column(String, default="weekly")  # daily, weekly, biweekly
    dark_theme = Column(Boolean, default=False)
    admin_test_notifications = Column(Boolean, default=False)  # Только для админов: отправка уведомлений каждую минуту для тестирования
    
    user = relationship("User", back_populates="settings")


class QuestionSchedule(Base):
    """
    Заглушка для модели расписания вопросов.
    Позже будет заполнена списком вопросов для каждого дня.
    """
    __tablename__ = "question_schedule"
    
    id = Column(Integer, primary_key=True, index=True)
    day_number = Column(Integer, nullable=False)  # Номер дня (1, 2, 3, ...)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    sphere = Column(String, nullable=False)  # Сфера жизни
    created_at = Column(DateTime, default=datetime.utcnow)
    
    question = relationship("Question")

