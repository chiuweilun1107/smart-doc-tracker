# Task-FE-010: 通知規則設定頁 (Settings UI)

---

## 1. 任務元數據
*   **優先級:** P2
*   **依賴項:** `Task-BE-008`

---

## 2. 參考規範
*   **設計系統:** [docs/design_system.md](../../design_system.md)

---

## 3. 任務描述
開發 `/settings` 頁面，供使用者綁定 Line 帳號，供管理員設定通知規則。

---

## 4. 開發待辦清單
- [ ] 建立 `/settings` Page。
- [ ] 實作 Line Binding 區塊 (顯示 QR Code 或 Webhook URL)。
- [ ] 實作 Notification Rules 設定表格。

---

## 6. 驗收標準
- [ ] 使用者可輸入 Line User ID 進行綁定。
- [ ] 管理員可新增/刪除通知規則。
