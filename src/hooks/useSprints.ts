import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProjectContext } from '@/contexts/ProjectContext';
import { toast } from 'sonner';

export type SprintStatus = 'planning' | 'active' | 'completed' | 'cancelled';

export interface Sprint { id: string; project_id: string | null; name: string; start_date: string; end_date: string; goal: string | null; velocity: number; capacity: number; status: SprintStatus; created_at: string; updated_at: string; }
export interface SprintInput { name: string; start_date: string; end_date: string; goal?: string; capacity?: number; status?: SprintStatus; }

export function useSprints() {
  const { settings } = useProjectContext();
  const projectId = settings.id;
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSprints = useCallback(async () => {
    if (!projectId) { setSprints([]); setLoading(false); return; }
    try {
      setLoading(true);
      const { data, error: e } = await supabase.from('sprints').select('*').eq('project_id', projectId).order('start_date', { ascending: false });
      if (e) throw e;
      if (e) throw e;
      setSprints((data || []).map((s) => ({ ...s, status: s.status as SprintStatus })));
      setError(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { fetchSprints(); }, [fetchSprints]);

  useEffect(() => {
    if (!projectId) return;
    const channel = supabase.channel('sprints-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'sprints', filter: `project_id=eq.${projectId}` }, () => fetchSprints()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [projectId, fetchSprints]);

  const createSprint = async (input: SprintInput) => {
    if (!projectId) { toast.error('No project selected'); return null; }
    try {
      const { data, error: e } = await supabase.from('sprints').insert({ project_id: projectId, name: input.name, start_date: input.start_date, end_date: input.end_date, goal: input.goal || null, capacity: input.capacity || 0, status: input.status || 'planning' }).select().single();
      if (e) throw e;
      toast.success('Sprint created'); return data;
    } catch { toast.error('Failed to create sprint'); return null; }
  };

  const updateSprint = async (id: string, updates: Partial<SprintInput & { velocity?: number }>) => {
    try { const { error: e } = await supabase.from('sprints').update(updates).eq('id', id); if (e) throw e; toast.success('Sprint updated'); return true; } catch { toast.error('Failed to update sprint'); return false; }
  };

  const startSprint = async (id: string) => { const active = sprints.find(s => s.status === 'active'); if (active) await updateSprint(active.id, { status: 'completed' }); return updateSprint(id, { status: 'active' }); };
  const completeSprint = async (id: string, velocity: number) => updateSprint(id, { status: 'completed', velocity });
  const deleteSprint = async (id: string) => { try { await supabase.from('sprints').delete().eq('id', id); toast.success('Sprint deleted'); return true; } catch { toast.error('Failed'); return false; } };

  const activeSprint = sprints.find(s => s.status === 'active');
  const planningSprints = sprints.filter(s => s.status === 'planning');
  const completedSprints = sprints.filter(s => s.status === 'completed');
  const averageVelocity = completedSprints.length > 0 ? Math.round(completedSprints.reduce((sum, s) => sum + s.velocity, 0) / completedSprints.length) : 0;

  return { sprints, loading, error, refetch: fetchSprints, createSprint, updateSprint, startSprint, completeSprint, deleteSprint, activeSprint, planningSprints, completedSprints, averageVelocity };
}
