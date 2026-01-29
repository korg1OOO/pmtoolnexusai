import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProjectContext } from '@/contexts/ProjectContext';
import { toast } from 'sonner';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type RiskStatus = 'identified' | 'analyzing' | 'mitigating' | 'closed' | 'accepted';

export interface Risk { id: string; project_id: string | null; title: string; description: string | null; category: string | null; probability: RiskLevel; impact: RiskLevel; status: RiskStatus; owner_id: string | null; owner_name: string | null; mitigation_plan: string | null; contingency_plan: string | null; triggers: string | null; linked_items: any[]; due_date: string | null; created_at: string; updated_at: string; closed_at: string | null; }
export interface RiskInput { title: string; description?: string; category?: string; probability?: RiskLevel; impact?: RiskLevel; status?: RiskStatus; owner_name?: string; mitigation_plan?: string; contingency_plan?: string; triggers?: string; due_date?: string; }

export function useRisks() {
  const { settings } = useProjectContext();
  const projectId = settings.id;
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRisks = useCallback(async () => {
    if (!projectId) { setRisks([]); setLoading(false); return; }
    try {
      setLoading(true);
      const { data, error: e } = await supabase.from('risks').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
      if (e) throw e;
      setRisks((data || []).map((r: any) => ({ ...r, probability: r.probability as RiskLevel, impact: r.impact as RiskLevel, status: r.status as RiskStatus, linked_items: Array.isArray(r.linked_items) ? r.linked_items : [] })));
      setError(null);
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { fetchRisks(); }, [fetchRisks]);

  useEffect(() => {
    if (!projectId) return;
    const channel = supabase.channel('risks-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'risks', filter: `project_id=eq.${projectId}` }, () => fetchRisks()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [projectId, fetchRisks]);

  const createRisk = async (input: RiskInput) => {
    if (!projectId) { toast.error('No project selected'); return null; }
    try {
      const { data, error: e } = await supabase.from('risks').insert({ project_id: projectId, title: input.title, description: input.description || null, category: input.category || null, probability: input.probability || 'medium', impact: input.impact || 'medium', status: input.status || 'identified', owner_name: input.owner_name || null, mitigation_plan: input.mitigation_plan || null, contingency_plan: input.contingency_plan || null, triggers: input.triggers || null, due_date: input.due_date || null }).select().single();
      if (e) throw e;
      toast.success('Risk created'); return data;
    } catch { toast.error('Failed to create risk'); return null; }
  };

  const updateRisk = async (id: string, updates: Partial<RiskInput>) => {
    try {
      const updateData: any = { ...updates };
      if (updates.status === 'closed') updateData.closed_at = new Date().toISOString();
      const { error: e } = await supabase.from('risks').update(updateData).eq('id', id);
      if (e) throw e; toast.success('Risk updated'); return true;
    } catch { toast.error('Failed to update risk'); return false; }
  };

  const deleteRisk = async (id: string) => { try { await supabase.from('risks').delete().eq('id', id); toast.success('Risk deleted'); return true; } catch { toast.error('Failed'); return false; } };

  const criticalRisks = risks.filter(r => r.impact === 'critical' || r.probability === 'critical');
  const openRisks = risks.filter(r => r.status !== 'closed');
  const mitigatingRisks = risks.filter(r => r.status === 'mitigating');

  return { risks, loading, error, refetch: fetchRisks, createRisk, updateRisk, deleteRisk, criticalRisks, openRisks, mitigatingRisks };
}
