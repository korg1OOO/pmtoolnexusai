/**
 * Workspace Service
 * Manages organizational units (divisions/departments) and team collaboration
 */

import { supabase as _supabase } from '@/integrations/supabase/client';
const supabase = _supabase as any;

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

export interface WorkspaceTeam {
    id: string;
    workspace_id: string;
    user_id: string | null;
    role: string;
    skills: string[];
    allocation_percentage: number;
    availability_status: string;
    assigned_at: string;
}

export interface WorkspaceOverview {
    workspace_name: string;
    total_portfolios: number;
    total_programs: number;
    total_projects: number;
    total_members: number;
    active_projects: number;
}

export interface WorkspaceAnalytics {
    workspace_id: string;
    portfolio_performance: any[];
    team_productivity: any[];
    resource_efficiency: any[];
    trend_analysis: any[];
}

export interface WorkspaceResource {
    id: string;
    workspace_id: string;
    resource_name: string;
    resource_type: string;
    total_capacity: number;
    allocated_capacity: number;
    available_capacity: number;
}

export interface WorkspaceBudget {
    id: string;
    workspace_id: string;
    total_budget: number;
    allocated_budget: number;
    spent_budget: number;
    variance: number;
    forecast: number;
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
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Workspace[];
}

/**
 * Get a single workspace
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
 * Create workspace
 */
export async function createWorkspace(params: CreateWorkspaceParams): Promise<Workspace> {
    const { data, error } = await supabase
        .from('workspaces')
        .insert({
            ...params,
            settings: {
                require_portfolio: false,
                auto_assign_members: true
            }
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

/**
 * Get workspace members
 */
export async function getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const { data, error } = await supabase
        .from('workspace_members')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('is_active', true);

    if (error) throw error;
    return data as WorkspaceMember[];
}

/**
 * Add workspace member
 */
export async function addWorkspaceMember(
    workspaceId: string,
    userId: string,
    role: string,
    permissions: MemberPermissions
): Promise<WorkspaceMember> {
    const workspace = await getWorkspace(workspaceId);
    if (!workspace) throw new Error('Workspace not found');

    const { data, error } = await supabase
        .from('workspace_members')
        .insert({
            workspace_id: workspaceId,
            user_id: userId,
            tenant_id: workspace.tenant_id,
            role,
            permissions
        })
        .select()
        .single();

    if (error) throw error;
    return data as WorkspaceMember;
}

/**
 * Remove workspace member
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
): Promise<WorkspaceMember> {
    const { data, error } = await supabase
        .from('workspace_members')
        .update({ role })
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .select()
        .single();

    if (error) throw error;
    return data as WorkspaceMember;
}

/**
 * Update member permissions
 */
export async function updateMemberPermissions(
    workspaceId: string,
    userId: string,
    permissions: MemberPermissions
): Promise<WorkspaceMember> {
    const { data, error } = await supabase
        .from('workspace_members')
        .update({ permissions })
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .select()
        .single();

    if (error) throw error;
    return data as WorkspaceMember;
}

/**
 * Get default workspace for tenant
 */
export async function getDefaultWorkspace(tenantId: string): Promise<Workspace> {
    const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            return createWorkspace({
                tenant_id: tenantId,
                name: 'Default Workspace',
                slug: 'default',
                description: 'Default workspace for organization'
            });
        }
        throw error;
    }

    return data as Workspace;
}

/**
 * Get workspace teams
 */
export async function getWorkspaceTeams(workspaceId: string): Promise<WorkspaceTeam[]> {
    const { data, error } = await supabase
        .from('workspace_teams')
        .select('*')
        .eq('workspace_id', workspaceId);

    if (error) throw error;
    return data as WorkspaceTeam[];
}

/**
 * Assign team member
 */
