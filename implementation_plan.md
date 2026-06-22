# Implementation Plan - GymAI Fitness App

GymAI is a comprehensive AI-powered fitness tracking application. It integrates workout tracking, nutrition logging, body weight tracking, and an AI Coach that analyzes progress to provide intelligent recommendations.

This plan details the technical steps to build the frontend (Expo React Native with TypeScript) and the backend (FastAPI with SQLModel/SQLite).

---

## User Review Required

> [!IMPORTANT]
> **Database Selection:** We will use **SQLite** (using SQLModel) for the backend database for local development. SQLite is zero-configuration and works out-of-the-box. The code will be structured such that switching to PostgreSQL in production is as simple as updating a database URL in the environment variables.
>
> **Authentication Bypass for Testing:** We will implement **Firebase Auth** integration, but we will also provide a local development "Bypass/Test Auth" mode. This allows testing the entire application without needing to provision a real Firebase project.
>
> **Gemini API Integration:** Since we need AI capabilities (AI Coach advice and AI Food Image scanning), we will use the Gemini API (using the `google-generativeai` package). If no `GEMINI_API_KEY` is present in the backend `.env` file, we will fallback to a deterministic simulated AI response.

---

## Open Questions

- **Do you already have a Firebase project config?** If yes, we can configure Firebase Auth in the mobile app. Otherwise, we will use the Auth Bypass/Test Mode for local testing.
- **Do you have a Gemini API key?** If you have one, we can add it to the backend environment variables. If not, the simulated mock AI coach/food scanner will return simulated realistic results.

---

## Proposed Changes

We will create two main directories in the workspace:
1. `gym-ai-api/` for the FastAPI backend.
2. `gym-ai-mobile/` for the Expo React Native frontend.

---

### Backend: `gym-ai-api/`

The backend will be built with **FastAPI** and **SQLModel** (SQLAlchemy + Pydantic).

#### [NEW] [main.py](file:///Users/ayushnimbhare/Files/Projects/fitnessTracker/gym-ai-api/app/main.py)
Entry point for the FastAPI application. Sets up routes, middleware (CORS), and database initialization.

#### [NEW] [database.py](file:///Users/ayushnimbhare/Files/Projects/fitnessTracker/gym-ai-api/app/db/database.py)
Initializes SQLModel engine and provides a session generator for database operations.

#### [NEW] [models.py](file:///Users/ayushnimbhare/Files/Projects/fitnessTracker/gym-ai-api/app/models/models.py)
Defines the database schema as SQLModel models:
* `User`: ID, email, name, created_at
* `Exercise`: ID, name, muscle_group, equipment (Pre-seeded with common exercises)
* `Workout`: ID, user_id, date, duration, name
* `WorkoutLog`: ID, workout_id, exercise_id, sets, reps, weight
* `NutritionLog`: ID, user_id, date, food_name, calories, protein, carbs, fat, quantity
* `BodyMetric`: ID, user_id, date, weight, body_fat, waist
* `AIInsight`: ID, user_id, date, type, content

#### [NEW] [auth.py](file:///Users/ayushnimbhare/Files/Projects/fitnessTracker/gym-ai-api/app/api/auth.py)
Handles Firebase JWT verification and Auth Bypass mode. Creates or fetches the user in the database.

#### [NEW] [workouts.py](file:///Users/ayushnimbhare/Files/Projects/fitnessTracker/gym-ai-api/app/api/workouts.py)
Endpoints for tracking exercises, workouts, and PRs.
* `GET /api/exercises` - Get pre-seeded and custom exercises
* `POST /api/exercises` - Create a custom exercise
* `GET /api/workouts` - Fetch workout history
* `POST /api/workouts` - Log a new workout (with sets, reps, weight logs)
* `GET /api/workouts/prs` - Get personal records per exercise

#### [NEW] [nutrition.py](file:///Users/ayushnimbhare/Files/Projects/fitnessTracker/gym-ai-api/app/api/nutrition.py)
Endpoints for tracking meals and scanning food.
* `GET /api/nutrition` - Fetch nutrition log history for a date range
* `POST /api/nutrition` - Log a meal manually
* `POST /api/nutrition/scan` - Analyze uploaded meal photo (or voice description) using Gemini and return nutrition estimates (calories, protein, carbs, fat)

#### [NEW] [metrics.py](file:///Users/ayushnimbhare/Files/Projects/fitnessTracker/gym-ai-api/app/api/metrics.py)
Endpoints for body metrics tracking.
* `GET /api/metrics` - Fetch weight/body-fat history
* `POST /api/metrics` - Log weight, body fat, or waist measurements

#### [NEW] [coach.py](file:///Users/ayushnimbhare/Files/Projects/fitnessTracker/gym-ai-api/app/api/coach.py)
Endpoints for the AI Coach recommendation service.
* `GET /api/coach/insights` - Analyze user data and generate coaching recommendations

---

### Frontend: `gym-ai-mobile/`

The frontend will be built with **Expo**, **TypeScript**, **React Navigation**, and **React Query**. It will support running on web so that it can be previewed directly in the browser.

#### [NEW] [App.tsx](file:///Users/ayushnimbhare/Files/Projects/fitnessTracker/gym-ai-mobile/App.tsx)
App entry point. Configures React Query Provider, Navigation container, and root state.

#### [NEW] [navigation](file:///Users/ayushnimbhare/Files/Projects/fitnessTracker/gym-ai-mobile/src/navigation/AppNavigator.tsx)
Handles Auth routing vs App Bottom Tab routing:
* **Auth Stack**: Login, Register, Forgot Password
* **App Tabs**:
  * Dashboard (Stats, Streaks, PR highlights, AI Coach recommendations)
  * Workouts (Log active workout, view workout history, manage exercises)
  * Nutrition (Log macros, AI food scanner camera, calorie progress bars)
  * Body Metrics (Log weight, track waist/body fat, charts)
  * AI Coach (Ask coach advice in a messaging UI)

#### [NEW] [screens](file:///Users/ayushnimbhare/Files/Projects/fitnessTracker/gym-ai-mobile/src/screens/)
* `DashboardScreen.tsx` - Displays dynamic charts, streaks, and recommendations.
* `WorkoutScreen.tsx` / `LogWorkoutScreen.tsx` - Form to select exercises and log weight, sets, reps.
* `NutritionScreen.tsx` - Logging page with camera food scanner and search functionality.
* `MetricsScreen.tsx` - Dynamic graphs displaying progress.
* `AICoachScreen.tsx` - Chat conversation with the AI coach.

#### [NEW] [api.ts](file:///Users/ayushnimbhare/Files/Projects/fitnessTracker/gym-ai-mobile/src/services/api.ts)
Axios configurations for calling the backend API.

---

## Verification Plan

### Automated Tests
* We will verify the API by writing a test suite inside `gym-ai-api/tests/` and run:
  `pytest`

### Manual Verification
1. Run the FastAPI server:
   `uvicorn app.main:app --reload`
2. Run the Expo web client:
   `npm run web` (or `npx expo start --web`)
3. Access the web interface in the browser to verify logging workouts, logging nutrition, triggering the AI food scan, and reviewing the AI coach recommendations.
