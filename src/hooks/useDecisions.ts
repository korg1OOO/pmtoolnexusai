import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProjectContext } from '@/contexts/ProjectContext';
import { toast } from 'sonner';

export type DecisionStatus = 'pending' | 'active' | 'superseded' | 'rejected';

export interface Decision {
  id: string;
  project_id: string | null;
  key: string | null;
  title: string;
  decision: string;
  context: string | null;
  impact: string | null;
  alternatives: string[];
  status: DecisionStatus;
  owner_id: string | null;
  owner_name: string | null;
  date: string;
  linked_tasks: string[];
  linked_risks: string[];
  linked_meetings: string[];
  linked_items: any[];
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface DecisionInput {
  title: string;
  decision: string;
  context?: string;
  impact?: string;
  alternatives?: string[];
  status?: DecisionStatus;
  owner_name?: string;
  date?: string;
  linked_tasks?: string[];
  linked_risks?: string[];
  linked_meetings?: string[];
  tags?: string[];
}

export function useDecisions() {
  const { settings } = useProjectContext();
  const projectId = settings.id;
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDecisions = useCallback(async () => {
    if (!projectId) {
      setDecisions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('decisions')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setDecisions(
        (data || []).map((d: any) => ({
          ...d,
          status: d.status as DecisionStatus,
          alternatives: Array.isArray(d.alternatives) ? d.alternatives.map(String) : [],
          linked_tasks: Array.isArray(d.linked_tasks) ? d.linked_tasks.map(String) : [],
          linked_risks: Array.isArray(d.linked_risks) ? d.linked_risks.map(String) : [],
          linked_meetings: Array.isArray(d.linked_meetings) ? d.linked_meetings.map(String) : [],
          linked_items: Array.isArray(d.linked_items) ? d.linked_items : [],
          tags: Array.isArray(d.tags) ? d.tags.map(String) : [],
        }))
      );
      setError(null);
    } catch (err: any) {
      console.error('Error fetching decisions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchDecisions();
  }, [fetchDecisions]);

  // Real-time subscription
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel('decisions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'decisions',
          filter: `project_id=eq.${projectId}`,
        },
        () => fetchDecisions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, fetchDecisions]);

  const generateKey = () => {
    const count = decisions.length + 1;
    return `DEC-${String(count).padStart(3, '0')}`;
  };

  const createDecision = async (input: DecisionInput): Promise<Decision | null> => {
    if (!projectId) {
      toast.error('No project selected');
      return null;
    }

    try {
      const key = generateKey();
      const { data, error: insertError } = await supabase
        .from('decisions')
        .insert({
          project_id: projectId,
          key,
          title: input.title,
          decision: input.decision,
          context: input.context || null,
          impact: input.impact || null,
          alternatives: input.alternatives || [],
          status: input.status || 'pending',
          owner_name: input.owner_name || null,
          date: input.date || new Date().toISOString().split('T')[0],
          linked_tasks: input.linked_tasks || [],
          linked_risks: input.linked_risks || [],
          linked_meetings: input.linked_meetings || [],
          tags: input.tags || [],
        } as any)
        .select()
        .single();

      if (insertError) throw insertError;

      const decision: Decision = {
        ...data,
        status: data.status as DecisionStatus,
        alternatives: Array.isArray(data.alternatives) ? data.alternatives.map(String) : [],
        linked_tasks: Array.isArray(data.linked_tasks) ? data.linked_tasks.map(String) : [],
        linked_risks: Array.isArray(data.linked_risks) ? data.linked_risks.map(String) : [],
        linked_meetings: Array.isArray(data.linked_meetings) ? data.linked_meetings.map(String) : [],
        linked_items: Array.isArray(data.linked_items) ? data.linked_items : [],
        tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
      };

      toast.success('Decision created');
      return decision;
    } catch (err: any) {
      console.error('Error creating decision:', err);
      toast.error('Failed to create decision');
      return null;
    }
  };

  const updateDecision = async (
    id: string,
    updates: Partial<DecisionInput>
  ): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('decisions')
        .update(updates as any)
        .eq('id', id);

      if (updateError) throw updateError;

      toast.success('Decision updated');
      return true;
    } catch (err: any) {
      console.error('Error updating decision:', err);
      toast.error('Failed to update decision');
      return false;
    }
  };

  const deleteDecision = async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('decisions')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      toast.success('Decision deleted');
      return true;
    } catch (err: any) {
      console.error('Error deleting decision:', err);
      toast.error('Failed to delete decision');
      return false;
    }
  };

  const activeDecisions = decisions.filter((d) => d.status === 'active');
  const pendingDecisions = decisions.filter((d) => d.status === 'pending');
  const supersededDecisions = decisions.filter((d) => d.status === 'superseded');

  return {
    decisions,
    loading,
    error,
    refetch: fetchDecisions,
    createDecision,
    updateDecision,
    deleteDecision,
    activeDecisions,
    pendingDecisions,
    supersededDecisions,
  };
}
