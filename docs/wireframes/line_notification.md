# Line Notification Wireframe (Line 通知樣式)

## 1. 概述
*   **平台:** Line App (Mobile / Desktop)
*   **目標:** 清楚傳達緊急度，並提供直接的操作入口 (Action Buttons)，減少用戶跳轉網頁的頻率。

## 2. Flex Message 設計

### 類型 A: 期限提醒 (Deadline Reminder)

#### Header (頂部色條)
*   **Color:** 依據緊急度變化
    *   🔴 `Rose-600` (逾期/緊急)
    *   🟡 `Amber-500` (即將到期)
*   **Text:** "⚠️ 任務即將到期" 或 "🚨 任務已逾期"

#### Bodry (內容區)
*   **Project:** "專案: Alpha Revamp" (粗體, Size: sm, Color: Slate-500)
*   **Task:** "第一階段驗收交付" (粗體, Size: lg, Color: Slate-900)
*   **Target Date:** "2023-11-05 (週五)" (Size: xl, Color: Rose-600, Align: Center)
*   **Countdown:** "剩餘 3 天" (Size: md, Color: Slate-500, Align: Center)
*   **Description:** "請確認所有驗收文件已上傳至雲端硬盤，並通知客戶窗口。" (Size: sm, Color: Slate-500, Wrap: True)

#### Footer (操作區)
*   **Button 1 (Primary):** "✅ 我已完成 (Mark Done)"
    *   *Action:* Postback Event -> Update DB status -> Reply "收到，已更新狀態。"
*   **Button 2 (Secondary):** "👀 查看詳情"
    *   *Action:* URI Link -> Open Web Dashboard details page
*   **Button 3 (Tertiary):** "延後提醒 (Snooze 1 day)"
    *   *Action:* Postback Event -> Reschedule notification

### 類型 B: 每日摘要 (Daily Digest)

#### Header
*   **Color:** `Blue-600`
*   **Text:** "📅 今日任務摘要"

#### Body
*   **List Item 1:**
    *   "🔴 [逾期] 合約用印申請 (Client A)"
*   **List Item 2:**
    *   "🟡 [今天] 會議記錄發送 (Project B)"
*   **List Item 3:**
    *   "🟢 [3天後] 備料確認"

#### Footer
*   **Button:** "前往儀表板查看全部"

## 3. 互動流程 (Interaction Flow)

1.  **User 收到通知 (Type A)**
2.  **User 點擊 "✅ 我已完成"**
3.  **Line Bot 回覆:** loading animation... (Webhooks processing)
4.  **Line Bot 回覆 (Success):**
    > "👍 辛苦了！已將「第一階段驗收交付」標記為完成。"
    > (包含一個隨機的鼓勵貼圖，增加親切感)

5.  **User 點擊 "延後提醒"**
6.  **Line Bot 回覆:**
    > "👌 了解。將在明天同一時間再次提醒您。"
