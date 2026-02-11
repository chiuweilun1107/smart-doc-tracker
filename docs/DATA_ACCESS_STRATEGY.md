# 資料存取策略 (Data Access Strategy)

## 決策：統一使用 Supabase Client

本專案使用**雲端 Supabase** 作為資料庫，統一採用 **Supabase Python Client** 進行資料存取。

## 架構原則

### 1. API Endpoints (FastAPI)
- **使用**: `Supabase Client`
- **原因**:
  - 直接利用 Supabase RLS (Row Level Security)
  - 減少後端安全邏輯複雜度
  - 自動處理使用者權限
  - 支援即時訂閱 (未來需求)

### 2. 後端服務 (Background Tasks, Webhooks)
- **使用**: `Supabase Client with Service Role Key`
- **原因**:
  - 後端服務需要繞過 RLS
  - 統一的資料存取介面
  - 避免維護兩套連線機制

### 3. SQLAlchemy 的角色
- **保留用途**: 僅用於 Alembic Migrations
- **不使用於**: Runtime 資料存取
- **原因**: Supabase 提供完整的資料庫管理介面

## 實作指南

### API Endpoints 範例

```python
from backend.core.config import settings
from backend.core import deps
from supabase import create_client

# 使用 Service Role Key (繞過 RLS)
supabase = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_SERVICE_ROLE_KEY
)

@router.get("/items")
def get_items(current_user = Depends(deps.get_current_user)):
    # 手動過濾 user_id (因為我們使用 Service Role Key)
    response = supabase.table("items")\
        .select("*")\
        .eq("user_id", str(current_user.id))\
        .execute()
    return response.data
```

### 後端服務範例

```python
from backend.core.config import settings
from supabase import create_client

# 初始化 Service Role Client
supabase = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_SERVICE_ROLE_KEY
)

class NotificationService:
    def send_notification(self, user_id, message):
        # 使用 Service Role Key，可以存取所有資料
        profile = supabase.table("profiles")\
            .select("*")\
            .eq("id", user_id)\
            .single()\
            .execute()
        # ...
```

## Migration 執行方式

### 本地環境無法直接連線 Supabase
由於網路限制或安全設定，本地 Alembic 無法直接連線到雲端 Supabase。

**解決方案**: 使用 Supabase SQL Editor 執行 migration scripts

1. 在 `backend/alembic/versions/` 建立 migration (手動或 autogenerate)
2. 在 `scripts/` 目錄建立對應的 `.sql` 檔案
3. 在 Supabase Dashboard > SQL Editor 執行 `.sql` 檔案
4. 手動更新 `alembic_version` 表（如需版本追蹤）

## 檔案結構

```
backend/
├── alembic/               # Migration 定義（版本控制用）
│   └── versions/
│       ├── 001_*.py       # Alembic migration (不直接執行)
│       └── 002_*.py
├── scripts/               # 實際執行的 SQL scripts
│   ├── 001_*.sql          # 在 Supabase SQL Editor 執行
│   └── 002_*.sql
└── api/v1/endpoints/      # 所有 endpoints 使用 Supabase Client
```

## 優點

1. **統一介面**: 所有資料存取都透過 Supabase Client
2. **安全性**: 自動利用 RLS policies
3. **簡化部署**: 不需要管理 database connection pool
4. **即時功能**: 未來可以輕鬆加入 Realtime subscriptions
5. **雲端優勢**: 完全利用 Supabase 雲端功能

## 注意事項

### Service Role Key 使用
- ⚠️ **絕對不可** 暴露給前端
- ✅ 只能在後端服務使用
- ✅ 必須手動驗證使用者權限（因為繞過 RLS）

### 查詢優化
- 使用 `.select()` 指定需要的欄位，避免 SELECT *
- 善用 `.in_()`, `.gte()`, `.lt()` 等過濾方法
- 利用 JOIN 語法減少 N+1 查詢

### 錯誤處理
- Supabase Client 不會拋出異常，需要檢查 response
- 使用 `response.data` 取得資料
- 使用 `response.count` 取得計數

## 相關環境變數

```env
# Supabase Configuration (必要)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=xxx                      # Anon key (前端用)
SUPABASE_SERVICE_ROLE_KEY=xxx         # Service role key (後端用)

# Database URL (僅供 Alembic migration 參考，不實際連線)
DATABASE_URL=postgresql://...
```
