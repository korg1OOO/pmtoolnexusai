import { supabase as _supabase } from '@/integrations/supabase/client';
const supabase = _supabase as any;

export interface User {
    id: string;
    tenant_id: string;
    email: string;
    full_name: string;
    role: 'admin' | 'manager' | 'member' | 'viewer';
    status: 'active' | 'inactive' | 'suspended';
    department_id?: string;
    workspace_id?: string;
    avatar_url?: string;
    phone?: string;
    job_title?: string;
    created_at: string;
    updated_at: string;
    last_login_at?: string;
    metadata?: Record<string, any>;
}

export interface UserRole {
    id: string;
    user_id: string;
    role_name: string;
    permissions: string[];
    assigned_by?: string;
    assigned_at: string;
    expires_at?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

/**
 * Get all users for a tenant
 */
export async function getUsers(tenantId: string): Promise<User[]> {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('full_name');

    if (error) throw error;
    return data as User[];
}

/**
 * Get a single user by ID
 */
export async function getUser(userId: string): Promise<User> {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) throw error;
    return data as User;
}

/**
 * Create a new user
 */
export async function createUser(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const { data, error } = await supabase
        .from('users')
        .insert(user)
        .select()
        .single();

    if (error) throw error;
    return data as User;
}

/**
 * Update a user
 */
export async function updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
        .from('users')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

    if (error) throw error;
    return data as User;
}

/**
 * Delete a user
 */
export async function deleteUser(userId: string): Promise<void> {
    const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

    if (error) throw error;
}

/**
 * Get user roles for a user
 */
export async function getUserRoles(userId: string): Promise<UserRole[]> {
    const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('assigned_at', { ascending: false });

    if (error) throw error;
    return data as UserRole[];
}

/**
 * Assign a role to a user
 */
export async function assignUserRole(userRole: Omit<UserRole, 'id' | 'created_at' | 'updated_at'>): Promise<UserRole> {
    const { data, error } = await supabase
        .from('user_roles')
        .insert(userRole)
        .select()
        .single();

    if (error) throw error;
    return data as UserRole;
}

/**
 * Revoke a user role
 */
export async function revokeUserRole(roleId: string): Promise<void> {
    const { error } = await supabase
        .from('user_roles')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', roleId);

    if (error) throw error;
}

/**
 * Update user status
 */
export async function updateUserStatus(userId: string, status: User['status']): Promise<User> {
    return updateUser(userId, { status });
}
