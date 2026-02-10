# 專案任務看板 (Project Task Board)

**狀態圖示說明 (Status Legend):**
*   ⚪️ `pending` (尚未開始)
*   🔵 `in_progress` (進行中)
*   ✅ `completed` (已完成)
*   🚧 `blocked` (被阻擋)
*   🔗 `decomposed` (已拆解為子任務)
*   🔴 `needs_rework` (審查失敗，需要返工)

| 狀態 | 優先級 | 任務ID | 任務描述 | 依賴項 | 詳細內容 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| ✅ | **最高** | `Task-Bootstrap-000` | **專案初始化 (Project Initialization)**<br>Next.js + FastAPI + Supabase 基礎架構搭建 | - | [查看](./tasks/Task-Bootstrap-000.md) |
| ✅ | 高 | `Task-DB-001` | **資料庫設計與遷移 (Database Schema)**<br>設計 User/Project/Doc 表結構與 RLS | `Task-Bootstrap-000` | [查看](./tasks/Task-DB-001.md) |
| ✅ | 高 | `Task-BE-002` | **認證與授權服務 (Auth Service)**<br>Supabase Auth 整合與 User Profile API | `Task-DB-001` | [查看](./tasks/Task-BE-002.md) |
| ✅ | 高 | `Task-BE-003` | **文件上傳與解析服務 (Doc Parsing)**<br>S3 上傳與 OCR/LLM 解析日期邏輯 | `Task-BE-002` | [查看](./tasks/Task-BE-003.md) |
| ✅ | 中 | `Task-FE-009` | **專案列表頁 (Project Listing UI)**<br>顯示所有專案卡片與新增入口 | `Task-BE-002` | [查看](./tasks/Task-FE-009.md) |
| ✅ | 中 | `Task-FE-004` | **儀表板開發 (Dashboard UI)**<br>依據設計稿實作清單視圖與統計卡片 | `Task-BE-003` | [查看](./tasks/Task-FE-004.md) |
| ✅ | 中 | `Task-FE-005` | **專案與文件校對頁 (Project Detail UI)**<br>雙欄式校對介面與事件確認功能 | `Task-BE-003` | [查看](./tasks/Task-FE-005.md) |
| ✅ | 中 | `Task-BE-006` | **通知排程與發送服務 (Notification)**<br>實作排程檢查期限並發送 Email/Line | `Task-BE-003` | [查看](./tasks/Task-BE-006.md) |
| ⚪️ | 中 | `Task-BE-007` | **Line Webhook 處理 (Line Integration)**<br>處理 Line Flex Message 回調互動 | `Task-BE-006` | [查看](./tasks/Task-BE-007.md) |
| ⚪️ | 低 | `Task-BE-008` | **系統設定 API (System Settings)**<br>Line ID 綁定與通知規則管理 | `Task-DB-001` | [查看](./tasks/Task-BE-008.md) |
| ⚪️ | 低 | `Task-FE-010` | **設定頁面 (Settings UI)**<br>Line 綁定介面與規則設定 | `Task-BE-008` | [查看](./tasks/Task-FE-010.md) |
