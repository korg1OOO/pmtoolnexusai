/**
 * Tenant Service
 * Manages company-level tenants and ML configuration
 */

import { supabase } from '@/integrations/supabase/client';

export interface Tenant {
    id: string;
    name: string;
    slug: string;
    ml_config: MLConfig;
    subscription_tier: string;
    max_workspaces: number;
    max_projects: number;
    max_users: number;
    created_at: string;
    updated_at: string;
    is_active: boolean;
}

export interface MLConfig {
    enabled: boolean;
    cross_project_learning: boolean;
    cross_workspace_learning: boolean;
    auto_learning_enabled: boolean;
    min_feedbacks_for_pattern: number;
    pattern_approval_required: boolean;
    allow_manual_learnings: boolean;
}

export interface CreateTenantParams {
    name: string;
    slug: string;
    ml_config?: Partial<MLConfig>;
}

/**
 * Get tenant by ID
 */
export async function getTenant(tenantId: string): Promise<Tenant | null> {
    const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single();

    if (error) throw error;
    return data as Tenant;
}

/**
 * Get tenant by slug
 */
export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
    const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', slug)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
    }
    return data as Tenant;
}

/**
 * Create new tenant
 */
export async function createTenant(params: CreateTenantParams): Promise<Tenant> {
    const { data, error } = await supabase
        .from('tenants')
        .insert({
            name: params.name,
            slug: params.slug,
            ml_config: params.ml_config || {},
        })
        .select()
        .single();

    if (error) throw error;
    return data as Tenant;
}

/**
 * Update tenant ML configuration
 */
export async function updateTenantMLConfig(
    tenantId: string,
    config: Partial<MLConfig>
): Promise<void> {
    const tenant = await getTenant(tenantId);
    if (!tenant) throw new Error('Tenant not found');

    const updatedConfig = {
        ...tenant.ml_config,
        ...config,
    };

    const { error } = await supabase
        .from('tenants')
        .update({ ml_config: updatedConfig })
        .eq('id', tenantId);

    if (error) throw error;
}

/**
 * Get tenant ML configuration
 */
export async function getTenantMLConfig(tenantId: string): Promise<MLConfig> {
    const tenant = await getTenant(tenantId);
    if (!tenant) throw new Error('Tenant not found');
    return tenant.ml_config;
}

/**
 * Get default tenant (for existing data)
 */
export async function getDefaultTenant(): Promise<Tenant> {
    const tenant = await getTenantBySlug('default');
    if (!tenant) throw new Error('Default tenant not found');
    return tenant;
}

// ===== Dashboard & Admin Functions =====

export interface TenantOverview {
    total_workspaces: number;
    total_users: number;
    total_projects: number;
    active_programs: number;
    subscription_status: string;
    subscription_tier: string;
}

export interface WorkspaceListItem {
    id: string;
    name: string;
    slug: string;
    member_count: number;
    project_count: number;
    created_at: string;
    is_active: boolean;
}

/**
 * Get tenant overview statistics
 */
export async function getTenantOverview(tenantId: string): Promise<TenantOverview> {
    // Get workspaces count
    const { count: workspacesCount } = await supabase
        .from('workspaces')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);

    // Get users count
    const { count: usersCount } = await supabase
        .from('workspace_members')
        .select('user_id', { count: 'exact', head: true })
        .eq('workspace.tenant_id', tenantId);

    // Get projects count
    const { count: projectsCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);

    // Get active programs count
    const { count: programsCount } = await supabase
        .from('programs')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

    const tenant = await getTenant(tenantId);

    return {
        total_workspaces: workspacesCount || 0,
        total_users: usersCount || 0,
        total_projects: projectsCount || 0,
        active_programs: programsCount || 0,
        subscription_status: 'active',
        subscription_tier: tenant?.subscription_tier || 'free'
    };
}

/**
 * Get all workspaces for tenant
 */
export async function getWorkspaces(tenantId: string): Promise<WorkspaceListItem[]> {
    const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

    if (error) throw error;

    // Get member and project counts for each workspace
    const workspacesWithCounts = await Promise.all(
        (data || []).map(async (workspace) => {
            const { count: memberCount } = await supabase
                .from('workspace_members')
                .select('*', { count: 'exact', head: true })
                .eq('workspace_id', workspace.id);

            const { count: projectCount } = await supabase
                .from('projects')
                .select('*', { count: 'exact', head: true })
                .eq('workspace_id', workspace.id);

            return {
                id: workspace.id,
                name: workspace.name,
                slug: workspace.slug,
                member_count: memberCount || 0,
                project_count: projectCount || 0,
                created_at: workspace.created_at,
                is_active: workspace.is_active
            };
        })
    );

    return workspacesWithCounts;
}

/**
 * Create new workspace
 */
export async function createWorkspace(tenantId: string, data: {
    name: string;
    slug: string;
    description?: string;
}) {
    const { data: workspace, error } = await supabase
        .from('workspaces')
        .insert({
            tenant_id: tenantId,
            name: data.name,
            slug: data.slug,
            description: data.description
        })
        .select()
        .single();

    if (error) throw error;
    return workspace;
}

/**
 * Update workspace
 */
export async function updateWorkspace(workspaceId: string, data: Partial<{
    name: string;
    slug: string;
    description: string;
    is_active: boolean;
}>) {
    const { data: workspace, error } = await supabase
        .from('workspaces')
        .update(data)
        .eq('id', workspaceId)
        .select()
        .single();

    if (error) throw error;
    return workspace;
}

/**
 * Delete workspace
 */
export async function deleteWorkspace(workspaceId: string) {
    const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', workspaceId);

    if (error) throw error;
}

/**
 * Get tenant settings
 */
export async function getTenantSettings(tenantId: string) {
    const { data, error } = await supabase
        .from('tenants')
        .select('settings')
        .eq('id', tenantId)
        .single();

    if (error) throw error;
    return data?.settings || {};
}

/**
 * Update tenant settings
 */
export async function updateTenantSettings(tenantId: string, settings: any) {
    const { data, error } = await supabase
        .from('tenants')
        .update({ settings })
        .eq('id', tenantId)
        .select()
        .single();

    if (error) throw error;
    return data;
}
