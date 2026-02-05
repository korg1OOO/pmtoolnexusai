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
        queryFn: async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('*');

            if (error) {
                // Fallback for when the table doesn't exist yet (during development)
                console.warn('Error fetching profiles (table might be missing):', error);
                return [];
            }

            return data as Profile[];
        },
    });
}

export function useProfile(userId: string | null) {
    return useQuery({
        queryKey: ['profile', userId],
        queryFn: async () => {
            if (!userId) return null;

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            return data as Profile;
        },
        enabled: !!userId,
    });
}

export function useUpdateProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...updates }: Partial<Profile> & { id: string }) => {
            const { data, error } = await supabase
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
