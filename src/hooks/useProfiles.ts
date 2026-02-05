import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Profile {
    id: string;
    email: string | null;
    full_name: string | null;
    avatar_url: string | null;
    updated_at: string | null;
}

export function useProfiles() {
    return useQuery({
        queryKey: ['profiles'],
        queryFn: async (): Promise<Profile[]> => {
            try {
                const { data, error } = await (supabase as any)
                    .from('profiles')
                    .select('*');

                if (error) {
                    console.warn('Profiles table may not exist:', error);
                    return [];
                }
                return data || [];
            } catch (e) {
                console.warn('Error fetching profiles:', e);
                return [];
            }
        },
    });
}

export function useProfileById(userId: string | null) {
    return useQuery({
        queryKey: ['profile', userId],
        queryFn: async (): Promise<Profile | null> => {
            if (!userId) return null;

            try {
                const { data, error } = await (supabase as any)
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (error) return null;
                return data;
            } catch {
                return null;
            }
        },
        enabled: !!userId,
    });
}

export function useUpdateProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...updates }: Partial<Profile> & { id: string }) => {
            const { data, error } = await (supabase as any)
                .from('profiles')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as Profile;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['profiles'] });
            queryClient.invalidateQueries({ queryKey: ['profile', data.id] });
            toast.success('Profile updated');
        },
        onError: (error: Error) => {
            toast.error(`Failed to update profile: ${error.message}`);
        },
    });
}
