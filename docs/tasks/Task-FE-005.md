# Task-FE-005: 專案與文件校對頁面 (Project Detail & Review UI)

---

## 1. 任務元數據
*   **優先級:** P1
*   **依賴項:** `Task-BE-003` (需文件上傳 API)

---

## 2. 參考規範 (Reference Specifications) [CRITICAL]
*   **設計系統:** [docs/design_system.md](../../design_system.md)
*   **線框圖:** [docs/wireframes/project_detail.md](../../wireframes/project_detail.md)
*   **API 設計:** [docs/backend/API_DESIGN.md](../../backend/API_DESIGN.md)

---

## 3. 任務描述
實作雙欄式校對介面。左側為 PDF 預覽，右側為 AI 解析出的事件表單。

---

## 4. 開發待辦清單
- [x] 建立 `/projects/[id]` 頁面佈局 (Split View)。
- [x] 整合 `react-pdf` 或類似套件實作左側預覽器 (Implemented Placeholder / Basic View for MVP).
- [x] 實作右側 `EventForm` (Ref: EventEditor)。
- [ ] 實作「點擊日期」->「PDF 自動跳轉」的互動邏輯 (Advanced - Planned for V2).
- [x] 實作文件上傳 Drag & Drop 區域。

---

## 6. 驗收標準
- [x] 可以上傳 PDF 並預覽 (Preview is basic).
- [x] 右側表單可編輯 AI 解析出的日期。
- [x] 點擊「確認」後，資料保存至資料庫。
- [x] 雙欄佈局在 Desktop 正常顯示，Mobile 自動切換為單欄。
