import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import type { DbTask } from "@/hooks/useTasks";

export interface Scenario {
    id: string;
    project_id: string;
    name: string;
    description: string | null;
    status: 'draft' | 'active' | 'archived';
    base_plan_snapshot_id: string | null;
    data: Record<string, unknown>;
    created_at: string;
    updated_at: string;
    created_by: string | null;
}

export const scenarioService = {
    async getScenarios(projectId: string): Promise<Scenario[]> {
        const { data, error } = await supabase
            .from('scenarios')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Scenario[];
    },

    async createScenario(projectId: string, name: string, description: string): Promise<Scenario> {
        // 1. Create the scenario record
        const { data: scenario, error: scenarioError } = await supabase
            .from('scenarios')
            .insert({
                project_id: projectId,
                name,
                description,
                status: 'draft'
            })
            .select()
            .single();

        if (scenarioError) throw scenarioError;

        // 2. Clone the tasks and dependencies (Background async ok? No, user wants it ready)
        await this.cloneProjectData(projectId, scenario.id);

        return scenario as Scenario;
    },

    async cloneProjectData(projectId: string, scenarioId: string) {
        // A. Fetch Source Tasks (Actuals)
        const { data: sourceTasks, error: tasksError } = await supabase
            .from('tasks')
            .select('*')
            .eq('project_id', projectId)
            .is('scenario_id', null);

        if (tasksError) throw tasksError;
        if (!sourceTasks || sourceTasks.length === 0) return;

        // B. Fetch Source Dependencies
        // We get all dependencies where the source task is in our list
        const sourceTaskIds = sourceTasks.map(t => t.id);
        const { data: sourceDeps, error: depsError } = await supabase
            .from('task_dependencies')
            .select('*')
            .in('task_id', sourceTaskIds); // Only if the dependent task is in the project

        // Note: External dependencies might be tricky, but for now assuming intra-project

        if (depsError) throw depsError;

        // C. Create Mapping oldId -> newId
        const idMap = new Map<string, string>();
        const newTasks = sourceTasks.map(task => {
            const newId = uuidv4();
            idMap.set(task.id, newId);

            // Destructure to remove system fields we don't want to copy directly if needed
            // But simple spread is usually fine, just overwrite keys
            const { id, created_at, updated_at, ...rest } = task;

            return {
                ...rest,
                id: newId,
                scenario_id: scenarioId,
                project_id: projectId, // Still belongs to project
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
        });

        // D. Insert New Tasks
        // Supabase allows bulk insert. 
        // Chunking might be needed for thousands, but let's assume < 1000 for now or rely on Supabase handling it.
        const { error: insertTasksError } = await supabase
            .from('tasks')
            .insert(newTasks);

        if (insertTasksError) throw insertTasksError;

        // E. Prepare New Dependencies
        if (sourceDeps && sourceDeps.length > 0) {
            const newDeps = sourceDeps
                .filter(dep => idMap.has(dep.task_id) && idMap.has(dep.predecessor_id))
                .map(dep => {
                    const { id, created_at, ...rest } = dep;
                    return {
                        ...rest,
                        task_id: idMap.get(dep.task_id),
                        predecessor_id: idMap.get(dep.predecessor_id),
                        scenario_id: scenarioId,
                    };
                });

            if (newDeps.length > 0) {
                const { error: insertDepsError } = await supabase
                    .from('task_dependencies')
                    .insert(newDeps);

                if (insertDepsError) throw insertDepsError;
            }
        }
    },

    async deleteScenario(id: string) {
        const { error } = await supabase
            .from('scenarios')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    async updateScenario(id: string, updates: Partial<Scenario>) {
        const { data, error } = await supabase
            .from('scenarios')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Scenario;
    },

    // Simulate applying adjustments (Update single task fields)
    async updateScenarioTask(scenarioId: string, taskId: string, updates: Partial<DbTask>) {
        const { error } = await supabase
            .from('tasks')
            .update(updates)
            .eq('id', taskId)
            .eq('scenario_id', scenarioId);
        if (error) throw error;
    },

    async promoteScenario(projectId: string, scenarioId: string) {
        // 1. Delete current actuals (backup could be done here if we had versioning)
        // For now, we assume "Actuals" are just tasks where scenario_id is NULL
        const { error: deleteError } = await supabase
            .from('tasks')
            .delete()
            .eq('project_id', projectId)
            .is('scenario_id', null);

        if (deleteError) throw deleteError;

        // 2. Convert scenario tasks to actuals
        const { error: promoteError } = await supabase
            .from('tasks')
            .update({ scenario_id: null } as Partial<DbTask>)
            .eq('project_id', projectId)
            .eq('scenario_id', scenarioId);

        if (promoteError) throw promoteError;

        // 3. Update scenario status to archived or promoted
        const { error: statusError } = await supabase
            .from('scenarios')
            .update({ status: 'archived', description: 'Promoted to live plan' })
            .eq('id', scenarioId);

        if (statusError) throw statusError;
    }
};
