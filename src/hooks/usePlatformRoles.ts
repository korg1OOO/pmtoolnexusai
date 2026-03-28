/**
 * Platform Roles Management Hooks
 * Covers: platform_roles, platform_role_permissions, platform_user_roles, platform_role_audit_log
 * Supports tenant-level override isolation.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase as _supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

const supabase = _supabase as any;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlatformRole {
    id: string;
    name: string;
    description: string | null;
    scope: 'platform' | 'tenant';
    tenant_id: string | null;
    is_system_role: boolean;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

export interface RolePermission {
    id: string;
    role_id: string;
    feature_key: string;
    is_enabled: boolean;
}

export interface PlatformUserRole {
    id: string;
    user_id: string;
    role_id: string;
    tenant_id: string | null;
    assigned_by: string | null;
    assigned_at: string;
    // joined
    role?: PlatformRole;
    user_email?: string;
    user_name?: string;
}

export interface PlatformFeature {
    key: string;
    name: string;
    description: string | null;
    category: string;
    sort_order: number;
}

// ─── Feature Flags (from platform_features table) ────────────────────────────

export function usePlatformFeatures() {
    return useQuery<PlatformFeature[]>({
        queryKey: ['platform-features'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('platform_features')
                .select('*')
                .order('sort_order', { ascending: true });
            if (error) throw error;
            return data ?? [];
        },
    });
}

// ─── Platform Roles ───────────────────────────────────────────────────────────

export function usePlatformRoles(tenantId?: string | null) {
    return useQuery<PlatformRole[]>({
        queryKey: ['platform-roles', tenantId],
        queryFn: async () => {
            let q = supabase.from('platform_roles').select('*');
            if (tenantId) {
                // tenant admin: see platform roles + their own tenant roles
                q = q.or(`scope.eq.platform,tenant_id.eq.${tenantId}`);
            }
            const { data, error } = await q.order('created_at', { ascending: true });
            if (error) throw error;
            return data ?? [];
        },
    });
}

export function useCreatePlatformRole() {
    const qc = useQueryClient();
    const { user } = useAuth();
    return useMutation({
        mutationFn: async (payload: { name: string; description?: string; tenant_id?: string | null }) => {
            const { data, error } = await supabase
                .from('platform_roles')
                .insert({
                    name: payload.name,
                    description: payload.description ?? null,
                    scope: payload.tenant_id ? 'tenant' : 'platform',
                    tenant_id: payload.tenant_id ?? null,
                    created_by: user?.id ?? null,
                })
                .select()
                .single();
            if (error) throw error;
            // log
            await supabase.from('platform_role_audit_log').insert({
                actor_id: user?.id,
                action: 'create_role',
                role_id: data.id,
                after_state: data,
                tenant_id: payload.tenant_id ?? null,
            });
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['platform-roles'] });
            toast.success('Role created successfully');
        },
        onError: (e: Error) => toast.error('Failed to create role: ' + e.message),
    });
}

export function useDeletePlatformRole() {
    const qc = useQueryClient();
    const { user } = useAuth();
    return useMutation({
        mutationFn: async (roleId: string) => {
            const { data: role } = await supabase.from('platform_roles').select('*').eq('id', roleId).single();
            if (role?.is_system_role) throw new Error('Cannot delete system roles');
            const { error } = await supabase.from('platform_roles').delete().eq('id', roleId);
            if (error) throw error;
            await supabase.from('platform_role_audit_log').insert({
                actor_id: user?.id,
                action: 'delete_role',
                role_id: roleId,
                before_state: role,
                tenant_id: role?.tenant_id ?? null,
            });
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['platform-roles'] });
            toast.success('Role deleted');
        },
        onError: (e: Error) => toast.error(e.message),
    });
}

// ─── Role Permissions ─────────────────────────────────────────────────────────

export function useRolePermissions(roleId: string | null) {
    return useQuery<RolePermission[]>({
        queryKey: ['role-permissions', roleId],
        queryFn: async () => {
            if (!roleId) return [];
            const { data, error } = await supabase
                .from('platform_role_permissions')
                .select('*')
                .eq('role_id', roleId);
            if (error) throw error;
            return data ?? [];
        },
        enabled: !!roleId,
    });
}

export function useAllRolePermissions(roleIds: string[]) {
    return useQuery<RolePermission[]>({
        queryKey: ['all-role-permissions', roleIds],
        queryFn: async () => {
            if (roleIds.length === 0) return [];
            const { data, error } = await supabase
                .from('platform_role_permissions')
                .select('*')
                .in('role_id', roleIds);
            if (error) throw error;
            return data ?? [];
        },
        enabled: roleIds.length > 0,
    });
}

export function useToggleRolePermission() {
    const qc = useQueryClient();
    const { user } = useAuth();
    return useMutation({
        mutationFn: async ({
            roleId,
            featureKey,
            isEnabled,
        }: {
            roleId: string;
            featureKey: string;
            isEnabled: boolean;
        }) => {
            const { data, error } = await supabase
                .from('platform_role_permissions')
                .upsert({ role_id: roleId, feature_key: featureKey, is_enabled: isEnabled }, { onConflict: 'role_id,feature_key' })
                .select()
                .single();
            if (error) throw error;
            await supabase.from('platform_role_audit_log').insert({
                actor_id: user?.id,
                action: 'toggle_permission',
                role_id: roleId,
                feature_key: featureKey,
                before_state: { is_enabled: !isEnabled },
                after_state: { is_enabled: isEnabled },
            });
            return data;
        },
        onSuccess: (_d, vars) => {
            qc.invalidateQueries({ queryKey: ['role-permissions', vars.roleId] });
            qc.invalidateQueries({ queryKey: ['all-role-permissions'] });
        },
        onError: (e: Error) => toast.error('Failed to toggle permission: ' + e.message),
    });
}

// ─── User Role Assignments ────────────────────────────────────────────────────

export function usePlatformUserRoles(tenantId?: string | null) {
    return useQuery<any[]>({
        queryKey: ['platform-user-roles', tenantId],
        queryFn: async () => {
            let q = supabase
                .from('platform_user_roles')
                .select(`
          *,
          role:platform_roles(id, name, scope, is_system_role)
        `);
            if (tenantId) q = q.eq('tenant_id', tenantId);
            const { data, error } = await q.order('assigned_at', { ascending: false });
            if (error) throw error;
            return data ?? [];
        },
    });
}

export function useAssignPlatformRole() {
    const qc = useQueryClient();
    const { user } = useAuth();
    return useMutation({
        mutationFn: async ({
            userId,
            roleId,
            tenantId,
        }: {
            userId: string;
            roleId: string;
            tenantId?: string | null;
        }) => {
            const { data, error } = await supabase
                .from('platform_user_roles')
                .upsert(
                    { user_id: userId, role_id: roleId, tenant_id: tenantId ?? null, assigned_by: user?.id },
                    { onConflict: 'user_id,role_id,tenant_id' }
                )
                .select()
                .single();
            if (error) throw error;
            await supabase.from('platform_role_audit_log').insert({
                actor_id: user?.id,
                action: 'assign_role',
                role_id: roleId,
                user_id: userId,
                after_state: data,
                tenant_id: tenantId ?? null,
            });
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['platform-user-roles'] });
            toast.success('Role assigned successfully');
        },
        onError: (e: Error) => toast.error('Failed to assign role: ' + e.message),
    });
}

export function useRevokePlatformRole() {
    const qc = useQueryClient();
    const { user } = useAuth();
    return useMutation({
        mutationFn: async ({ assignmentId, roleId, userId, tenantId }: { assignmentId: string; roleId: string; userId: string; tenantId?: string | null }) => {
            const { error } = await supabase.from('platform_user_roles').delete().eq('id', assignmentId);
            if (error) throw error;
            await supabase.from('platform_role_audit_log').insert({
                actor_id: user?.id,
                action: 'revoke_role',
                role_id: roleId,
                user_id: userId,
                tenant_id: tenantId ?? null,
            });
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['platform-user-roles'] });
            toast.success('Role revoked');
        },
        onError: (e: Error) => toast.error('Failed to revoke role: ' + e.message),
    });
}

// ─── Effective Permissions ────────────────────────────────────────────────────

/**
 * Returns the effective merged permissions for a user:
 * tenant-level role permissions override platform-level defaults.
 */
