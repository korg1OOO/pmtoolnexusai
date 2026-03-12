/**
 * Project Roles Service
 * Manages project-specific role customization
 */

import { supabase as _supabase } from '@/integrations/supabase/client';
const supabase = _supabase as any;
import { ProjectRole } from '@/types/ai-agents';

export interface CustomRole {
    id: string;
    project_id: string;
    role_id: string;
    role_name: string;
    role_description?: string;
    permissions: string[];
    color: string;
    icon: string;
    is_custom: boolean;
    based_on_role?: string;
    created_at: string;
    updated_at: string;
    created_by?: string;
}

export interface CustomRoleInput {
    role_id: string;
    role_name: string;
    role_description?: string;
    permissions?: string[];
    color?: string;
    icon?: string;
    is_custom?: boolean;
    based_on_role?: string;
}

// Standard roles definition
const STANDARD_ROLES = [
    {
        role_id: 'admin',
        role_name: 'Project Administrator',
        role_description: 'Full control over project settings and team',
        permissions: ['all'],
        color: '#f59e0b',
        icon: 'Crown',
        is_custom: false,
    },
    {
        role_id: 'pm',
        role_name: 'Project Manager',
        role_description: 'Manage project plan, resources, and deliverables',
        permissions: ['manage_plan', 'manage_team', 'manage_risks', 'view_financials', 'manage_meetings'],
        color: '#a855f7',
        icon: 'Briefcase',
        is_custom: false,
    },
    {
        role_id: 'lead',
        role_name: 'Team Lead',
        role_description: 'Lead a functional team and manage assignments',
        permissions: ['manage_tasks', 'manage_sprints', 'view_reports', 'manage_team_members'],
        color: '#3b82f6',
        icon: 'Star',
        is_custom: false,
    },
    {
        role_id: 'developer',
        role_name: 'Developer',
        role_description: 'Work on assigned tasks and update progress',
        permissions: ['update_tasks', 'view_plan', 'log_time', 'view_docs'],
        color: '#22c55e',
        icon: 'UserCheck',
        is_custom: false,
    },
    {
        role_id: 'analyst',
        role_name: 'Business Analyst',
        role_description: 'Define requirements and manage documentation',
        permissions: ['manage_requirements', 'manage_docs', 'view_plan', 'create_reports'],
        color: '#06b6d4',
        icon: 'UserCheck',
        is_custom: false,
    },
    {
        role_id: 'viewer',
        role_name: 'Viewer',
        role_description: 'Read-only access to project information',
        permissions: ['view_plan', 'view_reports', 'view_docs'],
        color: '#6b7280',
        icon: 'Users',
        is_custom: false,
    },
];

/**
 * Get all roles for a project (standard + custom)
 * Returns custom roles and standard roles not overridden
 */
export async function getProjectRoles(projectId: string): Promise<CustomRole[]> {
    const { data: customRoles, error } = await supabase
        .from('project_custom_roles')
        .select('*')
        .eq('project_id', projectId);

    if (error) throw error;

    // Get role IDs that have been customized
    const customizedRoleIds = new Set(customRoles?.map(r => r.role_id) || []);

    // Merge standard roles (not customized) with custom roles
    const standardRolesNotCustomized = STANDARD_ROLES
        .filter(r => !customizedRoleIds.has(r.role_id))
        .map(r => ({
            id: `standard-${r.role_id}`,
            project_id: projectId,
            ...r,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }));

    return [...(customRoles || []), ...standardRolesNotCustomized];
}

/**
 * Create a new custom role
 */
export async function createCustomRole(
    projectId: string,
    roleInput: CustomRoleInput
): Promise<CustomRole> {
    const { data, error } = await supabase
        .from('project_custom_roles')
        .insert({
            project_id: projectId,
            ...roleInput,
            is_custom: true,
            created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Update a project role (custom or standard)
 * If updating a standard role, creates a custom override
 */
export async function updateProjectRole(
    projectId: string,
    roleId: string,
    updates: Partial<CustomRoleInput>
): Promise<CustomRole> {
    // Check if custom role already exists
    const { data: existing } = await supabase
        .from('project_custom_roles')
        .select('*')
        .eq('project_id', projectId)
        .eq('role_id', roleId)
        .single();

    if (existing) {
        // Update existing custom role
        const { data, error } = await supabase
            .from('project_custom_roles')
            .update(updates)
            .eq('id', existing.id)
            .select()
            .single();

        if (error) throw error;
        return data;
    } else {
        // Create custom override for standard role
        const standardRole = STANDARD_ROLES.find(r => r.role_id === roleId);
        if (!standardRole) throw new Error('Role not found');

        const { data, error } = await supabase
            .from('project_custom_roles')
            .insert({
                project_id: projectId,
                role_id: roleId,
                role_name: updates.role_name || standardRole.role_name,
                role_description: updates.role_description || standardRole.role_description,
                permissions: updates.permissions || standardRole.permissions,
                color: updates.color || standardRole.color,
                icon: updates.icon || standardRole.icon,
                is_custom: false,
                based_on_role: roleId,
                created_by: (await supabase.auth.getUser()).data.user?.id,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}

/**
 * Delete a custom role
 * Cannot delete standard roles, only custom ones
 */
export async function deleteCustomRole(projectId: string, roleId: string): Promise<void> {
    const { error } = await supabase
        .from('project_custom_roles')
        .delete()
        .eq('project_id', projectId)
        .eq('role_id', roleId)
        .eq('is_custom', true);

    if (error) throw error;
}

/**
 * Reset a standard role to default
 * Removes the custom override
 */
export async function resetStandardRole(projectId: string, roleId: string): Promise<void> {
    const { error } = await supabase
        .from('project_custom_roles')
        .delete()
        .eq('project_id', projectId)
        .eq('role_id', roleId)
        .eq('is_custom', false);

    if (error) throw error;
}

/**
 * Get standard roles (for reference)
 */
export function getStandardRoles() {
    return STANDARD_ROLES;
}
