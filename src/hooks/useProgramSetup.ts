import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProjectContext } from '@/contexts/ProjectContext';

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
  };
}
