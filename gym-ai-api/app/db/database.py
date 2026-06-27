import os
from dotenv import load_dotenv
load_dotenv()

from sqlmodel import SQLModel, create_engine, Session, select
from app.models.models import Exercise

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///gym_ai.db")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# SQLite needs connect_args={"check_same_thread": False}
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, echo=True, connect_args=connect_args)

DEFAULT_EXERCISES = [
    {"name": "Bench Press", "muscle_group": "Chest", "equipment": "Barbell"},
    {"name": "Incline Dumbbell Press", "muscle_group": "Chest", "equipment": "Dumbbells"},
    {"name": "Barbell Squat", "muscle_group": "Quadriceps", "equipment": "Barbell"},
    {"name": "Deadlift", "muscle_group": "Hamstrings/Back", "equipment": "Barbell"},
    {"name": "Overhead Press", "muscle_group": "Shoulders", "equipment": "Barbell"},
    {"name": "Lateral Raise", "muscle_group": "Shoulders", "equipment": "Dumbbells"},
    {"name": "Pull Up", "muscle_group": "Lats", "equipment": "Bodyweight"},
    {"name": "Barbell Row", "muscle_group": "Back", "equipment": "Barbell"},
    {"name": "Dumbbell Curl", "muscle_group": "Biceps", "equipment": "Dumbbells"},
    {"name": "Tricep Rope Pushdown", "muscle_group": "Triceps", "equipment": "Cable"},
    {"name": "Leg Press", "muscle_group": "Quadriceps", "equipment": "Machine"},
    {"name": "Lying Leg Curl", "muscle_group": "Hamstrings", "equipment": "Machine"}
]

def seed_exercises(session: Session):
    for ex_data in DEFAULT_EXERCISES:
        existing = session.exec(select(Exercise).where(Exercise.name == ex_data["name"])).first()
        if not existing:
            exercise = Exercise(
                name=ex_data["name"],
                muscle_group=ex_data["muscle_group"],
                equipment=ex_data["equipment"],
                is_custom=False
            )
            session.add(exercise)
    session.commit()

def init_db():
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        seed_exercises(session)

def get_session():
    with Session(engine) as session:
        yield session

