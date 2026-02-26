/**
 * useSubscriptionLimits — centralized subscription limit enforcement.
 *
 * This hook provides:
 *  - The user's current tier and plan limits
 *  - Live usage counts (projects, team members, storage)
 *  - Helper functions to check if a limit is reached
 *  - A blocking function that shows a toast + returns false when over limit
 *
 * Usage:
 *  const { canCreateProject, requireLimit, usage, limits } = useSubscriptionLimits();
 *
 *  // Before creating a project:
 *  if (!requireLimit('projects')) return; // shows toast + redirects to pricing
 *
 *  // In render, to conditionally disable buttons:
 *  <Button disabled={!canCreateProject}>New Project</Button>
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserTier, useTierLimits, type SubscriptionTier } from '@/hooks/useFeatureAccess';
import { toast } from 'sonner';
import { useCallback, useMemo } from 'react';

export interface UsageData {
    projects: number;
    teamMembers: number;
    storageMB: number;
}

export interface SubscriptionLimitsReturn {
    tier: SubscriptionTier;
    tierLoading: boolean;
    limits: { projects: number; teamMembers: number; fileSize: number; storage: number; aiCredits: number };
    usage: UsageData;
    usageLoading: boolean;

    /** True when the user is below the limit (or limit is unlimited) */
    canCreateProject: boolean;
    canAddTeamMember: boolean;

    /** Returns true if within limit. Shows toast + returns false when blocked. */
    requireLimit: (resource: 'projects' | 'teamMembers' | 'storage') => boolean;

    /** Returns usage percentage (0-100), capped at 100. -1 for unlimited. */
    usagePercent: (resource: 'projects' | 'teamMembers' | 'storage') => number;
}

const RESOURCE_LABELS: Record<string, string> = {
    projects: 'projects',
    teamMembers: 'team members',
    storage: 'storage',
};

export function useSubscriptionLimits(): SubscriptionLimitsReturn {
    const { data: tier = 'free', isLoading: tierLoading } = useUserTier();
    const limits = useTierLimits(tier);

    // Real usage data — same query as SubscriptionWidget but DRY via shared queryKey
    const { data: usage = { projects: 0, teamMembers: 0, storageMB: 0 }, isLoading: usageLoading } = useQuery({
        queryKey: ['subscription-usage'],
        queryFn: async (): Promise<UsageData> => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { projects: 0, teamMembers: 0, storageMB: 0 };

            const { count: projectCount } = await (supabase as any)
                .from('projects')
                .select('*', { count: 'exact', head: true });

            const { count: memberCount } = await (supabase as any)
                .from('workspace_members')
                .select('*', { count: 'exact', head: true });

            const { data: docs } = await (supabase as any)
                .from('documents')
                .select('file_size');

            const totalStorageMB = (docs || []).reduce((s: number, d: any) => s + (d.file_size || 0), 0) / (1024 * 1024);

            return {
                projects: projectCount || 0,
                teamMembers: memberCount || 0,
                storageMB: Math.round(totalStorageMB),
            };
        },
        refetchInterval: 60000,
    });

    const isWithinLimit = useCallback((resource: 'projects' | 'teamMembers' | 'storage') => {
        if (resource === 'projects') {
            return limits.projects === -1 || usage.projects < limits.projects;
        }
        if (resource === 'teamMembers') {
            return limits.teamMembers === -1 || usage.teamMembers < limits.teamMembers;
        }
        if (resource === 'storage') {
            return limits.storage === -1 || usage.storageMB < limits.storage;
        }
        return true;
    }, [limits, usage]);

    const requireLimit = useCallback((resource: 'projects' | 'teamMembers' | 'storage'): boolean => {
        if (isWithinLimit(resource)) return true;

        const label = RESOURCE_LABELS[resource] || resource;
        toast.error(`${tier.charAt(0).toUpperCase() + tier.slice(1)} plan limit reached`, {
            description: `You've reached the maximum number of ${label} for your ${tier} plan. Upgrade to continue.`,
            action: {
                label: 'View Plans',
                onClick: () => { window.location.href = '/pricing'; },
            },
            duration: 8000,
        });
        return false;
    }, [isWithinLimit, tier]);

    const usagePercent = useCallback((resource: 'projects' | 'teamMembers' | 'storage'): number => {
        if (resource === 'projects') {
            if (limits.projects === -1) return -1;
            return Math.min((usage.projects / limits.projects) * 100, 100);
        }
        if (resource === 'teamMembers') {
            if (limits.teamMembers === -1) return -1;
            return Math.min((usage.teamMembers / limits.teamMembers) * 100, 100);
        }
        if (resource === 'storage') {
            if (limits.storage === -1) return -1;
            return Math.min((usage.storageMB / limits.storage) * 100, 100);
        }
        return 0;
    }, [limits, usage]);

    const canCreateProject = useMemo(() => isWithinLimit('projects'), [isWithinLimit]);
    const canAddTeamMember = useMemo(() => isWithinLimit('teamMembers'), [isWithinLimit]);

    return {
        tier,
        tierLoading,
        limits,
        usage,
        usageLoading,
        canCreateProject,
        canAddTeamMember,
        requireLimit,
        usagePercent,
    };
}
