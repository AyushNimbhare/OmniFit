# OmniFit - Git Engineer Hub

Welcome! This is the centralized hub for the **OmniFit Git Engineer**. This document is dynamically updated and synced to track repository status, branch strategies, commit history, deployment states, and code safety audits for OmniFit.

---

## 👤 Profile: OmniFit Git Engineer
*   **Role:** Manage the version control, repository safety, branching workflows, clean commits, and deployment pipelines.
*   **Focus:** Ensure zero credential leaks, maintain clean and logical commit history, and prevent build/deployment blockages.

---

## 📊 Repository Status

*   **Current Branch:** `main`
*   **Remote Origin:** `https://github.com/AyushNimbhare/OmniFit.git`
*   **Last Committed Hash:** `f59143a` (*Initial commit: GymAI unified FastAPI backend and Expo React Native frontend*)

### 📁 Workspace Modifications (Uncommitted Changes)
The following files are modified or untracked in the local working directory as of **June 24, 2026**:

| Status | File Path | Description of Changes |
| :--- | :--- | :--- |
| **Modified** | [gym-ai-api/.env.example](file:///Users/ayushnimbhare/Files/Projects/fitnessTracker/gym-ai-api/.env.example) | Added configurations / references |
| **Modified** | [gym-ai-api/app/main.py](file:///Users/ayushnimbhare/Files/Projects/fitnessTracker/gym-ai-api/app/main.py) | Updates to API routing/serving |
| **Modified** | [gym-ai-api/app/services/ai_service.py](file:///Users/ayushnimbhare/Files/Projects/fitnessTracker/gym-ai-api/app/services/ai_service.py) | Extended Gemini integration and prompt logic |
| **Modified** | [gym-ai-mobile/app.json](file:///Users/ayushnimbhare/Files/Projects/fitnessTracker/gym-ai-mobile/app.json) | Expo configurations updated |
| **Modified** | [gym-ai-mobile/src/screens/AICoachScreen.tsx](file:///Users/ayushnimbhare/Files/Projects/fitnessTracker/gym-ai-mobile/src/screens/AICoachScreen.tsx) | UX/chat screen updates |
| **Modified** | [gym-ai-mobile/src/screens/DashboardScreen.tsx](file:///Users/ayushnimbhare/Files/Projects/fitnessTracker/gym-ai-mobile/src/screens/DashboardScreen.tsx) | UI updates to dashboard macro rings |
| **Modified** | [gym-ai-mobile/src/screens/LoginScreen.tsx](file:///Users/ayushnimbhare/Files/Projects/fitnessTracker/gym-ai-mobile/src/screens/LoginScreen.tsx) | Firebase auth & bypass logic changes |
| **Modified** | [gym-ai-mobile/src/screens/NutritionScreen.tsx](file:///Users/ayushnimbhare/Files/Projects/fitnessTracker/gym-ai-mobile/src/screens/NutritionScreen.tsx) | Food scanner interface improvements |
| **Modified** | [gym-ai-mobile/src/services/AuthContext.tsx](file:///Users/ayushnimbhare/Files/Projects/fitnessTracker/gym-ai-mobile/src/services/AuthContext.tsx) | Context updates for session state |
| **Modified** | [gym-ai-mobile/src/services/api.ts](file:///Users/ayushnimbhare/Files/Projects/fitnessTracker/gym-ai-mobile/src/services/api.ts) | Network handler endpoint bindings |
| **Untracked** | `gym-ai-mobile/.env` | Local environment configurations (ignored by root gitignore) |
| **Untracked** | [social_media_manager.md](file:///Users/ayushnimbhare/Files/Projects/fitnessTracker/social_media_manager.md) | Social Media Manager's strategy document |

---

## 🔒 Security & Ignored Patterns
We enforce a strict security policy to prevent sensitive information leaks:
*   Root [.gitignore](file:///Users/ayushnimbhare/Files/Projects/fitnessTracker/.gitignore) protects virtual environments (`venv`), node modules (`node_modules`), databases (`gym_ai.db`), and secret configurations (`.env`).
*   **Safe-Commit Checklist:**
    1. Run `git status` to verify no `.env` or `.db` files are staged.
    2. Check `git diff --cached` for hardcoded keys (e.g., `AI_KEY`, `secret`).
    3. Ensure template variables in `.env.example` remain empty.

---

## 📋 Git Engineering Tasks & Work in Progress

- [ ] **Track and Commit Current Workspace Changes**
  - [ ] Audit recent changes in the 10 modified files for any credentials.
  - [ ] Group changes into cohesive commits (e.g., frontend UX updates vs. backend Gemini enhancements).
  - [ ] Stage and commit the files.
- [ ] **Branch Management**
  - [ ] Establish branch protection guidelines if collaborating.
  - [ ] Create a `dev` branch or specific feature branches for upcoming tasks.
- [ ] **Safety Verification**
  - [ ] Add pre-commit hook scripts if necessary to automate credential checking.

---

## 🔄 Sync Log
*   **2026-06-24:** Initial creation of the Git Engineer Hub. Established git profile, current repository status, security checklist, and active task tracker.
