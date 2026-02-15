-- Scheduled Reports Tables
-- Stores scheduled report configurations and execution history

CREATE TABLE IF NOT EXISTS scheduled_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    report_type TEXT NOT NULL CHECK (report_type IN ('pdf', 'excel', 'csv')),
    dashboard_id TEXT NOT NULL,
    schedule_frequency TEXT NOT NULL CHECK (schedule_frequency IN ('daily', 'weekly', 'monthly')),
    schedule_day INTEGER, -- Day of week (0-6) or day of month (1-31)
    schedule_time TIME NOT NULL,
    recipients TEXT[] NOT NULL,
    filters JSONB,
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_reports_user ON scheduled_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_project ON scheduled_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_next_run ON scheduled_reports(next_run_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_active ON scheduled_reports(is_active);

-- Report execution history
CREATE TABLE IF NOT EXISTS report_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scheduled_report_id UUID NOT NULL REFERENCES scheduled_reports(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
    error_message TEXT,
    file_size INTEGER,
    recipients_count INTEGER,
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_executions_schedule ON report_executions(scheduled_report_id);
CREATE INDEX IF NOT EXISTS idx_report_executions_date ON report_executions(executed_at DESC);

-- RLS Policies
ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_executions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own scheduled reports
CREATE POLICY scheduled_reports_select_policy ON scheduled_reports
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY scheduled_reports_insert_policy ON scheduled_reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY scheduled_reports_update_policy ON scheduled_reports
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY scheduled_reports_delete_policy ON scheduled_reports
    FOR DELETE USING (auth.uid() = user_id);

-- Users can only see executions for their own reports
CREATE POLICY report_executions_select_policy ON report_executions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM scheduled_reports
            WHERE scheduled_reports.id = report_executions.scheduled_report_id
            AND scheduled_reports.user_id = auth.uid()
        )
    );

-- Only system can insert execution records (would be done via backend)
CREATE POLICY report_executions_insert_policy ON report_executions
    FOR INSERT WITH CHECK (false); -- Disable direct inserts for now

COMMENT ON TABLE scheduled_reports IS 'Stores scheduled report configurations';
COMMENT ON TABLE report_executions IS 'Stores report execution history';
