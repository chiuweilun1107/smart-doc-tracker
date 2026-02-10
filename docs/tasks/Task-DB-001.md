# Task-DB-001: 資料庫設計與遷移 (Database Schema & Migration)

---

## 1. 任務元數據 (Metadata)
*   **優先級 (Priority):** P0
*   **難易度 (Difficulty):** 中
*   **依賴項 (Dependencies):** `Task-Bootstrap-000`

---

## 2. 參考規範 (Reference Specifications)
*   **資料庫設計:** [docs/database/DESIGN_PRINCIPLES.md](../../database/DESIGN_PRINCIPLES.md)
*   **資安規範:** [docs/security/BASIC_SECURITY.md](../../security/BASIC_SECURITY.md)

---

## 3. 任務描述 (Description)
設計並實作 PostgreSQL 資料庫 Schema，包含使用者、專案、文件與期限事件表。並設定 Row Level Security (RLS) 以確保資料安全。

### 3.1 核心表結構
1.  `profiles` (extends auth.users)
2.  `projects`
3.  `documents`
4.  `deadline_events`

---

## 4. 開發待辦清單 (Development Checklist)
- [x] 在 `/backend` 安裝 `alembic` 用於資料庫遷移管理。
- [x] 定義 SQLAlchemy Models (`models.py`) 對應上述 4 張表。
- [x] 撰寫 SQL 遷移腳本 (`alembic revision`)。
- [x] 實作 `profiles` 表的 Trigger，當 `auth.users` 新增時自動建立 profile。
- [x] 設定 RLS Policy: 使用者只能讀取/修改自己參與的專案 (Projects) 與相關文件。
- [x] 在 Supabase 執行遷移並驗證 Table 建立成功。

---

## 5. 來源使用者故事 (Source User Story)
> 作為系統，需儲存專案與期限資料，並確保使用者權限隔離。

---

## 6. 驗收標準 (Acceptance Criteria)
- [x] Supabase 中存在 `deadline_events` 等 4 張表。
- [x] `profiles.id` 是 `auth.users.id` 的 Foreign Key。
- [x] 嘗試使用未授權的 User ID 查詢 `projects` 表應返回空或錯誤 (RLS 驗證)。
- [x] Alembic 遷移腳本可重複執行而不報錯。

---

## 7. 完成後續動作
*   更新 `docs/CHANGELOG.md`。
