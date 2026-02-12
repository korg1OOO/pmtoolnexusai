/**
 * Marketing Hooks
 * React Query hooks for announcements and feature flags
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase as _supabase } from '@/integrations/supabase/client';
const supabase = _supabase as any;
import { toast } from 'sonner';
import { useAuth } from './useAuth';

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
    const { user } = useAuth();

    if (!flag || !flag.is_enabled) return false;

    // Check rollout percentage (0-100)
    // Generate a deterministic number from user ID for consistent experience
    if (flag.rollout_percentage < 100) {
        if (!user?.id) return false;

        // Use hash of user ID to get a number between 0-99
        const hash = user.id.split('').reduce((acc, char) => {
            return ((acc << 5) - acc) + char.charCodeAt(0);
        }, 0);
        const userPercentile = Math.abs(hash % 100);

        if (userPercentile >= flag.rollout_percentage) {
            return false;
        }
    }

    // Check tier restrictions if specified
    if (flag.target_tiers && flag.target_tiers.length > 0) {
        // TODO: Fetch user's subscription tier from subscription_tiers table
        // For now, assume all users have access
        // In production, you would query the user's tier and check against target_tiers
        return true;
    }

    return true;
}

// ============ MARKETING CAMPAIGNS ============

export interface MarketingCampaign {
    id: string;
    name: string;
    type: 'email' | 'sms' | 'push' | 'in_app';
    status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled';
    subject: string | null;
    content: any;
    target_audience: any;
    scheduled_at: string | null;
    started_at: string | null;
    completed_at: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

export interface CampaignAnalytics {
    total_recipients: number;
    sent_count: number;
    delivered_count: number;
    opened_count: number;
    clicked_count: number;
    converted_count: number;
    bounced_count: number;
    unsubscribed_count: number;
    open_rate: number;
    click_rate: number;
    conversion_rate: number;
}

export function useCampaigns(status?: string) {
    return useQuery({
        queryKey: ['marketing-campaigns', status],
        queryFn: async () => {
            let query = supabase
                .from('marketing_campaigns')
                .select('*')
                .order('created_at', { ascending: false });

            if (status) {
                query = query.eq('status', status);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data as MarketingCampaign[];
        }
    });
}

export function useCampaign(id: string | undefined) {
    return useQuery({
        queryKey: ['marketing-campaign', id],
        queryFn: async () => {
            if (!id) return null;

            const { data, error } = await supabase
                .from('marketing_campaigns')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data as MarketingCampaign;
        },
        enabled: !!id
    });
}

export function useCampaignAnalytics(campaignId: string | undefined) {
    return useQuery({
        queryKey: ['campaign-analytics', campaignId],
        queryFn: async () => {
            if (!campaignId) return null;

            const { data, error } = await supabase
                .rpc('get_campaign_metrics', { p_campaign_id: campaignId });

            if (error) throw error;
            return data?.[0] as CampaignAnalytics;
        },
        enabled: !!campaignId,
        refetchInterval: 30000 // Refetch every 30s for live campaigns
    });
}

export function useCreateCampaign() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (campaignData: Partial<MarketingCampaign>) => {
            const { data, error } = await supabase
                .from('marketing_campaigns')
                .insert(campaignData)
                .select()
                .single();

            if (error) throw error;
            return data as MarketingCampaign;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
            toast.success('Campaign created successfully');
        },
        onError: (error: any) => {
            toast.error(`Failed to create campaign: ${error.message}`);
        }
    });
}

export function useUpdateCampaign() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<MarketingCampaign> }) => {
            const { data, error } = await supabase
                .from('marketing_campaigns')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as MarketingCampaign;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
            queryClient.invalidateQueries({ queryKey: ['marketing-campaign', variables.id] });
            toast.success('Campaign updated successfully');
        },
        onError: (error: any) => {
            toast.error(`Failed to update campaign: ${error.message}`);
        }
    });
}

export function useExecuteCampaign() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (campaignId: string) => {
            const { data, error } = await supabase.functions.invoke('execute-campaign', {
                body: { campaignId }
            });

            if (error) throw error;
            return data;
        },
        onSuccess: (_, campaignId) => {
            queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
            queryClient.invalidateQueries({ queryKey: ['marketing-campaign', campaignId] });
            queryClient.invalidateQueries({ queryKey: ['campaign-analytics', campaignId] });
            toast.success('Campaign executed successfully');
        },
        onError: (error: any) => {
            toast.error(`Failed to execute campaign: ${error.message}`);
        }
    });
}

export function usePauseCampaign() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (campaignId: string) => {
            const { data, error } = await supabase
                .from('marketing_campaigns')
                .update({ status: 'paused' })
                .eq('id', campaignId)
                .select()
                .single();

            if (error) throw error;
            return data as MarketingCampaign;
        },
        onSuccess: (_, campaignId) => {
            queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
            queryClient.invalidateQueries({ queryKey: ['marketing-campaign', campaignId] });
            toast.success('Campaign paused');
        },
        onError: (error: any) => {
            toast.error(`Failed to pause campaign: ${error.message}`);
        }
    });
}
