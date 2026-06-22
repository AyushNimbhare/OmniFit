from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from app.db.database import get_session
from app.models.models import Exercise, Workout, WorkoutLog, User
from app.schemas.schemas import (
    ExerciseCreate, ExerciseResponse, WorkoutCreate, WorkoutResponse,
    WorkoutLogResponse, ExercisePRResponse
)
from app.api.auth import get_current_user

router = APIRouter(prefix="/api/workouts", tags=["workouts"])

# Get exercises (default + user-customized)
@router.get("/exercises", response_model=List[ExerciseResponse])
def get_exercises(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    statement = select(Exercise).where(
        (Exercise.is_custom == False) | (Exercise.user_id == current_user.id)
    )
    return session.exec(statement).all()

# Create a custom exercise
@router.post("/exercises", response_model=ExerciseResponse)
def create_exercise(
    exercise_in: ExerciseCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Check if exercise with the same name already exists for the user or globally
    existing = session.exec(select(Exercise).where(
        (Exercise.name == exercise_in.name) &
        ((Exercise.is_custom == False) | (Exercise.user_id == current_user.id))
    )).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="An exercise with this name already exists.")
        
    exercise = Exercise(
        name=exercise_in.name,
        muscle_group=exercise_in.muscle_group,
        equipment=exercise_in.equipment,
        is_custom=True,
        user_id=current_user.id
    )
    session.add(exercise)
    session.commit()
    session.refresh(exercise)
    return exercise

# Save a completed workout
@router.post("", response_model=WorkoutResponse)
def create_workout(
    workout_in: WorkoutCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    workout = Workout(
        user_id=current_user.id,
        date=workout_in.date or datetime.utcnow(),
        duration=workout_in.duration,
        name=workout_in.name
    )
    session.add(workout)
    session.commit()
    session.refresh(workout)
    
    for log_in in workout_in.logs:
        exercise = session.get(Exercise, log_in.exercise_id)
        if not exercise:
            raise HTTPException(status_code=404, detail=f"Exercise ID {log_in.exercise_id} not found")
        
        log = WorkoutLog(
            workout_id=workout.id,
            exercise_id=log_in.exercise_id,
            set_number=log_in.set_number,
            reps=log_in.reps,
            weight=log_in.weight
        )
        session.add(log)
        
    session.commit()
    
    # Fetch logs back to include exercise relationship
    statement = select(WorkoutLog).where(WorkoutLog.workout_id == workout.id)
    db_logs = session.exec(statement).all()
    
    logs_out = []
    for l in db_logs:
        logs_out.append(WorkoutLogResponse(
            id=l.id,
            exercise_id=l.exercise_id,
            exercise_name=l.exercise.name,
            set_number=l.set_number,
            reps=l.reps,
            weight=l.weight
        ))
        
    return WorkoutResponse(
        id=workout.id,
        user_id=workout.user_id,
        date=workout.date,
        duration=workout.duration,
        name=workout.name,
        logs=logs_out
    )

# Retrieve workout history
@router.get("", response_model=List[WorkoutResponse])
def get_workout_history(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    statement = select(Workout).where(Workout.user_id == current_user.id).order_by(Workout.date.desc())
    workouts = session.exec(statement).all()
    
    result = []
    for w in workouts:
        logs_out = []
        for l in w.logs:
            logs_out.append(WorkoutLogResponse(
                id=l.id,
                exercise_id=l.exercise_id,
                exercise_name=l.exercise.name,
                set_number=l.set_number,
                reps=l.reps,
                weight=l.weight
            ))
        result.append(WorkoutResponse(
            id=w.id,
            user_id=w.user_id,
            date=w.date,
            duration=w.duration,
            name=w.name,
            logs=logs_out
        ))
    return result

# Get personal records for exercises
@router.get("/prs", response_model=List[ExercisePRResponse])
def get_personal_records(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    statement = select(WorkoutLog).join(Workout).where(Workout.user_id == current_user.id)
    logs = session.exec(statement).all()
    
    prs = {}
    for l in logs:
        ex_id = l.exercise_id
        ex_name = l.exercise.name
        volume = l.reps * l.weight
        if ex_id not in prs:
            prs[ex_id] = {
                "exercise_id": ex_id,
                "exercise_name": ex_name,
                "max_weight": l.weight,
                "max_reps": l.reps,
                "max_volume": volume
            }
        else:
            prs[ex_id]["max_weight"] = max(prs[ex_id]["max_weight"], l.weight)
            prs[ex_id]["max_reps"] = max(prs[ex_id]["max_reps"], l.reps)
            prs[ex_id]["max_volume"] = max(prs[ex_id]["max_volume"], volume)
            
    return list(prs.values())
