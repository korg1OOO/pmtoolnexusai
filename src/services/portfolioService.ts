/**
 * Portfolio Service
 * Manages programs/initiatives grouping related projects
 */

import { supabase } from '@/integrations/supabase/client';

export interface Portfolio {
    id: string;
    tenant_id: string;
    workspace_id: string;
    name: string;
    description?: string;
    slug: string;
    portfolio_type: string;
    start_date?: string;
    end_date?: string;
    status: string;
    ml_sharing_scope: string;
    inherit_workspace_ml: boolean;
    total_budget?: number;
    currency: string;
    created_at: string;
    updated_at: string;
    is_active: boolean;
}

export interface PortfolioStats {
    total_projects: number;
    active_projects: number;
    completed_projects: number;
    total_budget: number;
    spent_budget: number;
    ml_patterns_count: number;
}

export interface MLMetrics {
    total_patterns: number;
    active_patterns: number;
    avg_success_rate: number;
    total_predictions: number;
}

export interface CreatePortfolioParams {
    tenant_id: string;
    workspace_id: string;
    name: string;
    description?: string;
    slug: string;
    portfolio_type?: string;
    start_date?: string;
    end_date?: string;
}

/**
 * Get portfolios for a workspace
 */
export async function getPortfolios(workspaceId: string): Promise<Portfolio[]> {
    const { data, error } = await supabase
        .from('portfolios')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('is_active', true)
        .order('name');

    if (error) throw error;
    return data as Portfolio[];
}

/**
 * Get portfolio by ID
 */
export async function getPortfolio(portfolioId: string): Promise<Portfolio | null> {
    const { data, error } = await supabase
        .from('portfolios')
        .select('*')
        .eq('id', portfolioId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
    }
    return data as Portfolio;
}

/**
 * Create new portfolio
 */
export async function createPortfolio(params: CreatePortfolioParams): Promise<Portfolio> {
    const { data, error } = await supabase
        .from('portfolios')
        .insert({
            tenant_id: params.tenant_id,
            workspace_id: params.workspace_id,
            name: params.name,
            description: params.description,
            slug: params.slug,
            portfolio_type: params.portfolio_type || 'program',
            start_date: params.start_date,
            end_date: params.end_date,
        })
        .select()
        .single();

    if (error) throw error;
    return data as Portfolio;
}

/**
 * Update portfolio
 */
export async function updatePortfolio(
    portfolioId: string,
    updates: Partial<Portfolio>
): Promise<Portfolio> {
    const { data, error } = await supabase
        .from('portfolios')
        .update(updates)
        .eq('id', portfolioId)
        .select()
        .single();

    if (error) throw error;
    return data as Portfolio;
}

/**
 * Delete portfolio
 */
export async function deletePortfolio(portfolioId: string): Promise<void> {
    const { error } = await supabase
        .from('portfolios')
        .update({ is_active: false })
        .eq('id', portfolioId);

    if (error) throw error;
}

/**
 * Get portfolio statistics
 */
export async function getPortfolioStats(portfolioId: string): Promise<PortfolioStats> {
    // Get projects in portfolio
    const { data: projects } = await supabase
        .from('projects')
        .select('id, status, budget')
        .eq('portfolio_id', portfolioId);

    const total_projects = projects?.length || 0;
    const active_projects = projects?.filter(p => p.status === 'active').length || 0;
    const completed_projects = projects?.filter(p => p.status === 'completed').length || 0;
    const total_budget = projects?.reduce((sum, p) => sum + (p.budget || 0), 0) || 0;

    // Get ML patterns for portfolio
    const { data: patterns } = await supabase
        .from('ml_learning_patterns')
        .select('id')
        .eq('portfolio_id', portfolioId)
        .eq('is_active', true);

    return {
        total_projects,
        active_projects,
        completed_projects,
        total_budget,
        spent_budget: 0, // TODO: Calculate from actual spending
        ml_patterns_count: patterns?.length || 0,
    };
}

