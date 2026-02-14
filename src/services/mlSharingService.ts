/**
 * ML Sharing Service
 * Manages cross-project ML pattern sharing and hierarchical pattern discovery
 */

import { supabase as _supabase } from '@/integrations/supabase/client';
const supabase = _supabase as any;

export interface ProjectHierarchy {
    tenant_id: string;
    workspace_id: string | null;
    portfolio_id: string | null;
    project_id: string;
}

export interface SharingStats {
    total_patterns: number;
    project_patterns: number;
    portfolio_patterns: number;
    workspace_patterns: number;
    tenant_patterns: number;
    manual_patterns: number;
    auto_patterns: number;
}

/**
 * Get project hierarchy (tenant, workspace, portfolio)
 */
export async function getProjectHierarchy(projectId: string): Promise<ProjectHierarchy> {
    const { data, error } = await supabase
        .from('projects')
        .select('tenant_id, workspace_id, portfolio_id, id')
        .eq('id', projectId)
        .single();

    if (error) throw error;

    return {
        tenant_id: data.tenant_id,
        workspace_id: data.workspace_id,
        portfolio_id: data.portfolio_id,
        project_id: data.id,
    };
}

/**
 * Find applicable patterns for a prediction (hierarchical)
 * Returns patterns from project → portfolio → workspace → tenant
 */
export async function findApplicablePatterns(
    predictionType: string,
    projectId: string
): Promise<any[]> {
    // 1. Get project hierarchy
    const hierarchy = await getProjectHierarchy(projectId);

    // 2. Build scope filters for hierarchical pattern matching
    const scopeFilters: string[] = [];

    // Project-specific patterns
    scopeFilters.push(`and(sharing_scope.eq.project,project_id.eq.${projectId})`);

    // Portfolio-wide patterns
    if (hierarchy.portfolio_id) {
        scopeFilters.push(`and(sharing_scope.eq.portfolio,portfolio_id.eq.${hierarchy.portfolio_id})`);
    }

    // Workspace-wide patterns
    if (hierarchy.workspace_id) {
        scopeFilters.push(`and(sharing_scope.eq.workspace,workspace_id.eq.${hierarchy.workspace_id})`);
    }

    // Tenant-wide patterns
    if (hierarchy.tenant_id) {
        scopeFilters.push(`and(sharing_scope.eq.tenant,tenant_id.eq.${hierarchy.tenant_id})`);
    }

    // 3. Query with hierarchy
    const { data, error } = await supabase
        .from('ml_learning_patterns')
        .select('*')
        .eq('pattern_type', predictionType)
        .eq('is_active', true)
        .eq('approval_status', 'approved')
        .or(scopeFilters.join(','));

    if (error) throw error;

    // 4. Sort by priority (project > portfolio > workspace > tenant)
    return sortByPriority(data || []);
}

/**
 * Sort patterns by scope priority
 */
function sortByPriority(patterns: any[]): any[] {
    const priority: Record<string, number> = {
        'project': 1,
        'portfolio': 2,
        'workspace': 3,
        'tenant': 4,
    };

    return patterns.sort((a, b) => {
        const priorityA = priority[a.sharing_scope] || 999;
        const priorityB = priority[b.sharing_scope] || 999;

        if (priorityA !== priorityB) {
            return priorityA - priorityB;
        }

        // If same priority, sort by success rate
        return b.success_rate - a.success_rate;
    });
}

/**
 * Promote pattern to higher scope
 */
