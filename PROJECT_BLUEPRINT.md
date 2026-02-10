# 專案藍圖 (Project Blueprint)

**致 AI 模型：**

本文件是此專案的 **唯一真相來源 (Single Source of Truth)** 與 **最高指導原則**。在執行任何開發任務 (`do task`) 或變更請求 (`change request`) 前，您 **必須** 優先讀取並遵循本文件的所有內容與連結，特別是「系統建置指南」與「文件映射地圖」。

---
## 1. 系統架構與技術棧
*   **Frontend:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, Shadcn/UI
*   **Backend:** Python 3.10+, FastAPI, Pydantic, SQLAlchemy/AsyncPG
*   **Database:** Supabase (PostgreSQL), Storage (S3-compatible)
*   **AI/OCR:** OpenAI GPT-4o / Claude 3.5 Sonnet, PyPDF2 / pdfminer.six
*   **Notifications:** Resend (Email), Line Messaging API (Instant Messaging)

---
## 2. 開發規範文件與其他文件的目錄結構
```
docs/
├── architecture/
│   ├── DIRECTORY_STRUCTURE.md    # 系統目錄架構規範
│   └── NAMING_CONVENTION.md      # 文件與資產命名規範
├── frontend/
│   ├── CODING_STYLE.md           # Next.js/TS 風格指南
│   ├── PERFORMANCE.md            # LCP/CLS 優化指南
│   └── ACCESSIBILITY.md          # WCAG 2.1 AA 指南
├── backend/
│   ├── API_DESIGN.md             # FastAPI 設計規範
│   └── TESTING.md                # Pytest 測試策略
├── database/
│   └── DESIGN_PRINCIPLES.md      # Supabase/PostgreSQL 設計原則
├── security/
│   └── BASIC_SECURITY.md         # RLS, Auth, Input Validation
├── performance/
│   └── OPTIMIZATION.md           # 系統效能優化策略
├── testing/
│   └── TEST_STRATEGY.md          # 測試金字塔策略
├── deployment/                   # (預留)
└── tasks/                        # 任務詳情存放處
```

---
## 3. 需求與功能建置 (Feature-to-Document Map)
| 功能需求 (Feature) | 對應規範文件 (Standard Docs) | 具體要求 (Specifics) | 優先級 (Pri) |
| :--- | :--- | :--- | :--- |
| **用戶登入與權限** | `security/BASIC_SECURITY.md`<br>`database/DESIGN_PRINCIPLES.md` | 使用 Supabase Auth + RLS | P0 |
| **專案管理 (CRUD)** | `frontend/CODING_STYLE.md`<br>`backend/API_DESIGN.md` | Shadcn UI 表單, RESTful API | P0 |
| **文件上傳與解析** | `frontend/PERFORMANCE.md`<br>`backend/API_DESIGN.md` | 檔案大小限制, 非同步處理 | P0 |
| **彈性通知規則引擎** | `database/DESIGN_PRINCIPLES.md` | 設計靈活的 JSONB 規則欄位 | P1 |
| **Line/Email 通知** | `backend/API_DESIGN.md` | Webhook 處理, 佇列發送 | P1 |
| **儀表板 (Dashboard)** | `frontend/PERFORMANCE.md`<br>`frontend/ACCESSIBILITY.md` | SSR/ISR 渲染, 圖表無障礙 | P1 |

---
## 4. 開發環境建置指南 (Development Environment Setup Guide)
*   **[點此查看詳細指南](docs/SETUP_GUIDE.md)**
    *   包含 Next.js 初始化、Python venv 設定、Supabase 連接教學。

---
## 5. 服務啟動路徑配置 (Service Startup Path Configuration)

### A. 服務啟動路徑映射表
| 服務 (Service) | 工作目錄 (Cwd) | 啟動指令 (Command) | 預設端口 | 驗證檔案 |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | `/frontend` | `npm run dev` | `3000` | `package.json` |
| **Backend** | `/backend` | `source venv/bin/activate && uvicorn main:app --reload` | `8000` | `main.py`, `requirements.txt` |
| **Database** | (Cloud) | (Managed by Supabase) | `5432` | `.env` |

### B. 路徑驗證機制
*   **前端驗證:** `test -f frontend/package.json && echo "Frontend path valid"`
*   **後端驗證:** `test -f backend/main.py && echo "Backend path valid"`

