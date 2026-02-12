import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase as _supabase } from "@/integrations/supabase/client";
const supabase = _supabase as any;
import { Database } from "@/integrations/supabase/types";

export type Portfolio = Database["public"]["Tables"]["portfolios"]["Row"];

export interface PortfolioProject {
  id: string;
  name: string;
  budget: number | null;
  spent: number | null;
  progress: number | null;
  health: 'green' | 'amber' | 'red' | string | null;
  code?: string;
  status?: string;
  end_date?: string;
  description?: string;
  manager?: string;
  team?: string[];
  milestones?: { name: string; date: string; status: string }[];
  risks?: { name: string; severity: string }[];
  burndownData?: { week: string; planned: number; actual: number }[];
  programCode?: string;
}

export interface PortfolioProgram {
  id: string;
  name: string;
  code?: string;
  status?: string;
  projects: PortfolioProject[];
}

export interface PortfolioWithPrograms extends Portfolio {
  programs: PortfolioProgram[];
}

export const usePortfolios = () => {
  return useQuery({
    queryKey: ["portfolios"],
    queryFn: async (): Promise<PortfolioWithPrograms[]> => {
      const { data, error } = await supabase
        .from("portfolios")
        .select(`
          *,
          programs (
            id,
            name,
            projects (
              id,
              name,
              budget,
              spent,
              progress,
              health
            )
          )
        `)
        .order("name");

      if (error) throw error;
      return data as unknown as PortfolioWithPrograms[];
    },
  });
};

export const usePortfolio = (id: string | undefined) => {
  return useQuery({
    queryKey: ["portfolios", id],
    queryFn: async (): Promise<PortfolioWithPrograms | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("portfolios")
        .select(`
          *,
          programs (
            id,
            name,
            code,
            status,
            owner_id,
            projects (
              id,
              name,
              code,
              status,
              health,
              progress,
              budget,
              spent,
              owner_id,
              end_date,
              description
            )
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as unknown as PortfolioWithPrograms;
    },
    enabled: !!id,
  });
};

export const useCreatePortfolio = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newPortfolio: { name: string; description?: string; status?: 'active' | 'archived' }) => {
      const { data, error } = await supabase
        .from('portfolios')
        .insert(newPortfolio)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
    },
  });
};

export const useUpdatePortfolio = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; description?: string; status?: 'active' | 'archived' }) => {
      const { data, error } = await supabase
        .from('portfolios')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
    },
  });
};

export const useDeletePortfolio = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('portfolios')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
    },
  });
};
