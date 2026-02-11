-- Incremental Schema Updates
-- Fix missing columns and tables

-- 1. Add user_id to notification_rules (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'notification_rules' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE notification_rules ADD COLUMN user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE;
        CREATE INDEX idx_notification_rules_user_id ON notification_rules(user_id);
        RAISE NOTICE 'Added user_id to notification_rules';
    ELSE
        RAISE NOTICE 'user_id already exists in notification_rules';
    END IF;
END $$;

-- 2. Create notification_logs table (if not exists)
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES deadline_events(id) ON DELETE CASCADE,
    notification_type VARCHAR NOT NULL,
    status VARCHAR NOT NULL,
    message TEXT,
    error_message TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_event_id ON notification_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at);

-- 3. Add Line verification fields to profiles (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'line_verification_code'
    ) THEN
        ALTER TABLE profiles ADD COLUMN line_verification_code VARCHAR(6);
        ALTER TABLE profiles ADD COLUMN line_verification_expires_at TIMESTAMPTZ;
        CREATE INDEX idx_profiles_verification_code ON profiles(line_verification_code);
        RAISE NOTICE 'Added Line verification fields to profiles';
    ELSE
        RAISE NOTICE 'Line verification fields already exist in profiles';
    END IF;
END $$;

-- 4. Enable RLS on new tables
ALTER TABLE notification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for notification_rules (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'notification_rules' AND policyname = 'Users can view their own notification rules'
    ) THEN
        CREATE POLICY "Users can view their own notification rules"
            ON notification_rules FOR SELECT
            USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'notification_rules' AND policyname = 'Users can create their own notification rules'
    ) THEN
        CREATE POLICY "Users can create their own notification rules"
            ON notification_rules FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'notification_rules' AND policyname = 'Users can update their own notification rules'
    ) THEN
        CREATE POLICY "Users can update their own notification rules"
            ON notification_rules FOR UPDATE
            USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'notification_rules' AND policyname = 'Users can delete their own notification rules'
    ) THEN
        CREATE POLICY "Users can delete their own notification rules"
            ON notification_rules FOR DELETE
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- 6. Create RLS policies for notification_logs (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'notification_logs' AND policyname = 'Users can view their own notification logs'
    ) THEN
        CREATE POLICY "Users can view their own notification logs"
            ON notification_logs FOR SELECT
            USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'notification_logs' AND policyname = 'Service role can insert notification logs'
    ) THEN
        CREATE POLICY "Service role can insert notification logs"
            ON notification_logs FOR INSERT
            WITH CHECK (true);
    END IF;
END $$;

-- 7. Add comments
COMMENT ON COLUMN notification_rules.user_id IS 'Owner of this notification rule';
COMMENT ON TABLE notification_logs IS 'Audit log of all sent notifications';
COMMENT ON COLUMN profiles.line_verification_code IS 'Temporary 6-digit code for Line account binding';
COMMENT ON COLUMN profiles.line_verification_expires_at IS 'Expiration timestamp for verification code';
