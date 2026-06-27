from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    name: str
    firebase_uid: str = Field(index=True, unique=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    workouts: List["Workout"] = Relationship(back_populates="user")
    nutrition_logs: List["NutritionLog"] = Relationship(back_populates="user")
    body_metrics: List["BodyMetric"] = Relationship(back_populates="user")
    ai_insights: List["AIInsight"] = Relationship(back_populates="user")

class Exercise(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    muscle_group: str = Field(index=True)
    equipment: str
    is_custom: bool = Field(default=False)
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")

class Workout(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    date: datetime = Field(default_factory=datetime.utcnow)
    duration: int = Field(default=0)  # duration in minutes
    name: str = Field(default="Workout")

    # Relationships
    user: User = Relationship(back_populates="workouts")
    logs: List["WorkoutLog"] = Relationship(back_populates="workout")

class WorkoutLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    workout_id: int = Field(foreign_key="workout.id")
    exercise_id: int = Field(foreign_key="exercise.id")
    set_number: int
    reps: int
    weight: float

    # Relationships
    workout: Workout = Relationship(back_populates="logs")
    exercise: Exercise = Relationship()

class NutritionLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    date: datetime = Field(default_factory=datetime.utcnow)
    food_name: str
    calories: float
    protein: float
    carbs: float
    fat: float
    quantity: str = Field(default="1 serving")

    # Relationships
    user: User = Relationship(back_populates="nutrition_logs")

class BodyMetric(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    date: datetime = Field(default_factory=datetime.utcnow)
    weight: float
    body_fat: Optional[float] = Field(default=None)
    waist: Optional[float] = Field(default=None)

    # Relationships
    user: User = Relationship(back_populates="body_metrics")

class AIInsight(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    date: datetime = Field(default_factory=datetime.utcnow)
    type: str  # e.g., 'coach' or 'nutrition'
    content: str

    # Relationships
    user: User = Relationship(back_populates="ai_insights")

class UserMemory(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True, unique=True)
    content: str = Field(default="")
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CoachMessage(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    role: str = Field(...)  # 'user' or 'assistant'
    content: str = Field(...)
    created_at: datetime = Field(default_factory=datetime.utcnow)