export async function assignTeamMember(
    workspaceId: string,
    userId: string,
    data: Omit<WorkspaceTeam, 'id' | 'workspace_id' | 'user_id' | 'assigned_at'>
): Promise<WorkspaceTeam> {
    const { data: team, error } = await supabase
        .from('workspace_teams')
        .insert({
            workspace_id: workspaceId,
            user_id: userId,
            ...data,
        })
        .select()
        .single();

    if (error) throw error;
    return team as WorkspaceTeam;
}

/**
 * Update team member
 */
export async function updateTeamMember(
    id: string,
    updates: Partial<WorkspaceTeam>
): Promise<WorkspaceTeam> {
    const { data, error } = await supabase
        .from('workspace_teams')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as WorkspaceTeam;
}

/**
 * Remove team member
 */
export async function removeTeamMember(id: string): Promise<void> {
    const { error } = await supabase
        .from('workspace_teams')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

/**
 * Get workspace overview (NEW)
 */
export async function getWorkspaceOverview(workspaceId: string): Promise<WorkspaceOverview> {
    const workspace = await getWorkspace(workspaceId);
    if (!workspace) throw new Error('Workspace not found');

    // Get counts from database
    const [portfolios, programs, projects, members] = await Promise.all([
        supabase.from('portfolios').select('id', { count: 'exact' }).eq('workspace_id', workspaceId),
        supabase.from('programs').select('id', { count: 'exact' }).eq('workspace_id', workspaceId),
        supabase.from('projects').select('id', { count: 'exact' }).eq('workspace_id', workspaceId),
        supabase.from('workspace_teams').select('id', { count: 'exact' }).eq('workspace_id', workspaceId)
    ]);

    const activeProjects = await supabase
        .from('projects')
        .select('id', { count: 'exact' })
        .eq('workspace_id', workspaceId)
        .eq('status', 'active');

    return {
        workspace_name: workspace.name,
        total_portfolios: portfolios.count || 0,
        total_programs: programs.count || 0,
        total_projects: projects.count || 0,
        total_members: members.count || 0,
        active_projects: activeProjects.count || 0
    };
}

/**
 * Get workspace analytics (NEW)
 */
export interface WorkspaceAnalytics {
    workspace_id: string;
    portfolio_performance: any[];
    team_productivity: any[];
    resource_efficiency: any[];
    trend_analysis: any[];
    performanceTrend?: Array<{
        month: string;
        onTrack: number;
        atRisk: number;
        delayed: number;
    }>;
    portfolioDistribution?: Array<{
        name: string;
        value: number;
    }>;
    resourceUtilization?: Array<{
        role: string;
        utilization: number;
    }>;
}

export async function getWorkspaceAnalytics(workspaceId: string): Promise<WorkspaceAnalytics> {
    // Get projects for this workspace with created_at for trend analysis
    const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, name, status, budget, actual_cost, progress, portfolio_id, created_at')
        .eq('workspace_id', workspaceId);

    if (projectsError) throw projectsError;

    // Get portfolios for names
    const { data: portfolios } = await supabase
        .from('portfolios')
        .select('id, name')
        .eq('workspace_id', workspaceId);

    // Get workspace team members for resource utilization
    const { data: teamMembers } = await supabase
        .from('workspace_teams')
        .select('id, role, allocation_percentage')
        .eq('workspace_id', workspaceId);

    const portfolioNameMap = new Map<string, string>();
    portfolios?.forEach((p: any) => portfolioNameMap.set(p.id, p.name));

    // Calculate portfolio performance
    const portfolioMap = new Map<string, { total: number; onTrack: number; budget: number; spent: number }>();

    projects?.forEach((p: any) => {
        const portfolioId = p.portfolio_id || 'unassigned';
        const current = portfolioMap.get(portfolioId) || { total: 0, onTrack: 0, budget: 0, spent: 0 };
        current.total++;
        if (p.status === 'active' && p.progress >= 50) current.onTrack++;
        current.budget += p.budget || 0;
        current.spent += p.actual_cost || 0;
        portfolioMap.set(portfolioId, current);
    });

    const portfolio_performance = Array.from(portfolioMap.entries()).map(([id, data]) => ({
        portfolio_id: id,
        on_track_percentage: data.total > 0 ? (data.onTrack / data.total) * 100 : 0,
        budget_utilization: data.budget > 0 ? (data.spent / data.budget) * 100 : 0
    }));

    // Build performance trend (last 6 months)
    const now = new Date();
    const performanceTrend: WorkspaceAnalytics['performanceTrend'] = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthLabel = d.toLocaleString('default', { month: 'short', year: '2-digit' });
        const monthProjects = (projects || []).filter((p: any) => {
            const created = new Date(p.created_at);
            return created <= new Date(d.getFullYear(), d.getMonth() + 1, 0);
        });
        const onTrack = monthProjects.filter((p: any) => p.status === 'active' && p.progress >= 50).length;
        const atRisk = monthProjects.filter((p: any) => p.status === 'active' && p.progress < 50 && p.progress >= 20).length;
        const delayed = monthProjects.filter((p: any) => p.status === 'active' && p.progress < 20).length;
        performanceTrend.push({ month: monthLabel, onTrack, atRisk, delayed });
    }

    // Build portfolio distribution
    const portfolioDistribution: WorkspaceAnalytics['portfolioDistribution'] = Array.from(portfolioMap.entries()).map(([id, data]) => ({
        name: portfolioNameMap.get(id) || 'Unassigned',
        value: data.total
    }));

    // Build resource utilization by role
    const roleMap = new Map<string, { totalAlloc: number; count: number }>();
    (teamMembers || []).forEach((m: any) => {
        const role = m.role || 'Member';
        const cur = roleMap.get(role) || { totalAlloc: 0, count: 0 };
        cur.totalAlloc += m.allocation_percentage || 0;
        cur.count++;
        roleMap.set(role, cur);
    });
    const resourceUtilization: WorkspaceAnalytics['resourceUtilization'] = Array.from(roleMap.entries()).map(([role, data]) => ({
        role,
        utilization: data.count > 0 ? Math.round(data.totalAlloc / data.count) : 0
    }));

    return {
        workspace_id: workspaceId,
        portfolio_performance,
        team_productivity: [],
        resource_efficiency: [],
        trend_analysis: [],
        performanceTrend,
        portfolioDistribution,
        resourceUtilization
    };
}