export function useEffectivePermissions(userId: string | null, tenantId?: string | null) {
    return useQuery<Record<string, boolean>>({
        queryKey: ['effective-permissions', userId, tenantId],
        queryFn: async () => {
            if (!userId) return {};
            const { data: assignments, error } = await supabase
                .from('platform_user_roles')
                .select('role_id, tenant_id, role:platform_roles(scope)')
                .eq('user_id', userId);
            if (error) throw error;
            if (!assignments || assignments.length === 0) return {};

            const roleIds = assignments.map((a: any) => a.role_id);
            const { data: perms } = await supabase
                .from('platform_role_permissions')
                .select('*')
                .in('role_id', roleIds);

            const effective: Record<string, boolean> = {};
            // First apply platform-level
            (perms ?? [])
                .filter((p: any) => {
                    const assignment = assignments.find((a: any) => a.role_id === p.role_id);
                    return assignment?.role?.scope === 'platform';
                })
                .forEach((p: any) => { effective[p.feature_key] = p.is_enabled; });
            // Then apply tenant-level overrides
            if (tenantId) {
                (perms ?? [])
                    .filter((p: any) => {
                        const assignment = assignments.find((a: any) => a.role_id === p.role_id);
                        return assignment?.role?.scope === 'tenant' && assignment?.tenant_id === tenantId;
                    })
                    .forEach((p: any) => { effective[p.feature_key] = p.is_enabled; });
            }
            return effective;
        },
        enabled: !!userId,
    });
}
