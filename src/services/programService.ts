/**
 * Program Service
 * Manages programs that group related projects for coordinated delivery
 */

import { supabase } from '@/integrations/supabase/client';

export interface Program {
    id: string;
    tenant_id: string;
    workspace_id: string;
    portfolio_id: string;
    name: string;
    code: string;
    description?: string;
    program_type: string;
    status: string;
    health: string;
    start_date?: string;
    end_date?: string;
    total_budget?: number;
    spent_budget?: number;
    currency: string;
    program_manager_id?: string;
    sponsor_id?: string;
    settings: ProgramSettings;
    created_at: string;
    updated_at: string;
    created_by_user_id?: string;
    is_active: boolean;
}

export interface ProgramSettings {
    auto_rollup_status: boolean;
    auto_rollup_budget: boolean;
    auto_rollup_progress: boolean;
    allow_cross_project_dependencies: boolean;
    require_project_approval: boolean;
}

export interface ProgramMember {
    id: string;
    program_id: string;
    user_id: string;
    tenant_id: string;
    role: string;
    permissions: ProgramMemberPermissions;
    joined_at: string;
    is_active: boolean;
}

export interface ProgramMemberPermissions {
    can_create_projects: boolean;
    can_edit_program: boolean;
    can_manage_members: boolean;
    can_view_financials: boolean;
    can_approve_changes: boolean;
}

export interface ProgramMilestone {
    id: string;
    program_id: string;
    tenant_id: string;
    name: string;
    description?: string;
    milestone_type: string;
    target_date: string;
    actual_date?: string;
    status: string;
    linked_project_tasks: any[];
    dependencies: any[];
    created_at: string;
}

export interface ProgramStats {
    total_projects: number;
    active_projects: number;
    completed_projects: number;
    on_hold_projects: number;
    total_budget: number;
    spent_budget: number;
    overall_progress: number;
    health_summary: {
        green: number;
        amber: number;
        red: number;
    };
}

export interface CreateProgramParams {
    tenant_id: string;
    workspace_id: string;
    portfolio_id: string;
    name: string;
    code: string;
    description?: string;
    program_type?: string;
    start_date?: string;
    end_date?: string;
    total_budget?: number;
    program_manager_id?: string;
    sponsor_id?: string;
}

/**
 * Get programs for a portfolio
 */
export async function getPrograms(portfolioId: string): Promise<Program[]> {
    const { data, error } = await supabase
        .from('programs')
        .select('*')
        .eq('portfolio_id', portfolioId)
        .eq('is_active', true)
        .order('name');

    if (error) throw error;
    return data as Program[];
}

/**
 * Get program by ID
 */
export async function getProgram(programId: string): Promise<Program | null> {
    const { data, error } = await supabase
        .from('programs')
        .select('*')
        .eq('id', programId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
    }
    return data as Program;
}

/**
 * Get program by code
 */
export async function getProgramByCode(tenantId: string, code: string): Promise<Program | null> {
    const { data, error } = await supabase
        .from('programs')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('code', code)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
    }
    return data as Program;
}

/**
 * Create new program
 */
export async function createProgram(params: CreateProgramParams): Promise<Program> {
    const { data, error } = await supabase
        .from('programs')
        .insert({
            tenant_id: params.tenant_id,
            workspace_id: params.workspace_id,
            portfolio_id: params.portfolio_id,
            name: params.name,
            code: params.code,
            description: params.description,
            program_type: params.program_type || 'standard',
            start_date: params.start_date,
            end_date: params.end_date,
            total_budget: params.total_budget,
            program_manager_id: params.program_manager_id,
            sponsor_id: params.sponsor_id,
        })
        .select()
        .single();

    if (error) throw error;
    return data as Program;
}

/**
 * Update program
 */
export async function updateProgram(
    programId: string,
    updates: Partial<Program>
): Promise<Program> {
    const { data, error } = await supabase
        .from('programs')
        .update(updates)
        .eq('id', programId)
        .select()
        .single();

    if (error) throw error;
    return data as Program;
}

/**
 * Delete program (soft delete)
 */