/**
 * Get workspace resources (NEW)
 */
export async function getWorkspaceResources(workspaceId: string): Promise<WorkspaceResource[]> {
    // Get team members for this workspace
    const { data: members, error } = await supabase
        .from('team_members')
        .select('id, user_id, role, allocation_percentage, projects(id, name)')
        .eq('workspace_id', workspaceId);

    if (error) {
        console.error('Error fetching workspace resources:', error);
        return [];
    }

    return members?.map(member => ({
        id: member.id,
        workspace_id: workspaceId,
        resource_name: member.user_id,
        resource_type: member.role || 'member',
        total_capacity: 100,
        allocated_capacity: member.allocation_percentage || 0,
        available_capacity: 100 - (member.allocation_percentage || 0)
    })) || [];
}

/**
 * Get workspace budget (NEW)
 */
export async function getWorkspaceBudget(workspaceId: string): Promise<WorkspaceBudget | null> {
    // Get all projects for this workspace
    const { data: projects, error } = await supabase
        .from('projects')
        .select('budget, actual_cost, forecast_cost')
        .eq('workspace_id', workspaceId);

    if (error) {
        console.error('Error fetching workspace budget:', error);
        return null;
    }

    const total_budget = projects?.reduce((sum, p) => sum + (p.budget || 0), 0) || 0;
    const spent_budget = projects?.reduce((sum, p) => sum + (p.actual_cost || 0), 0) || 0;
    const forecast = projects?.reduce((sum, p) => sum + (p.forecast_cost || 0), 0) || 0;

    return {
        id: workspaceId,
        workspace_id: workspaceId,
        total_budget,
        allocated_budget: total_budget,
        spent_budget,
        variance: total_budget - spent_budget,
        forecast
    };
}
