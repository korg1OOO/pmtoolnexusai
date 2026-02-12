/**
 * AI Provider Settings Hooks
 * React Query hooks for managing AI provider configuration
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AIProviderSettings {
    id: string;
    user_id: string;
    organization_id?: string;
    active_provider: 'lovable' | 'openai' | 'anthropic' | 'google';
    selected_model: string;
    fallback_enabled: boolean;
    fallback_provider: 'lovable' | 'openai' | 'anthropic' | 'google';
    created_at: string;
    updated_at: string;
}

export interface AIProviderApiKey {
    id: string;
    user_id: string;
    organization_id?: string;
    provider_id: 'openai' | 'anthropic' | 'google';
    encrypted_api_key: string;
    is_configured: boolean;
    created_at: string;
    updated_at: string;
}

export interface UpdateAISettingsData {
    active_provider: AIProviderSettings['active_provider'];
    selected_model: string;
    fallback_enabled: boolean;
    fallback_provider: AIProviderSettings['fallback_provider'];
}

export interface UpsertAPIKeyData {
    provider_id: AIProviderApiKey['provider_id'];
    encrypted_api_key: string;
}

/**
 * Fetch AI provider settings for current user
 */
export function useAIProviderSettings() {
    return useQuery({
        queryKey: ['ai-provider-settings'],
        queryFn: async (): Promise<AIProviderSettings | null> => {
            const { data, error } = await supabase
                .from('ai_provider_settings')
                .select('*')
                .single();

            if (error) {
                // Return null if no settings exist yet (user hasn't configured)
                if (error.code === 'PGRST116') return null;
                throw error;
            }

            return data;
        },
    });
}

/**
 * Fetch API keys status for current user
 */
export function useAIProviderApiKeys() {
    return useQuery({
        queryKey: ['ai-provider-api-keys'],
        queryFn: async (): Promise<AIProviderApiKey[]> => {
            const { data, error } = await supabase
                .from('ai_provider_api_keys')
                .select('*');

            if (error) throw error;
            return data || [];
        },
    });
}

/**
 * Update AI provider settings
 */
export function useUpdateAISettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (settings: UpdateAISettingsData) => {
            // Upsert (insert or update)
            const { data, error } = await supabase
                .from('ai_provider_settings')
                .upsert({
                    ...settings,
                    user_id: (await supabase.auth.getUser()).data.user?.id,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-provider-settings'] });
            toast.success('AI settings saved successfully');
        },
        onError: () => {
            toast.error('Failed to save AI settings');
        },
    });
}

/**
 * Save/Update API key for a provider
 */
export function useUpsertAPIKey() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (keyData: UpsertAPIKeyData) => {
            const userId = (await supabase.auth.getUser()).data.user?.id;

            // Upsert API key
            const { data, error } = await supabase
                .from('ai_provider_api_keys')
                .upsert({
                    ...keyData,
                    user_id: userId,
                    is_configured: true,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['ai-provider-api-keys'] });
            toast.success(`API key for ${variables.provider_id} saved successfully`);
        },
        onError: () => {
            toast.error('Failed to save API key');
        },
    });
}

/**
 * Delete API key for a provider
 */
export function useDeleteAPIKey() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (providerId: AIProviderApiKey['provider_id']) => {
            const { error } = await supabase
                .from('ai_provider_api_keys')
                .delete()
                .eq('provider_id', providerId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-provider-api-keys'] });
            toast.success('API key removed successfully');
        },
        onError: () => {
            toast.error('Failed to remove API key');
        },
    });
}
