import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProjectMember {
    id: string; // membership id
    project_id: string;
    user_id: string;
    role: 'owner' | 'admin' | 'member' | 'viewer';
    status: 'active' | 'invited' | 'inactive';
    joined_at: string;
    profile: {
        id: string;
        full_name: string | null;
        avatar_url: string | null;
        email: string | null;
        job_title: string | null;
    };
}

export function useProjectMembers(projectId: string | null) {
    const queryClient = useQueryClient();

    const { data: members, isLoading } = useQuery({
        queryKey: ['project-members', projectId],
        queryFn: async () => {
            if (!projectId) return [];

            // Since we don't have a direct relation set up in types yet or strict foreign keys might be tricky with auth.users
            // We will join manually or use the view if available.
            // Assuming 'profiles' table exists and is public.

            const { data, error } = await supabase
                .from('project_members')
                .select(`
          *,
          profile:profiles!public_project_members_user_id_fkey(*) 
        `)
                // Note: The foreign key might need to be explicit or we might need to fetch profiles separately if FK is not detected by PostgREST
                // Fallback or explicit query:
                .eq('project_id', projectId);

            if (error) {
                // Fallback: If relation fails, fetch members then profiles
                console.warn("Relation fetch failed, falling back to manual join", error);
                const { data: memberData, error: memberError } = await supabase
                    .from('project_members')
                    .select('*')
                    .eq('project_id', projectId);

                if (memberError) throw memberError;

                if (!memberData || memberData.length === 0) return [];

                const userIds = memberData.map(m => m.user_id);
                const { data: profiles, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .in('id', userIds);

                if (profileError) throw profileError;

                return memberData.map(m => ({
                    ...m,
                    profile: profiles?.find(p => p.id === m.user_id) || { id: m.user_id, full_name: 'Unknown', avatar_url: null, email: null }
                })) as ProjectMember[];
            }

            // If relation works
            return data.map((d: any) => ({
                ...d,
                profile: d.profile || { id: d.user_id, full_name: 'Unknown' } // Handle potential nulls
            })) as ProjectMember[];
        },
        enabled: !!projectId,
    });

    const addMember = useMutation({
        mutationFn: async ({ email, role }: { email: string; role: string }) => {
            if (!projectId) throw new Error("No project ID");

            // 1. Find user by email (Requires admin or RPC usually, but we'll try profiles look up if public)
            const { data: users, error: userError } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', email)
                .single();

            if (userError || !users) {
                // If profile not found, maybe invite flow? For now throw
                throw new Error("User not found via email");
            }

            const { error } = await supabase
                .from('project_members')
                .insert({
                    project_id: projectId,
                    user_id: users.id,
                    role,
                    status: 'active' // Auto activate for now
                });

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
            toast.success('Member added');
        },
        onError: (error) => toast.error('Failed to add member: ' + error.message),
    });

    const removeMember = useMutation({
        mutationFn: async (userId: string) => {
            if (!projectId) return;
            const { error } = await supabase
                .from('project_members')
                .delete()
                .eq('project_id', projectId)
                .eq('user_id', userId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
            toast.success('Member removed');
        },
    });

    return {
        members,
        isLoading,
        addMember,
        removeMember
    };
}
