# Project Detail & Document Review Wireframe (專案詳情與文件校對)

## 1. 頁面概述
*   **路徑:** `/projects/[id]`
*   **目標:** 提供一個整合介面，讓 PM 上傳文件、校對 AI 解析結果，並管理專案內的所有期限事件。
*   **模式:** 雙欄對照模式 (Split Pane)。

## 2. 佈局結構

### 2.1 頁面標頭 (Page Header)
*   **Breadcrumb:** Dashboard > Projects > [Project Name]
*   **Title:** [Project Name] (e.g., "Alpha Revamp Websiste")
*   **Actions (Right):**
    *   [Btn: Upload Document] (Primary)
    *   [Btn: Project Settings] (Secondary)

### 2.2 內容區域 (Split View Container)

#### 左欄：文件預覽區 (Document Viewer - 50%)
*   **Header:**
    *   Dropdown: [Select Document] (切換專案內的不同文件)
    *   Tools: [Zoom In] [Zoom Out] [Fit Width]
*   **Viewer:**
    *   PDF/Docx 渲染區域。
    *   **Highlight Layer:** 當右側選中某個提取出的事件時，左側對應的原始文字區域應顯示黃色高亮框。

#### 右欄：事件與解析結果 (Events & Parsed Data - 50%)
*   **Tab 1: Extracted Events (AI 解析結果)**
    *   **Alert Box:** "AI parsed 5 events found. Please review and confirm."
    *   **Event Card (Pending Review):**
        *   **Input: Event Title** (e.g., "驗收交付日")
        *   **Input: Date** (e.g., "2023-12-31") - *AI Confidence Score: 98% (Green)*
        *   **Input: Assignee** (Dropdown select user)
        *   **Input: Notification Rule** (e.g., "Standard: T-7, T-1")
        *   **Actions:** [Confirm ✅] [Delete 🗑️]
    *   **Interaction:** 當 Focus 在 "Date" 輸入框時，左側 PDF 自動捲動並高亮該日期的來源位置。

*   **Tab 2: Project Info (基本資訊)**
    *   專案描述、成員列表、通知預設規則設定。

## 3. 關鍵流程 (Key Flows)

### A. 文件上傳與解析流程
1.  點擊 "Upload Document"。
2.  Drag & Drop PDF 文件。
3.  顯示 Progress Bar: "Uploading..." -> "Processing with AI..."。
4.  完成後，自動切換到 "Extracted Events" Tab，並顯示 AI 抓到的事件卡片列表。

### B. 事件確認流程
1.  PM 點擊第一個事件卡片的 "Date" 欄位。
2.  左側 PDF 自動跳轉到第 5 頁，高亮 "2023年12月31日" 字樣。
3.  PM 確認無誤，點擊 [Confirm]。
4.  卡片變為 "Active" 狀態 (綠色邊框)，並加入正式的通知排程。
5.  若日期錯誤，PM 手動修正日期，點擊 [Confirm]。

## 4. 響應式設計 (Responsive)
*   **Desktop:** 左右 split view 並排。
*   **Mobile:**
    *   隱藏左側 PDF 預覽，只顯示右側事件列表。
    *   點擊事件旁的 "View Source" 按鈕，彈出 Modal 顯示 PDF 截圖或文字片段。
