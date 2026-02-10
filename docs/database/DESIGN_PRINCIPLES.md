# Database Design Principles (PostgreSQL / Supabase)

## Naming Conventions
*   **Tables:** `snake_case` (e.g., `user_projects`).
*   **Primary Keys:** `id` UUIDv4.
*   **Foreign Keys:** `[entity]_id` (e.g., `user_id`).
*   **Dates:** `created_at` (default `now()`), `updated_at`.

## Core Tables (Proposed)
1.  `projects`
    *   `id` (UUID), `name` (text), `description` (text), `status` (text), `created_at` (timestamptz)
2.  `documents`
    *   `id` (UUID), `project_id` (FK), `file_url` (text), `ocr_text` (text), `ai_metadata` (jsonb)
3.  `deadlines`
    *   `id` (UUID), `doc_id` (FK), `title` (text), `due_date` (timestamptz), `assigned_user_id` (FK), `status` (text)
4.  `users`
    *   `id` (UUID), `email` (text), `name` (text), `line_user_id` (text)

## Supabase Specifics
*   **Row Level Security (RLS):** Policies must be configured for data access (e.g., users can only see their project data).
*   **Backups:** Enable Point-in-Time Recovery (PITR).
*   **Migrations:** Use Supabase CLI for managing schema changes (`supabase db diff`).
