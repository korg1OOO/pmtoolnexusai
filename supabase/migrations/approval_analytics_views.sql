-- Approval Analytics Database Views
-- Creates views and functions for approval workflow analytics

-- 1. Approval Metrics View
-- Provides aggregate metrics per entity
CREATE OR REPLACE VIEW approval_metrics AS
SELECT 
  entity_id,
  entity_type,
  COUNT(*) as total_approvals,
  COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  AVG(EXTRACT(EPOCH FROM (completed_date - created_at))/3600) FILTER (WHERE completed_date IS NOT NULL) as avg_turnaround_hours,
  MAX(EXTRACT(EPOCH FROM (completed_date - created_at))/3600) FILTER (WHERE completed_date IS NOT NULL) as max_turnaround_hours,
  MIN(EXTRACT(EPOCH FROM (completed_date - created_at))/3600) FILTER (WHERE completed_date IS NOT NULL) as min_turnaround_hours
FROM approval_workflows
GROUP BY entity_id, entity_type;

-- 2. Approval Trends View (Daily aggregation for last 90 days)
CREATE OR REPLACE VIEW approval_trends AS
SELECT 
  DATE(created_at) as date,
  entity_id,
  entity_type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'approved') as approved,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
  COUNT(*) FILTER (WHERE status = 'pending') as pending
FROM approval_workflows
WHERE created_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE(created_at), entity_id, entity_type
ORDER BY date DESC;

-- 3. Bottleneck Analysis View
-- Identifies stuck approvals and slow approvers
CREATE OR REPLACE VIEW approval_bottlenecks AS
SELECT 
  a.id as approval_id,
  a.title,
  a.entity_id,
  a.entity_type,
  ap.user_id as approver_id,
  ap.status as approver_status,
  EXTRACT(EPOCH FROM (COALESCE(ap.action_date, NOW()) - a.created_at))/3600 as hours_pending,
  ap.order_num as order_index,
  a.type as priority,
  a.created_at
FROM approval_workflows a
JOIN approvers ap ON a.id = ap.approval_id
WHERE a.status = 'pending'
  AND ap.status = 'pending'
ORDER BY hours_pending DESC;

-- 4. Delegation Patterns View
-- Analyzes delegation behavior and patterns
CREATE OR REPLACE VIEW delegation_patterns AS
SELECT 
  d.delegator_id,
  d.delegate_id,
  d.delegation_type,
  COUNT(*) as delegation_count,
  COUNT(*) FILTER (WHERE d.status = 'active') as active_delegations,
  COUNT(*) FILTER (WHERE d.status = 'completed') as completed_delegations,
  COUNT(*) FILTER (WHERE d.status = 'revoked') as revoked_delegations,
  AVG(EXTRACT(EPOCH FROM (COALESCE(d.revoked_at, NOW()) - d.created_at))/86400) as avg_duration_days,
  MAX(d.created_at) as last_delegation_date
FROM delegations d
GROUP BY d.delegator_id, d.delegate_id, d.delegation_type;

-- 5. Approver Performance View
-- Tracks individual approver metrics
CREATE OR REPLACE VIEW approver_performance AS
SELECT 
  ap.user_id,
  COUNT(*) as total_approvals,
  COUNT(*) FILTER (WHERE ap.status = 'approved') as approved_count,
  COUNT(*) FILTER (WHERE ap.status = 'rejected') as rejected_count,
  COUNT(*) FILTER (WHERE ap.status = 'pending') as pending_count,
  AVG(EXTRACT(EPOCH FROM (ap.action_date - ap.created_at))/3600) FILTER (WHERE ap.action_date IS NOT NULL) as avg_response_hours,
  COUNT(DISTINCT a.entity_id) as entities_served,
  MAX(ap.action_date) as last_approval_date
FROM approvers ap
JOIN approval_workflows a ON ap.approval_id = a.id
GROUP BY ap.user_id;

-- 6. Compliance Metrics View
-- Aggregates compliance checklist data
CREATE OR REPLACE VIEW compliance_metrics AS
SELECT 
  c.entity_id,
  c.entity_type,
  COUNT(*) as total_checklists,
  COUNT(*) FILTER (WHERE c.completion_percent = 100) as completed_checklists,
  AVG(c.completion_percent) as avg_completion_percent,
  COUNT(ci.*) FILTER (WHERE ci.status IN ('in-progress', 'non-compliant')) as overdue_items,
  COUNT(ci.*) as total_items,
  COUNT(ci.*) FILTER (WHERE ci.status = 'compliant') as completed_items
FROM compliance_checklists c
LEFT JOIN checklist_items ci ON c.id = ci.checklist_id
GROUP BY c.entity_id, c.entity_type;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_approval_workflows_entity_status ON approval_workflows(entity_id, entity_type, status);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_created_at ON approval_workflows(created_at);
CREATE INDEX IF NOT EXISTS idx_approvers_user_status ON approvers(user_id, status);
CREATE INDEX IF NOT EXISTS idx_delegations_delegator ON delegations(delegator_id, status);
CREATE INDEX IF NOT EXISTS idx_delegations_delegate ON delegations(delegate_id, status);
CREATE INDEX IF NOT EXISTS idx_compliance_entity ON compliance_checklists(entity_id, entity_type);

-- Grant permissions
GRANT SELECT ON approval_metrics TO authenticated;
GRANT SELECT ON approval_trends TO authenticated;
GRANT SELECT ON approval_bottlenecks TO authenticated;
GRANT SELECT ON delegation_patterns TO authenticated;
GRANT SELECT ON approver_performance TO authenticated;
GRANT SELECT ON compliance_metrics TO authenticated;

-- Add comments for documentation
COMMENT ON VIEW approval_metrics IS 'Aggregate approval metrics per entity including turnaround times';
COMMENT ON VIEW approval_trends IS 'Daily approval trends for the last 90 days';
COMMENT ON VIEW approval_bottlenecks IS 'Identifies stuck approvals and slow approvers';
COMMENT ON VIEW delegation_patterns IS 'Analyzes delegation behavior and patterns';
COMMENT ON VIEW approver_performance IS 'Individual approver performance metrics';
COMMENT ON VIEW compliance_metrics IS 'Compliance checklist completion metrics';
