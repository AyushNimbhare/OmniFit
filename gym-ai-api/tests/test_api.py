import os
import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, create_engine
from app.main import app
from app.db.database import get_session
from app.models.models import User, Exercise, Workout, WorkoutLog, NutritionLog, BodyMetric, AIInsight

TEST_DATABASE_URL = "sqlite:///file:testdb?mode=memory&cache=shared&uri=true"
test_engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False, "uri": True})

@pytest.fixture(name="session")
def session_fixture():
    SQLModel.metadata.create_all(test_engine)
    with Session(test_engine) as session:
        from app.db.database import seed_exercises
        seed_exercises(session)
        yield session
    SQLModel.metadata.drop_all(test_engine)
    # Remove test DB file if it exists
    if os.path.exists("./test_gym_ai.db"):
        try:
            os.remove("./test_gym_ai.db")
        except PermissionError:
            pass

@pytest.fixture(name="client")
def client_fixture(session):
    def get_session_override():
        return session
    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()

def test_read_root(client):
    response = client.get("/")
    assert response.status_code == 200
    content_type = response.headers.get("content-type", "")
    if "text/html" in content_type:
        assert b"<!DOCTYPE html>" in response.content
    else:
        assert response.json()["status"] == "online"

def test_auth_sync(client):
    payload = {
        "email": "tester@example.com",
        "name": "Test User",
        "firebase_uid": "bypass-Test_User-tester_at_example_dot_com"
    }
    response = client.post("/api/auth/sync", json=payload)
    assert response.status_code == 200
    assert response.json()["email"] == "tester@example.com"
    assert response.json()["name"] == "Test User"

def test_exercises_and_workouts(client):
    # 1. Sync User
    uid = "bypass-Test_User-tester_at_example_dot_com"
    client.post("/api/auth/sync", json={
        "email": "tester@example.com",
        "name": "Test User",
        "firebase_uid": uid
    })
    headers = {"Authorization": f"Bearer {uid}"}
    
    # 2. Get exercises (includes seeded ones)
    res_ex = client.get("/api/workouts/exercises", headers=headers)
    assert res_ex.status_code == 200
    exercises = res_ex.json()
    assert len(exercises) > 0
    bench_press_id = next(ex["id"] for ex in exercises if ex["name"] == "Bench Press")
    
    # 3. Create Custom Exercise
    res_custom = client.post("/api/workouts/exercises", headers=headers, json={
        "name": "Custom Leg Press",
        "muscle_group": "Quads",
        "equipment": "Leg Press Machine"
    })
    assert res_custom.status_code == 200
    assert res_custom.json()["name"] == "Custom Leg Press"
    assert res_custom.json()["is_custom"] is True
    
    # 4. Log a Workout
    workout_payload = {
        "name": "Monday Push Day",
        "duration": 45,
        "logs": [
            {"exercise_id": bench_press_id, "set_number": 1, "reps": 8, "weight": 60.0},
            {"exercise_id": bench_press_id, "set_number": 2, "reps": 7, "weight": 60.0}
        ]
    }
    res_workout = client.post("/api/workouts", headers=headers, json=workout_payload)
    assert res_workout.status_code == 200
    workout = res_workout.json()
    assert workout["name"] == "Monday Push Day"
    assert len(workout["logs"]) == 2
    
    # 5. Get History
    res_history = client.get("/api/workouts", headers=headers)
    assert res_history.status_code == 200
    assert len(res_history.json()) == 1
    
    # 6. Check Personal Records
    res_prs = client.get("/api/workouts/prs", headers=headers)
    assert res_prs.status_code == 200
    assert len(res_prs.json()) == 1
    assert res_prs.json()[0]["max_weight"] == 60.0

def test_nutrition_logging_and_scan(client):
    uid = "bypass-Test_User-tester_at_example_dot_com"
    client.post("/api/auth/sync", json={
        "email": "tester@example.com",
        "name": "Test User",
        "firebase_uid": uid
    })
    headers = {"Authorization": f"Bearer {uid}"}
    
    # 1. Manual log
    log_payload = {
        "food_name": "Oatmeal with Honey",
        "calories": 320.0,
        "protein": 10.0,
        "carbs": 55.0,
        "fat": 6.0,
        "quantity": "1 bowl"
    }
    res_log = client.post("/api/nutrition", headers=headers, json=log_payload)
    assert res_log.status_code == 200
    assert res_log.json()["food_name"] == "Oatmeal with Honey"
    
    # 2. Get history
    res_history = client.get("/api/nutrition", headers=headers)
    assert res_history.status_code == 200
    assert len(res_history.json()) == 1
    
    # 3. Scan food (using description text)
    res_scan = client.post(
        "/api/nutrition/scan",
        headers=headers,
        data={"description": "chicken breast and rice"}
    )
    assert res_scan.status_code == 200
    data = res_scan.json()
    assert "chicken" in data["food_name"].lower()
    assert data["calories"] > 0
    assert data["protein"] > 0

