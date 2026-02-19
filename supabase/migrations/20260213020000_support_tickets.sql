-- Phase 15: Support Tickets
-- Create support ticket system with auto-generated ticket numbers

-- Support Tickets Table
DROP TABLE IF EXISTS support_tickets CASCADE;
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting', 'resolved', 'closed')),
  category TEXT CHECK (category IN ('billing', 'technical', 'feature_request', 'bug_report', 'other')),
  assigned_to UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sequence for ticket numbers
CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START 1000;

-- Function to auto-generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ticket_number := 'TKT-' || LPAD(nextval('ticket_number_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set ticket number on insert
DROP TRIGGER IF EXISTS set_ticket_number ON support_tickets;
CREATE TRIGGER set_ticket_number
  BEFORE INSERT ON support_tickets
  FOR EACH ROW
  WHEN (NEW.ticket_number IS NULL OR NEW.ticket_number = '')
  EXECUTE FUNCTION generate_ticket_number();

-- Ticket Replies Table
CREATE TABLE IF NOT EXISTS ticket_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE support_tickets
  SET updated_at = NOW()
  WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update ticket timestamp when reply is added
DROP TRIGGER IF EXISTS update_ticket_on_reply ON ticket_replies;
CREATE TRIGGER update_ticket_on_reply
  AFTER INSERT ON ticket_replies
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_timestamp();

-- Ticket Analytics View
CREATE OR REPLACE VIEW ticket_analytics AS
SELECT 
  status,
  priority,
  category,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (COALESCE(resolved_at, NOW()) - created_at))/3600)::NUMERIC(10, 2) as avg_resolution_hours,
  MIN(created_at) as earliest_ticket,
  MAX(created_at) as latest_ticket
FROM support_tickets
GROUP BY status, priority, category;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_replies_ticket_id ON ticket_replies(ticket_id);

-- Grant permissions (adjust based on your RLS policies)
-- These are examples - adjust based on your security requirements
COMMENT ON TABLE support_tickets IS 'Support ticket tracking system';
COMMENT ON TABLE ticket_replies IS 'Replies and updates to support tickets';
COMMENT ON VIEW ticket_analytics IS 'Analytics view for ticket performance metrics';
