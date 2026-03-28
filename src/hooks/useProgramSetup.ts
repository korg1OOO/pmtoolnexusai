import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProjectContext } from '@/contexts/ProjectContext';
import type { ExtractedContractData } from './useContractExtractor';

interface BrandConfig {
  primaryColor: string;   // HSL string e.g. "217 91% 60%"
  accentColor: string;
  sidebarColor: string;
  appName: string;
  logoUrl: string;
  borderRadius: string;
}

interface ContractConfig {
  contract_value: number;
  currency: string;
  payment_terms_days: number;
  penalty_rate_pct: number;
  penalty_cap_pct: number;
  acceptance_period_days: number;
  key_personnel_review_days: number;
  subcontractor_review_days: number;
  training_sessions_target: number;
  training_hours_target: number;
  training_max_per_session: number;
  hypercare_weeks: number;
  governing_reference: string;
  notes: string;
}

export function useProgramSetup() {
  const { settings } = useProjectContext();
  const projectId = settings.id;
  const qc = useQueryClient();

  const { data: contractConfig, isLoading: loadingContract } = useQuery({
    queryKey: ['program_contract_config', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_contract_config')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  const { data: keyPersonnel = [], isLoading: loadingKP } = useQuery({
    queryKey: ['key_personnel', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('key_personnel')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  const upsertContractConfig = useMutation({
    mutationFn: async (values: Partial<ContractConfig>) => {
      const { error } = await supabase
        .from('program_contract_config')
        .upsert({ ...values, project_id: projectId }, { onConflict: 'project_id' });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['program_contract_config', projectId] }),
  });

  const addKeyPerson = useMutation({
    mutationFn: async (values: { name: string; role: string; organisation: string; contract_start_date: string }) => {
      const { error } = await supabase.from('key_personnel').insert({ ...values, project_id: projectId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['key_personnel', projectId] }),
  });

  const removeKeyPerson = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('key_personnel').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['key_personnel', projectId] }),
  });

  const applyBranding = (config: BrandConfig) => {
    const root = document.documentElement;
    root.style.setProperty('--brand-primary', config.primaryColor);
    root.style.setProperty('--primary', config.primaryColor);
    root.style.setProperty('--brand-accent', config.accentColor);
    root.style.setProperty('--brand-sidebar', config.sidebarColor);
    root.style.setProperty('--sidebar-background', config.sidebarColor);
    root.style.setProperty('--brand-radius', config.borderRadius);
    root.style.setProperty('--radius', config.borderRadius);
    // Persist to localStorage so it survives reload
    localStorage.setItem('brand_config', JSON.stringify(config));
  };

  const loadSavedBranding = (): BrandConfig | null => {
    const saved = localStorage.getItem('brand_config');
    return saved ? JSON.parse(saved) : null;
  };

  const bulkImportFromContract = useMutation({
    mutationFn: async (data: ExtractedContractData) => {
      const results = await Promise.allSettled([
        // 1. Contract config
        supabase.from('program_contract_config').upsert(
          { ...data.contract_terms, project_id: projectId },
          { onConflict: 'project_id' }
        ),
        // 2. Key personnel (bulk)
        data.key_personnel.length > 0
          ? supabase.from('key_personnel').insert(
              data.key_personnel.map(p => ({ ...p, project_id: projectId }))
            )
          : Promise.resolve({ error: null }),
        // 3. Milestones (bulk)
        data.milestones.length > 0
          ? supabase.from('project_milestones').insert(
              data.milestones.map(m => ({
                project_id: projectId,
                name: m.name,
                description: m.description,
                due_date: m.due_date,
                status: 'on-track',
                progress: 0,
              }))
            )
          : Promise.resolve({ error: null }),
        // 4. Assumptions (bulk)
        data.assumptions.length > 0
          ? supabase.from('assumptions').insert(
              data.assumptions.map(a => ({
                project_id: projectId,
                title: a.title,
                category: a.category,
                owner_name: a.owner_name,
                impact_if_wrong: a.impact_if_wrong,
                status: 'open',
              }))
            )
          : Promise.resolve({ error: null }),
        // 5. Dependencies (bulk)
        data.dependencies.length > 0
          ? supabase.from('dependencies').insert(
              data.dependencies.map(d => ({
                project_id: projectId,
                title: d.title,
                dependent_on: d.dependent_on,
                provider: d.provider,
                owner_name: d.owner_name,
                notes: d.notes,
                status: 'pending',
              }))
            )
          : Promise.resolve({ error: null }),
        // 6. Risks (bulk)
        data.risks.length > 0
          ? supabase.from('risks').insert(
              data.risks.map(r => ({
                project_id: projectId,
                title: r.title,
                description: r.description,
                probability: r.probability,
                impact: r.impact,
                owner_name: r.owner_name,
                mitigation_plan: r.mitigation_plan,
                status: 'identified',
              }))
            )
          : Promise.resolve({ error: null }),
      ]);

      // Collect errors (don't throw — partial success is fine)
      const errors = results
        .filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && (r.value as { error: unknown }).error))
        .map(r => r.status === 'rejected' ? r.reason : (r.status === 'fulfilled' ? (r.value as { error: { message: string } }).error?.message : ''));

      return { errors, inserted: results.filter(r => r.status === 'fulfilled').length };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['program_contract_config', projectId] });
      qc.invalidateQueries({ queryKey: ['key_personnel', projectId] });
    },
  });

  return {
    projectId,
    contractConfig,
    keyPersonnel,
    loadingContract,
    loadingKP,
    upsertContractConfig,
    addKeyPerson,
    removeKeyPerson,
    applyBranding,
    loadSavedBranding,
    bulkImportFromContract,
  };
}