export async function promotePattern(
    patternId: string,
    fromScope: string,
    toScope: string,
    reason: string,
    userId: string
): Promise<void> {
    // Get original pattern
    const { data: pattern, error: fetchError } = await supabase
        .from('ml_learning_patterns')
        .select('*')
        .eq('id', patternId)
        .single();

    if (fetchError) throw fetchError;

    // Validate scope hierarchy
    const scopeHierarchy = ['project', 'portfolio', 'workspace', 'tenant'];
    const fromIndex = scopeHierarchy.indexOf(fromScope);
    const toIndex = scopeHierarchy.indexOf(toScope);

    if (toIndex <= fromIndex) {
        throw new Error('Can only promote to higher scope');
    }

    // Create new pattern at higher scope
    const { data: newPattern, error: createError } = await supabase
        .from('ml_learning_patterns')
        .insert({
            ...pattern,
            id: undefined, // Let database generate new ID
            sharing_scope: toScope,
            promoted_from_pattern_id: patternId,
            promotion_reason: reason,
            created_by_user_id: userId,
            source_type: 'promoted',
        })
        .select()
        .single();

    if (createError) throw createError;

    // Log the promotion
    await supabase
        .from('ml_pattern_sharing_log')
        .insert({
            pattern_id: newPattern.id,
            shared_from_scope: fromScope,
            shared_to_scope: toScope,
            from_project_id: pattern.project_id,
            from_portfolio_id: pattern.portfolio_id,
            from_workspace_id: pattern.workspace_id,
            action_type: 'promoted',
            reason,
            created_by_user_id: userId,
        });
}

/**
 * Get patterns by scope
 */
export async function getPatternsByScope(
    scope: string,
    scopeId: string
): Promise<any[]> {
    let query = supabase
        .from('ml_learning_patterns')
        .select('*')
        .eq('sharing_scope', scope)
        .eq('is_active', true);

    switch (scope) {
        case 'project':
            query = query.eq('project_id', scopeId);
            break;
        case 'portfolio':
            query = query.eq('portfolio_id', scopeId);
            break;
        case 'workspace':
            query = query.eq('workspace_id', scopeId);
            break;
        case 'tenant':
            query = query.eq('tenant_id', scopeId);
            break;
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Get ML sharing statistics for tenant
 */
export async function getMLSharingStats(tenantId: string): Promise<SharingStats> {
    const { data: patterns } = await supabase
        .from('ml_learning_patterns')
        .select('sharing_scope, source_type')
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

    const total_patterns = patterns?.length || 0;
    const project_patterns = patterns?.filter(p => p.sharing_scope === 'project').length || 0;
    const portfolio_patterns = patterns?.filter(p => p.sharing_scope === 'portfolio').length || 0;
    const workspace_patterns = patterns?.filter(p => p.sharing_scope === 'workspace').length || 0;
    const tenant_patterns = patterns?.filter(p => p.sharing_scope === 'tenant').length || 0;
    const manual_patterns = patterns?.filter(p => p.source_type === 'manual').length || 0;
    const auto_patterns = patterns?.filter(p => p.source_type === 'auto').length || 0;

    return {
        total_patterns,
        project_patterns,
        portfolio_patterns,
        workspace_patterns,
        tenant_patterns,
        manual_patterns,
        auto_patterns,
    };
}

/**
 * Get sharing activity timeline
 */
export async function getSharingActivity(tenantId: string, limit: number = 50): Promise<any[]> {
    const { data, error } = await supabase
        .from('ml_pattern_sharing_log')
        .select(`
            *,
            ml_learning_patterns (
                pattern_type,
                success_rate
            )
        `)
        .eq('ml_learning_patterns.tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data || [];
}

/**
 * Get patterns available to a project (for display)
 */
export async function getAvailablePatterns(projectId: string): Promise<{
    project: any[];
    portfolio: any[];
    workspace: any[];
    tenant: any[];
}> {
    const hierarchy = await getProjectHierarchy(projectId);

    const [projectPatterns, portfolioPatterns, workspacePatterns, tenantPatterns] = await Promise.all([
        // Project patterns
        getPatternsByScope('project', projectId),

        // Portfolio patterns
        hierarchy.portfolio_id
            ? getPatternsByScope('portfolio', hierarchy.portfolio_id)
            : Promise.resolve([]),

        // Workspace patterns
        hierarchy.workspace_id
            ? getPatternsByScope('workspace', hierarchy.workspace_id)
            : Promise.resolve([]),

        // Tenant patterns
        getPatternsByScope('tenant', hierarchy.tenant_id),
    ]);

    return {
        project: projectPatterns,
        portfolio: portfolioPatterns,
        workspace: workspacePatterns,
        tenant: tenantPatterns,
    };
}
