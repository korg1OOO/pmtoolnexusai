-- Migration: Stripe Payment Infrastructure
-- Created: 2026-02-15
-- Description: Creates tables for Stripe integration, payment methods, and auto-recharge functionality

-- =====================================================
-- STRIPE CUSTOMERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS stripe_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_customer_id TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE INDEX idx_stripe_customers_user_id ON stripe_customers(user_id);
CREATE INDEX idx_stripe_customers_stripe_id ON stripe_customers(stripe_customer_id);

-- =====================================================
-- PAYMENT METHODS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT NOT NULL, -- Stripe customer ID
    stripe_payment_method_id TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL DEFAULT 'card', -- card, bank_account, etc.
    is_default BOOLEAN DEFAULT false,
    last4 TEXT,
    brand TEXT, -- visa, mastercard, etc.
    exp_month INTEGER,
    exp_year INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payment_methods_customer_id ON payment_methods(customer_id);
CREATE INDEX idx_payment_methods_stripe_id ON payment_methods(stripe_payment_method_id);
CREATE INDEX idx_payment_methods_default ON payment_methods(customer_id, is_default) WHERE is_default = true;

-- =====================================================
-- USER PAYMENT METHODS TABLE (for auto-recharge)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_payment_method_id TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'card',
    is_default BOOLEAN DEFAULT false,
    last4 TEXT,
    brand TEXT,
    exp_month INTEGER,
    exp_year INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_payment_methods_user_id ON user_payment_methods(user_id);
CREATE INDEX idx_user_payment_methods_default ON user_payment_methods(user_id, is_default) WHERE is_default = true;

-- =====================================================
-- AUTO RECHARGE LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS auto_recharge_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    credits_attempted INTEGER NOT NULL,
    amount_attempted DECIMAL(10, 2) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
    error_message TEXT,
    payment_intent_id TEXT,
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_auto_recharge_logs_tenant_id ON auto_recharge_logs(tenant_id);
CREATE INDEX idx_auto_recharge_logs_user_id ON auto_recharge_logs(user_id);
CREATE INDEX idx_auto_recharge_logs_status ON auto_recharge_logs(status);
CREATE INDEX idx_auto_recharge_logs_triggered_at ON auto_recharge_logs(triggered_at DESC);

-- =====================================================
-- UPDATE INVOICES TABLE (add missing columns)
-- =====================================================
-- Add missing columns to invoices table if they don't exist
DO $$ 
BEGIN
    -- Add amount_due if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'amount_due'
    ) THEN
        ALTER TABLE invoices ADD COLUMN amount_due DECIMAL(10, 2) DEFAULT 0;
        -- Copy amount to amount_due for existing records
        UPDATE invoices SET amount_due = amount WHERE amount_due = 0;
    END IF;

    -- Add amount_paid if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'amount_paid'
    ) THEN
        ALTER TABLE invoices ADD COLUMN amount_paid DECIMAL(10, 2) DEFAULT 0;
        -- For paid invoices, set amount_paid = amount_due
        UPDATE invoices SET amount_paid = amount_due WHERE status = 'paid';
    END IF;

    -- Add updated_at if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE invoices ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        UPDATE invoices SET updated_at = created_at WHERE updated_at IS NULL;
    END IF;

    -- Add stripe_payment_intent_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'stripe_payment_intent_id'
    ) THEN
        ALTER TABLE invoices ADD COLUMN stripe_payment_intent_id TEXT;
    END IF;

    -- Add refund_amount if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'refund_amount'
    ) THEN
        ALTER TABLE invoices ADD COLUMN refund_amount DECIMAL(10, 2) DEFAULT 0;
    END IF;

    -- Add refund_date if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'refund_date'
    ) THEN
        ALTER TABLE invoices ADD COLUMN refund_date TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all new tables
DROP TRIGGER IF EXISTS update_stripe_customers_updated_at ON stripe_customers;
CREATE TRIGGER update_stripe_customers_updated_at
    BEFORE UPDATE ON stripe_customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON payment_methods;
CREATE TRIGGER update_payment_methods_updated_at
    BEFORE UPDATE ON payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_payment_methods_updated_at ON user_payment_methods;
CREATE TRIGGER update_user_payment_methods_updated_at
    BEFORE UPDATE ON user_payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_recharge_logs ENABLE ROW LEVEL SECURITY;

-- Stripe customers policies
CREATE POLICY "Users can view their own stripe customer"
    ON stripe_customers FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage stripe customers"
    ON stripe_customers FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Payment methods policies
CREATE POLICY "Users can view their payment methods"
    ON user_payment_methods FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their payment methods"
    ON user_payment_methods FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their payment methods"
    ON user_payment_methods FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their payment methods"
    ON user_payment_methods FOR DELETE
    USING (auth.uid() = user_id);

-- Auto recharge logs policies
CREATE POLICY "Users can view their auto recharge logs"
    ON auto_recharge_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage auto recharge logs"
    ON auto_recharge_logs FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE stripe_customers IS 'Maps users to Stripe customer IDs';
COMMENT ON TABLE payment_methods IS 'Stores Stripe payment method details';
COMMENT ON TABLE user_payment_methods IS 'User payment methods for auto-recharge';
COMMENT ON TABLE auto_recharge_logs IS 'Logs all auto-recharge attempts and results';

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON stripe_customers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON payment_methods TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_payment_methods TO authenticated;
GRANT SELECT, INSERT ON auto_recharge_logs TO authenticated;
