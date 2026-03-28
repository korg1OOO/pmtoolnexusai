// =============================================================================
// Agent Pipeline — Phase 4: Visual Operations as Chat Commands
// =============================================================================
// Covers Gantt-equivalent scheduling, critical path, baselines, dashboard
// analytics, and bulk operations — closing the final coverage gap.
// =============================================================================

interface HandlerResult {
    executed: boolean;
    summary: string;
    data?: unknown;
}

function extractEntityName(message: string, entityWords: string[]): string | null {
    const quotedMatch = message.match(/["'"\u2018\u2019\u201c\u201d]([^"'"\u2018\u2019\u201c\u201d]+)["'"\u2018\u2019\u201c\u201d]/);
    if (quotedMatch) return quotedMatch[1];
    const calledMatch = message.match(/(?:called|named)\s+(.+?)(?:\s+(?:as|to|from|is|was|status)|\.|,|$)/i);
    if (calledMatch) return calledMatch[1].trim();
    for (const word of entityWords) {
        const regex = new RegExp(`${word}\\s+([A-Z][a-zA-Z0-9\\s]+?)(?:\\s+(?:as|to|from|is|was|status|complete|done|start|end|date)|\\.|\,|$)`, 'i');
        const match = message.match(regex);
        if (match) return match[1].trim();
    }
    return null;
}

// ─── GANTT / SCHEDULING ──────────────────────────────────────────────────────

export async function rescheduleTask(
    projectId: string, message: string, supabase: any,
): Promise<HandlerResult> {
    const taskName = extractEntityName(message, ['task', 'activity', 'milestone']);
    if (!taskName) return { executed: false, summary: '⚠️ Please specify the task name. Example: "Reschedule task \'Design\' to start Jan 15 end Jan 30"' };

    const { data: tasks } = await supabase.from('tasks').select('id, name, start_date, end_date')
        .eq('project_id', projectId).ilike('name', `%${taskName}%`).limit(1);
    if (!tasks?.length) return { executed: false, summary: `🔍 No task found matching "${taskName}".` };

    const updates: Record<string, any> = {};
    // Parse dates from message
    const dateMatches = message.match(/(\d{4}-\d{2}-\d{2})/g);
    const naturalDates = message.match(/(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}(?:,?\s*\d{4})?/gi);

    if (dateMatches?.length) {
        if (message.toLowerCase().includes('start') && dateMatches[0]) updates.start_date = dateMatches[0];
        if (message.toLowerCase().includes('end') || message.toLowerCase().includes('finish')) {
            updates.end_date = dateMatches[dateMatches.length > 1 ? 1 : 0];
        }
        if (!updates.start_date && !updates.end_date) {
            updates.start_date = dateMatches[0];
            if (dateMatches.length > 1) updates.end_date = dateMatches[1];
        }
    } else if (naturalDates?.length) {
        const parseNatural = (s: string) => {
            const d = new Date(s);
            return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
        };
        if (naturalDates[0]) updates.start_date = parseNatural(naturalDates[0]);
        if (naturalDates.length > 1) updates.end_date = parseNatural(naturalDates[1]);
    }

    // Parse duration
    const durationMatch = message.match(/(\d+)\s*(?:day|week)/i);
    if (durationMatch && !updates.end_date && updates.start_date) {
        let days = parseInt(durationMatch[1], 10);
        if (message.toLowerCase().includes('week')) days *= 7;
        const start = new Date(updates.start_date);
        start.setDate(start.getDate() + days);
        updates.end_date = start.toISOString().split('T')[0];
        updates.duration = days;
    }

    if (Object.keys(updates).length === 0) {
        return { executed: false, summary: '⚠️ Could not parse dates. Try: "Reschedule task \'X\' to 2025-02-01 to 2025-02-15" or "Reschedule task \'X\' start Jan 15 end Feb 1"' };
    }

    const task = tasks[0];
    const { error } = await supabase.from('tasks').update(updates).eq('id', task.id);
    if (error) throw error;

    const changes = [];
    if (updates.start_date) changes.push(`start: ${task.start_date || 'unset'} → ${updates.start_date}`);
    if (updates.end_date) changes.push(`end: ${task.end_date || 'unset'} → ${updates.end_date}`);

    return {
        executed: true,
        summary: `📅 Task "${task.name}" rescheduled: ${changes.join(', ')}`,
        data: { taskId: task.id, updates },
    };
}

