# Smart Doc Deadline Tracker - 設計系統 (Design System)

## 1. 核心理念 (Philosophy)
*   **Professional Trust (專業信任):** 使用冷靜的藍色與灰色調，傳遞可靠與穩定的數據管理感。
*   **Deadline Driven (期限驅動):** 通過色彩與圖標明確區分「安全」、「警告」與「緊急」狀態，引導用戶優先處理即將到期的事務。
*   **Clean Efficiency (清晰高效):** 減少不必要的裝飾，專注於資訊層級與操作流暢度。

## 2. 色彩系統 (Color Palette)

### 主色 (Primary) - 用於導航、核心按鈕、強調文字
*   **Primary 900:** `#0f172a` (Slate-900) - 用於導航欄、標題
*   **Primary 600:** `#2563eb` (Blue-600) - 用於主要按鈕 (CTA)、連結
*   **Primary 100:** `#dbeafe` (Blue-100) - 用於選中狀態背景、圖標背景

### 狀態色 (Status) - 用於期限警示與任務狀態
*   **Success (完成/安全):** `#16a34a` (Green-600) / 背景 `#dcfce7` (Green-100)
    *   *用途*: 已結案任務、還有 14 天以上期限。
*   **Warning (注意/即將到期):** `#d97706` (Amber-600) / 背景 `#fef3c7` (Amber-100)
    *   *用途*: 期限剩餘 3-7 天。
*   **Critical (緊急/逾期):** `#e11d48` (Rose-600) / 背景 `#ffe4e6` (Rose-100)
    *   *用途*: 期限剩餘 < 3 天、已逾期。

### 中立色 (Neutral) - 用於文字、背景、邊框
*   **Text Primary:** `#0f172a` (Slate-900) - 主要內容文字
*   **Text Secondary:** `#64748b` (Slate-500) - 次要資訊、標籤
*   **Border:** `#e2e8f0` (Slate-200) - 分隔線、卡片邊框
*   **Background:** `#f8fafc` (Slate-50) - 頁面背景
*   **Surface:** `#ffffff` (White) - 卡片与內容區域背景

## 3. 字體系統 (Typography)

### 字體家族
*   **系統字體 (System UI):** `Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, `Helvetica Neue`, `Arial`.
*   **數據與代碼 (Monospace):** `JetBrains Mono`, `ui-monospace`, `SFMono-Regular`. (用於日期、金額、ID)

### 字級規範 (Type Scale)
*   **H1 (頁面標題):** 24px (1.5rem) / Bold / Leading-tight
*   **H2 (區塊標題):** 20px (1.25rem) / Semibold / Leading-snug
*   **H3 (卡片標題):** 16px (1rem) / Semibold
*   **Body (正文):** 14px (0.875rem) / Regular / Leading-normal
*   **Small (輔助文字):** 12px (0.75rem) / Regular / Text-slate-500

## 4. 元件規範 (Component Guidelines)

### 按鈕 (Buttons)
*   **Primary Button:**
    *   Bg: `Blue-600`, Text: `White`, Radius: `rounded-md`
    *   Hover: `Blue-700`, Active: `Blue-800`
    *   *用途*: 登入、提交表單、確認操作
*   **Secondary Button:**
    *   Bg: `White`, Text: `Slate-700`, Border: `Slate-300`, Radius: `rounded-md`
    *   Hover: `Slate-50`
    *   *用途*: 取消、返回、次要操作
*   **Danger Button:**
    *   Bg: `Rose-600`, Text: `White`
    *   *用途*: 刪除專案、撤銷任務

### 卡片 (Cards)
*   **Style:** `bg-white`, `border border-slate-200`, `rounded-lg`, `shadow-sm`
*   **Hover:** 用於可點擊卡片，`hover:shadow-md`, `transition-shadow duration-200`

### 狀態標籤 (Badges)
*   **Style:** `inline-flex`, `items-center`, `px-2.5 py-0.5`, `rounded-full`, `text-xs`, `font-medium`
*   **Example (逾期):** `bg-rose-100 text-rose-800`

### 表單 (Forms)
*   **Input:** `border-slate-300`, `rounded-md`, `focus:ring-2 focus:ring-blue-500 focus:border-blue-500`
*   **Error State:** `border-rose-500`, `focus:ring-rose-500`, 輔助文字顯示紅色錯誤訊息

## 5. 佈局與柵格 (Layout & Grid)
*   **Container:** `max-w-7xl`, `mx-auto`, `px-4 sm:px-6 lg:px-8`
*   **Grid:** 常用 `grid-cols-12`，間距 `gap-4` 或 `gap-6`
*   **Sidebar Navigation:** 固定左側 (Desktop) 或 漢堡選單 (Mobile)

## 6. 無障礙設計 (Accessibility / A11y)
*   **對比度:** 確保所有文字與背景對比度 >= 4.5:1。
*   **顏色依賴:** 狀態不應只靠顏色區分，必須搭配文字 (如 "逾期") 或圖標 (⚠️)。
*   **鍵盤導航:** 所有互動元件 (按鈕、輸入框、選單) 必須可通過 `Tab` 鍵聚焦 (Focus Ring 必須清晰)。
