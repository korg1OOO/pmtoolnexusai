-- Document Center Schema
-- Tables: documents, document_folders, document_versions, document_approvers, document_shares

-- Document Folders table
CREATE TABLE public.document_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.document_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT 'blue',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Documents table
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES public.document_folders(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'other',
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  version TEXT NOT NULL DEFAULT '1.0',
  status TEXT NOT NULL DEFAULT 'draft',
  uploaded_by UUID,
  uploaded_by_name TEXT,
  is_starred BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  locked_by UUID,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Document Versions table
CREATE TABLE public.document_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  change_notes TEXT,
  uploaded_by UUID,
  uploaded_by_name TEXT,
  status TEXT NOT NULL DEFAULT 'current',
  approved_by UUID,
  approved_by_name TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Document Approvers table
CREATE TABLE public.document_approvers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID,
  user_name TEXT NOT NULL,
  user_role TEXT,
  order_num INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending',
  comment TEXT,
  decided_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Document Shares table
CREATE TABLE public.document_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES public.document_folders(id) ON DELETE CASCADE,
  shared_with_user_id UUID,
  shared_with_email TEXT,
  permission TEXT NOT NULL DEFAULT 'view',
  share_link TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT document_or_folder CHECK (document_id IS NOT NULL OR folder_id IS NOT NULL)
);

-- Enable RLS on all tables
ALTER TABLE public.document_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_approvers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_folders
CREATE POLICY "Users can view document folders" ON public.document_folders
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create folders" ON public.document_folders
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update folders" ON public.document_folders
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete folders" ON public.document_folders
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- RLS Policies for documents
CREATE POLICY "Users can view documents" ON public.documents
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create documents" ON public.documents
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update documents" ON public.documents
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete documents" ON public.documents
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- RLS Policies for document_versions
CREATE POLICY "Users can view document versions" ON public.document_versions
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create versions" ON public.document_versions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update versions" ON public.document_versions
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete versions" ON public.document_versions
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- RLS Policies for document_approvers
CREATE POLICY "Users can view document approvers" ON public.document_approvers
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage approvers" ON public.document_approvers
  FOR ALL USING (auth.uid() IS NOT NULL);

-- RLS Policies for document_shares
CREATE POLICY "Users can view shares" ON public.document_shares
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage shares" ON public.document_shares
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Create storage bucket for project documents
INSERT INTO storage.buckets (id, name, public) VALUES ('project-documents', 'project-documents', true);

-- Storage RLS policies
CREATE POLICY "Authenticated users can upload documents" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'project-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view project documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'project-documents');

CREATE POLICY "Authenticated users can update documents" ON storage.objects
  FOR UPDATE USING (bucket_id = 'project-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete documents" ON storage.objects
  FOR DELETE USING (bucket_id = 'project-documents' AND auth.uid() IS NOT NULL);

-- Enable realtime for documents
ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.document_folders;

-- Add updated_at triggers
CREATE TRIGGER update_document_folders_updated_at
  BEFORE UPDATE ON public.document_folders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();