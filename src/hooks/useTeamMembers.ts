import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Profile } from './useProfiles';
import { ProjectRole } from '@/types/ai-agents';

export interface TeamMember extends Profile {
    role: ProjectRole;
    joined_at: string;
}

export function useTeamMembers(projectId: string | null) {
    return useQuery({
        queryKey: ['team-members', projectId],
        queryFn: async () => {
            if (!projectId) return [];

            // 1. Get all roles for this project
            const { data: roles, error: rolesError } = await supabase
                .from('user_roles')
                .select('*')
                .eq('project_id', projectId);

            if (rolesError) throw rolesError;
            if (!roles || roles.length === 0) return [];

            const userIds = roles.map(r => r.user_id);

            // 2. Get profiles for these users
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('*')
                .in('id', userIds);

            if (profilesError) {
                // Fallback if profiles table missing, just return roles with IDs
                console.warn('Could not fetch profiles:', profilesError);
                return roles.map(r => ({
                    id: r.user_id,
                    email: 'Unknown',
                    full_name: 'Unknown User',
                    avatar_url: null,
                    updated_at: null,
                    role: r.role,
                    joined_at: r.created_at || new Date().toISOString()
                })) as TeamMember[];
            }

            // 3. Merge data
            const mergedMembers = roles.map(role => {
                const profile = profiles?.find(p => p.id === role.user_id);
                return {
                    id: role.user_id,
                    role: role.role,
                    joined_at: role.created_at || new Date().toISOString(),
                    email: profile?.email || 'Unknown',
                    full_name: profile?.full_name || 'Unknown User',
                    avatar_url: profile?.avatar_url || null,
                    updated_at: profile?.updated_at || null,
                };
            });

            return mergedMembers as TeamMember[];
        },
        enabled: !!projectId,
    });
}

export function useAddTeamMember() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ projectId, email, role }: { projectId: string; email: string; role: ProjectRole }) => {
            // 1. Find user by email (public profiles)
            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', email)
                .single();

            if (profileError || !profiles) {
                throw new Error('User not found. They must sign up first.');
            }

            // 2. Add role
            const { data, error } = await supabase
                .from('user_roles')
                .insert({
                    project_id: projectId,
                    user_id: profiles.id,
                    role: role
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['team-members', variables.projectId] });
            toast.success('Team member added successfully');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    });
}

export function useRemoveTeamMember() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ projectId, userId }: { projectId: string; userId: string }) => {
            const { error } = await supabase
                .from('user_roles')
                .delete()
                .match({ project_id: projectId, user_id: userId });

            if (error) throw error;
            return { projectId, userId };
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['team-members', variables.projectId] });
            toast.success('Team member removed');
        },
        onError: (error: Error) => {
            toast.error('Failed to remove member: ' + error.message);
        }
    });
}

export function useUpdateTeamMemberRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ projectId, userId, role }: { projectId: string; userId: string; role: ProjectRole }) => {
            const { data, error } = await supabase
                .from('user_roles')
                .update({ role })
                .match({ project_id: projectId, user_id: userId })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['team-members', variables.projectId] });
            toast.success('Role updated');
        },
        onError: (error: Error) => {
            toast.error('Failed to update role: ' + error.message);
        }
    });
}