### C. 故障排除指南
*   **前端啟動失敗:** 檢查 `node_modules` 是否已安裝 (`npm install`)。
*   **後端啟動失敗:** 檢查 `venv` 是否啟用，以及 `.env` 是否包含正確的 `DATABASE_URL`。
*   **資料庫連接失敗:** 確認 Supabase 專案是否暫停 (Paused)，或 IP 是否被擋。

---
## 6. 系統建置指南
本章節為 AI 在執行 `AI plan tasks` 和 `AI do task` 指令時，必須遵循的核心開發流程與行為準則。

### 5.1 任務規劃階段準則 (Task Planning Phase)
*   **高難度任務拆解:** 這是由 `04_TaskCreation_Framework.md` 負責處理的任務規劃環節。當 AI 偵測到高難度任務時，應遵循該框架的指引進行拆解。

### 5.2 任務執行階段準則 (Task Execution Phase)
*   **上下文情境載入 (Context Loading):** 在執行任何任務之前，AI **必須** 首先查閱 `docs/CHANGELOG.md` 文件，以了解先前已完成任務的成果摘要，獲取開發的上下文情境。
*   **服務啟動路徑驗證 (Service Startup Path Validation):** 在執行任何涉及服務啟動的任務之前，AI **必須** 首先查閱 `PROJECT_BLUEPRINT.md` 中的「服務啟動路徑配置」章節，確保在正確的目錄中執行正確的指令。
*   **執行順序與依賴性檢查 (Execution Order & Dependency Check):** AI **必須** 嚴格遵循 `docs/TODO.md` 文件中由上到下的任務排列順序。在執行選定的任務 (Task-ID) 之前，AI **必須** 先查閱其對應的 `docs/tasks/[Task-ID].md` 文件，檢查其依賴項。只有當所有依賴項在 `docs/TODO.md` 中的狀態皆為 `✅ completed` 時，才可繼續執行此任務。
*   **任務生命週期管理 (Task Lifecycle Management):** AI 執行任務時，必須遵循一個嚴格的、包含狀態更新的生命週期。
    *   **啟動任務 (Task Initiation):** 當收到 `AI do task [Task-ID]` 指令後，AI 的**首要行動**必須是將 `docs/TODO.md` 中對應任務的狀態更新為 `🔵 in_progress`。
    *   **執行任務 (Task Execution):**
        *   **待辦清單即時更新:** AI 每完成一項步驟，**必須立即**編輯對應的 `docs/tasks/[Task-ID].md` 文件，將 `[ ]` 更新為 `[x]`。
        *   **服務啟動路徑驗證:** 在執行任何服務啟動指令前，AI **必須** 執行驗證步驟。
        *   **環境/套件變更綁定:** 任何影響環境的變更，**必須** 更新 `docs/SETUP_GUIDE.md` 或 `package.json`。
    *   **驗收標準驗證與報告:** 在宣告任務完成前，AI **必須** 逐項驗證 `驗收標準`，**並將文件中的 `[ ]` 更新為 `[x]`**，同時在對話中展示指令與結果 (`✅ 成功` 或 `❌ 失敗`)。
    *   **移交審查 (Handoff to QA):** 驗證通過後，回報 `"✅ 開發任務 [Task-ID] 已完成，所有驗收標準均已通過驗證。現移交進行程式碼審查。"`
*   **程式碼審查階段 (Code Review Phase):** 主 AI 自動指派 QA 代理進行審查。
*   **完成任務 (Task Completion):** 只有在 QA 審查通過後，主 AI 才可將任務狀態更新為 `✅ completed`，並追加 `docs/CHANGELOG.md`。

---
## 7. 文件映射地圖
| 文件 (Document) | 核心職責 (Core Responsibility) | 路徑 (Path) |
| :--- | :--- | :--- |
| **專案任務看板** | 追蹤所有開發任務的狀態、優先級與依賴關係。 | `docs/TODO.md` |
| **任務詳情目錄** | 存放所有獨立任務的詳細規格文件。 | `docs/tasks/` |
| **變更日誌** | 記錄所有已完成任務的摘要報告。 | `docs/CHANGELOG.md` |
| **目錄架構規範** | 定義專案的完整源碼目錄結構。 | `docs/architecture/DIRECTORY_STRUCTURE.md` |
| **命名規範** | 定義所有文件與資產的命名規則。 | `docs/architecture/NAMING_CONVENTION.md` |
