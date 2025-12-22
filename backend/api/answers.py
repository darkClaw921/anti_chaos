from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from backend.database.database import get_db
from backend.database import crud
from backend.api.users import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/api/answers", tags=["answers"])


class AnswerCreate(BaseModel):
    question_id: int
    answer: str


class AnswerResponse(BaseModel):
    id: int
    question_id: int
    answer: str
    date: str
    
    class Config:
        from_attributes = True


@router.post("/", response_model=AnswerResponse)
async def create_answer(
    answer_data: AnswerCreate,
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Проверяем существование вопроса
    question = await crud.get_question_by_id(db, answer_data.question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    answer = await crud.create_answer(
        db,
        user.id,
        answer_data.question_id,
        answer_data.answer
    )
    return {
        'id': answer.id,
        'question_id': answer.question_id,
        'answer': answer.answer,
        'date': answer.date.isoformat() if answer.date else ''
    }


@router.get("/", response_model=list[AnswerResponse])
async def get_my_answers(
    days: int = None,
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    answers = await crud.get_user_answers(db, user.id, days=days)
    return [{
        'id': a.id,
        'question_id': a.question_id,
        'answer': a.answer,
        'date': a.date.isoformat() if a.date else ''
    } for a in answers]