export async function reorderTask(
    projectId: string, message: string, supabase: any,
): Promise<HandlerResult> {
    const taskName = extractEntityName(message, ['task', 'activity']);
    if (!taskName) return { executed: false, summary: '⚠️ Please specify the task to reorder.' };

    const { data: task } = await supabase.from('tasks').select('id, name, sort_order')
        .eq('project_id', projectId).ilike('name', `%${taskName}%`).limit(1).single();
    if (!task) return { executed: false, summary: `🔍 No task found matching "${taskName}".` };

    const posMatch = message.match(/position\s+(\d+)/i) || message.match(/to\s+(\d+)/i);
    const lower = message.toLowerCase();
    let newOrder: number;

    if (posMatch) {
        newOrder = parseInt(posMatch[1], 10);
    } else if (lower.includes('top') || lower.includes('first')) {
        newOrder = 0;
    } else if (lower.includes('bottom') || lower.includes('last')) {
        newOrder = 999;
    } else {
        // "Move after X"
        const afterMatch = message.match(/(?:after|below)\s+["']?([^"']+?)["']?\s*$/i);
        if (afterMatch) {
            const { data: ref } = await supabase.from('tasks').select('sort_order')
                .eq('project_id', projectId).ilike('name', `%${afterMatch[1].trim()}%`).limit(1).single();
            newOrder = ref ? ref.sort_order + 1 : 0;
        } else {
            return { executed: false, summary: '⚠️ Specify position. Example: "Move task \'X\' to position 3" or "Move task \'X\' to top"' };
        }
    }

    const { error } = await supabase.from('tasks').update({ sort_order: newOrder }).eq('id', task.id);
    if (error) throw error;

    return { executed: true, summary: `✅ Task "${task.name}" moved to position ${newOrder}.`, data: { taskId: task.id, newOrder } };
}

export async function addDependency(
    projectId: string, message: string, supabase: any,
): Promise<HandlerResult> {
    // Extract two task names: "task A depends on task B" or "link A to B"
    const lower = message.toLowerCase();
    const depMatch = lower.match(/["']([^"']+)["']\s*(?:depends on|blocked by|after|links? to)\s*["']([^"']+)["']/i)
        || lower.match(/(?:task|activity)\s+(.+?)\s+(?:depends on|blocked by|after)\s+(?:task|activity)\s+(.+?)(?:\.|$)/i);

    if (!depMatch) {
        return { executed: false, summary: '⚠️ Please specify both tasks. Example: "Task \'Design\' depends on \'Requirements\'"' };
    }

    const [, successorName, predecessorName] = depMatch;

    const { data: successor } = await supabase.from('tasks').select('id, name')
        .eq('project_id', projectId).ilike('name', `%${successorName.trim()}%`).limit(1).single();
    const { data: predecessor } = await supabase.from('tasks').select('id, name')
        .eq('project_id', projectId).ilike('name', `%${predecessorName.trim()}%`).limit(1).single();

    if (!successor || !predecessor) {
        return { executed: false, summary: `🔍 Could not find one or both tasks: "${successorName}", "${predecessorName}"` };
    }

    let depType = 'FS'; // Finish-to-Start (default)
    if (lower.includes('start-to-start') || lower.includes('ss')) depType = 'SS';
    else if (lower.includes('finish-to-finish') || lower.includes('ff')) depType = 'FF';
    else if (lower.includes('start-to-finish') || lower.includes('sf')) depType = 'SF';

    const { error } = await (supabase as any).from('task_dependencies')
        .insert({ project_id: projectId, predecessor_id: predecessor.id, successor_id: successor.id, type: depType, lag: 0 });
    if (error) throw error;

    return {
        executed: true,
        summary: `🔗 Dependency created: "${predecessor.name}" → "${successor.name}" (${depType})`,
        data: { predecessorId: predecessor.id, successorId: successor.id, type: depType },
    };
}