def test_body_metrics(client):
    uid = "bypass-Test_User-tester_at_example_dot_com"
    client.post("/api/auth/sync", json={
        "email": "tester@example.com",
        "name": "Test User",
        "firebase_uid": uid
    })
    headers = {"Authorization": f"Bearer {uid}"}
    
    # 1. Log weight metric
    metric_payload = {
        "weight": 75.5,
        "body_fat": 15.2,
        "waist": 82.0
    }
    res_metric = client.post("/api/metrics", headers=headers, json=metric_payload)
    assert res_metric.status_code == 200
    assert res_metric.json()["weight"] == 75.5
    
    # 2. Get metrics
    res_get = client.get("/api/metrics", headers=headers)
    assert res_get.status_code == 200
    assert len(res_get.json()) == 1
    assert res_get.json()[0]["weight"] == 75.5

def test_coach_insights(client):
    uid = "bypass-Test_User-tester_at_example_dot_com"
    client.post("/api/auth/sync", json={
        "email": "tester@example.com",
        "name": "Test User",
        "firebase_uid": uid
    })
    headers = {"Authorization": f"Bearer {uid}"}
    
    # Generate insights (will succeed even with mock/empty data)
    res_coach = client.get("/api/coach/insights", headers=headers)
    assert res_coach.status_code == 200
    assert res_coach.json()["type"] == "coach"
    assert len(res_coach.json()["content"]) > 0

def test_coach_memory(client):
    uid = "bypass-Test_User-tester_at_example_dot_com"
    client.post("/api/auth/sync", json={
        "email": "tester@example.com",
        "name": "Test User",
        "firebase_uid": uid
    })
    headers = {"Authorization": f"Bearer {uid}"}
    
    # 1. Get memory (initial, default)
    res_mem = client.get("/api/coach/memory", headers=headers)
    assert res_mem.status_code == 200
    assert "No facts recorded yet" in res_mem.json()["content"]
    
    # 2. Update memory manually
    update_payload = {"content": "- Goal: Increase Bench Press\n- Injury: Elbow pain"}
    res_put = client.put("/api/coach/memory", headers=headers, json=update_payload)
    assert res_put.status_code == 200
    assert "Bench Press" in res_put.json()["content"]
    
    # 3. Retrieve and confirm manual update
    res_mem2 = client.get("/api/coach/memory", headers=headers)
    assert res_mem2.status_code == 200
    assert "Elbow pain" in res_mem2.json()["content"]
    
    # 4. Chat with coach to trigger keyword learning (e.g., "vegan")
    chat_payload = {
        "message": "I want to eat more protein but I am a vegan",
        "history": []
    }
    res_chat = client.post("/api/coach/chat", headers=headers, json=chat_payload)
    assert res_chat.status_code == 200
    chat_data = res_chat.json()
    assert "response" in chat_data
    assert "updated_memory" in chat_data
    assert "plant-based diet" in chat_data["updated_memory"]

def test_coach_chat_history(client):
    # Sync User
    uid = "bypass-Test_User-tester_at_example_dot_com"
    client.post("/api/auth/sync", json={
        "email": "tester@example.com",
        "name": "Test User",
        "firebase_uid": uid
    })
    headers = {"Authorization": f"Bearer {uid}"}

    # 1. Check history initially empty
    res_hist = client.get("/api/coach/history", headers=headers)
    assert res_hist.status_code == 200
    assert len(res_hist.json()) == 0

    # 2. Send a chat message
    chat_payload = {
        "message": "Hello Coach! How can I lose fat?",
        "history": []
    }
    res_chat = client.post("/api/coach/chat", headers=headers, json=chat_payload)
    assert res_chat.status_code == 200
    
    # 3. Retrieve history again, should contain 2 messages
    res_hist2 = client.get("/api/coach/history", headers=headers)
    assert res_hist2.status_code == 200
    history_data = res_hist2.json()
    assert len(history_data) == 2
    
    assert history_data[0]["role"] == "user"
    assert history_data[0]["content"] == "Hello Coach! How can I lose fat?"
    
    assert history_data[1]["role"] == "assistant"
    assert history_data[1]["content"] == res_chat.json()["response"]
