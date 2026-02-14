/**
 * Workspace Service
 * Manages organizational units (divisions/departments) and team collaboration
 */

import { supabase } from '@/integrations/supabase/client';

export interface Workspace {
    id: string;
    tenant_id: string;
    name: string;
    description?: string;
    slug: string;
    ml_sharing_enabled: boolean;
    ml_sharing_scope: string;
    inherit_tenant_ml: boolean;
    settings: WorkspaceSettings;
    created_at: string;
    updated_at: string;
    is_active: boolean;
}

export interface WorkspaceSettings {
    default_project_template?: string | null;
    require_portfolio: boolean;
    auto_assign_members: boolean;
}

export interface WorkspaceMember {
    id: string;
    workspace_id: string;
    user_id: string;
    tenant_id: string;
    role: string;
    permissions: MemberPermissions;
    joined_at: string;
    is_active: boolean;
}

export interface MemberPermissions {
    can_create_projects: boolean;
    can_create_portfolios: boolean;
    can_manage_ml: boolean;
    can_invite_members: boolean;
}

export interface CreateWorkspaceParams {
    tenant_id: string;
    name: string;
    description?: string;
    slug: string;
}

/**
 * Get workspaces for a tenant
 */
export async function getWorkspaces(tenantId: string): Promise<Workspace[]> {
    const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('name');

    if (error) throw error;
    return data as Workspace[];
}

/**
 * Get workspace by ID
 */
export async function getWorkspace(workspaceId: string): Promise<Workspace | null> {
    const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', workspaceId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
    }
    return data as Workspace;
}

/**
 * Create new workspace
 */
export async function createWorkspace(params: CreateWorkspaceParams): Promise<Workspace> {
    const { data, error } = await supabase
        .from('workspaces')
        .insert({
            tenant_id: params.tenant_id,
            name: params.name,
            description: params.description,
            slug: params.slug,
        })
        .select()
        .single();

    if (error) throw error;
    return data as Workspace;
}

/**
 * Update workspace
 */
export async function updateWorkspace(
    workspaceId: string,
    updates: Partial<Workspace>
): Promise<Workspace> {
    const { data, error } = await supabase
        .from('workspaces')
        .update(updates)
        .eq('id', workspaceId)
        .select()
        .single();

    if (error) throw error;
    return data as Workspace;
}

/**
 * Delete workspace
 */
export async function deleteWorkspace(workspaceId: string): Promise<void> {
    const { error } = await supabase
        .from('workspaces')
        .update({ is_active: false })
        .eq('id', workspaceId);

    if (error) throw error;
}

// ============================================
// WORKSPACE MEMBERS
// ============================================

/**
 * Get workspace members
 */
export async function getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const { data, error } = await supabase
        .from('workspace_members')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('is_active', true)
        .order('joined_at');

    if (error) throw error;
    return data as WorkspaceMember[];
}

/**
 * Add member to workspace
 */
export async function addWorkspaceMember(
    workspaceId: string,
    userId: string,
    role: string = 'member'
): Promise<WorkspaceMember> {
    // Get workspace to get tenant_id
    const workspace = await getWorkspace(workspaceId);
    if (!workspace) throw new Error('Workspace not found');

    const { data, error } = await supabase
        .from('workspace_members')
        .insert({
            workspace_id: workspaceId,
            user_id: userId,
            tenant_id: workspace.tenant_id,
            role,
        })
        .select()
        .single();

    if (error) throw error;
    return data as WorkspaceMember;
}

/**
 * Remove member from workspace
 */
export async function removeWorkspaceMember(
    workspaceId: string,
    userId: string
): Promise<void> {
    const { error } = await supabase
        .from('workspace_members')
        .update({ is_active: false })
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId);

    if (error) throw error;
}

/**
 * Update member role
 */
export async function updateMemberRole(
    workspaceId: string,
    userId: string,
    role: string
): Promise<void> {
    const { error } = await supabase
        .from('workspace_members')
        .update({ role })
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId);

    if (error) throw error;
}

/**
 * Update member permissions
 */
export async function updateMemberPermissions(
    workspaceId: string,
    userId: string,
    permissions: Partial<MemberPermissions>
): Promise<void> {
    // Get current member
    const { data: member } = await supabase
        .from('workspace_members')
        .select('permissions')
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .single();

    if (!member) throw new Error('Member not found');

    const updatedPermissions = {
        ...member.permissions,
        ...permissions,
    };

    const { error } = await supabase
        .from('workspace_members')
        .update({ permissions: updatedPermissions })
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId);

    if (error) throw error;
}

/**
 * Get default workspace (for existing data)
 */
export async function getDefaultWorkspace(tenantId: string): Promise<Workspace> {
    const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('slug', 'default')
        .single();

    if (error) throw error;
    return data as Workspace;
}
