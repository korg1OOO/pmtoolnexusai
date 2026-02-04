import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Database } from '@/integrations/supabase/types';

type TaskType = Database['public']['Enums']['task_type'];
type TaskStatus = Database['public']['Enums']['task_status'];
type PriorityLevel = Database['public']['Enums']['priority_level'];

interface TimelineData {
    swimlanes: any[];
    milestones: any[];
}

export function useTimelineGenerator() {
    const [isGenerating, setIsGenerating] = useState(false);
    const queryClient = useQueryClient();

    const generatePlan = async (projectId: string, data: TimelineData) => {
        setIsGenerating(true);
        try {
            if (!projectId) throw new Error("Project ID is required");

            const { swimlanes } = data;
            const tasksToInsert: any[] = [];
            const dependenciesToInsert: any[] = [];

            // We need to map Activity IDs (from Timeline) to Task IDs (newly created) to create dependencies
            // But Activity IDs are UUIDs from 'timeline_activities'.
            // We can't know the new Task UUID until insertion.
            // If we do one giant bulk insert, we won't know which new ID corresponds to which old Activity ID easily.
            // Strategy:
            // 1. Insert Phases (Swimlanes).
            // 2. Insert Tasks (Activities) with parent_id set to Phase ID.
            // 3. Insert Dependencies.

            // To keep track of IDs, we might need to do this somewhat sequentially or use a returned mapping.

            // Let's process Swimlane by Swimlane.
            // We map manually to types acceptable by Supabase

            const activityIdMap = new Map<string, string>(); // OldActivityId -> NewTaskId

            for (let sIndex = 0; sIndex < swimlanes.length; sIndex++) {
                const swimlane = swimlanes[sIndex];

                // 1. Create Phase Task
                const phaseTask = {
                    project_id: projectId,
                    wbs: `${sIndex + 1} .0`,
                    name: swimlane.label,
                    type: 'phase' as TaskType,
                    status: 'not-started' as TaskStatus,
                    priority: 'medium' as PriorityLevel,
                    start_date: new Date().toISOString().split('T')[0], // Should be calculated from children
                    end_date: new Date().toISOString().split('T')[0],
                    duration: 0,
                    progress: 0,
                    level: 0,
                    sort_order: sIndex * 1000,
                    expanded: true,
                    parent_id: null
                };

                const { data: insertedPhase, error: phaseError } = await supabase
                    .from('tasks')
                    .insert(phaseTask)
                    .select()
                    .single();

                if (phaseError) throw phaseError;
                const phaseId = insertedPhase.id;

                // 2. Process Activities
                if (swimlane.activities && swimlane.activities.length > 0) {
                    // Sort activities by start month? Or just keep array order?
                    const sortedActivities = [...swimlane.activities].sort((a: any, b: any) => a.start - b.start);

                    for (let aIndex = 0; aIndex < sortedActivities.length; aIndex++) {
                        const activity = sortedActivities[aIndex];
                        // Convert months to date. Assuming Start Date of project is "Mar 2025" (from initialMonths[0]). 
                        // We need a reference start date. 
                        // For now, let's default to Today + start_month * 30 days? 
                        // Ideally we pass projectStartDate from the UI.
                        // We'll use a rough estimate: Today as base.
                        // Date calc
                        const baseDate = new Date();
                        const startOffsetDays = activity.start * 30;
                        const durationDays = activity.duration * 30;

                        const startDate = new Date(baseDate);
                        startDate.setDate(startDate.getDate() + startOffsetDays);

                        const endDate = new Date(startDate);
                        endDate.setDate(startDate.getDate() + durationDays);

                        const task = {
                            project_id: projectId,
                            parent_id: phaseId,
                            wbs: `${sIndex + 1}.${aIndex + 1} `,
                            name: activity.name,
                            type: 'task' as TaskType,
                            status: 'not-started' as TaskStatus,
                            priority: 'medium' as PriorityLevel,
                            start_date: startDate.toISOString().split('T')[0],
                            end_date: endDate.toISOString().split('T')[0],
                            duration: durationDays,
                            progress: 0,
                            level: 1,
                            sort_order: (sIndex * 1000) + (aIndex + 1) * 100,
                            expanded: true,
                            notes: activity.notes
                        };

                        const { data: insertedTask, error: taskError } = await supabase
                            .from('tasks')
                            .insert(task)
                            .select()
                            .single();

                        if (taskError) throw taskError;

                        // Map Old ID to New ID
                        activityIdMap.set(activity.id, insertedTask.id);
                    }
                }
            }

            // 3. Process Dependencies
            // We iterate through all activities again to find their dependencies
            // Timeline Dependency: source -> target (or stored on activity).
            // In TimelineData (fetched in component), we have `activities` which have `dependencies`.
            // Let's re-iterate the data structure.

            const newDependencies: any[] = [];

            data.swimlanes.forEach(swimlane => {
                swimlane.activities?.forEach((activity: any) => {
                    if (activity.dependencies) {
                        activity.dependencies.forEach((dep: any) => {
                            // dep.targetId is the OTHER activity. 
                            // In TimelinePlannerTab.tsx: `dependencies` array on an activity usually means "This activity depends on Target".
                            // Wait, checking `TimelinePlannerTab.tsx`: 
                            // `const pred = actMap.get(dep.targetId); `
                            // `const x1 = columnWidth + (pred.start + pred.duration)...`
                            // So if A has dep {targetId: B}, then B is the predecessor (starts before A). A depends on B.
                            // So: Predecessor = B (TargetId), Successor = A (Current Activity).

                            const successorId = activityIdMap.get(activity.id);
                            const predecessorId = activityIdMap.get(dep.targetId);

                            if (successorId && predecessorId) {
                                newDependencies.push({
                                    task_id: successorId, // The one that depends (Successor)
                                    predecessor_id: predecessorId, // The one that comes first
                                    type: dep.type || 'FS',
                                    lag: 0
                                });
                            }
                        });
                    }
                });
            });

            if (newDependencies.length > 0) {
                const { error: depError } = await supabase
                    .from('task_dependencies')
                    .insert(newDependencies);

                if (depError) throw depError;
            }

            toast.success(`Project Plan Generated with ${activityIdMap.size} tasks!`);
            queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
            queryClient.invalidateQueries({ queryKey: ['dependencies', projectId] });

        } catch (error: any) {
            console.error("Error generating plan:", error);
            toast.error(`Failed to generate plan: ${error.message} `);
        } finally {
            setIsGenerating(false);
        }
    };

    return { generatePlan, isGenerating };
}

