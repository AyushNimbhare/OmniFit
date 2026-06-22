from datetime import datetime, time
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlmodel import Session, select
from typing import List, Optional
from app.db.database import get_session
from app.models.models import NutritionLog, User
from app.schemas.schemas import NutritionLogCreate, NutritionLogResponse
from app.api.auth import get_current_user
from app.services import ai_service

router = APIRouter(prefix="/api/nutrition", tags=["nutrition"])

# Get nutrition logs (filterable by date YYYY-MM-DD)
@router.get("", response_model=List[NutritionLogResponse])
def get_nutrition_logs(
    date: Optional[str] = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    if date:
        try:
            parsed_date = datetime.strptime(date, "%Y-%m-%d").date()
            start = datetime.combine(parsed_date, time.min)
            end = datetime.combine(parsed_date, time.max)
            statement = select(NutritionLog).where(
                (NutritionLog.user_id == current_user.id) &
                (NutritionLog.date >= start) &
                (NutritionLog.date <= end)
            )
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
    else:
        statement = select(NutritionLog).where(NutritionLog.user_id == current_user.id).order_by(NutritionLog.date.desc())
        
    return session.exec(statement).all()

# Log a meal manually
@router.post("", response_model=NutritionLogResponse)
def log_nutrition(
    log_in: NutritionLogCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    log = NutritionLog(
        user_id=current_user.id,
        date=log_in.date or datetime.utcnow(),
        food_name=log_in.food_name,
        calories=log_in.calories,
        protein=log_in.protein,
        carbs=log_in.carbs,
        fat=log_in.fat,
        quantity=log_in.quantity
    )
    session.add(log)
    session.commit()
    session.refresh(log)
    return log

# AI Scan Meal (image and/or text description)
@router.post("/scan")
async def scan_meal(
    file: Optional[UploadFile] = File(None),
    description: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user)
):
    """
    Scans a food image or voice description.
    Returns calorie and macronutrient estimates (not saved to DB yet).
    """
    image_bytes = None
    mime_type = None
    
    if file:
        image_bytes = await file.read()
        mime_type = file.content_type
        
    if not image_bytes and not description:
        raise HTTPException(
            status_code=400,
            detail="Please provide either a food image file or a description."
        )
        
    # Analyze using the AI service wrapper
    nutrition_data = ai_service.analyze_food(
        image_bytes=image_bytes,
        mime_type=mime_type,
        description=description
    )
    
    return nutrition_data
