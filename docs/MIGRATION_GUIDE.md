# Database Migration 執行指南

## 重要：我們使用雲端 Supabase

本專案使用 **Supabase Cloud** 託管資料庫，所有 schema 變更都需要在 **Supabase Dashboard** 執行。

## 為什麼不能直接執行 Alembic？

由於以下原因，本地環境無法直接連線到 Supabase 執行 `alembic upgrade`：

1. 網路防火牆或 IP 限制
2. Supabase Connection Pooler 的連線限制
3. 本地開發環境安全考量

## 執行 Migration 的正確流程

### 步驟 1: 查看待執行的 Migrations

檢查 `scripts/` 目錄中的 SQL 檔案：

```bash
ls -l scripts/*.sql
```

當前待執行的 migrations:
- `scripts/001_create_notification_tables.sql` - 建立 notification_rules 和 notification_logs 表
- `scripts/002_add_line_verification.sql` - 新增 Line 驗證碼欄位

### 步驟 2: 登入 Supabase Dashboard

1. 前往 [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. 選擇您的專案
3. 點擊左側選單的 **SQL Editor**

### 步驟 3: 執行 SQL Scripts

依序執行每個 SQL 檔案：

#### 3.1 執行 001_create_notification_tables.sql

1. 開啟 `scripts/001_create_notification_tables.sql`
2. 複製全部內容
3. 在 SQL Editor 貼上
4. 點擊 **Run** 或按 `Ctrl+Enter`
5. 確認執行成功（查看綠色成功訊息）

#### 3.2 執行 002_add_line_verification.sql

1. 開啟 `scripts/002_add_line_verification.sql`
2. 複製全部內容
3. 在 SQL Editor 貼上
4. 點擊 **Run** 或按 `Ctrl+Enter`
5. 確認執行成功

### 步驟 4: 驗證 Schema 變更

在 Supabase Dashboard 驗證變更：

1. 點擊 **Table Editor**
2. 檢查以下表格是否存在：
   - ✅ `notification_rules` (包含 user_id 欄位)
   - ✅ `notification_logs`
   - ✅ `profiles` (新增 line_verification_code, line_verification_expires_at 欄位)

3. 點擊 **Database** > **Policies**
4. 確認 RLS policies 已建立：
   - ✅ notification_rules 的 4 個 policies
   - ✅ notification_logs 的 2 個 policies

### 步驟 5: (可選) 更新 Alembic Version 表

如果需要追蹤 migration 版本，手動更新 `alembic_version` 表：

```sql
-- 檢查當前版本
SELECT * FROM alembic_version;

-- 更新到最新版本 (002)
UPDATE alembic_version SET version_num = '002';
-- 或者，如果表不存在，建立它
CREATE TABLE IF NOT EXISTS alembic_version (
    version_num VARCHAR(32) NOT NULL PRIMARY KEY
);
INSERT INTO alembic_version (version_num) VALUES ('002');
```

## Migration 檔案說明

### 001_create_notification_tables.sql
**目的**: 建立通知規則和記錄表

**包含**:
- `notification_rules` 表 (使用者自訂通知規則)
- `notification_logs` 表 (通知發送記錄)
- RLS policies (確保資料安全)
- Indexes (提升查詢效能)

**影響**:
- 允許使用者設定個人化通知規則
- 記錄所有通知發送歷史
- 修正 P1 問題 #3 和 #4

### 002_add_line_verification.sql
**目的**: 新增 Line 綁定驗證碼功能

**包含**:
- `profiles.line_verification_code` 欄位 (6位數驗證碼)
- `profiles.line_verification_expires_at` 欄位 (過期時間)
- Index (加速驗證碼查詢)

**影響**:
- 提升 Line 綁定安全性
- 使用驗證碼取代直接輸入 Email
- 修正 P1 問題 #2

## 常見問題 (FAQ)

### Q: 為什麼有 `.py` 和 `.sql` 兩種 migration 檔案？

A:
- `.py` (Alembic) - 用於版本控制和本地開發參考
- `.sql` - **實際執行的檔案**，在 Supabase Dashboard 使用

### Q: 如果執行 SQL 時出錯怎麼辦？

A:
1. 檢查錯誤訊息
2. 確認表格/欄位是否已存在
3. 如果是「已存在」錯誤，通常可以忽略（使用 `IF NOT EXISTS`）
4. 如果是其他錯誤，檢查 SQL 語法或相依性

### Q: 可以回滾 (rollback) migration 嗎？

A: 可以，每個 Alembic migration 都有 `downgrade()` 函數。需要手動將其轉換為 SQL 並在 Supabase 執行。

### Q: 未來如何新增 migration？

A:
1. 手動建立新的 `.py` 檔案在 `backend/alembic/versions/`
2. 手動建立對應的 `.sql` 檔案在 `scripts/`
3. 更新本文件的「待執行 migrations」清單
4. 通知團隊成員執行新的 SQL script

## 檢查清單

執行完所有 migrations 後，確認：

- [ ] 所有 SQL scripts 執行成功
- [ ] Table Editor 中可以看到新的表格和欄位
- [ ] RLS policies 已正確建立
- [ ] Backend 服務可以正常存取新表格
- [ ] API endpoints 可以正常運作

## 需要幫助？

如果遇到問題：
1. 查看 Supabase logs
2. 檢查 backend console 輸出
3. 參考 `docs/DATA_ACCESS_STRATEGY.md`
