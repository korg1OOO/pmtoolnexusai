import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SidebarBadges {
    actions: number;
    risks: number;
    issues: number;
}

async function fetchSidebarBadges(projectId: string): Promise<SidebarBadges> {
    const [actionsResult, risksResult, issuesResult] = await Promise.all([
        supabase
            .from('actions')
            .select('id', { count: 'exact', head: true })
            .eq('project_id', projectId)
            .eq('status', 'open'),
        supabase
            .from('risks')
            .select('id', { count: 'exact', head: true })
            .eq('project_id', projectId)
            .in('status', ['open', 'active']),
        supabase
            .from('issues')
            .select('id', { count: 'exact', head: true })
            .eq('project_id', projectId)
            .in('status', ['open', 'in-progress']),
    ]);

    return {
        actions: actionsResult.count ?? 0,
        risks: risksResult.count ?? 0,
        issues: issuesResult.count ?? 0,
    };
}

export function useSidebarBadges(projectId: string | undefined) {
    return useQuery({
        queryKey: ['sidebar-badges', projectId],
        queryFn: () => fetchSidebarBadges(projectId!),
        enabled: !!projectId,
        refetchInterval: 60_000, // refresh every 60s
        staleTime: 30_000,
    });
}
