import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export interface UserPreference {
    id: string;
    user_id: string;
    project_id: string;
    preference_key: string;
    preference_value: unknown;
    updated_at: string;
}

export function useUserPreferences(projectId: string | null) {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Fetch all preferences for this project/user
    const query = useQuery({
        queryKey: ['user-preferences', projectId, user?.id],
        queryFn: async () => {
            if (!projectId || !user) return [];
            const { data, error } = await supabase
                .from('user_preferences')
                .select('*')
                .eq('project_id', projectId)
                .eq('user_id', user.id);

            if (error) {
                // Return empty if table doesn't exist yet (for smooth dev experience)
                if (error.code === '42P01') return [];
                throw error;
            }
            return data as UserPreference[];
        },
        enabled: !!projectId && !!user,
    });

    const updatePreference = useMutation({
        mutationFn: async ({ key, value }: { key: string; value: unknown }) => {
            if (!projectId || !user) throw new Error('No project or user');

            const { data, error } = await supabase
                .from('user_preferences')
                .upsert({
                    user_id: user.id,
                    project_id: projectId,
                    preference_key: key,
                    preference_value: value,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'user_id, project_id, preference_key' })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            queryClient.setQueryData(
                ['user-preferences', projectId, user?.id],
                (old: UserPreference[] | undefined) => {
                    if (!old) return [data];
                    const index = old.findIndex(p => p.preference_key === data.preference_key);
                    if (index >= 0) {
                        return [...old.slice(0, index), data, ...old.slice(index + 1)];
                    }
                    return [...old, data];
                }
            );
        },
        onError: (error) => {
            console.error('Failed to save preference:', error);
            // toast.error('Failed to save settings'); // Optional: Too noisy for auto-save
        }
    });

    const getPreference = (key: string) => {
        return query.data?.find(p => p.preference_key === key)?.preference_value;
    };

    return {
        preferences: query.data || [],
        isLoading: query.isLoading,
        updatePreference,
        getPreference,
    };
}
