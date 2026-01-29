import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProjectContext } from '@/contexts/ProjectContext';
import { toast } from 'sonner';

export type ItemType = 'epic' | 'story' | 'task' | 'bug' | 'tech-debt' | 'feature' | 'enhancement' | 'technical-debt';
export type BacklogStatus = 'todo' | 'in-progress' | 'review' | 'done';
export type BacklogPriority = 'critical' | 'high' | 'medium' | 'low';
export type PriorityLevel = BacklogPriority;

export interface BacklogItem { id: string; project_id: string | null; epic_id: string | null; sprint_id: string | null; key: string | null; title: string; description: string | null; type: ItemType; priority: BacklogPriority; story_points: number | null; assignee_id: string | null; assignee_name: string | null; labels: string[]; status: BacklogStatus; sort_order: number; created_at: string; updated_at: string; }
export interface BacklogItemInput { title: string; description?: string; type?: ItemType; priority?: BacklogPriority; story_points?: number; assignee_name?: string; labels?: string[]; epic_id?: string; sprint_id?: string; status?: BacklogStatus; }

export function useBacklogItems() {
  const { settings } = useProjectContext();
  const projectId = settings.id;
  const [items, setItems] = useState<BacklogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    if (!projectId) { setItems([]); setLoading(false); return; }
    try {
      setLoading(true);
      const { data, error: e } = await supabase.from('backlog_items').select('*').eq('project_id', projectId).order('sort_order', { ascending: true });
      if (e) throw e;
      setItems((data || []).map((item: any) => ({ ...item, type: item.type as ItemType, priority: item.priority as BacklogPriority, status: item.status as BacklogStatus, labels: Array.isArray(item.labels) ? item.labels : [] })));
      setError(null);
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  useEffect(() => {
    if (!projectId) return;
    const channel = supabase.channel('backlog-items-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'backlog_items', filter: `project_id=eq.${projectId}` }, () => fetchItems()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [projectId, fetchItems]);

  const generateKey = () => `BL-${String(items.length + 1).padStart(3, '0')}`;

  const createItem = async (input: BacklogItemInput) => {
    if (!projectId) { toast.error('No project selected'); return null; }
    try {
      const key = generateKey();
      const { data, error: e } = await supabase.from('backlog_items').insert({ project_id: projectId, key, title: input.title, description: input.description || null, type: input.type || 'story', priority: input.priority || 'medium', story_points: input.story_points || null, assignee_name: input.assignee_name || null, labels: input.labels || [], epic_id: input.epic_id || null, sprint_id: input.sprint_id || null, status: input.status || 'todo', sort_order: items.length }).select().single();
      if (e) throw e;
      toast.success('Backlog item created'); return data;
    } catch { toast.error('Failed to create backlog item'); return null; }
  };

  const updateItem = async (id: string, updates: Partial<BacklogItemInput>) => {
    try { const { error: e } = await supabase.from('backlog_items').update(updates).eq('id', id); if (e) throw e; toast.success('Item updated'); return true; } catch { toast.error('Failed to update item'); return false; }
  };

  const moveToSprint = async (id: string, sprintId: string | null) => updateItem(id, { sprint_id: sprintId } as any);
  const updateStatus = async (id: string, status: BacklogStatus) => updateItem(id, { status });
  const deleteItem = async (id: string) => { try { await supabase.from('backlog_items').delete().eq('id', id); toast.success('Item deleted'); return true; } catch { toast.error('Failed'); return false; } };

  const totalPoints = items.reduce((sum, i) => sum + (i.story_points || 0), 0);
  const scheduledItems = items.filter(i => i.sprint_id);
  const unassignedItems = items.filter(i => !i.epic_id);

  return { items, loading, error, refetch: fetchItems, createItem, updateItem, moveToSprint, updateStatus, deleteItem, totalPoints, scheduledItems, unassignedItems };
}
