# API Design Guidelines (FastAPI)

## RESTful Principles
1.  **Versioning:** All endpoints must be versioned, e.g., `/api/v1/projects`.
2.  **Resource Naming:** Use nouns (plural), e.g., `/projects`, `/users`.
3.  **HTTP Actions:**
    *   `GET`: Retrieve (No side effects)
    *   `POST`: Create
    *   `PUT/PATCH`: Update
    *   `DELETE`: Delete (Soft deletion preferred)
4.  **Error Handling:** Return structured errors using `HTTPException`.
    *   `400`: Bad Request (Validation Error)
    *   `401`: Unauthorized (Missing/Invalid Token)
    *   `403`: Forbidden (Permission Denied)
    *   `404`: Not Found

## Data Format
*   **Request & Response:** JSON (`content-type: application/json`).
*   **Success Response:** (Optional wrapper, usually direct resource or list)
*   **Validation:** Use `Pydantic` models for strict schema validation.

## Authentication
*   **Bearer Token:** Authorization header with JWT or API Key (Supabase Auth).
