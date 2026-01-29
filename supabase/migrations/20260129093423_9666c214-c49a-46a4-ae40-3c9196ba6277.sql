-- Email accounts table (personal and shared)
CREATE TABLE public.email_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  account_type TEXT NOT NULL DEFAULT 'personal' CHECK (account_type IN ('personal', 'shared')),
  email_address TEXT NOT NULL,
  display_name TEXT,
  
  -- IMAP Settings
  imap_host TEXT NOT NULL,
  imap_port INTEGER NOT NULL DEFAULT 993,
  imap_username TEXT NOT NULL,
  imap_password TEXT NOT NULL, -- Encrypted via pgcrypto
  imap_encryption TEXT NOT NULL DEFAULT 'ssl' CHECK (imap_encryption IN ('ssl', 'tls', 'none')),
  
  -- SMTP Settings
  smtp_host TEXT,
  smtp_port INTEGER DEFAULT 587,
  smtp_username TEXT,
  smtp_password TEXT,
  smtp_encryption TEXT DEFAULT 'tls' CHECK (smtp_encryption IN ('ssl', 'tls', 'none')),
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'success', 'error')),
  sync_error TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Email folders table
CREATE TABLE public.email_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.email_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  remote_name TEXT NOT NULL,
  folder_type TEXT DEFAULT 'custom' CHECK (folder_type IN ('inbox', 'sent', 'drafts', 'trash', 'spam', 'archive', 'custom')),
  unread_count INTEGER DEFAULT 0,
  total_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Emails table
CREATE TABLE public.emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.email_accounts(id) ON DELETE CASCADE,
  folder_id UUID NOT NULL REFERENCES public.email_folders(id) ON DELETE CASCADE,
  
  -- Email identifiers
  message_id TEXT NOT NULL,
  thread_id TEXT,
  in_reply_to TEXT,
  references_ids JSONB DEFAULT '[]'::jsonb,
  
  -- Email content
  subject TEXT,
  from_address TEXT NOT NULL,
  from_name TEXT,
  to_addresses JSONB DEFAULT '[]'::jsonb,
  cc_addresses JSONB DEFAULT '[]'::jsonb,
  bcc_addresses JSONB DEFAULT '[]'::jsonb,
  reply_to TEXT,
  
  body_text TEXT,
  body_html TEXT,
  snippet TEXT,
  
  -- Attachments
  has_attachments BOOLEAN DEFAULT false,
  attachments JSONB DEFAULT '[]'::jsonb,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  is_starred BOOLEAN DEFAULT false,
  is_flagged BOOLEAN DEFAULT false,
  labels JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  sent_at TIMESTAMP WITH TIME ZONE,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(account_id, message_id)
);

-- Email drafts table
CREATE TABLE public.email_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.email_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Draft content
  to_addresses JSONB DEFAULT '[]'::jsonb,
  cc_addresses JSONB DEFAULT '[]'::jsonb,
  bcc_addresses JSONB DEFAULT '[]'::jsonb,
  subject TEXT,
  body_html TEXT,
  body_text TEXT,
  
  -- Reply/Forward context
  reply_to_email_id UUID REFERENCES public.emails(id) ON DELETE SET NULL,
  forward_email_id UUID REFERENCES public.emails(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_emails_account_folder ON public.emails(account_id, folder_id);
CREATE INDEX idx_emails_thread ON public.emails(thread_id);
CREATE INDEX idx_emails_received_at ON public.emails(received_at DESC);
CREATE INDEX idx_emails_is_read ON public.emails(is_read) WHERE is_read = false;
CREATE INDEX idx_email_accounts_user ON public.email_accounts(user_id);
CREATE INDEX idx_email_accounts_project ON public.email_accounts(project_id);

-- Enable RLS
ALTER TABLE public.email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_drafts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_accounts
CREATE POLICY "Users can view their own email accounts"
  ON public.email_accounts FOR SELECT
  USING (user_id = auth.uid() OR project_id IN (SELECT id FROM public.projects));

CREATE POLICY "Users can create their own email accounts"
  ON public.email_accounts FOR INSERT
  WITH CHECK (user_id = auth.uid() OR auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own email accounts"
  ON public.email_accounts FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own email accounts"
  ON public.email_accounts FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for email_folders
CREATE POLICY "Users can view folders from their accounts"
  ON public.email_folders FOR SELECT
  USING (account_id IN (
    SELECT id FROM public.email_accounts 
    WHERE user_id = auth.uid() OR project_id IN (SELECT id FROM public.projects)
  ));

CREATE POLICY "Users can manage folders from their accounts"
  ON public.email_folders FOR ALL
  USING (account_id IN (
    SELECT id FROM public.email_accounts WHERE user_id = auth.uid()
  ));

-- RLS Policies for emails
CREATE POLICY "Users can view emails from their accounts"
  ON public.emails FOR SELECT
  USING (account_id IN (
    SELECT id FROM public.email_accounts 
    WHERE user_id = auth.uid() OR project_id IN (SELECT id FROM public.projects)
  ));

CREATE POLICY "Users can manage emails from their accounts"
  ON public.emails FOR ALL
  USING (account_id IN (
    SELECT id FROM public.email_accounts WHERE user_id = auth.uid()
  ));

-- RLS Policies for email_drafts
CREATE POLICY "Users can view their own drafts"
  ON public.email_drafts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own drafts"
  ON public.email_drafts FOR ALL
  USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_email_accounts_updated_at
  BEFORE UPDATE ON public.email_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_drafts_updated_at
  BEFORE UPDATE ON public.email_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for emails
ALTER PUBLICATION supabase_realtime ADD TABLE public.emails;