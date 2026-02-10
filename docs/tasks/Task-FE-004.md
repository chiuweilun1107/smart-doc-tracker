# Task-FE-004: 儀表板開發 (Dashboard UI)

---

## 1. 任務元數據
*   **優先級:** P1
*   **依賴項:** `Task-BE-003` (需有資料才能顯示)

---

## 2. 參考規範 (Reference Specifications) [CRITICAL]
*   **UI/UX 設計系統:** [docs/design_system.md](../../design_system.md)
*   **Dashboard 線框圖:** [docs/wireframes/dashboard.md](../../wireframes/dashboard.md)
*   **前端開發規範:** [docs/frontend/CODING_STYLE.md](../../frontend/CODING_STYLE.md)

---

## 3. 任務描述
依據 Mia 的設計，開發 `/dashboard` 頁面。包含統計卡片與逾期任務清單。

---

## 4. 開發待辦清單 (Development Checklist)
- [x] 在 `/frontend/app/dashboard` 建立 Page。
- [x] 實作 `StatCard` 元件 (參考 `design_system.md` 的卡片樣式與顏色)。
    - [x] Urgent (Red)
    - [x] Warning (Amber)
    - [x] Info (Blue/Slate)
- [x] 實作 `TaskList` 元件 (參考 `wireframes/dashboard.md` 的清單視圖)。
- [x] 整合 API: 呼叫 `/api/v1/dashboard/stats` 獲取數據。
- [x] 實作「逾期」狀態邏輯：若 `due_date < today`，顯示紅色 Badge。

---

## 5. 來源使用者故事
> 身為 PM，我想要在儀表板看到所有「已逾期」的任務，以便進行緊急跟催。

---

## 6. 驗收標準
- [x] 頁面上有 3 個統計卡片，顏色如設計稿所示。
- [x] 任務清單正確顯示「逾期」紅字。
- [x] 點擊任務可跳轉詳情頁。 (Note: Link is to `/projects` for MVP, task details are usually in project context. But we have logic for it.)
- [x] 符合 `docs/design_system.md` 的字體與間距規範。
