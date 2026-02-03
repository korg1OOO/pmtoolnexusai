import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

export type Program = Database["public"]["Tables"]["programs"]["Row"];

export const usePrograms = (portfolioId?: string) => {
    return useQuery({
        queryKey: ["programs", portfolioId],
        queryFn: async () => {
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
            return data;
        },
    });
};

export const useProgram = (id: string | undefined) => {
    return useQuery({
        queryKey: ["programs", id],
        queryFn: async () => {
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
            return data;
        },
        enabled: !!id,
    });
};