/**
 * Get portfolio ML metrics
 */
export async function getPortfolioMLMetrics(portfolioId: string): Promise<MLMetrics> {
    // Get patterns
    const { data: patterns } = await supabase
        .from('ml_learning_patterns')
        .select('success_rate, is_active')
        .eq('portfolio_id', portfolioId);

    const total_patterns = patterns?.length || 0;
    const active_patterns = patterns?.filter(p => p.is_active).length || 0;
    const avg_success_rate = patterns?.length
        ? patterns.reduce((sum, p) => sum + p.success_rate, 0) / patterns.length
        : 0;

    // Get predictions
    const { data: predictions } = await supabase
        .from('ml_predictions')
        .select('id')
        .in('project_id',
            await supabase
                .from('projects')
                .select('id')
                .eq('portfolio_id', portfolioId)
                .then(r => r.data?.map(p => p.id) || [])
        );

    return {
        total_patterns,
        active_patterns,
        avg_success_rate,
        total_predictions: predictions?.length || 0,
    };
}

// ============================================
// PORTFOLIO INITIATIVES (NEW)
// ============================================

export interface PortfolioInitiative {
    id: string;
    portfolio_id: string;
    name: string;
    start_date?: string;
    end_date?: string;
    status: string;
    milestones: number;
    dependencies?: any[];
    created_at: string;
    updated_at: string;
}

/**
 * Get portfolio initiatives
 */
export async function getPortfolioInitiatives(portfolioId: string): Promise<PortfolioInitiative[]> {
    const { data, error } = await supabase
        .from('portfolio_initiatives')
        .select('*')
        .eq('portfolio_id', portfolioId)
        .order('start_date', { ascending: true });

    if (error) throw error;
    return data as PortfolioInitiative[];
}

/**
 * Create portfolio initiative
 */
export async function createPortfolioInitiative(
    portfolioId: string,
    initiative: Omit<PortfolioInitiative, 'id' | 'portfolio_id' | 'created_at' | 'updated_at'>
): Promise<PortfolioInitiative> {
    const { data, error } = await supabase
        .from('portfolio_initiatives')
        .insert({
            portfolio_id: portfolioId,
            ...initiative,
        })
        .select()
        .single();

    if (error) throw error;
    return data as PortfolioInitiative;
}

/**
 * Update portfolio initiative
 */
export async function updatePortfolioInitiative(
    id: string,
    updates: Partial<Omit<PortfolioInitiative, 'id' | 'portfolio_id' | 'created_at' | 'updated_at'>>
): Promise<PortfolioInitiative> {
    const { data, error } = await supabase
        .from('portfolio_initiatives')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as PortfolioInitiative;
}

/**
 * Delete portfolio initiative
 */
export async function deletePortfolioInitiative(id: string): Promise<void> {
    const { error } = await supabase
        .from('portfolio_initiatives')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// ============================================
// PORTFOLIO RESOURCES (NEW)
// ============================================

export interface PortfolioResource {
    id: string;
    portfolio_id: string;
    program_id?: string;
    required: number;
    allocated: number;
    skills_needed: string[];
    created_at: string;
    updated_at: string;
}

/**
 * Get portfolio resources
 */
export async function getPortfolioResources(portfolioId: string): Promise<PortfolioResource[]> {
    const { data, error } = await supabase
        .from('portfolio_resources')
        .select('*')
        .eq('portfolio_id', portfolioId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as PortfolioResource[];
}

/**
 * Update portfolio resources
 */
export async function updatePortfolioResources(
    portfolioId: string,
    resources: Omit<PortfolioResource, 'id' | 'created_at' | 'updated_at'>[]
): Promise<PortfolioResource[]> {
    // Delete existing resources
    await supabase
        .from('portfolio_resources')
        .delete()
        .eq('portfolio_id', portfolioId);

    // Insert new resources
    const { data, error } = await supabase
        .from('portfolio_resources')
        .insert(resources)
        .select();

    if (error) throw error;
    return data as PortfolioResource[];
}