export async function deleteProgram(programId: string): Promise<void> {
    const { error } = await supabase
        .from('programs')
        .update({ is_active: false })
        .eq('id', programId);

    if (error) throw error;
}

/**
 * Get program statistics
 */
export async function getProgramStats(programId: string): Promise<ProgramStats> {
    // Get projects in program
    const { data: projects } = await supabase
        .from('projects')
        .select('id, status, health, budget, spent, progress')
        .eq('program_id', programId);

    const total_projects = projects?.length || 0;
    const active_projects = projects?.filter(p => p.status === 'active').length || 0;
    const completed_projects = projects?.filter(p => p.status === 'completed').length || 0;
    const on_hold_projects = projects?.filter(p => p.status === 'on-hold').length || 0;

    const total_budget = projects?.reduce((sum, p) => sum + (p.budget || 0), 0) || 0;
    const spent_budget = projects?.reduce((sum, p) => sum + (p.spent || 0), 0) || 0;
    const overall_progress = projects?.length
        ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length)
        : 0;

    const health_summary = {
        green: projects?.filter(p => p.health === 'green').length || 0,
        amber: projects?.filter(p => p.health === 'amber').length || 0,
        red: projects?.filter(p => p.health === 'red').length || 0,
    };

    return {
        total_projects,
        active_projects,
        completed_projects,
        on_hold_projects,
        total_budget,
        spent_budget,
        overall_progress,
        health_summary,
    };
}

/**
 * Get program projects
 */
export async function getProgramProjects(programId: string): Promise<any[]> {
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('program_id', programId)
        .order('name');

    if (error) throw error;
    return data || [];
}

// ============================================
// PROGRAM MEMBERS
// ============================================

/**
 * Get program members
 */
export async function getProgramMembers(programId: string): Promise<ProgramMember[]> {
    const { data, error } = await supabase
        .from('program_members')
        .select('*')
        .eq('program_id', programId)
        .eq('is_active', true)
        .order('joined_at');

    if (error) throw error;
    return data as ProgramMember[];
}

/**
 * Add member to program
 */
export async function addProgramMember(
    programId: string,
    userId: string,
    role: string = 'member'
): Promise<ProgramMember> {
    // Get program to get tenant_id
    const program = await getProgram(programId);
    if (!program) throw new Error('Program not found');

    const { data, error } = await supabase
        .from('program_members')
        .insert({
            program_id: programId,
            user_id: userId,
            tenant_id: program.tenant_id,
            role,
        })
        .select()
        .single();

    if (error) throw error;
    return data as ProgramMember;
}

/**
 * Remove member from program
 */
export async function removeProgramMember(
    programId: string,
    userId: string
): Promise<void> {
    const { error } = await supabase
        .from('program_members')
        .update({ is_active: false })
        .eq('program_id', programId)
        .eq('user_id', userId);

    if (error) throw error;
}

// ============================================
// PROGRAM MILESTONES
// ============================================

/**
 * Get program milestones
 */
export async function getProgramMilestones(programId: string): Promise<ProgramMilestone[]> {
    const { data, error } = await supabase
        .from('program_milestones')
        .select('*')
        .eq('program_id', programId)
        .eq('is_active', true)
        .order('target_date');

    if (error) throw error;
    return data as ProgramMilestone[];
}

/**
 * Create program milestone
 */
export async function createProgramMilestone(
    programId: string,
    milestone: Partial<ProgramMilestone>
): Promise<ProgramMilestone> {
    const program = await getProgram(programId);
    if (!program) throw new Error('Program not found');

    const { data, error } = await supabase
        .from('program_milestones')
        .insert({
            program_id: programId,
            tenant_id: program.tenant_id,
            ...milestone,
        })
        .select()
        .single();

    if (error) throw error;
    return data as ProgramMilestone;
}

/**
 * Get program hierarchy
 */
export async function getProgramHierarchy(programId: string): Promise<{
    tenant_id: string;
    workspace_id: string;
    portfolio_id: string;
    program_id: string;
}> {
    const program = await getProgram(programId);
    if (!program) throw new Error('Program not found');

    return {
        tenant_id: program.tenant_id,
        workspace_id: program.workspace_id,
        portfolio_id: program.portfolio_id,
        program_id: program.id,
    };
}
