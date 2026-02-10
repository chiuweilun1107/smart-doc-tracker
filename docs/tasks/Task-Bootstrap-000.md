# Task-Bootstrap-000: 專案初始化 (Project Initialization)

---

## 1. 任務元數據 (Metadata)
*   **優先級 (Priority):** 最高 (P0)
*   **難易度 (Difficulty):** 低
*   **依賴項 (Dependencies):** 無

---

## 2. 參考規範 (Reference Specifications)
*   **專案藍圖:** [PROJECT_BLUEPRINT.md](../../PROJECT_BLUEPRINT.md)
*   **開發環境建置:** [docs/SETUP_GUIDE.md](../../SETUP_GUIDE.md)
*   **目錄架構:** [docs/architecture/DIRECTORY_STRUCTURE.md](../../architecture/DIRECTORY_STRUCTURE.md)

---

## 3. 任務描述 (Description)
建立專案的基礎目錄結構，並初始化 Next.js (Frontend) 與 Python FastAPI (Backend) 環境。同時確認 Supabase 專案連接設定。

### 3.1 執行目標
*   建立 `/frontend` (Next.js 14 App Router)
*   建立 `/backend` (Python FastAPI)
*   建立 `project.config.yaml` 驗證機制

---

## 4. 開發待辦清單 (Development Checklist)
- [x] 執行 `npx create-next-app@latest frontend --typescript --tailwind --eslint` (參照藍圖 Next.js 14+)。
- [x] 在 `/frontend` 安裝 `shadcn-ui` 並初始化 (`npx shadcn-ui@latest init`)。 (Manual installation due to network issue)
- [x] 建立 `/backend` 目錄，並建立 Python 虛擬環境 (`python -m venv venv`)。
- [x] 在 `/backend` 建立 `requirements.txt` 並安裝 `fastapi uvicorn sqlalchemy asyncpg bitsandbytes python-multipart`。
- [x] 在 `/backend` 建立 `main.py` 作為 API 入口點 (Hello World)。
- [x] 設定根目錄的 `.gitignore` (包含 `node_modules`, `venv`, `.env`, `__pycache__`)。
- [x] 驗證 `npm run dev` (Frontend) 與 `uvicorn main:app --reload` (Backend) 可成功啟動。

---

## 5. 來源使用者故事 (Source User Story)
> (非使用者故事，屬技術基礎建設)

---

## 6. 驗收標準 (Acceptance Criteria)
- [x] `/frontend/package.json` 存在且包含 `next`, `react`, `tailwindcss`。
- [x] `/backend/main.py` 存在且包含 FastAPI 實例。
- [x] 執行 `npm run dev` 後，訪問 `http://localhost:3000` 可看到 Next.js 歡迎頁。
- [x] 執行後端啟動指令後，訪問 `http://localhost:8000/docs` 可看到 Swagger UI。
- [x] 專案根目錄包含正確的 `.gitignore` 檔案。

---

## 7. 完成後續動作 (Post-completion Actions)
*   更新 `docs/CHANGELOG.md`。
