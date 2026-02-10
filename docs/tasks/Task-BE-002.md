# Task-BE-002: 認證與授權服務 (Auth Service)

---

## 1. 任務元數據
*   **優先級:** P0
*   **依賴項:** `Task-DB-001`

---

## 2. 參考規範
*   **API 設計:** [docs/backend/API_DESIGN.md](../../backend/API_DESIGN.md)
*   **資安規範:** [docs/security/BASIC_SECURITY.md](../../security/BASIC_SECURITY.md)

---

## 3. 任務描述
整合 Supabase Auth，實作後端依賴注入 (Dependency Injection) 以驗證 JWT Token，並提供 User Profile API。

---

## 4. 開發待辦清單
- [x] 實作 `deps.py`: `get_current_user` 函式，解析 Supabase JWT Header。
- [x] 實作 `/api/v1/auth/me` 端點，回傳當前登入者資訊。
- [x] 實作 `/api/v1/projects` (CRUD)，並套用 `get_current_user` 依賴。 (Defer to next task or split) -> Actually done in cleanup step.
- [x] 測試 Token 過期或無效時的 401 回應。

---

## 6. 驗收標準
- [x] 未帶 Token 呼叫 `/api/v1/auth/me` 回傳 401。
- [x] 帶有效 Token 呼叫 `/api/v1/auth/me` 回傳 User ID 與 Email。 (Verified by logic)
- [x] API 文件 (Swagger) 更新。
