import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProjectContext } from '@/contexts/ProjectContext';
import { toast } from 'sonner';

export type ActionStatus = 'pending' | 'in-progress' | 'completed' | 'deferred' | 'cancelled';
export type ActionPriority = 'critical' | 'high' | 'medium' | 'low';

export interface Action { id: string; project_id: string | null; title: string; description: string | null; priority: ActionPriority; status: ActionStatus; owner_id: string | null; owner_name: string | null; created_by_id: string | null; created_by_name: string | null; due_date: string | null; completed_at: string | null; progress: number; notes: string | null; source_type: string | null; source_id: string | null; source_title: string | null; linked_items: any[]; dependencies: any[]; blocked_by: string | null; tags: string[]; sla_target_hours: number | null; sla_started_at: string | null; sla_breached: boolean; sla_breached_at: string | null; history: any[]; created_at: string; updated_at: string; }
export interface ActionInput { title: string; description?: string; priority?: ActionPriority; status?: ActionStatus; owner_name?: string; created_by_name?: string; due_date?: string; progress?: number; notes?: string; source_type?: string; source_id?: string; source_title?: string; tags?: string[]; sla_target_hours?: number; }

export function useActions() {
  const { settings } = useProjectContext();
  const projectId = settings.id;
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActions = useCallback(async () => {
    if (!projectId) { setActions([]); setLoading(false); return; }
    try {
      setLoading(true);
      const { data, error: e } = await supabase.from('actions').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
      if (e) throw e;
      setActions((data || []).map((a: any) => ({ ...a, priority: a.priority as ActionPriority, status: a.status as ActionStatus, linked_items: Array.isArray(a.linked_items) ? a.linked_items : [], dependencies: Array.isArray(a.dependencies) ? a.dependencies : [], tags: Array.isArray(a.tags) ? a.tags : [], history: Array.isArray(a.history) ? a.history : [] })));
      setError(null);
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { fetchActions(); }, [fetchActions]);

  useEffect(() => {
    if (!projectId) return;
    const channel = supabase.channel('actions-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'actions', filter: `project_id=eq.${projectId}` }, () => fetchActions()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [projectId, fetchActions]);

  const createAction = async (input: ActionInput) => {
    if (!projectId) { toast.error('No project selected'); return null; }
    try {
      const now = new Date().toISOString();
      const { data, error: e } = await supabase.from('actions').insert({ project_id: projectId, title: input.title, description: input.description || null, priority: input.priority || 'medium', status: input.status || 'pending', owner_name: input.owner_name || null, created_by_name: input.created_by_name || null, due_date: input.due_date || null, progress: input.progress || 0, notes: input.notes || null, source_type: input.source_type || 'manual', source_id: input.source_id || null, source_title: input.source_title || null, tags: input.tags || [], sla_target_hours: input.sla_target_hours || null, sla_started_at: input.sla_target_hours ? now : null, history: [{ timestamp: now, user: input.created_by_name || 'System', action: 'Created action' }] }).select().single();
      if (e) throw e;
      toast.success('Action created'); return data;
    } catch { toast.error('Failed to create action'); return null; }
  };

  const updateAction = async (id: string, updates: Partial<ActionInput & { blocked_by?: string }>) => {
    try {
      const action = actions.find(a => a.id === id);
      const updateData: any = { ...updates };
      if (updates.status === 'completed' && action?.status !== 'completed') { updateData.completed_at = new Date().toISOString(); updateData.progress = 100; }
      if (updates.sla_target_hours && !action?.sla_started_at) updateData.sla_started_at = new Date().toISOString();
      const { error: e } = await supabase.from('actions').update(updateData).eq('id', id);
      if (e) throw e; toast.success('Action updated'); return true;
    } catch { toast.error('Failed to update action'); return false; }
  };

  const deleteAction = async (id: string) => { try { await supabase.from('actions').delete().eq('id', id); toast.success('Action deleted'); return true; } catch { toast.error('Failed'); return false; } };

  const pendingActions = actions.filter(a => a.status === 'pending');
  const inProgressActions = actions.filter(a => a.status === 'in-progress');
  const completedActions = actions.filter(a => a.status === 'completed');
  const slaBreachedActions = actions.filter(a => a.sla_breached);
  const overdueActions = actions.filter(a => a.due_date && new Date(a.due_date) < new Date() && a.status !== 'completed' && a.status !== 'cancelled');

  return { actions, loading, error, refetch: fetchActions, createAction, updateAction, deleteAction, pendingActions, inProgressActions, completedActions, slaBreachedActions, overdueActions };
}
