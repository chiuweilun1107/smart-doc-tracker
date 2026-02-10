# Development Setup Guide (開發環境建置指南)

本專案包含兩個核心服務：Frontend (Next.js) 與 Backend (FastAPI)。

## 1. 前端開發環境 (Frontend)
*   **路徑:** `/frontend`
*   **技術棧:** Next.js 14, TypeScript, Tailwind CSS, Shadcn/UI
*   **啟動指令:**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
*   **服務位址:** `http://localhost:3000`

## 2. 後端開發環境 (Backend)
*   **路徑:** `/backend`
*   **技術棧:** Python 3.10+, FastAPI, SQLAlchemy
*   **啟動指令:**
    ```bash
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    uvicorn main:app --reload
    ```
*   **API 文件:** `http://localhost:8000/docs`

## 3. 環境變數 (.env)
請參照 `.env.example` 建立 `.env` 檔案。

```bash
# Backend
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
OPENAI_API_KEY="sk-..."
SUPABASE_URL="https://..."
SUPABASE_KEY="eyJ..."

# Frontend
NEXT_PUBLIC_API_URL="http://localhost:8000"
```
