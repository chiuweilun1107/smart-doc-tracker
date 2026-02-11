
# 📖 Smart Doc Tracker - 使用者手冊 (User Guide)

歡迎使用 **Smart Doc Tracker**！這是一套專為政府標案設計的智慧文件追蹤系統，結合 AI 解析與 Line 即時通知，讓您不再錯過任何截止日期。

---

## 🚀 快速上手 (Getting Started)

### 1. 啟動系統
確保您已經啟動了前端與後端服務：

*   **後端 (Backend)**:
    ```bash
    cd backend
    source venv/bin/activate
    uvicorn backend.main:app --reload --port 8000
    ```
*   **前端 (Frontend)**:
    ```bash
    cd frontend
    npm run dev
    ```
    前往 [http://localhost:3000](http://localhost:3000) 即可看到全新的 Landing Page。

---

## 🛠 功能教學

### 1. 登入與註冊
*   點擊首頁右上角的 **[Get Started]** 或 **[Log In]**。
*   輸入您的 Email 進行登入 (目前使用 Supabase Auth)。
*   *(開發環境預設帳號: admin@example.com / password)*

### 2. 建立專案 (Create Project)
*   進入 **Dashboard (儀表板)**，點擊 **[前往專案列表]**。
*   點擊右上角 **[+ 新增專案]**。
*   輸入專案名稱 (例如：「113年 數位發展部 雲端服務案」) 與描述。
*   建立後，點擊專案卡片進入該專案。

### 3. 上傳標案文件 (Upload Documents)
这是系統的核心功能。
*   在專案詳情頁中，找到 **"上傳文件"**區塊。
*   拖拉或選擇您的 PDF 標案文件 (例如：投標須知.pdf)。
*   **AI 解析**: 系統會自動讀取文件內容，識別出關鍵日期 (截止日、開標日等)。
*   **人工校對**: 您可以在右側介面校對 AI 抓取的日期是否正確，並手動修正/新增。

### 4. 綁定 Line 通知 (Line Integration)
為了接收即時通知，請綁定您的 Line 帳號：
1.  前往 **Dashboard** -> **[系統設定] (Settings)** (或點擊儀表板的快速連結)。
2.  在 **Line 帳號綁定** 卡片中，掃描 QR Code 加入機器人好友。
3.  傳送任意訊息給機器人，它會引導您輸入 Email 進行綁定。
4.  綁定成功後，網頁上會顯示「✅ 已連線」。

### 5. 設定通知規則 (Notification Rules)
*   在 **[系統設定]** 頁面，您可以設定何時收到通知。
*   預設規則：截止前 7 天、3 天、1 天、0 天。
*   您可以新增自訂規則，並設定嚴重程度 (Info/Warning/Critical)。

### 6. 接收通知與回報
*   當任務快到期時，您的 Line 會收到 **Flex Message (卡片通知)**。
*   卡片上會有 **[Mark as Completed]** 按鈕。
*   直接在 Line 點擊按鈕，系統就會將該任務標記為「已完成」，無需打開電腦！

---

## ❓ 常見問題
*   **Q: AI 解析不準確怎麼辦？**
    *   A: 雖然我們使用了先進的 LLM，但仍建議人工校對。您可以在上傳後的介面中直接編輯日期。
*   **Q: 收不到 Line 通知？**
    *   A: 請確認您已在 [系統設定] 頁面完成綁定，且該任務的截止日期符合您的通知規則。

---
*© 2024 Smart Doc Tracker Team*
