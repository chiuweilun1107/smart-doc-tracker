# Task-FE-009: 專案列表頁 (Project Listing UI)

---

## 1. 任務元數據
*   **優先級:** P1
*   **依賴項:** `Task-BE-002`

---

## 2. 參考規範
*   **設計系統:** [docs/design_system.md](../../design_system.md)
*   **前端規範:** [docs/frontend/CODING_STYLE.md](../../frontend/CODING_STYLE.md)

---

## 3. 任務描述
開發 `/projects` 列表頁，顯示所有專案卡片，並提供「新增專案」入口。

---

## 4. 開發待辦清單
- [x] 建立 `/projects` Page。
- [x] 實作 `ProjectCard` 元件 (顯示專案名、狀態、截止任務數)。
- [x] 實作「新增專案」Modal 表單。
- [x] 整合 API `/api/v1/projects`。

---

## 6. 驗收標準
- [x] 顯示專案列表。
- [x] 點擊專案卡片跳轉至 `/projects/[id]`。
- [x] 可成功建立新專案。
