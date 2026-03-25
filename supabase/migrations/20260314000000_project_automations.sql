-- Project Automation Rules
-- Stores trigger → action rules created by the AI chat or users.
-- Examples: "When a task is overdue, notify the assignee"

CREATE TABLE IF NOT EXISTS project_automation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    trigger_type TEXT NOT NULL,      -- task_overdue, risk_critical, milestone_reached, task_completed, budget_exceeded, schedule, custom
    trigger_config JSONB DEFAULT '{}',
    action_type TEXT NOT NULL,       -- send_email, notify_user, create_issue, update_status
    action_config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast project-scoped lookups
CREATE INDEX IF NOT EXISTS idx_automation_rules_project ON project_automation_rules(project_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_trigger ON project_automation_rules(trigger_type) WHERE is_active = true;

-- RLS
ALTER TABLE project_automation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view automation rules for their projects"
    ON project_automation_rules FOR SELECT
    USING (
        created_by = auth.uid()
        OR project_id IN (
            SELECT p.id FROM projects p WHERE p.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can create automation rules"
    ON project_automation_rules FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own automation rules"
    ON project_automation_rules FOR UPDATE
    USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own automation rules"
    ON project_automation_rules FOR DELETE
    USING (created_by = auth.uid());

-- updated_at trigger
CREATE TRIGGER set_automation_rules_updated_at
    BEFORE UPDATE ON project_automation_rules
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();
