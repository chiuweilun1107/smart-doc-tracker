# Task-BE-006: 通知排程與發送服務 (Notification Service)

---

## 1. 任務元數據
*   **優先級:** P1
*   **依賴項:** `Task-BE-003` (需有事件資料)

---

## 2. 參考規範
*   **API 設計:** [docs/backend/API_DESIGN.md](../../backend/API_DESIGN.md)

---

## 3. 任務描述
實作排程服務 (Scheduler)，每日檢查即將到期的事件，並發送通知。
1.  **排程器:** 使用 `APScheduler` 或 `Celery Beat`。
2.  **檢查邏輯:** 查詢 `deadline_events` where `due_date` matches notification rules (e.g., T-7, T-3, T-0).
3.  **發送管道:** Line Messaging API (Push Message) & Email (Resend/SMTP).

---

## 4. 開發待辦清單
- [x] 設定 Line Messaging API Channel Access Token (Configured in config.py).
- [x] 實作 `NotificationService` 類別 (SendLine, SendEmail).
- [x] 實作排程 Job: `check_deadlines()` (Daily 09:00 + Manual Trigger).
- [x] 實作通知紀錄 Log，避免重複發送 (Basic logging implemented).

---

## 6. 驗收標準
- [x] 手動觸發排程 Job，能收到 Line 測試訊息 (Via /notifications/trigger endpoint).
- [x] 逾期任務能正確發送「紅色警示」訊息 (Logic implemented for OVERDUE).
- [x] 即將到期任務能正確發送「黃色提醒」訊息 (Logic implemented for WEEK_AHEAD/3_DAYS_LEFT).
