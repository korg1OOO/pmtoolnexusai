import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProjectContext } from '@/contexts/ProjectContext';
import { toast } from 'sonner';

export type IssueSeverity = 'minor' | 'moderate' | 'major' | 'critical' | 'high' | 'medium' | 'low';
export type IssueStatus = 'open' | 'investigating' | 'in-progress' | 'blocked' | 'resolved' | 'closed';
export type IssuePriority = 'critical' | 'high' | 'medium' | 'low';
export type IssueType = 'bug' | 'blocker' | 'impediment' | 'defect' | 'incident';

export interface Issue { id: string; project_id: string | null; key: string | null; title: string; description: string | null; type: string; severity: IssueSeverity; priority: IssuePriority; status: IssueStatus; reporter_id: string | null; reporter_name: string | null; assignee_id: string | null; assignee_name: string | null; sla_target_resolution: number | null; sla_breached: boolean; linked_items: any[]; affected_areas: string[]; tags: string[]; root_cause: string | null; resolution: string | null; comments: any[]; history: any[]; created_at: string; updated_at: string; resolved_at: string | null; closed_at: string | null; }
export interface IssueInput { title: string; description?: string; type?: string; severity?: IssueSeverity; priority?: IssuePriority; status?: IssueStatus; reporter_name?: string; assignee_name?: string; sla_target_resolution?: number; affected_areas?: string[]; tags?: string[]; }

export function useIssues() {
  const { settings } = useProjectContext();
  const projectId = settings.id;
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIssues = useCallback(async () => {
    if (!projectId) { setIssues([]); setLoading(false); return; }
    try {
      setLoading(true);
      const { data, error: e } = await supabase.from('issues').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
      if (e) throw e;
      setIssues((data || []).map((i: any) => ({ ...i, severity: i.severity as IssueSeverity, priority: i.priority as IssuePriority, status: i.status as IssueStatus, linked_items: Array.isArray(i.linked_items) ? i.linked_items : [], affected_areas: Array.isArray(i.affected_areas) ? i.affected_areas : [], tags: Array.isArray(i.tags) ? i.tags : [], comments: Array.isArray(i.comments) ? i.comments : [], history: Array.isArray(i.history) ? i.history : [] })));
      setError(null);
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { fetchIssues(); }, [fetchIssues]);

  useEffect(() => {
    if (!projectId) return;
    const channel = supabase.channel('issues-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'issues', filter: `project_id=eq.${projectId}` }, () => fetchIssues()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [projectId, fetchIssues]);

  const generateKey = () => `ISS-${String(issues.length + 1).padStart(3, '0')}`;

  const createIssue = async (input: IssueInput) => {
    if (!projectId) { toast.error('No project selected'); return null; }
    try {
      const key = generateKey();
      const { data, error: e } = await supabase.from('issues').insert({ project_id: projectId, key, title: input.title, description: input.description || null, type: input.type || 'bug', severity: input.severity || 'moderate', priority: input.priority || 'medium', status: input.status || 'open', reporter_name: input.reporter_name || null, assignee_name: input.assignee_name || null, sla_target_resolution: input.sla_target_resolution || null, affected_areas: input.affected_areas || [], tags: input.tags || [], history: [{ timestamp: new Date().toISOString(), user: input.reporter_name || 'System', action: 'Created issue' }] }).select().single();
      if (e) throw e;
      toast.success('Issue created'); return data;
    } catch { toast.error('Failed to create issue'); return null; }
  };

  const updateIssue = async (id: string, updates: Partial<IssueInput & { root_cause?: string; resolution?: string }>) => {
    try {
      const issue = issues.find(i => i.id === id);
      const updateData: any = { ...updates };
      if (updates.status === 'resolved' && issue?.status !== 'resolved') updateData.resolved_at = new Date().toISOString();
      if (updates.status === 'closed' && issue?.status !== 'closed') updateData.closed_at = new Date().toISOString();
      const { error: e } = await supabase.from('issues').update(updateData).eq('id', id);
      if (e) throw e; toast.success('Issue updated'); return true;
    } catch { toast.error('Failed to update issue'); return false; }
  };

  const addComment = async (id: string, user: string, text: string) => {
    const issue = issues.find(i => i.id === id);
    if (!issue) return false;
    const newComment = { id: crypto.randomUUID(), user, text, timestamp: new Date().toISOString() };
    try {
      const { error: e } = await supabase.from('issues').update({ comments: [...issue.comments, newComment] }).eq('id', id);
      if (e) throw e; return true;
    } catch { return false; }
  };

  const deleteIssue = async (id: string) => { try { await supabase.from('issues').delete().eq('id', id); toast.success('Issue deleted'); return true; } catch { toast.error('Failed'); return false; } };

  const openIssues = issues.filter(i => i.status === 'open');
  const criticalIssues = issues.filter(i => i.severity === 'critical' || i.priority === 'critical');
  const slaBreachedIssues = issues.filter(i => i.sla_breached);

  return { issues, loading, error, refetch: fetchIssues, createIssue, updateIssue, deleteIssue, addComment, openIssues, criticalIssues, slaBreachedIssues };
}
