import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProjectMember {
    id: string;
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

            try {
                const { data: memberData, error: memberError } = await (supabase as any)
                    .from('project_members')
                    .select('*')
                    .eq('project_id', projectId);

                if (memberError) throw memberError;
                if (!memberData || memberData.length === 0) return [];

                const userIds = memberData.map((m: any) => m.user_id);
                const { data: profiles } = await (supabase as any)
                    .from('profiles')
                    .select('*')
                    .in('id', userIds);

                return memberData.map((m: any) => ({
                    ...m,
                    profile: profiles?.find((p: any) => p.id === m.user_id) || { id: m.user_id, full_name: 'Unknown', avatar_url: null, email: null }
                })) as ProjectMember[];
            } catch (err) {
                console.warn('project_members table may not exist:', err);
                return [];
            }
        },
        enabled: !!projectId,
    });

    const addMember = useMutation({
        mutationFn: async ({ email, role }: { email: string; role: string }) => {
            if (!projectId) throw new Error("No project ID");

            const { data: users, error: userError } = await (supabase as any)
                .from('profiles')
                .select('id')
                .eq('email', email)
                .single();

            if (userError || !users) {
                throw new Error("User not found via email");
            }

            const { error } = await (supabase as any)
                .from('project_members')
                .insert({
                    project_id: projectId,
                    user_id: users.id,
                    role,
                    status: 'active'
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
            const { error } = await (supabase as any)
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
