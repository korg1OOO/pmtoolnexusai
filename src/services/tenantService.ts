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
