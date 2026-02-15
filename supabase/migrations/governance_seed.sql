-- Governance Sample Data Seed Script
-- Run this SQL in your Supabase SQL Editor AFTER running the migration script
-- This creates sample data for testing the governance panel

-- Sample Policy Documents
INSERT INTO policy_documents (title, category, version, last_reviewed, next_review, applicable_to, document_url, mandatory, status, owner, entity_id, entity_type)
VALUES
    ('Project Management Policy', 'Project Management', '2.1', '2024-01-15', '2024-07-15', ARRAY['All Projects']::text[], '/docs/pm-policy.pdf', true, 'active', 'PMO Director', '00000000-0000-0000-0000-000000000001', 'workspace'),
    ('Change Management Policy', 'Change Management', '1.5', '2024-02-01', '2024-08-01', ARRAY['All Projects']::text[], '/docs/change-mgmt-policy.pdf', true, 'active', 'Change Manager', '00000000-0000-0000-0000-000000000001', 'workspace'),
    ('Risk Management Framework', 'Risk Management', '3.0', '2024-03-01', '2024-09-01', ARRAY['Strategic Projects']::text[], '/docs/risk-framework.pdf', false, 'active', 'Risk Manager', '00000000-0000-0000-0000-000000000001', 'workspace');

-- Sample Approval Workflows
INSERT INTO approval_workflows (id, type, title, status, current_approver, submitted_date, submitted_by, attachments, entity_id, entity_type)
VALUES
    ('10000000-0000-0000-0000-000000000001', 'Budget Increase', 'Q2 Budget Increase Request', 'pending', 'Finance Director', '2024-05-01', 'John Doe', ARRAY['budget-analysis.xlsx']::text[], '00000000-0000-0000-0000-000000000001', 'workspace'),
    ('10000000-0000-0000-0000-000000000002', 'Scope Change', 'Additional Feature Request', 'approved', 'Product Owner', '2024-04-15', 'Jane Smith', ARRAY[]::text[], '00000000-0000-0000-0000-000000000001', 'workspace');

-- Sample Approvers for Budget Increase Request
INSERT INTO approvers (approval_id, user_id, name, role, order_num, status, action_date)
VALUES
    ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Project Manager', 'Submitter', 1, 'approved', '2024-05-01'),
    ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'Finance Director', 'Approver', 2, 'pending', NULL),
    ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'CFO', 'Final Approver', 3, 'pending', NULL);

-- Sample Approvers for Scope Change Request
INSERT INTO approvers (approval_id, user_id, name, role, order_num, status, action_date)
VALUES
    ('10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000004', 'Product Owner', 'Approver', 1, 'approved', '2024-04-20'),
    ('10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000005', 'Steering Committee', 'Final Approver', 2, 'approved', '2024-04-25');

-- Update completed workflow
UPDATE approval_workflows
SET completed_date = '2024-04-25'
WHERE id = '10000000-0000-0000-0000-000000000002';

-- Sample Compliance Checklist
INSERT INTO compliance_checklists (id, framework, entity_id, entity_type, completion_percent, last_audit, next_audit, auditor, status)
VALUES
    ('30000000-0000-0000-0000-000000000001', 'ISO 27001', '00000000-0000-0000-0000-000000000001', 'workspace', 50, '2024-01-10', '2024-07-10', 'External Auditor', 'in-progress');

-- Sample Checklist Items
INSERT INTO checklist_items (checklist_id, requirement, description, status, evidence, verified_by, verified_date, priority)
VALUES
    ('30000000-0000-0000-0000-000000000001', 'Information Security Policy', 'Documented and approved information security policy', 'compliant', ARRAY['policy-doc.pdf']::text[], 'Security Officer', '2024-01-10', 'critical'),
    ('30000000-0000-0000-0000-000000000001', 'Access Control Procedures', 'Formal access control procedures in place', 'compliant', ARRAY['access-control-matrix.xlsx']::text[], 'IT Manager', '2024-01-10', 'high'),
    ('30000000-0000-0000-0000-000000000001', 'Incident Response Plan', 'Documented incident response procedures', 'in-progress', ARRAY[]::text[], NULL, NULL, 'high'),
    ('30000000-0000-0000-0000-000000000001', 'Business Continuity Plan', 'Business continuity and disaster recovery plan', 'non-compliant', ARRAY[]::text[], NULL, NULL, 'critical');

-- Update completion percentage
UPDATE compliance_checklists
SET completion_percent = 50
WHERE id = '30000000-0000-0000-0000-000000000001';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Sample governance data seeded successfully!';
    RAISE NOTICE 'Note: Replace entity_id 00000000-0000-0000-0000-000000000001 with your actual workspace ID';
END $$;
