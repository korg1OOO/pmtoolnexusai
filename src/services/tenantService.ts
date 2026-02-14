/**
 * Tenant Service
 * Manages company-level tenants and ML configuration
 */

import { supabase as _supabase } from '@/integrations/supabase/client';
const supabase = _supabase as any;

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

// ============================================
// DEPARTMENTS (NEW)
// ============================================

export interface Department {
    id: string;
    tenant_id: string;
    parent_id?: string;
    name: string;
    description?: string;
    budget?: number;
    spent?: number;
    manager_id?: string;
    member_count: number;
    created_at: string;
    updated_at: string;
}

/**
 * Get departments for a tenant
 */
export async function getDepartments(tenantId: string): Promise<Department[]> {
    const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('name');

    if (error) throw error;
    return data as Department[];
}

/**
 * Create department
 */
export async function createDepartment(
    tenantId: string,
    department: Omit<Department, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>
): Promise<Department> {
    const { data, error } = await supabase
        .from('departments')
        .insert({
            tenant_id: tenantId,
            ...department,
        })
        .select()
        .single();

    if (error) throw error;
    return data as Department;
}

/**
 * Update department
 */
export async function updateDepartment(
    id: string,
    updates: Partial<Omit<Department, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>
): Promise<Department> {
    const { data, error } = await supabase
        .from('departments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as Department;
}

/**
 * Delete department
 */
export async function deleteDepartment(id: string): Promise<void> {
    const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// ============================================
// LICENSES (NEW)
// ============================================

export interface License {
    id: string;
    tenant_id: string;
    license_type: string;
    total_licenses: number;
    allocated_licenses: number;
    price_per_license?: number;
    renewal_date?: string;
    status: string;
    created_at: string;
    updated_at: string;
}

/**
 * Get licenses for a tenant
 */
export async function getLicenses(tenantId: string): Promise<License[]> {
    const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('license_type');

    if (error) throw error;
    return data as License[];
}

/**
 * Create license
 */
export async function createLicense(
    tenantId: string,
    license: Omit<License, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>
): Promise<License> {
    const { data, error } = await supabase
        .from('licenses')
        .insert({
            tenant_id: tenantId,
            ...license,
        })
        .select()
        .single();

    if (error) throw error;
    return data as License;
}

/**
 * Update license
 */
export async function updateLicense(
    id: string,
    updates: Partial<Omit<License, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>
): Promise<License> {
    const { data, error } = await supabase
        .from('licenses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as License;
}

/**
 * Allocate license
 */
export async function allocateLicense(licenseId: string): Promise<License> {
    const { data: license } = await supabase
        .from('licenses')
        .select('*')
        .eq('id', licenseId)
        .single();

    if (!license) throw new Error('License not found');

    const { data, error } = await supabase
        .from('licenses')
        .update({ allocated_licenses: license.allocated_licenses + 1 })
        .eq('id', licenseId)
        .select()
        .single();

    if (error) throw error;
    return data as License;
}

/**
 * Deallocate license
 */
export async function deallocateLicense(licenseId: string): Promise<License> {
    const { data: license } = await supabase
        .from('licenses')
        .select('*')
        .eq('id', licenseId)
        .single();

    if (!license) throw new Error('License not found');

    const { data, error } = await supabase
        .from('licenses')
        .update({ allocated_licenses: Math.max(0, license.allocated_licenses - 1) })
        .eq('id', licenseId)
        .select()
        .single();

    if (error) throw error;
    return data as License;
}

