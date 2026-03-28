/**
 * useAdminMetricsTrend
 *
 * Computes period-over-period trend percentages for the Admin Dashboard metric cards.
 * Compares "current period" (last 30 days) vs "previous period" (31–60 days ago)
 * for: active users (7d), total users, MRR, and projects.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase as _supabase } from '@/integrations/supabase/client';

const supabase = _supabase as any;

function pctChange(current: number, previous: number): number | null {
    if (previous === 0) return current > 0 ? 100 : null;
    return parseFloat((((current - previous) / previous) * 100).toFixed(1));
}

interface AdminMetricsTrend {
    usersTrend: number | null;          // total user growth % vs last month
    activeUsersTrend: number | null;    // 7-day active users change % vs prior 7-day window
    activeUsersCount: number;           // actual count from DB (not formula)
    mrrTrend: number | null;            // MRR change % vs last month
    projectsTrend: number | null;       // new projects this month vs last month
}

export function useAdminMetricsTrend() {
    return useQuery<AdminMetricsTrend>({
        queryKey: ['admin-metrics-trend'],
        queryFn: async (): Promise<AdminMetricsTrend> => {
            const now = new Date();

            // Period boundaries
            const d30 = new Date(now.getTime() - 30 * 86400_000).toISOString();
            const d60 = new Date(now.getTime() - 60 * 86400_000).toISOString();
            const d7 = new Date(now.getTime() - 7 * 86400_000).toISOString();
            const d14 = new Date(now.getTime() - 14 * 86400_000).toISOString();

            const [
                usersThisMonth,
                usersLastMonth,
                activeNow,
                activePrev,
                subsThis,
                subsLast,
                projThis,
                projLast,
            ] = await Promise.all([
                // Users created in last 30 days
                supabase.from('profiles').select('id', { count: 'exact', head: true })
                    .gte('created_at', d30),
                // Users created 31-60 days ago
                supabase.from('profiles').select('id', { count: 'exact', head: true })
                    .gte('created_at', d60).lt('created_at', d30),

                // Active users: last_sign_in_at within 7 days (raw count)
                supabase.from('profiles').select('id', { count: 'exact', head: true })
                    .gte('updated_at', d7),
                // Active users: last_sign_in_at between 8–14 days ago
                supabase.from('profiles').select('id', { count: 'exact', head: true })
                    .gte('updated_at', d14).lt('updated_at', d7),

                // Subscriptions created last 30 days (count as proxy for MRR growth)
                supabase.from('subscriptions').select('id', { count: 'exact', head: true })
                    .gte('created_at', d30).eq('status', 'active'),
                // Subscriptions created 31-60 days ago
                supabase.from('subscriptions').select('id', { count: 'exact', head: true })
                    .gte('created_at', d60).lt('created_at', d30).eq('status', 'active'),

                // Projects created last 30 days
                supabase.from('projects').select('id', { count: 'exact', head: true })
                    .gte('created_at', d30),
                // Projects created 31-60 days ago
                supabase.from('projects').select('id', { count: 'exact', head: true })
                    .gte('created_at', d60).lt('created_at', d30),
            ]);

            return {
                usersTrend: pctChange(usersThisMonth.count ?? 0, usersLastMonth.count ?? 0),
                activeUsersTrend: pctChange(activeNow.count ?? 0, activePrev.count ?? 0),
                activeUsersCount: activeNow.count ?? 0,
                mrrTrend: pctChange(subsThis.count ?? 0, subsLast.count ?? 0),
                projectsTrend: pctChange(projThis.count ?? 0, projLast.count ?? 0),
            };
        },
        staleTime: 5 * 60_000, // 5 min cache
        retry: 1,
    });
}
