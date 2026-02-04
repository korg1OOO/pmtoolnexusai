import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useProjectContext } from '@/contexts/ProjectContext';

export interface Notebook {
  id: string;
  project_id: string | null;
  user_id: string | null;
  name: string;
  icon: string;
  color: string;
  sort_order: number;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotebookSection {
  id: string;
  notebook_id: string;
  name: string;
  color: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface NotebookPage {
  id: string;
  section_id: string;
  title: string;
  content: string;
  content_html: string;
  tags: string[];
  is_favorite: boolean;
  is_pinned: boolean;
  created_by: string | null;
  created_by_user_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PageLink {
  id: string;
  source_page_id: string;
  target_page_id: string;
  link_text: string | null;
  created_at: string;
}

export function useNotebooks() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { settings } = useProjectContext();
  const projectId = settings?.id;

  const isValidUuid = (id: string | null | undefined): boolean => {
    if (!id) return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  const fetchNotebooks = async () => {
    if (!projectId || !isValidUuid(projectId)) {
      setNotebooks([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notebooks')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setNotebooks(data || []);
    } catch (error) {
      console.error('Error fetching notebooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNotebook = async (name: string, icon = 'book-open', color = 'blue') => {
    try {
      const { data, error } = await supabase
        .from('notebooks')
        .insert({
          project_id: projectId,
          name,
          icon,
          color,
          sort_order: notebooks.length,
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: 'Notebook created', description: `"${name}" has been created.` });
      return data;
    } catch (error) {
      console.error('Error creating notebook:', error);
      toast({ title: 'Error', description: 'Failed to create notebook', variant: 'destructive' });
      return null;
    }
  };

  const updateNotebook = async (id: string, updates: Partial<Notebook>) => {
    try {
      const { error } = await supabase
        .from('notebooks')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Notebook updated' });
    } catch (error) {
      console.error('Error updating notebook:', error);
      toast({ title: 'Error', description: 'Failed to update notebook', variant: 'destructive' });
    }
  };

  const deleteNotebook = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notebooks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Notebook deleted' });
    } catch (error) {
      console.error('Error deleting notebook:', error);
      toast({ title: 'Error', description: 'Failed to delete notebook', variant: 'destructive' });
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchNotebooks();
    }
  }, [projectId]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel('notebooks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notebooks',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          fetchNotebooks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  return {
    notebooks,
    loading,
    createNotebook,
    updateNotebook,
    deleteNotebook,
    refetch: fetchNotebooks,
  };
}

export function useSections(notebookId: string | null) {
  const [sections, setSections] = useState<NotebookSection[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const isValidUuid = (id: string | null | undefined): boolean => {
    if (!id) return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  const fetchSections = async () => {
    if (!notebookId || !isValidUuid(notebookId)) {
      setSections([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notebook_sections')
        .select('*')
        .eq('notebook_id', notebookId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setSections(data || []);
    } catch (error) {
      console.error('Error fetching sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSection = async (name: string, color?: string) => {
    if (!notebookId || !isValidUuid(notebookId)) return null;

    try {
      const { data, error } = await supabase
        .from('notebook_sections')
        .insert({
          notebook_id: notebookId,
          name,
          color,
          sort_order: sections.length,
        })
        .select()
        .single();

      if (error) throw error;
      toast({ title: 'Section created' });
      return data;
    } catch (error) {
      console.error('Error creating section:', error);
      toast({ title: 'Error', description: 'Failed to create section', variant: 'destructive' });
      return null;
    }
  };

  const updateSection = async (id: string, updates: Partial<NotebookSection>) => {
    try {
      const { error } = await supabase
        .from('notebook_sections')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating section:', error);
      toast({ title: 'Error', description: 'Failed to update section', variant: 'destructive' });
    }
  };

  const deleteSection = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notebook_sections')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Section deleted' });
    } catch (error) {
      console.error('Error deleting section:', error);
      toast({ title: 'Error', description: 'Failed to delete section', variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchSections();
  }, [notebookId]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!notebookId || !isValidUuid(notebookId)) return;

    const channel = supabase
      .channel(`sections-${notebookId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notebook_sections',
          filter: `notebook_id=eq.${notebookId}`,
        },
        () => {
          fetchSections();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [notebookId]);

  return {
    sections,
    loading,
    createSection,
    updateSection,
    deleteSection,
    refetch: fetchSections,
  };
}

export function usePages(sectionId: string | null) {
  const [pages, setPages] = useState<NotebookPage[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const isValidUuid = (id: string | null | undefined): boolean => {
    if (!id) return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  const fetchPages = async () => {
    if (!sectionId || !isValidUuid(sectionId)) {
      setPages([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notebook_pages')
        .select('*')
        .eq('section_id', sectionId)
        .order('is_pinned', { ascending: false })
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setPages(data || []);
    } catch (error) {
      console.error('Error fetching pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPage = async (title = 'Untitled') => {
    if (!sectionId || !isValidUuid(sectionId)) return null;

    try {
      const { data, error } = await supabase
        .from('notebook_pages')
        .insert({
          section_id: sectionId,
          title,
          content: '',
          sort_order: pages.length,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating page:', error);
      toast({ title: 'Error', description: 'Failed to create page', variant: 'destructive' });
      return null;
    }
  };

  const updatePage = async (id: string, updates: Partial<NotebookPage>) => {
    try {
      const { error } = await supabase
        .from('notebook_pages')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating page:', error);
      toast({ title: 'Error', description: 'Failed to save page', variant: 'destructive' });
    }
  };

  const deletePage = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notebook_pages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Page deleted' });
    } catch (error) {
      console.error('Error deleting page:', error);
      toast({ title: 'Error', description: 'Failed to delete page', variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchPages();
  }, [sectionId]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!sectionId || !isValidUuid(sectionId)) return;

    const channel = supabase
      .channel(`pages-${sectionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notebook_pages',
          filter: `section_id=eq.${sectionId}`,
        },
        () => {
          fetchPages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sectionId]);

  return {
    pages,
    loading,
    createPage,
    updatePage,
    deletePage,
    refetch: fetchPages,
  };
}

export function useAllPages(projectId: string | null) {
  const [allPages, setAllPages] = useState<(NotebookPage & { section_name?: string; notebook_name?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  const isValidUuid = (id: string | null | undefined): boolean => {
    if (!id) return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  const fetchAllPages = async () => {
    if (!projectId || !isValidUuid(projectId)) {
      setAllPages([]);
      setLoading(false);
      return;
    }

    try {
      // First get all notebooks for this project
      const { data: notebooks, error: nbError } = await supabase
        .from('notebooks')
        .select('id, name')
        .eq('project_id', projectId);

      if (nbError) throw nbError;

      if (!notebooks || notebooks.length === 0) {
        setAllPages([]);
        setLoading(false);
        return;
      }

      // Get all sections for these notebooks
      const { data: sections, error: secError } = await supabase
        .from('notebook_sections')
        .select('id, name, notebook_id')
        .in('notebook_id', notebooks.map(n => n.id));

      if (secError) throw secError;

      if (!sections || sections.length === 0) {
        setAllPages([]);
        setLoading(false);
        return;
      }

      // Get all pages for these sections
      const { data: pages, error: pageError } = await supabase
        .from('notebook_pages')
        .select('*')
        .in('section_id', sections.map(s => s.id))
        .order('updated_at', { ascending: false });

      if (pageError) throw pageError;

      // Enrich pages with section and notebook names
      const enrichedPages = (pages || []).map(page => {
        const section = sections.find(s => s.id === page.section_id);
        const notebook = notebooks.find(n => n.id === section?.notebook_id);
        return {
          ...page,
          section_name: section?.name,
          notebook_name: notebook?.name,
        };
      });

      setAllPages(enrichedPages);
    } catch (error) {
      console.error('Error fetching all pages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllPages();
  }, [projectId]);

  return { allPages, loading, refetch: fetchAllPages };
}

export function usePageLinks(pageId: string | null) {
  const [outgoingLinks, setOutgoingLinks] = useState<PageLink[]>([]);
  const [incomingLinks, setIncomingLinks] = useState<PageLink[]>([]);
  const [loading, setLoading] = useState(true);

  const isValidUuid = (id: string | null | undefined): boolean => {
    if (!id) return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  const fetchLinks = async () => {
    if (!pageId || !isValidUuid(pageId)) {
      setOutgoingLinks([]);
      setIncomingLinks([]);
      setLoading(false);
      return;
    }

    try {
      const [outgoing, incoming] = await Promise.all([
        supabase
          .from('notebook_page_links')
          .select('*')
          .eq('source_page_id', pageId),
        supabase
          .from('notebook_page_links')
          .select('*')
          .eq('target_page_id', pageId),
      ]);

      if (outgoing.error) throw outgoing.error;
      if (incoming.error) throw incoming.error;

      setOutgoingLinks(outgoing.data || []);
      setIncomingLinks(incoming.data || []);
    } catch (error) {
      console.error('Error fetching page links:', error);
    } finally {
      setLoading(false);
    }
  };

  const createLink = async (targetPageId: string, linkText?: string) => {
    if (!pageId || !isValidUuid(pageId)) return;

    try {
      const { error } = await supabase
        .from('notebook_page_links')
        .insert({
          source_page_id: pageId,
          target_page_id: targetPageId,
          link_text: linkText,
        });

      if (error && !error.message.includes('duplicate')) throw error;
      fetchLinks();
    } catch (error) {
      console.error('Error creating link:', error);
    }
  };

  const deleteLink = async (linkId: string) => {
    try {
      const { error } = await supabase
        .from('notebook_page_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;
      fetchLinks();
    } catch (error) {
      console.error('Error deleting link:', error);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, [pageId]);

  return { outgoingLinks, incomingLinks, loading, createLink, deleteLink };
}
