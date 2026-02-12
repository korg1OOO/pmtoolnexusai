/**
 * Admin Management Hooks
 * Hooks for managing admin roles, permissions, and activity logging
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const db = supabase as any;

export interface Permission {
    id: string;
    name: string;
    description: string;
    resource_type: string;
    action_type: string;
    created_at: string;
    updated_at: string;
}

export function usePermissions() {
    return useQuery({
        queryKey: ['permissions'],
        queryFn: async () => {
            const { data, error } = await db.from('permissions').select('*').order('resource_type, action_type');
            if (error) throw error;
            return data as Permission[];
        },
    });
}

export function useCreatePermission() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (permissionData: { name: string; description: string; resource_type: string; action_type: string }) => {
            const { data, error } = await db.from('permissions').insert([permissionData]).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['permissions'] });
            toast({ title: 'Permission Created', description: 'Permission created successfully' });
        },
        onError: (error: Error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        },
    });
}

export function useUpdatePermission() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ id, ...updates }: { id: string; name?: string; description?: string; resource_type?: string; action_type?: string }) => {
            const { data, error } = await db.from('permissions').update(updates).eq('id', id).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['permissions'] });
            toast({ title: 'Permission Updated', description: 'Permission updated successfully' });
        },
        onError: (error: Error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        },
    });
}

export function useDeletePermission() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (permissionId: string) => {
            const { error } = await db.from('permissions').delete().eq('id', permissionId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['permissions'] });
            toast({ title: 'Permission Deleted', description: 'Permission deleted successfully' });
        },
        onError: (error: Error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        },
    });
}

export interface AdminRole {
    id: string;
    name: string;
    description: string;
    permissions: Record<string, string[]>;
    is_system_role: boolean;
    created_at: string;
    updated_at: string;
}

export interface AdminUser {
    user_id: string;
    email?: string;
    full_name?: string;
    role_id: string;
    role_name?: string;
    role_description?: string;
    permissions?: Record<string, string[]>;
    granted_by: string;
    granted_at: string;
    revoked_at?: string;
    revoked_by?: string;
    notes?: string;
}

export interface AdminActivityLog {
    id: string;
    admin_user_id: string;
    admin_email?: string;
    action: string;
    resource_type?: string;
    resource_id?: string;
    details?: Record<string, any>;
    ip_address?: string;
    user_agent?: string;
    created_at: string;
}

export function useAdminRoles() {
    return useQuery({
        queryKey: ['admin-roles'],
        queryFn: async () => {
            const { data, error } = await db.from('admin_roles').select('*').order('name');
            if (error) throw error;
            return data as AdminRole[];
        },
    });
}

export function useCreateAdminRole() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (roleData: { name: string; description: string; permissions: Record<string, string[]> }) => {
            const { data, error } = await db.from('admin_roles').insert([roleData]).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
            toast({ title: 'Role Created', description: 'Admin role created successfully' });
        },
        onError: (error: Error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        },
    });
}

export function useUpdateAdminRole() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ id, ...updates }: { id: string; name?: string; description?: string; permissions?: Record<string, string[]> }) => {
            const { data, error } = await db.from('admin_roles').update(updates).eq('id', id).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
            toast({ title: 'Role Updated', description: 'Admin role updated successfully' });
        },
        onError: (error: Error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        },
    });
}

export function useDeleteAdminRole() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (roleId: string) => {
            const { error } = await db.from('admin_roles').delete().eq('id', roleId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
            toast({ title: 'Role Deleted', description: 'Admin role deleted successfully' });
        },
        onError: (error: Error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        },
    });
}

export function useAdminUsers() {
    return useQuery({
        queryKey: ['admin-users'],
        queryFn: async () => {
            const { data, error } = await db.from('active_admin_users').select('*');
            if (error) throw error;
            return data as AdminUser[];
        },
    });
}

export function useGrantAdminAccess() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (adminData: { user_id: string; role_id: string; notes?: string }) => {
            const { data: { user } } = await supabase.auth.getUser();
            const { data, error } = await db.from('admin_users').insert([{ ...adminData, granted_by: user?.id }]).select().single();
            if (error) throw error;
            await db.rpc('log_admin_activity', {
                p_admin_user_id: user?.id,
                p_action: 'admin.grant_access',
                p_resource_type: 'user',
                p_resource_id: adminData.user_id,
                p_details: { role_id: adminData.role_id },
            });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            toast({ title: 'Admin Access Granted', description: 'User granted admin access successfully' });
        },
        onError: (error: Error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        },
    });
}

export function useRevokeAdminAccess() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (userId: string) => {
            const { data: { user } } = await supabase.auth.getUser();
            const { error } = await db.from('admin_users').update({ revoked_at: new Date().toISOString(), revoked_by: user?.id }).eq('user_id', userId);
            if (error) throw error;
            await db.rpc('log_admin_activity', {
                p_admin_user_id: user?.id,
                p_action: 'admin.revoke_access',
                p_resource_type: 'user',
                p_resource_id: userId,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            toast({ title: 'Admin Access Revoked', description: 'User admin access revoked successfully' });
        },
        onError: (error: Error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        },
    });
}

export function useUpdateAdminRole_User() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
            const { data: { user } } = await supabase.auth.getUser();
            const { error } = await db.from('admin_users').update({ role_id: roleId }).eq('user_id', userId);
            if (error) throw error;
            await db.rpc('log_admin_activity', {
                p_admin_user_id: user?.id,
                p_action: 'admin.update_role',
                p_resource_type: 'user',
                p_resource_id: userId,
                p_details: { new_role_id: roleId },
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            toast({ title: 'Role Updated', description: 'Admin role updated successfully' });
        },
        onError: (error: Error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        },
    });
}

export function useAdminActivityLog(filters?: { adminId?: string; resourceType?: string; limit?: number }) {
    return useQuery({
        queryKey: ['admin-activity-log', filters],
        queryFn: async () => {
            let query = db.from('admin_activity_log').select('*').order('created_at', { ascending: false }).limit(filters?.limit || 100);
            if (filters?.adminId) query = query.eq('admin_user_id', filters.adminId);
            if (filters?.resourceType) query = query.eq('resource_type', filters.resourceType);
            const { data, error } = await query;
            if (error) throw error;
            return data as AdminActivityLog[];
        },
    });
}

export function useAdminActivitySummary() {
    return useQuery({
        queryKey: ['admin-activity-summary'],
        queryFn: async () => {
            const { data, error } = await db.from('admin_activity_summary').select('*').order('activity_date', { ascending: false }).limit(30);
            if (error) throw error;
            return data;
        },
    });
}

export function useCheckPermission() {
    return useMutation({
        mutationFn: async ({ resource, action }: { resource: string; action: string }) => {
            const { data: { user } } = await supabase.auth.getUser();
            const { data, error } = await db.rpc('check_admin_permission', {
                p_user_id: user?.id,
                p_resource: resource,
                p_action: action,
            });
            if (error) throw error;
            return data as boolean;
        },
    });
}

export function useCurrentUserPermissions() {
    return useQuery({
        queryKey: ['current-user-permissions'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            const { data, error } = await db.from('active_admin_users').select('permissions').eq('user_id', user?.id).single();
            if (error) throw error;
            return data?.permissions as Record<string, string[]> | null;
        },
    });
}
