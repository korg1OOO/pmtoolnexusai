/**
 * Program Timeline Service
 * Manages program-level timeline, critical path, and cross-project coordination
 */

import { supabase as _supabase } from '@/integrations/supabase/client';
const supabase = _supabase as any;

export interface TimelineTask {
    id: string;
    project_id: string;
    project_name: string;
    project_code: string;
    name: string;
    start_date: string;
    end_date: string;
    duration: number;
    progress: number;
    status: string;
    assignee_id?: string;
    is_critical: boolean;
    dependencies: string[];
    cross_project_dependencies: CrossProjectDependency[];
}

export interface CrossProjectDependency {
    id: string;
    source_task_id: string;
    source_project_id: string;
    target_task_id: string;
    target_project_id: string;
    dependency_type: string;
    lag: number;
    status: string;
}

export interface ProgramTimelineData {
    program_id: string;
    program_name: string;
    projects: ProjectTimeline[];
    cross_project_dependencies: CrossProjectDependency[];
    program_milestones: ProgramMilestone[];
    critical_path: TimelineTask[];
    conflicts: SchedulingConflict[];
}

export interface ProjectTimeline {
    project_id: string;
    project_name: string;
    project_code: string;
    project_status: string;
    project_health: string;
    tasks: TimelineTask[];
}

export interface ProgramMilestone {
    id: string;
    name: string;
    target_date: string;
    actual_date?: string;
    status: string;
    linked_task_ids: string[];
}

export interface SchedulingConflict {
    type: string;
    severity: string;
    description: string;
    affected_tasks: string[];
    suggested_resolution?: string;
}

export interface ProgramDates {
    earliest_start: string;
    latest_end: string;
    total_duration: number;
}

/**
 * Get complete program timeline data
 */
export async function getProgramTimeline(programId: string): Promise<ProgramTimelineData> {
    // Get program info
    const { data: program } = await supabase
        .from('programs')
        .select('id, name')
        .eq('id', programId)
        .single();

    if (!program) throw new Error('Program not found');

    // Get all projects in program
    const { data: projects } = await supabase
        .from('projects')
        .select('id, name, code, status, health')
        .eq('program_id', programId)
        .order('name');

    if (!projects) return {
        program_id: programId,
        program_name: program.name,
        projects: [],
        cross_project_dependencies: [],
        program_milestones: [],
        critical_path: [],
        conflicts: [],
    };

    // Get all tasks for these projects
    const projectIds = projects.map(p => p.id);
    const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .in('project_id', projectIds)
        .order('start_date');

    // Get cross-project dependencies
    const { data: crossDeps } = await supabase
        .from('cross_project_dependencies')
        .select('*')
        .eq('program_id', programId);

    // Get program milestones
    const { data: milestones } = await supabase
        .from('program_milestones')
        .select('*')
        .eq('program_id', programId)
        .order('target_date');

    // Organize tasks by project
    const projectTimelines: ProjectTimeline[] = projects.map(project => {
        const projectTasks = tasks?.filter(t => t.project_id === project.id) || [];

        return {
            project_id: project.id,
            project_name: project.name,
            project_code: project.code,
            project_status: project.status,
            project_health: project.health,
            tasks: projectTasks.map(task => ({
                id: task.id,
                project_id: task.project_id,
                project_name: project.name,
                project_code: project.code,
                name: task.name,
                start_date: task.start_date,
                end_date: task.end_date,
                duration: task.duration,
                progress: task.progress,
                status: task.status,
                assignee_id: task.assignee_id,
                is_critical: task.is_critical,
                dependencies: [], // Will be populated from task_dependencies
                cross_project_dependencies: crossDeps?.filter(
                    d => d.source_task_id === task.id || d.target_task_id === task.id
                ) || [],
            })),
        };
    });

    // Calculate critical path
    const criticalPath = await calculateCriticalPath(programId);

    // Detect conflicts
    const conflicts = await detectSchedulingConflicts(programId);

    return {
        program_id: programId,
        program_name: program.name,
        projects: projectTimelines,
        cross_project_dependencies: crossDeps || [],
        program_milestones: milestones?.map(m => ({
            id: m.id,
            name: m.name,
            target_date: m.target_date,
            actual_date: m.actual_date,
            status: m.status,
            linked_task_ids: m.linked_project_tasks || [],
        })) || [],
        critical_path: criticalPath,
        conflicts,
    };
}

/**
 * Calculate critical path across all projects in program
 */
async function calculateCriticalPath(programId: string): Promise<TimelineTask[]> {
    // Get all tasks in program
    const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .eq('program_id', programId);

    if (!projects) return [];

    const projectIds = projects.map(p => p.id);

    const { data: tasks } = await supabase
        .from('tasks')
        .select('*, projects(name, code)')
        .in('project_id', projectIds)
        .eq('is_critical', true)
        .order('start_date');

    return tasks?.map(task => ({
        id: task.id,
        project_id: task.project_id,
        project_name: task.projects?.name || '',
        project_code: task.projects?.code || '',
        name: task.name,
        start_date: task.start_date,
        end_date: task.end_date,
        duration: task.duration,
        progress: task.progress,
        status: task.status,
        assignee_id: task.assignee_id,
        is_critical: task.is_critical,
        dependencies: [],
        cross_project_dependencies: [],
    })) || [];
}

/**
 * Detect scheduling conflicts in program
 */
