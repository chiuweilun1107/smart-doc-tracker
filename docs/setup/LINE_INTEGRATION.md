# LINE Messaging API 整合指南

## 1. 建立 LINE Channel
1. 前往 [LINE Developers Console](https://developers.line.biz/console/) 並登入您的 LINE 帳號。
2. 建立一個新的 Provider (如果尚未建立)。
3. 建立一個新的 Channel，選擇 **Messaging API** 類型。
4. 填寫必要的欄位 (Channel name, Description 等)。

## 2. 取得憑證 (Credentials)
登入 Console 後，請點選您剛建立的 Channel，然後依照下列位置尋找：

1.  **Channel Secret**:
    *   位置：**Basic Settings** (基本設定) 分頁。
    *   說明：滑動至頁面中段，會看到 `Channel secret` 欄位。
    *   [官方說明連結](https://developers.line.biz/en/docs/messaging-api/building-bot/#channel-secret)

2.  **Channel Access Token**:
    *   位置：**Messaging API** 分頁。
    *   說明：滑動至頁面最下方，找到 `Channel access token (long-lived)` 欄位，點擊 **Issue** 按鈕產生。
    *   [官方說明連結](https://developers.line.biz/en/docs/messaging-api/building-bot/#issue-channel-access-token)

## 3. 更新環境變數 (.env)
請將取得的憑證填入您的 `.env` 檔案中：
```bash
LINE_CHANNEL_SECRET="您的_channel_secret"
LINE_CHANNEL_ACCESS_TOKEN="您的_channel_access_token"
```

## 4. 取得您的 User ID (開發者測試用)
為了測試通知功能，您需要知道自己的 Line User ID（這不是您的 LINE ID，而是一串 U 開頭的長字串）。
1. 用手機掃描 Messaging API 分頁中的 QR code，將此機器人加為好友。
2. 取得 User ID 的方式：
   - **方法 A (簡易)**: 在 **Basic Settings** 分頁的最下方，找到 "Your User ID" 欄位，這就是您的開發者 User ID。
   - **方法 B**: 等我們完成 Webhook 後，機器人可以回覆您的 ID。

## 5. Webhook 設定 (Task-BE-007)
*本步驟將在 Task-BE-007 中實作，預先說明如下：*
1. 我們將建立一個 Webhook 接收端點： `POST /api/v1/line/webhook`。
2. 若要在本機開發環境測試，需使用 `ngrok` 將 localhost 公開到網際網路：
   ```bash
   ngrok http 8000
   ```
3. 複製 ngrok 產生的 URL (例如：`https://xxxx.ngrok-free.app`)。
4. 回到 LINE Console 的 **Messaging API** 分頁，設定 Webhook URL 為：
   `https://<您的-ngrok-url>/api/v1/line/webhook`
5. 記得開啟 "Use webhook" 選項。
6. 關閉 "Auto-reply messages" (自動回覆) 以免干擾。

## 6. 測試通知功能
當後端伺服器啟動後，您可以使用以下指令手動觸發通知測試 (需先設定好 User ID 到資料庫 Profile 中)：
```bash
curl -X POST http://localhost:8000/api/v1/dashboard/notifications/trigger \
  -H "Authorization: Bearer <您的_JWT_TOKEN>"
```
(或使用瀏覽器打開 `http://localhost:8000/docs` Swagger UI 進行測試)

