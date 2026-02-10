# Task-BE-007: Line Webhook 處理 (Line Integration)

---

## 1. 任務元數據
*   **優先級:** P1
*   **依賴項:** `Task-BE-006` (需先能發送，才能處理回覆)

---

## 2. 參考規範
*   **設計系統:** [docs/wireframes/line_notification.md](../../wireframes/line_notification.md) (參考互動流程)
*   **API 設計:** [docs/backend/API_DESIGN.md](../../backend/API_DESIGN.md)

---

## 3. 任務描述
實作 Line Webhook Endpoint，處理使用者在 Line 上的互動 (Postback Events)。
主要處理：「我已完成」按鈕點擊事件。

---

## 4. 開發待辦清單
- [ ] 實作 `/api/v1/webhooks/line`。
- [ ] 驗證 Line Signature (安全性)。
- [ ] 解析 Postback Data (包含 `task_id`, `action=mark_done`)。
- [ ] 更新資料庫狀態 (`deadline_events.status = 'completed'`).
- [ ] 回覆 Line 訊息 (Reply Message): "已更新狀態"。

---

## 6. 驗收標準
- [ ] 模擬 Postback Event，API 回傳 200 OK。
- [ ] 資料庫中對應的 Task 狀態變為 Completed。
- [ ] Line 手機端收到「更新成功」的回覆。
