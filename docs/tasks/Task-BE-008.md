# Task-BE-008: 系統設定與通知規則 API (System Settings API)

---

## 1. 任務元數據
*   **優先級:** P2 (非 MVP 核心，但重要)
*   **依賴項:** `Task-DB-001`

---

## 3. 任務描述
實作系統設定相關 API，允許管理員設定全域通知規則 (e.g., T-7, T-3) 和管理 Line User ID 綁定。

---

## 4. 開發待辦清單
- [ ] 實作 `/api/v1/settings/rules` (CRUD 通知規則)。
- [ ] 實作 `/api/v1/users/line-binding` (綁定 Line ID)。
- [ ] 實作使用者列表管理 API (Admin only)。

---

## 6. 驗收標準
- [ ] 管理員可新增一條 "T-14" 的通知規則。
- [ ] 使用者可查詢自己的 Line 綁定狀態。
