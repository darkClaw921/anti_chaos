from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.database.database import get_db
from backend.database import crud
from backend.api.users import get_current_user
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/api/spheres", tags=["spheres"])


class SphereRatingCreate(BaseModel):
    sphere: str
    rating: int


class SphereRatingsCreate(BaseModel):
    ratings: List[SphereRatingCreate]


class FocusSpheresUpdate(BaseModel):
    spheres: List[str]


@router.post("/ratings")
async def create_sphere_ratings(
    data: SphereRatingsCreate,
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    results = []
    for rating_data in data.ratings:
        sphere = await crud.create_user_sphere(
            db,
            user.id,
            rating_data.sphere,
            rating_data.rating
        )
        results.append({
            'id': sphere.id,
            'sphere': sphere.sphere,
            'rating': sphere.rating,
            'date': sphere.date.isoformat()
        })
    return results


@router.get("/ratings")
async def get_sphere_ratings(
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    spheres = await crud.get_latest_user_spheres(db, user.id)
    return [{
        'id': s.id,
        'sphere': s.sphere,
        'rating': s.rating,
        'date': s.date.isoformat()
    } for s in spheres]


@router.put("/focus")
async def update_focus_spheres(
    data: FocusSpheresUpdate,
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    spheres = await crud.set_user_focus_spheres(db, user.id, data.spheres)
    return [{'id': s.id, 'sphere': s.sphere} for s in spheres]


@router.get("/focus")
async def get_focus_spheres(
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    spheres = await crud.get_user_focus_spheres(db, user.id)
    return [{'id': s.id, 'sphere': s.sphere} for s in spheres]


@router.get("/for-rating-after-questions")
async def get_spheres_for_rating_after_questions_endpoint(
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Заглушка: получает список сфер (1 или 2) для оценки после окончания вопросов.
    Возвращает сферы, которые пользователь проходил за период.
    """
    from backend.services.question_service import get_spheres_for_rating_after_questions
    spheres = await get_spheres_for_rating_after_questions(db, user.id)
    return {'spheres': spheres}

