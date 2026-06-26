# OmniFit Project Progress & Sync Log

This file tracks completed milestones, current active session details, and the operational checklist for **OmniFit**. It serves as a central progress-sync point for all agents working on this workspace.

---

## 🏁 Completed Milestones

### Phase 1: Core MVP Features
- [x] **Backend Infrastructure:** FastAPI setup, SQLite connection, SQLModel database schemas, and default exercise seeding.
- [x] **Auth Bypass Mode:** Frictionless offline development login using mock bearer tokens.
- [x] **Workout Tracking:** Log sets, reps, and weight, plus calculated Personal Records (PR) dashboard metrics.
- [x] **Nutrition Logging:** Daily macro counts (calories, protein, carbs, fat) with manually logged meals.
- [x] **Body Metrics Tracker:** CRUD operations for weight, waist, and body fat, rendered in progress bar charts.
- [x] **Safari Viewport & PWA Optimizations:** Custom HTML template reset (`100svh`/`100dvh`), `viewport-fit=cover` scaling, and overridden safe area insets to fit iOS Safari bottom navigation bar.

### Phase 2: Credentials & Live APIs Integration
- [x] **Firebase Auth Integration:** Live email/password registration, profiles database sync, and "Continue with Google" popup flows.
- [x] **Gemini API Integration:** Multimodal food scanner (`analyze_food` using `gemini-2.5-flash`).
- [x] **OpenRouter Chatbot Integration:** Conversational coaching chat (`chat_with_coach` using OpenRouter for flexible model routing).
- [x] **Dynamic Workout Streak:** Replaced hardcoded streak with dynamic calendar days tracker counting consecutive active workout days.

---

## 📍 Active Session Parameters (Sync Coordinates)

Keep these updated if host network or system environments change:
* **Host IP:** `192.168.1.33` (Mac)
* **Backend Port:** `8000`
* **Local Web Server:** `http://192.168.1.33:8000/` (Serves the API and PWA build)
* **Metro Bundler Port:** `8081` (Optional for client hot-reloading)

---

## ⚙️ Operational Cheat Sheet for Agents

### 1. Run Backend Server (Unified serving of API + Client)
```bash
cd gym-ai-api
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 2. Rebuild PWA Frontend Client
```bash
cd gym-ai-mobile
npx expo export --platform web --clear
```

### 3. Run Backend Unit Tests
```bash
cd gym-ai-api
PYTHONPATH=. venv/bin/pytest
```

---

## 📋 Next Feature Backlog
- [ ] Add SVG charts for metrics visual tracking.
- [ ] Implement custom routine templates (push/pull/legs).
- [ ] Add hydration tracking (water logger).
