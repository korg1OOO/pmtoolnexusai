-- Invoice Management Enhancement
-- Syncs Stripe invoices to local database for reporting

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
    stripe_invoice_id TEXT UNIQUE NOT NULL,
    stripe_customer_id TEXT NOT NULL,
    amount_due INTEGER NOT NULL, -- in cents
    amount_paid INTEGER NOT NULL,
    currency TEXT DEFAULT 'usd',
    status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
    invoice_pdf TEXT, -- URL to PDF
    hosted_invoice_url TEXT, -- Stripe hosted page
    invoice_number TEXT,
    billing_reason TEXT,
    due_date TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create invoice line items table
CREATE TABLE IF NOT EXISTS invoice_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT,
    amount INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_amount INTEGER,
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_subscription ON invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_invoice ON invoices(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_customer ON invoices(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice ON invoice_line_items(invoice_id);

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invoices
CREATE POLICY "Users can view their own invoices"
    ON invoices
    FOR SELECT
    USING (
        subscription_id IN (
            SELECT id FROM subscriptions
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all invoices"
    ON invoices
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- RLS Policies for invoice line items
CREATE POLICY "Users can view their own invoice items"
    ON invoice_line_items
    FOR SELECT
    USING (
        invoice_id IN (
            SELECT id FROM invoices
            WHERE subscription_id IN (
                SELECT id FROM subscriptions
                WHERE user_id = auth.uid()
            )
        )
    );

-- Updated_at trigger
CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE invoices IS 'Synced Stripe invoices for reporting and history';
COMMENT ON TABLE invoice_line_items IS 'Line items for each invoice';
