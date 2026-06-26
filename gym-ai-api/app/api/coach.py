from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from app.db.database import get_session
from app.models.models import User, Workout, WorkoutLog, NutritionLog, BodyMetric, AIInsight, UserMemory
from app.schemas.schemas import AIInsightResponse, UserMemoryResponse, UserMemoryUpdate
from app.api.auth import get_current_user
from app.services import ai_service

router = APIRouter(prefix="/api/coach", tags=["coach"])

@router.get("/insights", response_model=AIInsightResponse)
def get_insights(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Generates a personalized progress report and actionable coaching suggestions
    based on the user's logged metrics over the last 30 days.
    """
    now = datetime.utcnow()
    last_30_days = now - timedelta(days=30)
    last_7_days = now - timedelta(days=7)
    
    # 1. Workout Trend Analysis
    workouts = session.exec(
        select(Workout).where(
            (Workout.user_id == current_user.id) &
            (Workout.date >= last_30_days)
        )
    ).all()
    recent_workouts_count = len([w for w in workouts if w.date >= last_7_days])
    
    # Check for strength plateaus
    statement = select(WorkoutLog).join(Workout).where(
        (Workout.user_id == current_user.id) &
        (Workout.date >= last_30_days)
    )
    logs = session.exec(statement).all()
    
    exercise_weights = {}
    for l in logs:
        ex_name = l.exercise.name
        ex_date = l.workout.date.date()
        if ex_name not in exercise_weights:
            exercise_weights[ex_name] = {}
        if ex_date not in exercise_weights[ex_name]:
            exercise_weights[ex_name][ex_date] = 0.0
        exercise_weights[ex_name][ex_date] = max(exercise_weights[ex_name][ex_date], l.weight)
        
    stalls = []
    for ex_name, dates_dict in exercise_weights.items():
        if len(dates_dict) >= 3:
            sorted_dates = sorted(list(dates_dict.keys()))
            w_first = dates_dict[sorted_dates[0]]
            w_last = dates_dict[sorted_dates[-1]]
            if w_last <= w_first:
                stalls.append(ex_name)

    # 2. Nutrition Analysis (average daily macro intake)
    nutrition = session.exec(
        select(NutritionLog).where(
            (NutritionLog.user_id == current_user.id) &
            (NutritionLog.date >= last_7_days)
        )
    ).all()
    
    avg_calories = 0.0
    avg_protein = 0.0
    avg_carbs = 0.0
    avg_fat = 0.0
    
    if nutrition:
        dates = set(n.date.date() for n in nutrition)
        logging_days = len(dates) or 1
        
        total_cal = sum(n.calories for n in nutrition)
        total_prot = sum(n.protein for n in nutrition)
        total_carb = sum(n.carbs for n in nutrition)
        total_fat = sum(n.fat for n in nutrition)
        
        avg_calories = total_cal / logging_days
        avg_protein = total_prot / logging_days
        avg_carbs = total_carb / logging_days
        avg_fat = total_fat / logging_days

    # 3. Body Weight Trend Analysis
    metrics = session.exec(
        select(BodyMetric).where(
            (BodyMetric.user_id == current_user.id) &
            (BodyMetric.date >= last_30_days)
        ).order_by(BodyMetric.date.asc())
    ).all()
    
    weight_trend = "Stable"
    weight_change_text = "No weight data logged recently."
    if len(metrics) >= 2:
        w_start = metrics[0].weight
        w_end = metrics[-1].weight
        diff = w_end - w_start
        weight_change_text = f"Weight changed from {w_start} kg to {w_end} kg (diff: {diff:+.2f} kg) in the last {(metrics[-1].date - metrics[0].date).days} days."
        if diff > 0.5:
            weight_trend = "Increasing"
        elif diff < -0.5:
            weight_trend = "Decreasing"
    elif len(metrics) == 1:
        weight_change_text = f"Current weight is {metrics[0].weight} kg. Need more logging points to calculate trend."

    # Compile user summary for AI Coach context
    summary_parts = [
        f"User Profile: Name = {current_user.name}",
        f"Workout Frequency: {recent_workouts_count} workouts in the last 7 days (total {len(workouts)} workouts in 30 days).",
        f"Nutrition (7-day average): Calories = {avg_calories:.1f} kcal/day, Protein = {avg_protein:.1f}g/day, Carbs = {avg_carbs:.1f}g/day, Fat = {avg_fat:.1f}g/day.",
        f"Weight Trend: {weight_trend}. Details: {weight_change_text}"
    ]
    if stalls:
        summary_parts.append(f"Strength Stalls detected (no weight progression in last 3 logs): {', '.join(stalls)}.")
    else:
        summary_parts.append("Strength Progress: Steady progression or insufficient logs to analyze platueas.")
        
    summary_text = "\n".join(summary_parts)
    
    # Generate insights from Gemini (or simulation fallback)
    insight_content = ai_service.generate_coaching_advice(summary_text)
    
    # Save insight log
    insight = AIInsight(
        user_id=current_user.id,
        date=now,
        type="coach",
        content=insight_content
    )
    session.add(insight)
    session.commit()
    session.refresh(insight)
    
    return insight

from pydantic import BaseModel
from typing import List

class ChatMessage(BaseModel):
    role: str # 'user' or 'assistant'
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []

@router.get("/memory", response_model=UserMemoryResponse)
def get_memory(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve the current coach memory for the user.
    """
    memory = session.exec(
        select(UserMemory).where(UserMemory.user_id == current_user.id)
    ).first()
    
    if not memory:
        memory = UserMemory(
            user_id=current_user.id,
            content="- No facts recorded yet. Tell the coach about your training goal or injuries!"
        )
        session.add(memory)
        session.commit()
        session.refresh(memory)
        
    return memory

@router.put("/memory", response_model=UserMemoryResponse)
def update_memory(
    payload: UserMemoryUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Manually update the coach memory for the user.
    """
    memory = session.exec(
        select(UserMemory).where(UserMemory.user_id == current_user.id)
    ).first()
    
    if not memory:
        memory = UserMemory(user_id=current_user.id)
        session.add(memory)
        
    memory.content = payload.content
    memory.updated_at = datetime.utcnow()
    
    session.add(memory)
    session.commit()
    session.refresh(memory)
    return memory

@router.post("/chat")
def chat_with_coach(
    request: ChatRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Interactive chat with GymAI Coach.
    Uses the user's logged activity as background context for the AI advisor.
    Also incorporates persistent memory.
    """
    now = datetime.utcnow()
    last_30_days = now - timedelta(days=30)
    
    # Compile a brief metrics context
    workouts = session.exec(select(Workout).where((Workout.user_id == current_user.id) & (Workout.date >= last_30_days))).all()
    metrics = session.exec(select(BodyMetric).where((BodyMetric.user_id == current_user.id) & (BodyMetric.date >= last_30_days))).all()
    nutrition = session.exec(select(NutritionLog).where((NutritionLog.user_id == current_user.id) & (NutritionLog.date >= now - timedelta(days=7)))).all()
    
    context = f"User Name: {current_user.name}\n"
    if metrics:
        context += f"Latest Weight: {metrics[-1].weight} kg\n"
    if workouts:
        context += f"Workouts logged (last 30d): {len(workouts)}\n"
    if nutrition:
        dates = set(n.date.date() for n in nutrition)
        logging_days = len(dates) or 1
        avg_cal = sum(n.calories for n in nutrition) / logging_days
        avg_prot = sum(n.protein for n in nutrition) / logging_days
        context += f"Avg Calories (last 7d): {avg_cal:.1f} kcal, Avg Protein: {avg_prot:.1f}g\n"
        
    # Get user memory
    memory = session.exec(
        select(UserMemory).where(UserMemory.user_id == current_user.id)
    ).first()
    if not memory:
        memory = UserMemory(
            user_id=current_user.id,
            content="- No facts recorded yet. Tell the coach about your training goal or injuries!"
        )
        session.add(memory)
        session.commit()
        session.refresh(memory)
        
    # Format history for the AI service
    hist_dicts = [{"role": msg.role, "content": msg.content} for msg in request.history]
    
    ai_result = ai_service.chat_with_coach(request.message, hist_dicts, context, memory.content)
    
    # Save the updated memory if it was returned
    updated_memory = ai_result.get("updated_memory", memory.content)
    if updated_memory != memory.content:
        memory.content = updated_memory
        memory.updated_at = datetime.utcnow()
        session.add(memory)
        session.commit()
        session.refresh(memory)
        
    return {
        "response": ai_result.get("response", ""),
        "updated_memory": memory.content
    }

