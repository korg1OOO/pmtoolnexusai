import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type Portfolio = Tables<'portfolios'>;
export type Program = Tables<'programs'>;

export function usePortfolios() {
    return useQuery({
        queryKey: ['portfolios'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('portfolios')
                .select('*')
                .order('name');
            if (error) throw error;
            return data as Portfolio[];
        },
    });
}

export function usePrograms(portfolioId?: string) {
    return useQuery({
        queryKey: ['programs', portfolioId],
        queryFn: async () => {
            let query = supabase.from('programs').select('*');
            if (portfolioId) {
                query = query.eq('portfolio_id', portfolioId);
            }
            const { data, error } = await query.order('name');
            if (error) throw error;
            return data as Program[];
        },
    });
}
