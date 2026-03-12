import { useQuery } from '@tanstack/react-query';
import { supabase as _supabase } from '@/integrations/supabase/client';

const supabase = _supabase as any;

export interface ProjectAllocationRow {
    project_id: string;
    project_name: string;
    required: number;
    allocated: number;
    skills_needed: string[];
}

export interface ResourceConflictRow {
    resource_id: string;
    resource_name: string;
    projects: string[];
    total_allocation: number;
}

export interface SkillGapRow {
    skill: string;
    required: number;
    available: number;
    gap: number;
}

export interface ProgramResourceResult {
    total_capacity: number;
    total_allocated: number;
    total_required: number;
    projects: ProjectAllocationRow[];
    conflicts: ResourceConflictRow[];
    skillGaps: SkillGapRow[];
}

async function fetchProgramResources(programId: string): Promise<ProgramResourceResult> {
    // 1. Projects in program
    const { data: projects = [] } = await supabase
        .from('projects')
        .select('id, name')
        .eq('program_id', programId);

    const projectIds = projects.map((p: any) => p.id);

    if (projectIds.length === 0) {
        return {
            total_capacity: 0, total_allocated: 0, total_required: 0,
            projects: [], conflicts: [], skillGaps: [],
        };
    }

    // 2. Resources for these projects
    const { data: resources = [] } = await supabase
        .from('resources')
        .select('id, project_id, name, max_units, notes')
        .in('project_id', projectIds);

    // 3. resource_assignments → tasks → project
    //    We do: resource_assignments JOIN tasks ON task_id to get project_id
    const { data: assignments = [] } = await supabase
        .from('resource_assignments')
        .select(`
      id, resource_id, units,
      task:tasks(id, project_id, name)
    `)
        .in('resource_id', resources.map((r: any) => r.id));

    // 4. Also include team_members as an allocation signal
    const { data: teamMembers = [] } = await supabase
        .from('team_members')
        .select('id, project_id, role, allocation_percentage')
        .in('project_id', projectIds);

    // Total capacity: sum of max_units for all resources
    const total_capacity = resources.reduce((s: number, r: any) => s + (r.max_units || 100), 0);

    // Per-resource allocation map
    type ResourceAlloc = { name: string; totalUnits: number; projectNames: string[] };
    const resourceAllocMap = new Map<string, ResourceAlloc>();

    for (const r of resources) {
        resourceAllocMap.set(r.id, { name: r.name, totalUnits: 0, projectNames: [] });
    }

    for (const a of assignments) {
        const task = a.task as any;
        if (!task || !resourceAllocMap.has(a.resource_id)) continue;
        const alloc = resourceAllocMap.get(a.resource_id)!;
        alloc.totalUnits += a.units || 0;
        const proj = projects.find((p: any) => p.id === task.project_id);
        if (proj && !alloc.projectNames.includes(proj.name)) {
            alloc.projectNames.push(proj.name);
        }
    }

    const total_allocated = Array.from(resourceAllocMap.values())
        .reduce((s, r) => s + r.totalUnits, 0);

    // Conflicts: resources whose total allocation > 100
    const conflicts: ResourceConflictRow[] = [];
    for (const [resourceId, alloc] of resourceAllocMap.entries()) {
        if (alloc.totalUnits > 100) {
            conflicts.push({
                resource_id: resourceId,
                resource_name: alloc.name,
                projects: alloc.projectNames,
                total_allocation: alloc.totalUnits,
            });
        }
    }

    // Per-project allocation matrix
    const projectAllocMap = new Map<string, { allocated: number }>();
    for (const p of projects) projectAllocMap.set(p.id, { allocated: 0 });

    for (const a of assignments) {
        const task = a.task as any;
        if (!task?.project_id) continue;
        const cur = projectAllocMap.get(task.project_id);
        if (cur) cur.allocated += a.units || 0;
    }
    // Also count team_members
    for (const tm of teamMembers) {
        const cur = projectAllocMap.get(tm.project_id);
        if (cur) cur.allocated += tm.allocation_percentage || 0;
    }

    const projectRows: ProjectAllocationRow[] = projects.map((p: any) => ({
        project_id: p.id,
        project_name: p.name,
        required: 150, // default planning target per project
        allocated: projectAllocMap.get(p.id)?.allocated || 0,
        skills_needed: [],
    }));

    const total_required = projectRows.reduce((s, p) => s + p.required, 0);

    return {
        total_capacity,
        total_allocated,
        total_required,
        projects: projectRows,
        conflicts,
        skillGaps: [], // future: derive from team_members role vs resource notes
    };
}

export function useProgramResources(programId: string | null | undefined) {
    return useQuery({
        queryKey: ['program-resources-live', programId],
        queryFn: () => fetchProgramResources(programId!),
        enabled: !!programId,
    });
}
