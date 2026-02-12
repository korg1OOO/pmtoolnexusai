/**
 * Marketing Hooks
 * React Query hooks for announcements and feature flags
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types
export interface Announcement {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'feature';
    target_audience?: any;
    link_url?: string;
    link_text?: string;
    is_dismissible: boolean;
    is_active: boolean;
    starts_at?: string;
    ends_at?: string;
    created_at: string;
    updated_at: string;
    dismissal_count?: number;
}

export interface FeatureFlag {
    id: string;
    name: string;
    description?: string;
    is_enabled: boolean;
    rollout_percentage: number;
    target_tiers?: string[];
    created_at: string;
    updated_at: string;
}

export interface CreateAnnouncementData {
    title: string;
    message: string;
    type: Announcement['type'];
    target_audience?: any;
    link_url?: string;
    link_text?: string;
    is_dismissible?: boolean;
    starts_at?: string;
    ends_at?: string;
}

export interface CreateFeatureFlagData {
    name: string;
    description?: string;
    is_enabled?: boolean;
    rollout_percentage?: number;
    target_tiers?: string[];
}

// ============ ANNOUNCEMENTS ============

export function useAnnouncements(activeOnly = false) {
    return useQuery({
        queryKey: ['announcements', activeOnly],
        queryFn: async () => {
            let query = supabase
                .from(activeOnly ? 'active_announcements' : 'announcements')
                .select('*')
                .order('created_at', { ascending: false });

            const { data, error } = await query;
            if (error) throw error;
            return data as Announcement[];
        }
    });
}

export function useAnnouncement(id: string) {
    return useQuery({
        queryKey: ['announcement', id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('announcements')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data as Announcement;
        },
        enabled: !!id
    });
}

export function useCreateAnnouncement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (announcementData: CreateAnnouncementData) => {
            const { data, error } = await supabase
                .from('announcements')
                .insert({
                    ...announcementData,
                    is_active: true
                })
                .select()
                .single();

            if (error) throw error;
            return data as Announcement;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['announcements'] });
            toast.success('Announcement created successfully');
        },
        onError: (error: any) => {
            toast.error(`Failed to create announcement: ${error.message}`);
        }
    });
}

export function useUpdateAnnouncement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<CreateAnnouncementData> }) => {
            const { data, error } = await supabase
                .from('announcements')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as Announcement;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['announcements'] });
            queryClient.invalidateQueries({ queryKey: ['announcement', variables.id] });
            toast.success('Announcement updated successfully');
        },
        onError: (error: any) => {
            toast.error(`Failed to update announcement: ${error.message}`);
        }
    });
}

export function useToggleAnnouncement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
            const { data, error } = await supabase
                .from('announcements')
                .update({ is_active: isActive })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as Announcement;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['announcements'] });
            toast.success('Announcement status updated');
        },
        onError: (error: any) => {
            toast.error(`Failed to toggle announcement: ${error.message}`);
        }
    });
}

export function useDeleteAnnouncement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('announcements')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['announcements'] });
            toast.success('Announcement deleted successfully');
        },
        onError: (error: any) => {
            toast.error(`Failed to delete announcement: ${error.message}`);
        }
    });
}

export function useDismissAnnouncement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (announcementId: string) => {
            const { data: { user } } = await supabase.auth.getUser();

            const { error } = await supabase
                .from('announcement_dismissals')
                .insert({
                    user_id: user?.id,
                    announcement_id: announcementId
                });

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['announcements'] });
        }
    });
}

// ============ FEATURE FLAGS ============

export function useFeatureFlags() {
    return useQuery({
        queryKey: ['feature-flags'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('feature_flags')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            return data as FeatureFlag[];
        }
    });
}

export function useFeatureFlag(id: string) {
    return useQuery({
        queryKey: ['feature-flag', id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('feature_flags')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data as FeatureFlag;
        },
        enabled: !!id
    });
}

export function useFeatureFlagByName(name: string) {
    return useQuery({
        queryKey: ['feature-flag-name', name],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('feature_flags')
                .select('*')
                .eq('name', name)
                .single();

            if (error) throw error;
            return data as FeatureFlag;
        },
        enabled: !!name
    });
}

export function useCreateFeatureFlag() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (flagData: CreateFeatureFlagData) => {
            const { data, error } = await supabase
                .from('feature_flags')
                .insert(flagData)
                .select()
                .single();

            if (error) throw error;
            return data as FeatureFlag;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
            toast.success('Feature flag created successfully');
        },
        onError: (error: any) => {
            toast.error(`Failed to create feature flag: ${error.message}`);
        }
    });
}

export function useUpdateFeatureFlag() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<CreateFeatureFlagData> }) => {
            const { data, error } = await supabase
                .from('feature_flags')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as FeatureFlag;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
            queryClient.invalidateQueries({ queryKey: ['feature-flag', variables.id] });
            toast.success('Feature flag updated successfully');
        },
        onError: (error: any) => {
            toast.error(`Failed to update feature flag: ${error.message}`);
        }
    });
}

export function useToggleFeatureFlag() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, isEnabled }: { id: string; isEnabled: boolean }) => {
            const { data, error } = await supabase
                .from('feature_flags')
                .update({ is_enabled: isEnabled })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as FeatureFlag;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
            toast.success('Feature flag toggled');
        },
        onError: (error: any) => {
            toast.error(`Failed to toggle feature flag: ${error.message}`);
        }
    });
}

export function useDeleteFeatureFlag() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('feature_flags')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
            toast.success('Feature flag deleted successfully');
        },
        onError: (error: any) => {
            toast.error(`Failed to delete feature flag: ${error.message}`);
        }
    });
}

// Helper to check if feature is enabled for current user
export function useIsFeatureEnabled(flagName: string): boolean {
    const { data: flag } = useFeatureFlagByName(flagName);

    if (!flag || !flag.is_enabled) return false;

    // TODO: Add tier checking and rollout percentage logic
    // For now, just return if enabled globally
    return flag.rollout_percentage === 100;
}
