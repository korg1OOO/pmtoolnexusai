import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

export type Portfolio = Database["public"]["Tables"]["portfolios"]["Row"];

export const usePortfolios = () => {
  return useQuery({
    queryKey: ["portfolios"],
    queryFn: async () => {
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
      return data;
    },
  });
};

export const usePortfolio = (id: string | undefined) => {
  return useQuery({
    queryKey: ["portfolios", id],
    queryFn: async () => {
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
      return data;
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
