# 變更日誌 (Changelog)

本文件紀錄所有已完成任務的詳細變更與成果。

---
## [2026-02-10] Task-BE-006: 通知排程與發送服務
*   **Status**: ✅ Completed
*   **Highlights**:
    *   Implemented `NotificationService` with deadline checking logic (T-7, T-3, T-1, T-0, Overdue).
    *   Integrated `APScheduler` for daily deadline checks (09:00 AM).
    *   Added `POST /api/v1/dashboard/notifications/trigger` endpoint for manual testing.
    *   Integrated `line-bot-sdk` for sending Push Messages used by the scheduler.
    *   Updated `Profile` model with `line_user_id` support (migrated DB schema).

## [2026-02-09] Frontend Fixes & Configuration
*   **Status**: ✅ Completed
*   **Highlights**:
    *   Fixed `createClientComponentClient` import error in `frontend/app/projects/page.tsx`.
    *   Fixed missing environment variables in frontend build process.
    *   Configured Supabase Anon Key and URL in `.env`.

## [2026-02-09] Task-FE-005: 專案與文件校對頁面
*   **Status**: ✅ Completed
*   **Highlights**:
    *   Implemented `/projects/[id]` detail page with Split View.
    *   Created `DocumentUploader` with Drag & Drop support.
    *   Created `EventEditor` for reviewing and editing AI-parsed events.
    *   Implemented Backend API: `GET /documents/{id}` and `PUT /events/{id}` using Supabase logic.
    *   Added Polling mechanism for auto-refreshing AI results.

## [2026-02-09] Task-FE-004: 儀表板開發
*   **Status**: ✅ Completed
*   **Highlights**:
    *   Implemented `/dashboard` page.
    *   Created `StatCard` for metrics display.
    *   Created `RecentTaskList` with Overdue/Warning logic.
    *   Implemented Backend API `/api/v1/dashboard/stats` for aggregated metrics.

## [2026-02-09] Task-FE-009: 專案列表頁
*   **Status**: ✅ Completed
*   **Highlights**:
    *   Implemented `/projects` page with responsive grid layout.
    *   Created `ProjectCard` component using Shadcn UI.
    *   Implemented `NewProjectDialog` with Form validation (Zod) and API integration.
    *   Setup `apiClient` with Auth token injection for secure requests.
    *   Added backend CRUD endpoints for Projects (`Task-BE-002-Cleanup`).

## [2026-02-09] Task-BE-003: 文件上傳與解析服務
*   **Status**: ✅ Completed
*   **Highlights**:
    *   Implemented `DocumentParserService` with Azure OpenAI (GPT-4) integration.
    *   Verified Traditional Chinese parsing accuracy.
    *   Created PDF text extraction pipeline using `pypdf`.
    *   Implemented `/api/v1/documents/upload` with background processing tasks.

## [2026-02-09] Task-BE-002: 認證與授權服務
*   **Status**: ✅ Completed
*   **Highlights**:
    *   Implemented `get_current_user` dependency with Supabase Auth verification.
    *   Added `python-jose` for JWT handling.
    *   Created `/api/v1/auth/me` endpoint.
    *   Configured API Router structure.

## [2026-02-09] Task-DB-001: 資料庫設計與遷移
*   **Status**: ✅ Completed
*   **Highlights**:
    *   Designed core schema: `profiles`, `projects`, `documents`, `deadline_events`.
    *   Setup Alembic for migration management.
    *   Applied `Initial Schema` migration to Supabase.
    *   Implemented RLS Policies for secure data access.
    *   Created `handle_new_user` trigger for auto-profile creation.
