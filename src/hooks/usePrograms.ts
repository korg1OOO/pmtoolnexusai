import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { PortfolioProgram, PortfolioProject } from "./usePortfolios";

export type Program = Database["public"]["Tables"]["programs"]["Row"];

export const usePrograms = (portfolioId?: string) => {
    return useQuery({
        queryKey: ["programs", portfolioId],
        queryFn: async (): Promise<PortfolioProgram[]> => {
            let query = supabase
                .from("programs")
                .select(`
          *,
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
            end_date
          )
        `);

            if (portfolioId) {
                query = query.eq("portfolio_id", portfolioId);
            }

            const { data, error } = await query.order("name");

            if (error) throw error;
            return data as unknown as PortfolioProgram[];
        },
    });
};

export const useProgram = (id: string | undefined) => {
    return useQuery({
        queryKey: ["programs", id],
        queryFn: async (): Promise<PortfolioProgram | null> => {
            if (!id) return null;
            const { data, error } = await supabase
                .from("programs")
                .select(`
          *,
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
        `)
                .eq("id", id)
                .single();

            if (error) throw error;
            return data as unknown as PortfolioProgram;
        },
    });
};

export const useCreateProgram = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (newProgram: { name: string; description?: string; status?: 'active' | 'archived'; portfolio_id: string }) => {
            const { data, error } = await supabase
                .from('programs')
                .insert(newProgram)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['programs'] });
        },
    });
};

export const useUpdateProgram = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (program: { id: string; name?: string; description?: string; status?: 'active' | 'archived'; owner_id?: string }) => {
            const { data, error } = await supabase
                .from('programs')
                .update(program)
                .eq('id', program.id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['programs'] });
        },
    });
};

export const useDeleteProgram = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('programs')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['programs'] });
        },
    });
};
