from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class UserCreate(BaseModel):
    email: str
    name: str
    firebase_uid: str

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    firebase_uid: str
    created_at: datetime
    class Config:
        from_attributes = True

class ExerciseCreate(BaseModel):
    name: str
    muscle_group: str
    equipment: str

class ExerciseResponse(BaseModel):
    id: int
    name: str
    muscle_group: str
    equipment: str
    is_custom: bool
    user_id: Optional[int]
    class Config:
        from_attributes = True

class WorkoutLogCreate(BaseModel):
    exercise_id: int
    set_number: int
    reps: int
    weight: float

class WorkoutLogResponse(BaseModel):
    id: int
    exercise_id: int
    exercise_name: str
    set_number: int
    reps: int
    weight: float
    class Config:
        from_attributes = True

class WorkoutCreate(BaseModel):
    name: str = "Workout"
    date: Optional[datetime] = None
    duration: int = 0
    logs: List[WorkoutLogCreate]

class WorkoutResponse(BaseModel):
    id: int
    user_id: int
    date: datetime
    duration: int
    name: str
    logs: List[WorkoutLogResponse]
    class Config:
        from_attributes = True

class NutritionLogCreate(BaseModel):
    food_name: str
    calories: float
    protein: float
    carbs: float
    fat: float
    quantity: str = "1 serving"
    date: Optional[datetime] = None

class NutritionLogResponse(BaseModel):
    id: int
    user_id: int
    date: datetime
    food_name: str
    calories: float
    protein: float
    carbs: float
    fat: float
    quantity: str
    class Config:
        from_attributes = True

class BodyMetricCreate(BaseModel):
    weight: float
    body_fat: Optional[float] = None
    waist: Optional[float] = None
    date: Optional[datetime] = None

class BodyMetricResponse(BaseModel):
    id: int
    user_id: int
    date: datetime
    weight: float
    body_fat: Optional[float]
    waist: Optional[float]
    class Config:
        from_attributes = True

class AIInsightResponse(BaseModel):
    id: int
    user_id: int
    date: datetime
    type: str
    content: str
    class Config:
        from_attributes = True

class ExercisePRResponse(BaseModel):
    exercise_id: int
    exercise_name: str
    max_weight: float
    max_reps: int
    max_volume: float

class UserMemoryResponse(BaseModel):
    user_id: int
    content: str
    updated_at: datetime
    class Config:
        from_attributes = True

class UserMemoryUpdate(BaseModel):
    content: str
