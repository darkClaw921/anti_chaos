from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.database.database import get_db
from backend.services.progress_service import calculate_progress, get_weekly_summary, get_monthly_report
from backend.api.users import get_current_user

router = APIRouter(prefix="/api/progress", tags=["progress"])


@router.get("/")
async def get_progress(
    days: int = 7,
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    progress = await calculate_progress(db, user.id, days=days)
    return progress


@router.get("/weekly")
async def get_weekly(
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    summary = await get_weekly_summary(db, user.id)
    return summary


@router.get("/monthly")
async def get_monthly(
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    report = await get_monthly_report(db, user.id)
    return report

