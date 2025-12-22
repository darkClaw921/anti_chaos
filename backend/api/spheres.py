from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from backend.database.database import get_db
from backend.database import crud
from backend.api.users import get_current_user, get_admin_user
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/api/spheres", tags=["spheres"])


class SphereRatingCreate(BaseModel):
    sphere: str
    rating: int


class SphereRatingsCreate(BaseModel):
    ratings: List[SphereRatingCreate]


class FocusSpheresUpdate(BaseModel):
    spheres: List[str]


class SphereResponse(BaseModel):
    id: int
    key: str
    name: str
    color: str
    created_at: str
    updated_at: str
    
    class Config:
        from_attributes = True


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


@router.get("/all", response_model=List[SphereResponse])
async def get_all_spheres(
    db: AsyncSession = Depends(get_db)
):
    """Получить все сферы (публичный endpoint для всех пользователей)"""
    spheres = await crud.get_all_spheres(db)
    return [{
        'id': s.id,
        'key': s.key,
        'name': s.name,
        'color': s.color,
        'created_at': s.created_at.isoformat(),
        'updated_at': s.updated_at.isoformat()
    } for s in spheres]


# Admin endpoints для управления сферами
class SphereCreate(BaseModel):
    key: str
    name: str
    color: str


class SphereUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None


@router.get("/admin/all", response_model=List[SphereResponse])
async def get_all_spheres_admin(
    admin = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Получить все сферы (только для админов)"""
    spheres = await crud.get_all_spheres(db)
    return [{
        'id': s.id,
        'key': s.key,
        'name': s.name,
        'color': s.color,
        'created_at': s.created_at.isoformat(),
        'updated_at': s.updated_at.isoformat()
    } for s in spheres]


@router.post("/admin/", response_model=SphereResponse)
async def create_sphere_admin(
    data: SphereCreate,
    admin = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Создать новую сферу (только для админов)"""
    # Проверяем, не существует ли уже сфера с таким ключом
    existing = await crud.get_sphere_by_key(db, data.key)
    if existing:
        raise HTTPException(status_code=400, detail=f"Сфера с ключом '{data.key}' уже существует")
    
    sphere = await crud.create_sphere(db, data.key, data.name, data.color)
    return {
        'id': sphere.id,
        'key': sphere.key,
        'name': sphere.name,
        'color': sphere.color,
        'created_at': sphere.created_at.isoformat(),
        'updated_at': sphere.updated_at.isoformat()
    }


@router.put("/admin/{sphere_id}", response_model=SphereResponse)
async def update_sphere_admin(
    sphere_id: int,
    data: SphereUpdate,
    admin = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Обновить сферу (только для админов)"""
    sphere = await crud.update_sphere(db, sphere_id, data.name, data.color)
    if not sphere:
        raise HTTPException(status_code=404, detail="Сфера не найдена")
    
    return {
        'id': sphere.id,
        'key': sphere.key,
        'name': sphere.name,
        'color': sphere.color,
        'created_at': sphere.created_at.isoformat(),
        'updated_at': sphere.updated_at.isoformat()
    }


@router.delete("/admin/{sphere_id}")
async def delete_sphere_admin(
    sphere_id: int,
    admin = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Удалить сферу (только для админов)"""
    success = await crud.delete_sphere(db, sphere_id)
    if not success:
        raise HTTPException(status_code=404, detail="Сфера не найдена")
    
    return {"message": "Сфера успешно удалена"}

