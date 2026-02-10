# PROJECT_REQUIREMENTS.md

---

## 1. 專案總覽 (Project Overview)

### 專案名稱 (Project Name)
**智能文件期限追蹤管理系統 (Smart Doc Deadline Tracker)**

### 專案背景 (Background)
公司內部日常運作中產生大量文件（如標案合約、會議記錄、需求說明書等），其中包含許多關鍵的截止日期（驗收日、付款日、交付日）。目前依賴人工識別與紀錄，容易發生疏漏，導致違約或專案延宕風險。

### 核心目標 (Goals / Objectives)
1.  **自動化解析**: 透過 AI/OCR 技術自動從上傳的文件（PDF, Word）中提取關鍵事件與截止日期。
2.  **多管道主動通知**: 系統依據提取的日期，透過 **Line** 與 **Email** 自動發送提醒給相關人員，確保訊息不漏接。
3.  **雙向互動**: 接收通知的人員可透過 Line 直接回覆（如：回報進度或確認收到），系統即時更新狀態。
4.  **彈性規則**: 支援自定義通知頻率與時間點（例如：針對緊急專案設定每日提醒，或自訂 "T-14, T-7, T-1" 規則）。
5.  **集中管理**: 提供 Web 管理後台，總覽所有專案進度與文件期限。

### 範圍定義 (Scope Definition)
*   **範圍內 (In-Scope):**
    *   Web 管理介面 (Dashboard, 專案管理, 文件上傳)。
    *   文件解析引擎 (支援 PDF/Word 轉文字 + LLM 實體提取)。
    *   **多管道通知服務**:
        *   Line Messaging API (推播與 Webhook 接收)。
        *   SMTP/Email Service (如 SendGrid/Resend) 發送郵件通知。
    *   **彈性通知規則引擎**: 允許用戶針對不同專案或事件設定客製化的提醒時間點。
    *   使用者/權限管理 (公司內部員工)。
*   **範圍外 (Out-of-Scope):**
    *   外部客戶存取權限 (僅限內部使用)。
    *   複雜的公文簽核流程 (僅專注於期限追蹤)。

---

## 2. 使用者角色 (User Personas)

### 角色一：專案經理 (Project Manager)
*   **描述**: 主要操作者。負責建立專案、上傳合約文件、校對 AI 解析出的日期是否正確，並指派負責人員。
*   **痛點**: 文件太多，常忘記設行事曆提醒；手動 Key-in 日期很花時間；擔心 Line 訊息被洗版，希望重要事項也能有 Email 留底。

### 角色二：一般員工 (Task Owner)
*   **描述**: 被指派任務的執行者。
*   **需求**: 不需要一直登入系統，希望能直接在 Line 上收到提醒並簡單回報；也希望能在信箱收到詳細的任務內容備份。

### 角色三：系統管理員 (Admin)
*   **描述**: 負責維護員工名單、Line ID 綁定與系統參數設定。

---

## 3. 資訊架構與頁面規劃 (Information Architecture)

### 網站地圖 (Sitemap)
*   **登入頁 (Login)**
*   **儀表板 (Dashboard)**
    *   近期截止任務清單 (Today / This Week)
    *   逾期任務警示
*   **專案管理 (Projects)**
    *   專案列表
    *   **專案詳情頁**
        *   基本資訊
        *   文件上傳區 (Drag & Drop)
        *   **期限事件列表 (Event List)**: 顯示 AI 解析結果，支援手動編輯/新增。
*   **人員管理 (Users)**
    *   員工列表 (綁定 Line User ID)
*   **系統設定 (Settings)**
    *   **通知規則設定 (Notification Rules)**:
        *   預設規則模板 (e.g., 標準: T-7, T-3, T-0)
        *   **自定義規則**: 允許針對特定專案或緊急程度，設定任意天數的組合 (e.g., T-30, T-14, T-7, T-1)。
    *   Email SMTP / Line Token 設定
### 核心頁面元件
*   **文件解析校對區**: 左側顯示原始文件預覽，右側顯示 AI 提取出的表單 (事件名稱、日期、負責人)，供使用者快速比對與修正。

---

## 4. 功能史詩與使用者故事 (Epics & User Stories)

### Epic 1: 智能文件解析 (Intelligent Document Parsing)
*   **User Story**: 身為 PM，我想要上傳一份 PDF 合約，以便系統自動列出所有的「驗收日期」和「付款期限」。
    *   *Acceptance Criteria*:
        *   Given 上傳一份標準格式的合約 PDF
        *   Then 系統應在 30 秒內完成解析
        *   And 系統應列出至少 90% 正確的日期實體供確認

### Epic 2: Line 雙向通知 (Line Integration)
*   **User Story**: 身為員工，我想要在 Line 上收到任務即將到期的通知，以便我安排工作。
*   **User Story**: 身為員工，我想要在 Line 通知中點擊「已完成」，以便直接更新系統狀態，不用登入網頁。
    *   *Acceptance Criteria*:
        *   Given 收到 Line 提醒訊息
        *   When 點擊訊息下方的「回報完成」按鈕
        *   Then 系統資料庫該任務狀態更新為 "Completed"
        *   And Line 會話中收到「更新成功」的回覆

### Epic 3: 任務管理與監控 (Task Monitoring)
*   **User Story**: 身為 PM，我想要在儀表板看到所有「已逾期」的任務，以便進行緊急跟催。

---

## 5. 非功能性需求 (Non-Functional Requirements)

*   **準確性**: AI 日期提取的準確率需具備自我信心指數標示，低信心的結果需強調顯示提醒人工確認。
*   **安全性**: 上傳的文件僅供內部解析使用，需考量敏感資料保護。
*   **可擴充性**: 需保留未來擴充 Email 或 Slack 通知的彈性。

---

## 6. 資料模型摘要 (Data Model Summary)

*   **Project**: `id`, `name`, `status`
*   **Document**: `id`, `project_id`, `file_url`, `parsed_content`
*   **DeadlineEvent**: `id`, `doc_id`, `title`, `due_date`, `assigned_user_id`, `status` (Pending, Completed), `source_text` (AI 依據的原文)
*   **User**: `id`, `name`, `line_user_id`, `email`
