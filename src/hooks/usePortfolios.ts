import { useQuery } from "@tanstack/react-query";
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
