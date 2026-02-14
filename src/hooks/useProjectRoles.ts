/**
 * useProjectRoles Hook
 * React hook for managing project-specific roles
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getProjectRoles,
    createCustomRole,
    updateProjectRole,
    deleteCustomRole,
    resetStandardRole,
    CustomRole,
    CustomRoleInput,
} from '@/services/projectRolesService';
import { toast } from 'sonner';

export function useProjectRoles(projectId: string) {
    return useQuery({
        queryKey: ['project-roles', projectId],
        queryFn: () => getProjectRoles(projectId),
        enabled: !!projectId,
    });
}

export function useCreateCustomRole(projectId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (roleInput: CustomRoleInput) => createCustomRole(projectId, roleInput),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-roles', projectId] });
            toast.success('Custom role created successfully');
        },
        onError: (error: Error) => {
            toast.error(`Failed to create role: ${error.message}`);
        },
    });
}

export function useUpdateProjectRole(projectId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ roleId, updates }: { roleId: string; updates: Partial<CustomRoleInput> }) =>
            updateProjectRole(projectId, roleId, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-roles', projectId] });
            toast.success('Role updated successfully');
        },
        onError: (error: Error) => {
            toast.error(`Failed to update role: ${error.message}`);
        },
    });
}

export function useDeleteCustomRole(projectId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (roleId: string) => deleteCustomRole(projectId, roleId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-roles', projectId] });
            toast.success('Custom role deleted successfully');
        },
        onError: (error: Error) => {
            toast.error(`Failed to delete role: ${error.message}`);
        },
    });
}

export function useResetStandardRole(projectId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (roleId: string) => resetStandardRole(projectId, roleId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-roles', projectId] });
            toast.success('Role reset to default');
        },
        onError: (error: Error) => {
            toast.error(`Failed to reset role: ${error.message}`);
        },
    });
}
