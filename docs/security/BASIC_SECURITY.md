# Basic Security Guidelines

## Authentication & Authorization
1.  **Identity Provider:** Use Supabase Auth (Email + Password, Magic Link).
2.  **Access Control:** Implement Row Level Security (RLS) policies in PostgreSQL.
    *   Example: `create policy "Users can view own data" on projects for select using (auth.uid() = user_id);`
3.  **API Security:** All backend endpoints (except login/public) must require a valid JWT token.

## Data Protection
1.  **Sensitive Data:** Never store passwords in plain text (Supabase handles hashing).
2.  **Transfers:** Use HTTPS/TLS for all communication.
3.  **Environment Variables:** Store secrets (API Keys, DB URL) in `.env` files, never commit to Git.

## Input Validation
1.  **Frontend:** Validate forms using Zod or React Hook Form before submission.
2.  **Backend:** Use Pydantic models to validate incoming JSON payloads strict typing.
3.  **File Uploads:** Validate file types (PDF/DOCX only) and size limits (e.g., max 10MB) before processing.
