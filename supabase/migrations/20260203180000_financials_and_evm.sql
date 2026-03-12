-- Migration: Financials and EVM Tables
-- Created at: 2026-02-03 18:00:00

-- Create project_budget_items table
CREATE TABLE IF NOT EXISTS public.project_budget_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    planned NUMERIC DEFAULT 0,
    actual NUMERIC DEFAULT 0,
    forecast NUMERIC DEFAULT 0,
    variance NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS to project_budget_items
ALTER TABLE public.project_budget_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users on project_budget_items"
ON public.project_budget_items
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create project_invoices table
CREATE TABLE IF NOT EXISTS public.project_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL,
    date DATE NOT NULL,
    amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'sent',
    milestone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS to project_invoices
ALTER TABLE public.project_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users on project_invoices"
ON public.project_invoices
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create project_evm_snapshots table
CREATE TABLE IF NOT EXISTS public.project_evm_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    as_of_date DATE NOT NULL,
    pv NUMERIC DEFAULT 0,
    ev NUMERIC DEFAULT 0,
    ac NUMERIC DEFAULT 0,
    bac NUMERIC DEFAULT 0,
    spi NUMERIC DEFAULT 0,
    cpi NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS to project_evm_snapshots
ALTER TABLE public.project_evm_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users on project_evm_snapshots"
ON public.project_evm_snapshots
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Add updated_at trigger for budget items and invoices
CREATE OR REPLACE TRIGGER handle_updated_at_project_budget_items
    BEFORE UPDATE ON public.project_budget_items
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER handle_updated_at_project_invoices
    BEFORE UPDATE ON public.project_invoices
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Add to real-time publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_budget_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_invoices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_evm_snapshots;