export async function removeDependency(
    projectId: string, message: string, supabase: any,
): Promise<HandlerResult> {
    const depMatch = message.match(/["']([^"']+)["']\s*(?:and|from|to)\s*["']([^"']+)["']/i);
    if (!depMatch) return { executed: false, summary: '⚠️ Please specify both tasks. Example: "Remove dependency between \'A\' and \'B\'"' };

    const { data: taskA } = await supabase.from('tasks').select('id')
        .eq('project_id', projectId).ilike('name', `%${depMatch[1].trim()}%`).limit(1).single();
    const { data: taskB } = await supabase.from('tasks').select('id')
        .eq('project_id', projectId).ilike('name', `%${depMatch[2].trim()}%`).limit(1).single();

    if (!taskA || !taskB) return { executed: false, summary: '🔍 Could not find one or both tasks.' };

    const { error } = await (supabase as any).from('task_dependencies').delete()
        .or(`and(predecessor_id.eq.${taskA.id},successor_id.eq.${taskB.id}),and(predecessor_id.eq.${taskB.id},successor_id.eq.${taskA.id})`);
    if (error) throw error;

    return { executed: true, summary: `✅ Dependency between "${depMatch[1]}" and "${depMatch[2]}" removed.`, data: { taskAId: taskA.id, taskBId: taskB.id } };
}

// ─── CRITICAL PATH ───────────────────────────────────────────────────────────

