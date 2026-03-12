-- Governance Tables Migration
-- Run this SQL in your Supabase SQL Editor to create the governance tables

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Policy Documents Table
CREATE TABLE IF NOT EXISTS policy_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    version TEXT NOT NULL,
    last_reviewed TIMESTAMP WITH TIME ZONE,
    next_review TIMESTAMP WITH TIME ZONE,
    applicable_to TEXT[],
    document_url TEXT,
    mandatory BOOLEAN DEFAULT false,
    status TEXT CHECK (status IN ('active', 'draft', 'archived')) DEFAULT 'draft',
    owner TEXT,
    entity_id UUID NOT NULL,
    entity_type TEXT CHECK (entity_type IN ('project', 'portfolio', 'program', 'workspace')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_policy_documents_entity ON policy_documents(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_policy_documents_status ON policy_documents(status);

-- Approval Workflows Table
CREATE TABLE IF NOT EXISTS approval_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'escalated')) DEFAULT 'pending',
    current_approver TEXT,
    submitted_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    submitted_by TEXT NOT NULL,
    completed_date TIMESTAMP WITH TIME ZONE,
    comments TEXT,
    attachments TEXT[],
    entity_id UUID NOT NULL,
    entity_type TEXT CHECK (entity_type IN ('project', 'portfolio', 'program', 'workspace')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_approval_workflows_entity ON approval_workflows(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_status ON approval_workflows(status);

-- Approvers Table (for approval chain)
CREATE TABLE IF NOT EXISTS approvers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    approval_id UUID NOT NULL REFERENCES approval_workflows(id) ON DELETE CASCADE,
    user_id UUID,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    order_num INTEGER NOT NULL,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    action_date TIMESTAMP WITH TIME ZONE,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_approvers_approval_id ON approvers(approval_id);
CREATE INDEX IF NOT EXISTS idx_approvers_user_id ON approvers(user_id);

-- Compliance Checklists Table
CREATE TABLE IF NOT EXISTS compliance_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    framework TEXT NOT NULL,
    entity_id UUID NOT NULL,
    entity_type TEXT CHECK (entity_type IN ('project', 'portfolio', 'program', 'workspace')) NOT NULL,
    completion_percent INTEGER DEFAULT 0 CHECK (completion_percent >= 0 AND completion_percent <= 100),
    last_audit TIMESTAMP WITH TIME ZONE,
    next_audit TIMESTAMP WITH TIME ZONE,
    auditor TEXT,
    status TEXT CHECK (status IN ('compliant', 'non-compliant', 'in-progress')) DEFAULT 'in-progress',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_compliance_checklists_entity ON compliance_checklists(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_compliance_checklists_status ON compliance_checklists(status);

-- Checklist Items Table
CREATE TABLE IF NOT EXISTS checklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checklist_id UUID NOT NULL REFERENCES compliance_checklists(id) ON DELETE CASCADE,
    requirement TEXT NOT NULL,
    description TEXT,
    status TEXT CHECK (status IN ('compliant', 'non-compliant', 'in-progress', 'not-applicable')) DEFAULT 'in-progress',
    evidence TEXT[],
    verified_by TEXT,
    verified_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_checklist_items_checklist_id ON checklist_items(checklist_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_status ON checklist_items(status);
CREATE INDEX IF NOT EXISTS idx_checklist_items_priority ON checklist_items(priority);

-- Add RLS (Row Level Security) policies
-- Note: Adjust these policies based on your authentication and authorization requirements

ALTER TABLE policy_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvers ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

-- Example RLS policy (adjust based on your auth setup)
-- Allow authenticated users to read all governance data
CREATE POLICY "Allow authenticated users to read policy_documents"
    ON policy_documents FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to read approval_workflows"
    ON approval_workflows FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to read approvers"
    ON approvers FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to read compliance_checklists"
    ON compliance_checklists FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to read checklist_items"
    ON checklist_items FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to update approvers (for approve/reject actions)
CREATE POLICY "Allow authenticated users to update approvers"
    ON approvers FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to update approval_workflows
CREATE POLICY "Allow authenticated users to update approval_workflows"
    ON approval_workflows FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to update checklist_items
CREATE POLICY "Allow authenticated users to update checklist_items"
    ON checklist_items FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to update compliance_checklists
CREATE POLICY "Allow authenticated users to update compliance_checklists"
    ON compliance_checklists FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to update updated_at automatically
CREATE TRIGGER update_policy_documents_updated_at
    BEFORE UPDATE ON policy_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_approval_workflows_updated_at
    BEFORE UPDATE ON approval_workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_checklists_updated_at
    BEFORE UPDATE ON compliance_checklists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_checklist_items_updated_at
    BEFORE UPDATE ON checklist_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Governance tables created successfully!';
END $$;
