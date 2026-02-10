# Naming Conventions

## General Rules
*   **Files & Directories:** Use `kebab-case` for general files, `snake_case` for Python files.
*   **Variables:** `camelCase` (JS/TS), `snake_case` (Python).
*   **Constants:** `UPPER_SNAKE_CASE` (Both).

## Frontend (TypeScript / React)
*   **Components:** `PascalCase.tsx` (e.g., `ProjectCard.tsx`).
*   **Hooks:** `camelCase.ts` (starts with `use`, e.g., `useProjects.ts`).
*   **Utilities:** `kebab-case.ts` (e.g., `date-formatter.ts`).
*   **Types/Interfaces:** `PascalCase.ts` (e.g., `Project.ts`). Interface names should ideally *not* be prefixed with `I` unless necessary for clarity.

## Backend (Python)
*   **Modules/Files:** `snake_case.py` (e.g., `project_service.py`).
*   **Classes:** `PascalCase` (e.g., `class ProjectManager:`).
*   **Functions/Methods:** `snake_case` (e.g., `def create_project():`).
*   **API Routes:** `kebab-case` in URL path (e.g., `/api/v1/user-profiles`).

## Database (PostgreSQL)
*   **Tables:** `snake_case` (plural), e.g., `projects`, `task_deadlines`.
*   **Columns:** `snake_case`, e.g., `created_at`, `user_id`.
*   **Primary Keys:** `id` (UUID preferred).
*   **Foreign Keys:** `[table_singular]_id`, e.g., `project_id`.