export async function calculateCriticalPath(
    projectId: string, supabase: any,
): Promise<HandlerResult> {
    try {
        const { data, error } = await supabase.functions.invoke('calculate-critical-path', {
            body: { project_id: projectId },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        const cp = data as { success: boolean; updated: number; projectEnd: string; criticalPath: { id: string; name: string }[] };
        const lines = [
            `🔴 **Critical Path Analysis**`,
            ``,
            `Project end date: **${cp.projectEnd || 'Unknown'}**`,
            `Critical tasks: **${cp.criticalPath?.length || 0}**`,
            '',
        ];
        if (cp.criticalPath?.length) {
            lines.push('| # | Critical Task |', '|---|---------------|');
            cp.criticalPath.forEach((t, i) => lines.push(`| ${i + 1} | ${t.name} |`));
        }
        return { executed: true, summary: lines.join('\n'), data: cp };
    } catch (err: any) {
        // Fallback: query tasks marked as critical
        const { data: criticalTasks } = await supabase.from('tasks')
            .select('name, start_date, end_date, duration, progress')
            .eq('project_id', projectId).eq('is_critical', true).order('start_date', { ascending: true });

        if (!criticalTasks?.length) return { executed: true, summary: '🔴 No critical path data available. Try running auto-schedule first.', data: [] };

        const lines = [`🔴 **Critical Path** (${criticalTasks.length} tasks):`, '',
            '| # | Task | Start | End | Duration | Progress |',
            '|---|------|-------|-----|----------|----------|'];
        criticalTasks.forEach((t: any, i: number) => {
            lines.push(`| ${i + 1} | ${t.name} | ${t.start_date || '-'} | ${t.end_date || '-'} | ${t.duration || '-'}d | ${t.progress || 0}% |`);
        });
        return { executed: true, summary: lines.join('\n'), data: criticalTasks };
    }
}

// ─── BASELINES ───────────────────────────────────────────────────────────────

export async function queryBaselines(
    projectId: string, supabase: any,
): Promise<HandlerResult> {
    const { data, error } = await supabase.from('project_baselines')
        .select('id, name, description, baseline_date, created_at')
        .eq('project_id', projectId).order('created_at', { ascending: false });
    if (error) {
        if (error.code === '42P01') return { executed: true, summary: 'Baselines not configured for this project.', data: [] };
        throw error;
    }
    if (!data?.length) return { executed: true, summary: 'No baselines saved.', data: [] };
    const lines = [`📏 **Baselines** (${data.length}):`, ''];
    data.forEach((b: any, i: number) => {
        lines.push(`${i + 1}. **${b.name}** — ${b.baseline_date || b.created_at?.split('T')[0] || '-'}${b.description ? ` — ${b.description}` : ''}`);
    });
    return { executed: true, summary: lines.join('\n'), data };
}

export async function createBaseline(
    projectId: string, message: string, supabase: any,
): Promise<HandlerResult> {
    const name = extractEntityName(message, ['baseline']) || `Baseline ${new Date().toISOString().split('T')[0]}`;
    const desc = message.match(/(?:description|note)[:\s]+(.+?)(?:\.|$)/i);

    const { data: baseline, error } = await supabase.from('project_baselines')
        .insert({ project_id: projectId, name, description: desc?.[1] || null, baseline_date: new Date().toISOString().split('T')[0] })
        .select().single();
    if (error) throw error;

    // Snapshot current task dates into task_baselines
    const { data: tasks } = await supabase.from('tasks').select('id, start_date, end_date, duration')
        .eq('project_id', projectId);

    if (tasks?.length) {
        const taskBaselines = tasks.map((t: any) => ({
            task_id: t.id, baseline_name: name,
            baseline_start: t.start_date || new Date().toISOString().split('T')[0],
            baseline_end: t.end_date || new Date().toISOString().split('T')[0],
            baseline_duration: t.duration || 0,
        }));
        await supabase.from('task_baselines').insert(taskBaselines);
    }

    return { executed: true, summary: `📏 Baseline "${name}" created — ${tasks?.length || 0} task snapshots saved.`, data: baseline };
}

export async function deleteBaseline(
    projectId: string, message: string, supabase: any,
): Promise<HandlerResult> {
    const name = extractEntityName(message, ['baseline']);
    if (!name) return { executed: false, summary: '⚠️ Please specify the baseline name.' };

    const { data: baselines } = await supabase.from('project_baselines').select('id, name')
        .eq('project_id', projectId).ilike('name', `%${name}%`).limit(1);
    if (!baselines?.length) return { executed: false, summary: `🔍 No baseline found matching "${name}".` };

    // Delete task baselines first
    await supabase.from('task_baselines').delete().eq('baseline_name', baselines[0].name);
    const { error } = await supabase.from('project_baselines').delete().eq('id', baselines[0].id);
    if (error) throw error;

    return { executed: true, summary: `🗑️ Baseline "${baselines[0].name}" and all task snapshots deleted.`, data: { deletedId: baselines[0].id } };
}

// ─── DASHBOARD ANALYTICS ────────────────────────────────────────────────────

export async function queryDashboard(
    projectId: string, supabase: any,
): Promise<HandlerResult> {
    // Aggregate the full project health picture
    const [tasksRes, risksRes, issuesRes, budgetRes, sprintRes] = await Promise.all([
        supabase.from('tasks').select('status, progress, is_critical, end_date').eq('project_id', projectId),
        supabase.from('risks').select('status, impact, probability').eq('project_id', projectId),
        supabase.from('issues').select('status, priority').eq('project_id', projectId),
        supabase.from('budgets').select('total_budget, spent, remaining').eq('project_id', projectId).limit(1),
        supabase.from('sprints').select('name, status, start_date, end_date').eq('project_id', projectId).eq('status', 'active').limit(1),
    ]);

    const tasks = tasksRes.data || [];
    const risks = risksRes.data || [];
    const issues = issuesRes.data || [];
    const budget = budgetRes.data?.[0];
    const sprint = sprintRes.data?.[0];

    const total = tasks.length;
    const done = tasks.filter((t: any) => t.status === 'Complete' || t.status === 'done').length;
    const inProgress = tasks.filter((t: any) => t.status === 'In Progress' || t.status === 'in-progress').length;
    const overdue = tasks.filter((t: any) => t.end_date && new Date(t.end_date) < new Date() && t.status !== 'Complete' && t.status !== 'done').length;
    const criticalTasks = tasks.filter((t: any) => t.is_critical).length;
    const avgProgress = total ? Math.round(tasks.reduce((s: number, t: any) => s + (t.progress || 0), 0) / total) : 0;

    const openRisks = risks.filter((r: any) => r.status === 'open' || r.status === 'Open').length;
    const highRisks = risks.filter((r: any) => (r.impact === 'High' || r.impact === 'high') && (r.status === 'open' || r.status === 'Open')).length;
    const openIssues = issues.filter((i: any) => i.status === 'open' || i.status === 'Open' || i.status === 'In Progress').length;

    const health = overdue > 3 || highRisks > 2 ? '🔴 At Risk' : overdue > 0 || openRisks > 3 ? '🟡 Needs Attention' : '🟢 On Track';

    const lines = [
        `## 📊 Project Dashboard`,
        '',
        `**Overall Health:** ${health}`,
        '',
        `### Schedule`,
        `| Metric | Value |`,
        `|--------|-------|`,
        `| Total Tasks | ${total} |`,
        `| Completed | ${done} (${total ? Math.round(done / total * 100) : 0}%) |`,
        `| In Progress | ${inProgress} |`,
        `| Overdue | ${overdue} ${overdue > 0 ? '⚠️' : '✅'} |`,
        `| Critical Path Tasks | ${criticalTasks} |`,
        `| Average Progress | ${avgProgress}% |`,
        '',
        `### Risk & Issues`,
        `| Metric | Value |`,
        `|--------|-------|`,
        `| Open Risks | ${openRisks} |`,
        `| High-Impact Risks | ${highRisks} ${highRisks > 0 ? '🔴' : '✅'} |`,
        `| Open Issues | ${openIssues} |`,
    ];

    if (budget) {
        const spent = budget.spent || 0;
        const total_b = budget.total_budget || 0;
        lines.push('', `### Budget`, `| Metric | Value |`, `|--------|-------|`,
            `| Total Budget | $${total_b.toLocaleString()} |`,
            `| Spent | $${spent.toLocaleString()} (${total_b ? Math.round(spent / total_b * 100) : 0}%) |`,
            `| Remaining | $${(budget.remaining || total_b - spent).toLocaleString()} |`);
    }

    if (sprint) {
        lines.push('', `### Active Sprint`, `**${sprint.name}** — ${sprint.start_date || '-'} to ${sprint.end_date || '-'}`);
    }

    return { executed: true, summary: lines.join('\n'), data: { tasks: total, done, overdue, openRisks, highRisks, openIssues, budget, sprint } };
}

export async function queryVelocity(
    projectId: string, supabase: any,
): Promise<HandlerResult> {
    const { data: sprints } = await supabase.from('sprints')
        .select('name, status, velocity').eq('project_id', projectId)
        .order('created_at', { ascending: true });
    if (!sprints?.length) return { executed: true, summary: 'No sprint velocity data available.', data: [] };

    const completed = sprints.filter((s: any) => s.status === 'completed' || s.status === 'Completed');
    const avgVelocity = completed.length
        ? Math.round(completed.reduce((s: number, sp: any) => s + (sp.velocity || 0), 0) / completed.length)
        : 0;

    const lines = [`📈 **Sprint Velocity**`, '', `Average velocity: **${avgVelocity} points/sprint**`, '',
        '| Sprint | Status | Velocity |', '|--------|--------|----------|'];
    sprints.forEach((s: any) => {
        lines.push(`| ${s.name} | ${s.status} | ${s.velocity || '-'} |`);
    });
    return { executed: true, summary: lines.join('\n'), data: { sprints, avgVelocity } };
}

// ─── BULK OPERATIONS ─────────────────────────────────────────────────────────

export async function bulkUpdateTaskStatus(
    projectId: string, message: string, supabase: any,
): Promise<HandlerResult> {
    const lower = message.toLowerCase();
    let targetStatus: string;
    if (lower.includes('complete') || lower.includes('done')) targetStatus = 'Complete';
    else if (lower.includes('progress') || lower.includes('start')) targetStatus = 'In Progress';
    else if (lower.includes('hold') || lower.includes('pause')) targetStatus = 'On Hold';
    else targetStatus = 'Complete';

    // Determine filter
    let filterField: string | null = null;
    let filterValue: string | null = null;

    if (lower.includes('overdue')) {
        // Mark all overdue tasks
        const now = new Date().toISOString().split('T')[0];
        const { data: overdue } = await supabase.from('tasks').select('id, name')
            .eq('project_id', projectId).lt('end_date', now).neq('status', 'Complete');
        if (!overdue?.length) return { executed: true, summary: 'No overdue tasks found.', data: [] };
        const ids = overdue.map((t: any) => t.id);
        const { error } = await supabase.from('tasks').update({ status: targetStatus }).in('id', ids);
        if (error) throw error;
        return { executed: true, summary: `✅ Bulk updated ${ids.length} overdue tasks to **${targetStatus}**.`, data: { count: ids.length, status: targetStatus } };
    }

    if (lower.includes('all task') || lower.includes('all activities')) {
        const phaseName = extractEntityName(message, ['phase', 'in phase']);
        if (phaseName) {
            // Find phase
            const { data: phases } = await supabase.from('tasks').select('id').eq('project_id', projectId)
                .eq('type', 'phase').ilike('name', `%${phaseName}%`).limit(1);
            if (phases?.[0]) {
                filterField = 'parent_id';
                filterValue = phases[0].id;
            }
        }
    }

    let query = supabase.from('tasks').select('id').eq('project_id', projectId).neq('status', targetStatus);
    if (filterField && filterValue) query = query.eq(filterField, filterValue);

    const { data: tasks } = await query;
    if (!tasks?.length) return { executed: true, summary: `No tasks to update.`, data: [] };

    const ids = tasks.map((t: any) => t.id);
    const { error } = await supabase.from('tasks').update({ status: targetStatus }).in('id', ids);
    if (error) throw error;

    return { executed: true, summary: `✅ Bulk updated ${ids.length} tasks to **${targetStatus}**.`, data: { count: ids.length, status: targetStatus } };
}

export async function bulkAssignTasks(
    projectId: string, message: string, supabase: any,
): Promise<HandlerResult> {
    const assigneeName = extractEntityName(message, ['to', 'assign']);
    if (!assigneeName) return { executed: false, summary: '⚠️ Please specify the assignee name.' };

    // Find unassigned tasks or tasks in phase
    const lower = message.toLowerCase();
    let query = supabase.from('tasks').select('id')
        .eq('project_id', projectId);

    if (lower.includes('unassigned')) {
        query = query.is('assignee', null);
    }

    const { data: tasks } = await query.limit(50);
    if (!tasks?.length) return { executed: true, summary: 'No tasks to assign.', data: [] };

    const ids = tasks.map((t: any) => t.id);
    const { error } = await supabase.from('tasks').update({ assignee: assigneeName }).in('id', ids);
    if (error) throw error;

    return { executed: true, summary: `✅ Assigned ${ids.length} tasks to **${assigneeName}**.`, data: { count: ids.length, assignee: assigneeName } };
}

export async function bulkDeleteTasks(
    projectId: string, message: string, supabase: any,
): Promise<HandlerResult> {
    const lower = message.toLowerCase();

    if (lower.includes('completed') || lower.includes('done')) {
        const { data: tasks } = await supabase.from('tasks').select('id')
            .eq('project_id', projectId).eq('status', 'Complete');
        if (!tasks?.length) return { executed: true, summary: 'No completed tasks to delete.', data: [] };
        const ids = tasks.map((t: any) => t.id);
        const { error } = await supabase.from('tasks').delete().in('id', ids);
        if (error) throw error;
        return { executed: true, summary: `🗑️ Deleted ${ids.length} completed tasks.`, data: { count: ids.length } };
    }

    return { executed: false, summary: '⚠️ Please be specific about which tasks to bulk delete. Example: "Delete all completed tasks"' };
}

// ─── DEPENDENCIES QUERY ─────────────────────────────────────────────────────

export async function queryDependencies(
    projectId: string, supabase: any,
): Promise<HandlerResult> {
    const { data: deps, error } = await (supabase as any).from('task_dependencies')
        .select('predecessor_id, successor_id, type, lag')
        .eq('project_id', projectId);
    if (error) {
        if (error.code === '42P01') return { executed: true, summary: 'No dependencies configured.', data: [] };
        throw error;
    }
    if (!deps?.length) return { executed: true, summary: 'No task dependencies found.', data: [] };

    // Resolve task names
    const taskIds = [...new Set([...deps.map((d: any) => d.predecessor_id), ...deps.map((d: any) => d.successor_id)])];
    const { data: tasks } = await supabase.from('tasks').select('id, name').in('id', taskIds);
    const nameMap = Object.fromEntries((tasks || []).map((t: any) => [t.id, t.name]));

    const lines = [`🔗 **Dependencies** (${deps.length}):`, '',
        '| # | Predecessor | → | Successor | Type | Lag |',
        '|---|-------------|---|-----------|------|-----|'];
    deps.forEach((d: any, i: number) => {
        lines.push(`| ${i + 1} | ${nameMap[d.predecessor_id] || 'Unknown'} | → | ${nameMap[d.successor_id] || 'Unknown'} | ${d.type || 'FS'} | ${d.lag || 0}d |`);
    });
    return { executed: true, summary: lines.join('\n'), data: deps };
}

// ─── TIMELINE / SCHEDULE SUMMARY ─────────────────────────────────────────────

export async function queryTimeline(
    projectId: string, supabase: any,
): Promise<HandlerResult> {
    const { data: phases, error } = await supabase.from('tasks')
        .select('name, start_date, end_date, status, progress, type')
        .eq('project_id', projectId).in('type', ['phase', 'milestone'])
        .order('start_date', { ascending: true });
    if (error) throw error;
    if (!phases?.length) return { executed: true, summary: 'No phases or milestones to display.', data: [] };

    const lines = [`📅 **Project Timeline**`, '', '| # | Item | Type | Start | End | Status | Progress |',
        '|---|------|------|-------|-----|--------|----------|'];
    phases.forEach((p: any, i: number) => {
        const icon = p.type === 'milestone' ? '🏁' : '📂';
        lines.push(`| ${i + 1} | ${icon} ${p.name} | ${p.type} | ${p.start_date || '-'} | ${p.end_date || '-'} | ${p.status || '-'} | ${p.progress || 0}% |`);
    });
    return { executed: true, summary: lines.join('\n'), data: phases };
}
