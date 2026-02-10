# Dashboard Wireframe (儀表板)

## 1. 頁面概述
*   **路徑:** `/dashboard`
*   **目標:** 讓 Project Manager 和 User 一眼掌握當前的緊急任務，並快速進行處理。
*   **佈局:** 頂部導航 + 左側側邊欄 (Desktop) + 主要內容區。

## 2. 佈局結構 (Layout Structure)

### 2.1 頂部導航欄 (Top Navbar)
*   **Left:** "Smart Tracker" Logo
*   **Right:**
    *   [Notification Bell] (含未讀紅點)
    *   [User Avatar] -> Dropdown (Profile, Settings, Logout)

### 2.2 側邊欄導航 (Sidebar)
*   **Menu Items:**
    *   [Dashboard] (Active State: `bg-slate-100 text-blue-600`)
    *   [Projects]
    *   [My Tasks]
    *   [Team] (Admin only)
    *   [Settings]

### 2.3 主要內容區 (Main Content)

#### A. 迎賓與摘要區 (Header & Stats)
*   **Title:** "Good morning, [User Name] 👋"
*   **Stats Cards (橫向排列):**
    1.  **Card: Urgent / Overdue**
        *   Icon: 🚨 (Red)
        *   Value: "3" (Red Text)
        *   Label: "Tasks Overdue"
        *   Bg: `bg-rose-50`
    2.  **Card: Due This Week**
        *   Icon: 📅 (Amber)
        *   Value: "8"
        *   Label: "Due within 7 days"
        *   Bg: `bg-amber-50`
    3.  **Card: Pending Review**
        *   Icon: 📝 (Blue)
        *   Value: "12"
        *   Label: "Docs to Parse"
        *   Bg: `bg-slate-50`

#### B. 任務視圖切換 (View Switcher)
*   **Tabs:**
    *   `[List View]` (Default, Active)
    *   `[Calendar View]`
*   **Filters:**
    *   Dropdown: [All Projects | Project A | Project B]
    *   Toggle: [Show Completed] (Default: Off)

#### C. 任務清單 (Task List - List View)
*   **Table Header:** Status | Due Date | Task Name | Project | Assignee | Actions
*   **Row Item (Example: Urgent):**
    *   **Status:** 🔴 Badge "Overdue"
    *   **Due Date:** "2023-10-25" (Red Text, Monospace Font)
    *   **Task Name:** "Stage 1 Payment Milestone"
        *   Subtext: "Contract: #CT-2023-001"
    *   **Project:** "Alpha Revamp"
    *   **Assignee:** [Avatar] "John Doe"
    *   **Actions:**
        *   [Btn: Line Remind] (Send Line notification immediately)
        *   [Btn: Mark Done]
        *   [Btn: Edit] (Three-dot menu)

*   **Row Item (Example: Upcoming):**
    *   **Status:** 🟡 Badge "Due in 3 Days"
    *   **Due Date:** "2023-11-02"
    *   ...

#### D. 行事曆視圖 (Calendar View - Optional)
*   **FullCalendar Component:**
    *   顯示月視圖。
    *   日期格子內顯示任務小圓點 (紅/黃/綠)。
    *   點擊日期，右側滑出 (Slide-over) 顯示該日任務清單。

## 3. 互動邏輯 (Interactions)
*   **點擊 "Line Remind":** 彈出確認 Modal，確認發送訊息內容預覽，點擊「發送」後顯示 Toast "Notification Sent"。
*   **點擊 "Task Name":** 跳轉至 `/projects/[id]/tasks/[taskId]` 詳情頁。
*   **點擊 "Mark Done":** 任務列淡出或劃線，狀態即時更新為 ✅ Completed，並從當前「未完成」視圖中移除 (除非 Filter 開啟)。
