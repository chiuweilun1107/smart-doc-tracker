# 支援的文件格式

## 📁 目前支援的格式

系統現在支援以下三種文件格式：

### 1. PDF (.pdf) ✅
- **完全支援**
- 使用 `pypdf` 提取文字
- 支援多頁文件
- 支援表格和格式化文字

### 2. DOCX (.docx) ✅
- **完全支援**
- 使用 `python-docx` 提取文字
- 支援段落、表格、標題
- Microsoft Word 2007 及更新版本的格式

### 3. DOC (.doc) ⚠️
- **有限支援**
- Microsoft Word 97-2003 舊格式
- 建議轉換為 .docx 或 .pdf 以獲得最佳結果
- 某些複雜格式可能無法正確解析

## 🚀 上傳和解析流程

### 步驟 1: 選擇文件
在專案頁面點擊「上傳文件」，選擇以下任一格式：
- `contract.pdf`
- `agreement.docx`
- `proposal.doc`

### 步驟 2: 自動處理
系統會自動執行：

```
1. 文件上傳
   └─ 儲存到 Supabase Storage

2. 文字提取
   ├─ PDF: 使用 pypdf
   ├─ DOCX: 使用 python-docx
   └─ DOC: 使用 docx2txt (有限)

3. AI 智能解析
   └─ Azure OpenAI GPT-4 分析
   └─ 識別截止日期和事件

4. 儲存結果
   └─ 自動建立任務和提醒
```

### 步驟 3: 查看結果
- 在 Dashboard 查看所有截止日期
- 在專案頁面查看文件詳情
- 系統會自動標記逾期任務

## 📊 格式比較

| 格式 | 文字提取準確度 | AI 解析效果 | 推薦度 |
|------|--------------|------------|--------|
| PDF  | ⭐⭐⭐⭐⭐    | ⭐⭐⭐⭐⭐   | 推薦 |
| DOCX | ⭐⭐⭐⭐⭐    | ⭐⭐⭐⭐⭐   | 推薦 |
| DOC  | ⭐⭐⭐       | ⭐⭐⭐      | 建議轉換 |

## 💡 最佳實踐

### 1. 選擇合適的格式
- ✅ **推薦**: PDF 或 DOCX
- ⚠️ **避免**: DOC (舊格式)

### 2. 文件品質
- 確保文件是文字型（非掃描影像）
- 掃描的 PDF 需要先進行 OCR 處理
- 避免過度複雜的排版

### 3. 檔案大小
- 建議 < 10MB
- 過大的文件可能需要較長處理時間

### 4. 內容結構
清晰的日期格式有助於 AI 解析：
- ✅ `2026-03-15`
- ✅ `2026年3月15日`
- ✅ `March 15, 2026`
- ⚠️ `下週五` (相對日期可能不準確)

## 🔧 技術細節

### 文字提取實作

**PDF 提取:**
```python
from pypdf import PdfReader

reader = PdfReader(file)
for page in reader.pages:
    text += page.extract_text()
```

**DOCX 提取:**
```python
from docx import Document

doc = Document(file)
for paragraph in doc.paragraphs:
    text += paragraph.text
```

**DOC 提取:**
```python
import docx2txt

text = docx2txt.process(file)
# 有限支援，建議轉換為 DOCX
```

## ⚠️ 已知限制

### DOC 格式限制
- 舊版 Word 格式（1997-2003）
- 需要外部工具完整支援
- 建議使用以下方式轉換：
  1. Microsoft Word: 另存為 `.docx`
  2. Google Docs: 上傳後下載為 `.docx`
  3. LibreOffice: 開啟後匯出為 `.docx`

### 掃描文件
- **不支援**純影像 PDF
- 需要先使用 OCR 工具處理：
  - Adobe Acrobat Pro
  - Google Drive (自動 OCR)
  - Online OCR 服務

### 受保護文件
- **不支援**加密或密碼保護的文件
- 請先移除保護再上傳

## 🎯 未來計劃

計劃支援的格式：
- [ ] **Excel** (.xlsx, .xls) - 表格資料解析
- [ ] **PowerPoint** (.pptx) - 簡報內容提取
- [ ] **純文字** (.txt) - 基本文字文件
- [ ] **RTF** (.rtf) - 富文本格式
- [ ] **ODT** (.odt) - OpenDocument 文字
- [ ] **影像 OCR** - 掃描文件自動 OCR

## 🆘 故障排除

### 上傳失敗
**錯誤**: "Unsupported file type"
- 檢查文件副檔名是否正確
- 確認文件沒有損壞
- 嘗試轉換為 PDF 或 DOCX

### 文字提取失敗
**錯誤**: "Failed to extract text"
- 檢查是否為掃描 PDF（需要 OCR）
- 嘗試用其他軟體重新儲存文件
- 確認文件沒有加密

### AI 解析無結果
**狀態**: "completed" 但沒有事件
- 文件可能沒有包含明確的日期資訊
- 嘗試使用更清晰的日期格式
- 檢查文件內容是否正確提取

## 📞 需要協助？

如果遇到問題：
1. 查看文件狀態（processing/completed/error）
2. 檢查後端日誌：`tail -f /tmp/backend.log`
3. 嘗試轉換文件格式
4. 聯繫技術支援

## 🔄 版本歷史

- **v1.2** (2026-02-11): 新增 DOCX 和 DOC 支援
- **v1.1** (2026-02-10): 優化 PDF 文字提取
- **v1.0** (2026-02-01): 初始版本，支援 PDF
