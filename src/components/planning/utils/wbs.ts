import { DbTask } from '@/hooks/useTasks';

export function recalculateWBS(
    tasks: DbTask[],
    parentId: string | null = null,
    parentWbs: string = ''
): Partial<DbTask>[] {
    const children = tasks
        .filter((t) => t.parent_id === parentId)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    let updates: Partial<DbTask>[] = [];

    children.forEach((task, index) => {
        const newWbs = parentWbs ? `${parentWbs}.${index + 1}` : `${index + 1}`;

        if (task.wbs !== newWbs) {
            updates.push({ id: task.id, wbs: newWbs });
        }

        // Recursively process children
        const childUpdates = recalculateWBS(tasks, task.id, newWbs);
        updates = [...updates, ...childUpdates];
    });

    return updates;
}
