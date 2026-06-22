from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Optional
from app.db.database import get_session
from app.models.models import BodyMetric, User
from app.schemas.schemas import BodyMetricCreate, BodyMetricResponse
from app.api.auth import get_current_user

router = APIRouter(prefix="/api/metrics", tags=["metrics"])

# Get body metrics history
@router.get("", response_model=List[BodyMetricResponse])
def get_metrics(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    statement = select(BodyMetric).where(BodyMetric.user_id == current_user.id).order_by(BodyMetric.date.asc())
    return session.exec(statement).all()

# Log a body metric entry (weight, body_fat, waist)
@router.post("", response_model=BodyMetricResponse)
def log_metric(
    metric_in: BodyMetricCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    metric = BodyMetric(
        user_id=current_user.id,
        date=metric_in.date or datetime.utcnow(),
        weight=metric_in.weight,
        body_fat=metric_in.body_fat,
        waist=metric_in.waist
    )
    session.add(metric)
    session.commit()
    session.refresh(metric)
    return metric
