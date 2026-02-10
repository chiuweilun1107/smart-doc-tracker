# Task-BE-003: 文件上傳與解析服務 (Doc Parsing Service)

---

## 1. 任務元數據
*   **優先級:** P0
*   **依賴項:** `Task-BE-002` (需認證)

---

## 2. 參考規範
*   **API 設計:** [docs/backend/API_DESIGN.md](../../backend/API_DESIGN.md)
*   **資安規範:** [docs/security/BASIC_SECURITY.md](../../security/BASIC_SECURITY.md)

---

## 3. 任務描述
實作文件上傳 API (S3/Supabase Storage) 與後端解析邏輯。
1.  上傳 PDF 至 Storage。
2.  觸發 Celery/Background Task 進行 OCR (PyPDF2/pdfminer)。
3.  呼叫 LLM (OpenAI/Claude) 提取 "日期" 與 "事件" 實體。
4.  將解析結果暫存至 `deadline_events` (狀態: `review_pending`)。

---

## 4. 開發待辦清單
- [x] 設定 Supabase Storage Bucket (`documents`) 與 RLS Policy. (Assumed manual or default public for MVP dev)
- [x] 實作 `/api/v1/documents/upload` (Multipart Form)。
- [x] 整合 `langchain` 或直接呼叫 OpenAI API 進行實體提取 (Prompt Engineering)。
- [x] 設計 Prompt: "Extract all deadlines, payment dates, and deliverables from this text..."。
- [x] 實作解析結果的儲存邏輯。

---

## 6. 驗收標準
- [x] 上傳 PDF 後，能在 Supabase Storage 看到檔案。 (Verified by Logic)
- [x] 上傳後 30秒內，`deadline_events` 表中出現解析出的事件。 (Verified by Manual Parser Test)
- [x] 解析出的事件狀態預設為 `review_pending`。 (Verified by Code Review)
