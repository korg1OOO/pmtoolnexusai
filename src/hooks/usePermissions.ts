import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const usePermissions = () => {
    return useQuery({
        queryKey: ['permissions'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { canManagePortfolios: false, canManagePrograms: false, hasManagementAccess: false };

            // Check if user is owner of any portfolio
            const { count: portfolioCount } = await supabase
                .from('portfolios')
                .select('*', { count: 'exact', head: true })
                .eq('owner_id', user.id);

            // Check if user is owner of any program
            const { count: programCount } = await supabase
                .from('programs')
                .select('*', { count: 'exact', head: true })
                .eq('owner_id', user.id);

            const canManagePortfolios = (portfolioCount || 0) > 0;
            const canManagePrograms = (programCount || 0) > 0;

            return {
                canManagePortfolios,
                canManagePrograms,
                hasManagementAccess: canManagePortfolios || canManagePrograms
            };
        }
    });
};
