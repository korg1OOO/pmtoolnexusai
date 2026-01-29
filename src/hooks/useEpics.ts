import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProjectContext } from '@/contexts/ProjectContext';
import { toast } from 'sonner';

export interface Epic {
  id: string;
  project_id: string | null;
  name: string;
  color: string;
  description: string | null;
  progress: number;
  total_points: number;
  completed_points: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface EpicInput {
  name: string;
  color?: string;
  description?: string;
}

export function useEpics() {
  const { settings } = useProjectContext();
  const projectId = settings.id;
  const [epics, setEpics] = useState<Epic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEpics = useCallback(async () => {
    if (!projectId) { setEpics([]); setLoading(false); return; }
    try {
      setLoading(true);
      const { data, error: e } = await supabase.from('epics').select('*').eq('project_id', projectId).order('sort_order', { ascending: true });
      if (e) throw e;
      setEpics(data || []);
      setError(null);
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { fetchEpics(); }, [fetchEpics]);

  useEffect(() => {
    if (!projectId) return;
    const channel = supabase.channel('epics-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'epics', filter: `project_id=eq.${projectId}` }, () => fetchEpics()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [projectId, fetchEpics]);

  const createEpic = async (input: EpicInput) => {
    if (!projectId) { toast.error('No project selected'); return null; }
    try {
      const { data, error: e } = await supabase.from('epics').insert({ project_id: projectId, name: input.name, color: input.color || 'blue', description: input.description || null, sort_order: epics.length }).select().single();
      if (e) throw e;
      toast.success('Epic created'); return data;
    } catch (err: any) { toast.error('Failed to create epic'); return null; }
  };

  const updateEpic = async (id: string, updates: Partial<EpicInput>) => {
    try { const { error: e } = await supabase.from('epics').update(updates).eq('id', id); if (e) throw e; toast.success('Epic updated'); return true; } catch { toast.error('Failed to update epic'); return false; }
  };

  const deleteEpic = async (id: string) => {
    try { const { error: e } = await supabase.from('epics').delete().eq('id', id); if (e) throw e; toast.success('Epic deleted'); return true; } catch { toast.error('Failed to delete epic'); return false; }
  };

  return { epics, loading, error, refetch: fetchEpics, createEpic, updateEpic, deleteEpic };
}
