# Project Profile: Product Engineer (Antigravity AI)

This file documents the role, responsibilities, architectural context, current project state, and roadmap of the lead Product Engineer agent for **OmniFit**. It is updated and synced at each step to maintain continuity across sessions and coordinate with other agents.

---

## 👤 Agent Profile & Directives

* **Role:** Lead Product Engineer / Architect
* **Primary Objective:** Build a visually stunning, highly performant, and developer-friendly AI fitness platform (**OmniFit**) that runs seamlessly on both desktop browsers and iOS Safari (PWA mode).
* **Engineering Values:**
  1. **Visual Excellence:** Maintain the premium dark-themed, glassmorphic UI with smooth micro-animations. Avoid browser-default styles.
  2. **Zero-Setup Testing (Dual-Mode):** Ensure the application remains instantly testable offline via fallback/bypass simulation modes if API keys or Firebase credentials are missing.
  3. **Multi-Agent Coordination:** Write clean, modular, typed code (TypeScript + SQLModel) with automated test coverage so other agents can easily modify or extend features.

---

## 🏗️ Project Architecture & State

### 1. Frontend Client (`gym-ai-mobile/`)
* **Technology:** React Native Expo (compiled for Web/PWA).
* **Viewport & Safari Layout Fixes:**
  * Uses `viewport-fit=cover` in `public/index.html`.
  * Style resets for `html`, `body`, and `#root` use `100svh` / `100dvh` to sit perfectly within Safari's address bar boundaries.
  * Web `safeAreaInsets` are overridden to `0` with font descender padding adjustments in `AppNavigator.tsx` to prevent clipping.
* **Authentication:** Firebase Web SDK (email/password & Google login popup) with local bypass fallback.
* **Active Base API URL:** Resolves dynamically depending on origin, falling back to: `http://192.168.1.33:8000`.

### 2. Backend Server (`gym-ai-api/`)
* **Technology:** FastAPI, SQLModel (SQLite database).
* **Database Models:** `User`, `Exercise` (seeded with default lifts), `Workout`, `WorkoutLog`, `NutritionLog`, `BodyMetric`, `AIInsight`.
* **Testing:** Pytest suite with isolated in-memory SQLite instances (`pytest` runs via `PYTHONPATH=. venv/bin/pytest`).

### 3. AI Integrations
* **Food Scanner (`analyze_food`):** Calls native **Google Gemini API** (`gemini-2.5-flash`) for multi-modal image scanning and nutritional estimates.
* **AI Coach (`chat_with_coach` & `generate_coaching_advice`):** Calls **OpenRouter API** (`meta-llama/llama-3.3-70b-instruct:free` by default) to allow flexible model switching for text recommendations.

---

## 📍 Current Session Context (Last Updated: 2026-06-26)

* **Current Mac Host IP:** `192.168.1.33`
* **Active Port:** `8000` (Uvicorn running in the background as task `task-1063`)
* **Status:** 
  * Real Firebase credentials and OpenRouter/Gemini API keys are configured in `gym-ai-api/.env` and `gym-ai-mobile/.env`.
  * Dynamic workout streak tracker (consecutive days calculated from real database logs) is fully operational.
  * Backend unit tests are passing (6/6).

---

## 🚀 Product Backlog & Roadmap

- [ ] **Data Visualizations:** Add visual charts (e.g. weight progress line charts, macronutrient distribution pie charts) to the Dashboard/Metrics screen using SVG or styled canvas.
- [ ] **Workout Planner:** Allow users to build routine templates (e.g., "Push Day", "Pull Day") that pre-populate exercises and target sets.
- [ ] **Advanced Nutrition Metrics:** Track hydration (water log) and micronutrients (fiber, sodium).
- [ ] **Multi-Agent CLI Tools:** Build helper scripts in the workspace to automatically scan the local IP address and rebuild/restart the server with a single command.