export async function detectSchedulingConflicts(programId: string): Promise<SchedulingConflict[]> {
    const conflicts: SchedulingConflict[] = [];

    // Get cross-project dependencies
    const { data: deps } = await supabase
        .from('cross_project_dependencies')
        .select(`
            *,
            source_task:tasks!cross_project_dependencies_source_task_id_fkey(id, name, end_date),
            target_task:tasks!cross_project_dependencies_target_task_id_fkey(id, name, start_date)
        `)
        .eq('program_id', programId);

    if (!deps) return conflicts;

    // Check for dependency violations
    deps.forEach(dep => {
        const sourceEndDate = new Date(dep.source_task.end_date);
        const targetStartDate = new Date(dep.target_task.start_date);

        // Add lag
        sourceEndDate.setDate(sourceEndDate.getDate() + (dep.lag || 0));

        if (dep.dependency_type === 'FS' && sourceEndDate > targetStartDate) {
            conflicts.push({
                type: 'dependency_violation',
                severity: 'high',
                description: `Task "${dep.target_task.name}" starts before predecessor "${dep.source_task.name}" finishes`,
                affected_tasks: [dep.source_task_id, dep.target_task_id],
                suggested_resolution: `Move "${dep.target_task.name}" start date to ${sourceEndDate.toISOString().split('T')[0]}`,
            });
        }
    });

    return conflicts;
}

/**
 * Calculate program dates (earliest start, latest end)
 */
export async function calculateProgramDates(programId: string): Promise<ProgramDates> {
    const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .eq('program_id', programId);

    if (!projects || projects.length === 0) {
        return {
            earliest_start: new Date().toISOString().split('T')[0],
            latest_end: new Date().toISOString().split('T')[0],
            total_duration: 0,
        };
    }

    const projectIds = projects.map(p => p.id);

    const { data: tasks } = await supabase
        .from('tasks')
        .select('start_date, end_date')
        .in('project_id', projectIds);

    if (!tasks || tasks.length === 0) {
        return {
            earliest_start: new Date().toISOString().split('T')[0],
            latest_end: new Date().toISOString().split('T')[0],
            total_duration: 0,
        };
    }

    const startDates = tasks.map(t => new Date(t.start_date));
    const endDates = tasks.map(t => new Date(t.end_date));

    const earliestStart = new Date(Math.min(...startDates.map(d => d.getTime())));
    const latestEnd = new Date(Math.max(...endDates.map(d => d.getTime())));

    const totalDuration = Math.ceil((latestEnd.getTime() - earliestStart.getTime()) / (1000 * 60 * 60 * 24));

    return {
        earliest_start: earliestStart.toISOString().split('T')[0],
        latest_end: latestEnd.toISOString().split('T')[0],
        total_duration: totalDuration,
    };
}

/**
 * Get program milestones with linked tasks
 */
export async function getProgramMilestonesWithTasks(programId: string) {
    const { data: milestones } = await supabase
        .from('program_milestones')
        .select('*')
        .eq('program_id', programId)
        .order('target_date');

    if (!milestones) return [];

    // For each milestone, get linked tasks
    const milestonesWithTasks = await Promise.all(
        milestones.map(async (milestone) => {
            const linkedTaskIds = milestone.linked_project_tasks || [];

            if (linkedTaskIds.length === 0) {
                return { ...milestone, linked_tasks: [] };
            }

            const { data: tasks } = await supabase
                .from('tasks')
                .select('*, projects(name, code)')
                .in('id', linkedTaskIds);

            return {
                ...milestone,
                linked_tasks: tasks || [],
            };
        })
    );

    return milestonesWithTasks;
}

/**
 * Create cross-project dependency
 */
export async function createCrossProjectDependency(params: {
    program_id: string;
    tenant_id: string;
    source_project_id: string;
    source_task_id: string;
    target_project_id: string;
    target_task_id: string;
    dependency_type: string;
    lag?: number;
}): Promise<CrossProjectDependency> {
    // Check for circular dependency
    const { data: circularCheck } = await supabase
        .rpc('check_circular_dependency', {
            p_source_task_id: params.source_task_id,
            p_target_task_id: params.target_task_id,
        });

    if (circularCheck) {
        throw new Error('This dependency would create a circular reference');
    }

    const { data, error } = await supabase
        .from('cross_project_dependencies')
        .insert({
            program_id: params.program_id,
            tenant_id: params.tenant_id,
            source_project_id: params.source_project_id,
            source_task_id: params.source_task_id,
            target_project_id: params.target_project_id,
            target_task_id: params.target_task_id,
            dependency_type: params.dependency_type,
            lag: params.lag || 0,
        })
        .select()
        .single();

    if (error) throw error;
    return data as CrossProjectDependency;
}

/**
 * Delete cross-project dependency
 */
export async function deleteCrossProjectDependency(dependencyId: string): Promise<void> {
    const { error } = await supabase
        .from('cross_project_dependencies')
        .delete()
        .eq('id', dependencyId);

    if (error) throw error;
}

/**
 * Get cross-project dependencies for a program
 */
export async function getCrossProjectDependencies(programId: string): Promise<CrossProjectDependency[]> {
    const { data, error } = await supabase
        .from('cross_project_dependencies')
        .select('*')
        .eq('program_id', programId);

    if (error) throw error;
    return data as CrossProjectDependency[];
}

/**
 * Get projects belonging to a program
 */
export async function getProgramProjects(programId: string) {
    const { data, error } = await supabase
        .from('projects')
        .select('id, name, code, status, health')
        .eq('program_id', programId)
        .order('name');

    if (error) throw error;
    return data || [];
}
