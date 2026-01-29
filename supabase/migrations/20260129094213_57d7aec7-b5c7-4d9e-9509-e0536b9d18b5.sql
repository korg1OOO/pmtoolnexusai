-- Add OAuth provider fields to email_accounts
ALTER TABLE public.email_accounts 
ADD COLUMN IF NOT EXISTS provider_type TEXT DEFAULT 'imap' CHECK (provider_type IN ('imap', 'gmail', 'microsoft')),
ADD COLUMN IF NOT EXISTS oauth_client_id TEXT,
ADD COLUMN IF NOT EXISTS oauth_client_secret TEXT,
ADD COLUMN IF NOT EXISTS oauth_access_token TEXT,
ADD COLUMN IF NOT EXISTS oauth_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS oauth_token_expires_at TIMESTAMPTZ;