-- Migration: Add notification_rules and notification_logs tables
-- Execute this in Supabase SQL Editor

-- 1. Create notification_rules table
CREATE TABLE IF NOT EXISTS notification_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    days_before INTEGER NOT NULL,
    severity VARCHAR DEFAULT 'info',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create notification_logs table for tracking sent notifications
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES deadline_events(id) ON DELETE CASCADE,
    notification_type VARCHAR NOT NULL,  -- 'line', 'email', etc.
    status VARCHAR NOT NULL,  -- 'sent', 'failed', 'pending'
    message TEXT,  -- The actual message content
    error_message TEXT,  -- Error if failed
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notification_rules_user_id ON notification_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_event_id ON notification_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE notification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for notification_rules
CREATE POLICY "Users can view their own notification rules"
    ON notification_rules FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notification rules"
    ON notification_rules FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification rules"
    ON notification_rules FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notification rules"
    ON notification_rules FOR DELETE
    USING (auth.uid() = user_id);

-- 6. Create RLS policies for notification_logs
CREATE POLICY "Users can view their own notification logs"
    ON notification_logs FOR SELECT
    USING (auth.uid() = user_id);

-- Service role can insert notification logs (for backend system)
CREATE POLICY "Service role can insert notification logs"
    ON notification_logs FOR INSERT
    WITH CHECK (true);

COMMENT ON TABLE notification_rules IS 'User-specific notification rules for deadline events';
COMMENT ON TABLE notification_logs IS 'Audit log of all sent notifications';
