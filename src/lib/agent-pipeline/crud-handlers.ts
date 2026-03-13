// =============================================================================
// Agent Pipeline — CRUD Handlers (Read / Update / Delete)
// =============================================================================
//
// Handles query, update, and delete operations that the original dispatcher
// didn't cover. Each handler follows the same pattern:
// 1. Parse the user message for entity identifiers
// 2. Execute the Supabase operation
// 3. Return a DispatchResult-compatible object
//
// Design:
// - Supabase client is injected (testable)
// - Returns { executed, summary, data } matching DispatchResult shape
// - All handlers are pure async functions
// =============================================================================

interface HandlerResult {
    executed: boolean;
    summary: string;
    data?: unknown;
    link?: string;
}

// ─── QUERY HANDLERS ──────────────────────────────────────────────────────────

export async function queryProjectStatus(
    projectId: string,
    supabase: any,
): Promise<HandlerResult> {
    // Fetch project details
    const { data: project, error: projErr } = await supabase
        .from('projects')
        .select('name, status, start_date, end_date, methodology')
        .eq('id', projectId)
        .single();

    if (projErr) throw projErr;

    // Fetch task summary
    const { data: tasks } = await supabase
        .from('tasks')
        .select('status')
        .eq('project_id', projectId);

    const taskCounts = {
        total: tasks?.length ?? 0,
        completed: tasks?.filter((t: any) => t.status === 'Complete')?.length ?? 0,
        inProgress: tasks?.filter((t: any) => t.status === 'In Progress')?.length ?? 0,
        notStarted: tasks?.filter((t: any) => t.status === 'Not Started')?.length ?? 0,
    };

    // Fetch recent issues/risks count
    const { count: issueCount } = await supabase
        .from('issues')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .eq('status', 'Open');

    const { count: riskCount } = await supabase
        .from('risks')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .eq('status', 'Open');

    const progress = taskCounts.total > 0
        ? Math.round((taskCounts.completed / taskCounts.total) * 100)
        : 0;

    const summary = [
        `📊 **Project: ${project.name}**`,
        '',
        `| Metric | Value |`,
        `|--------|-------|`,
        `| Status | ${project.status || 'Active'} |`,
        `| Methodology | ${project.methodology || 'N/A'} |`,
        `| Start | ${project.start_date || 'Not set'} |`,
        `| End | ${project.end_date || 'Not set'} |`,
        `| Overall Progress | **${progress}%** |`,
        '',
        `📋 **Tasks**: ${taskCounts.total} total — ${taskCounts.completed} done, ${taskCounts.inProgress} in progress, ${taskCounts.notStarted} not started`,
        `⚠️ **Open Issues**: ${issueCount ?? 0}`,
        `🔴 **Open Risks**: ${riskCount ?? 0}`,
    ].join('\n');

    return { executed: true, summary, data: { project, taskCounts, issueCount, riskCount } };
}

export async function queryTasks(
    projectId: string,
    message: string,
    supabase: any,
): Promise<HandlerResult> {
    const lower = message.toLowerCase();

    // Build filter
    let query = supabase
        .from('tasks')
        .select('name, status, priority, progress, start_date, end_date, assigned_to')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(20);

    // Apply status filter if specified
    if (lower.includes('complete') || lower.includes('done')) {
        query = query.eq('status', 'Complete');
    } else if (lower.includes('in progress') || lower.includes('active')) {
        query = query.eq('status', 'In Progress');
    } else if (lower.includes('not started') || lower.includes('pending')) {
        query = query.eq('status', 'Not Started');
    } else if (lower.includes('overdue') || lower.includes('late')) {
        query = query.lt('end_date', new Date().toISOString().split('T')[0]);
        query = query.neq('status', 'Complete');
    }

    const { data: tasks, error } = await query;
    if (error) throw error;

    if (!tasks || tasks.length === 0) {
        return { executed: true, summary: 'No tasks found matching your criteria.', data: [] };
    }

    const lines = [
        `📋 **Tasks** (${tasks.length}):`,
        '',
        '| # | Task | Status | Progress | Priority |',
        '|---|------|--------|----------|----------|',
    ];

    tasks.forEach((t: any, i: number) => {
        lines.push(`| ${i + 1} | ${t.name} | ${t.status} | ${t.progress}% | ${t.priority || '-'} |`);
    });

    return { executed: true, summary: lines.join('\n'), data: tasks };
}

export async function queryTeam(
    projectId: string,
    supabase: any,
): Promise<HandlerResult> {
    const { data: roles, error } = await supabase
        .from('user_roles')
        .select('user_id, role, created_at')
        .eq('project_id', projectId);

    if (error) throw error;

    if (!roles || roles.length === 0) {
        return { executed: true, summary: 'No team members assigned to this project yet.', data: [] };
    }

    // Try to get profiles
    const userIds = roles.map((r: any) => r.user_id);
    const { data: profiles } = await (supabase as any)
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

    const members = roles.map((r: any) => {
        const profile = profiles?.find((p: any) => p.id === r.user_id);
        return {
            name: profile?.full_name || 'Unknown',
            email: profile?.email || '-',
            role: r.role,
            since: r.created_at?.split('T')[0] || '-',
        };
    });

    const lines = [
        `👥 **Team Members** (${members.length}):`,
        '',
        '| Name | Email | Role | Since |',
        '|------|-------|------|-------|',
    ];

    members.forEach((m: any) => {
        lines.push(`| ${m.name} | ${m.email} | ${m.role} | ${m.since} |`);
    });

    return { executed: true, summary: lines.join('\n'), data: members };
}

export async function queryRisksIssues(
    projectId: string,
    message: string,
    supabase: any,
): Promise<HandlerResult> {
    const lower = message.toLowerCase();
    const showRisks = lower.includes('risk') || (!lower.includes('issue'));
    const showIssues = lower.includes('issue') || (!lower.includes('risk'));

    const lines: string[] = [];
    let allData: any = {};

    if (showRisks) {
        const { data: risks, error } = await supabase
            .from('risks')
            .select('title, status, probability, impact, mitigation_strategy')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false })
            .limit(10);

        if (!error && risks?.length) {
            lines.push(`🔴 **Risks** (${risks.length}):`, '',
                '| Risk | Status | Probability | Impact |',
                '|------|--------|-------------|--------|',
            );
            risks.forEach((r: any) => {
                lines.push(`| ${r.title} | ${r.status} | ${r.probability || '-'} | ${r.impact || '-'} |`);
            });
            allData.risks = risks;
        } else {
            lines.push('✅ No open risks.');
        }
    }

    if (showIssues) {
        const { data: issues, error } = await supabase
            .from('issues')
            .select('title, status, priority, resolution')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false })
            .limit(10);

        if (!error && issues?.length) {
            if (lines.length > 0) lines.push('');
            lines.push(`⚠️ **Issues** (${issues.length}):`, '',
                '| Issue | Status | Priority |',
                '|-------|--------|----------|',
            );
            issues.forEach((i: any) => {
                lines.push(`| ${i.title} | ${i.status} | ${i.priority || '-'} |`);
            });
            allData.issues = issues;
        } else {
            lines.push('✅ No open issues.');
        }
    }

    return { executed: true, summary: lines.join('\n'), data: allData };
}

export async function queryBudget(
    projectId: string,
    supabase: any,
): Promise<HandlerResult> {
    const { data: budgets } = await supabase
        .from('budgets')
        .select('total_budget, spent, remaining, currency')
        .eq('project_id', projectId)
        .limit(1)
        .maybeSingle();

    const { data: expenses } = await supabase
        .from('expenses')
        .select('amount, description, category, created_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(5);

    const lines: string[] = [];

    if (budgets) {
        const fmt = (n: number) => `$${(n || 0).toLocaleString()}`;
        lines.push(
            `💰 **Budget Summary**:`,
            '',
            `| Metric | Value |`,
            `|--------|-------|`,
            `| Total Budget | ${fmt(budgets.total_budget)} |`,
            `| Spent | ${fmt(budgets.spent)} |`,
            `| Remaining | ${fmt(budgets.remaining)} |`,
        );
    } else {
        lines.push('💰 No budget set for this project.');
    }

    if (expenses?.length) {
        lines.push('', `📝 **Recent Expenses** (last ${expenses.length}):`);
        expenses.forEach((e: any) => {
            lines.push(`- ${e.description || 'Expense'}: $${(e.amount || 0).toLocaleString()} (${e.category || '-'})`);
        });
    }

    return { executed: true, summary: lines.join('\n'), data: { budgets, expenses } };
}

export async function querySprint(
    projectId: string,
    supabase: any,
): Promise<HandlerResult> {
    const { data: sprints } = await supabase
        .from('sprints')
        .select('name, status, start_date, end_date, goal')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(3);

    if (!sprints?.length) {
        return { executed: true, summary: 'No sprints found for this project.', data: [] };
    }

    // Get stories for latest sprint
    const latest = sprints[0];
    const { data: stories } = await supabase
        .from('stories')
        .select('title, status, story_points')
        .eq('project_id', projectId)
        .limit(15);

    const lines = [
        `🏃 **Current Sprint: ${latest.name}**`,
        '',
        `| Metric | Value |`,
        `|--------|-------|`,
        `| Status | ${latest.status || 'Active'} |`,
        `| Start | ${latest.start_date || '-'} |`,
        `| End | ${latest.end_date || '-'} |`,
        `| Goal | ${latest.goal || '-'} |`,
    ];

    if (stories?.length) {
        const done = stories.filter((s: any) => s.status === 'Done')?.length ?? 0;
        lines.push('', `📊 **Stories**: ${stories.length} total, ${done} done`);
    }

    return { executed: true, summary: lines.join('\n'), data: { sprints, stories } };
}

// ─── UPDATE HANDLERS ─────────────────────────────────────────────────────────

export async function updateTaskStatus(
    projectId: string,
    message: string,
    supabase: any,
): Promise<HandlerResult> {
    // Determine target status
    const lower = message.toLowerCase();
    let newStatus: string;
    if (lower.includes('complete') || lower.includes('done') || lower.includes('finish')) {
        newStatus = 'Complete';
    } else if (lower.includes('in progress') || lower.includes('start') || lower.includes('working')) {
        newStatus = 'In Progress';
    } else if (lower.includes('not started') || lower.includes('reset') || lower.includes('pending')) {
        newStatus = 'Not Started';
    } else {
        newStatus = 'In Progress';
    }

    // Find task by name
    const taskName = extractEntityName(message, ['task', 'activity', 'item']);
    if (!taskName) {
        return {
            executed: false,
            summary: '⚠️ Please specify the task name. Example: "Mark task \'Design Review\' as complete"',
        };
    }

    const { data: tasks } = await supabase
        .from('tasks')
        .select('id, name, status')
        .eq('project_id', projectId)
        .ilike('name', `%${taskName}%`)
        .limit(5);

    if (!tasks?.length) {
        return { executed: false, summary: `🔍 No task found matching "${taskName}".` };
    }

    if (tasks.length > 1) {
        const names = tasks.map((t: any) => `- ${t.name} (${t.status})`).join('\n');
        return {
            executed: false,
            summary: `Found ${tasks.length} matching tasks. Please be more specific:\n${names}`,
        };
    }

    const task = tasks[0];
    const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', task.id);

    if (error) throw error;

    return {
        executed: true,
        summary: `✅ Task "${task.name}" updated: **${task.status}** → **${newStatus}**`,
        data: { taskId: task.id, oldStatus: task.status, newStatus },
    };
}

export async function updateTask(
    projectId: string,
    message: string,
    supabase: any,
): Promise<HandlerResult> {
    const taskName = extractEntityName(message, ['task', 'activity']);
    if (!taskName) {
        return {
            executed: false,
            summary: '⚠️ Please specify the task name. Example: "Update task \'Design Review\' due date to 2026-04-15"',
        };
    }

    // Find the task
    const { data: tasks } = await supabase
        .from('tasks')
        .select('id, name')
        .eq('project_id', projectId)
        .ilike('name', `%${taskName}%`)
        .limit(1)
        .single();

    if (!tasks) {
        return { executed: false, summary: `🔍 No task found matching "${taskName}".` };
    }

    // Parse updates
    const updates: Record<string, any> = {};
    const lower = message.toLowerCase();

    // Priority
    if (lower.includes('high priority') || lower.includes('priority high')) updates.priority = 'High';
    else if (lower.includes('medium priority') || lower.includes('priority medium')) updates.priority = 'Medium';
    else if (lower.includes('low priority') || lower.includes('priority low')) updates.priority = 'Low';
    else if (lower.includes('critical')) updates.priority = 'Critical';

    // Progress
    const progressMatch = message.match(/(\d+)\s*%/);
    if (progressMatch) updates.progress = parseInt(progressMatch[1], 10);

    // Dates
    const dateMatch = message.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
        if (lower.includes('start')) updates.start_date = dateMatch[1];
        else if (lower.includes('due') || lower.includes('end')) updates.end_date = dateMatch[1];
    }

    // Name change
    const renameMatch = message.match(/rename\s+(?:to|as)\s+["']([^"']+)["']/i);
    if (renameMatch) updates.name = renameMatch[1];

    if (Object.keys(updates).length === 0) {
        return {
            executed: false,
            summary: '⚠️ Could not determine what to update. Try: "Update task \'X\' priority to High" or "Set task \'X\' progress to 75%"',
        };
    }

    const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', tasks.id);

    if (error) throw error;

    const changeDesc = Object.entries(updates).map(([k, v]) => `${k}: ${v}`).join(', ');
    return {
        executed: true,
        summary: `✅ Task "${tasks.name}" updated: ${changeDesc}`,
        data: { taskId: tasks.id, updates },
    };
}

export async function updateRiskStatus(
    projectId: string,
    message: string,
    supabase: any,
): Promise<HandlerResult> {
    const lower = message.toLowerCase();
    let newStatus: string;
    if (lower.includes('close') || lower.includes('resolve')) newStatus = 'Closed';
    else if (lower.includes('mitigat')) newStatus = 'Mitigated';
    else if (lower.includes('escalat')) newStatus = 'Escalated';
    else if (lower.includes('accept')) newStatus = 'Accepted';
    else newStatus = 'Closed';

    const riskName = extractEntityName(message, ['risk']);
    if (!riskName) {
        return { executed: false, summary: '⚠️ Please specify the risk name.' };
    }

    const { data: risks } = await supabase
        .from('risks')
        .select('id, title, status')
        .eq('project_id', projectId)
        .ilike('title', `%${riskName}%`)
        .limit(1);

    if (!risks?.length) {
        return { executed: false, summary: `🔍 No risk found matching "${riskName}".` };
    }

    const risk = risks[0];
    const { error } = await supabase
        .from('risks')
        .update({ status: newStatus })
        .eq('id', risk.id);

    if (error) throw error;

    return {
        executed: true,
        summary: `✅ Risk "${risk.title}" updated: **${risk.status}** → **${newStatus}**`,
        data: { riskId: risk.id, oldStatus: risk.status, newStatus },
    };
}

export async function updateIssueStatus(
    projectId: string,
    message: string,
    supabase: any,
): Promise<HandlerResult> {
    const lower = message.toLowerCase();
    let newStatus: string;
    if (lower.includes('close') || lower.includes('resolve')) newStatus = 'Closed';
    else if (lower.includes('reopen') || lower.includes('re-open')) newStatus = 'Open';
    else if (lower.includes('escalat')) newStatus = 'Escalated';
    else newStatus = 'Closed';

    const issueName = extractEntityName(message, ['issue']);
    if (!issueName) {
        return { executed: false, summary: '⚠️ Please specify the issue name.' };
    }

    const { data: issues } = await supabase
        .from('issues')
        .select('id, title, status')
        .eq('project_id', projectId)
        .ilike('title', `%${issueName}%`)
        .limit(1);

    if (!issues?.length) {
        return { executed: false, summary: `🔍 No issue found matching "${issueName}".` };
    }

    const issue = issues[0];
    const { error } = await supabase
        .from('issues')
        .update({ status: newStatus })
        .eq('id', issue.id);

    if (error) throw error;

    return {
        executed: true,
        summary: `✅ Issue "${issue.title}" updated: **${issue.status}** → **${newStatus}**`,
        data: { issueId: issue.id, oldStatus: issue.status, newStatus },
    };
}

export async function updateProject(
    projectId: string,
    message: string,
    supabase: any,
): Promise<HandlerResult> {
    const updates: Record<string, any> = {};
    const lower = message.toLowerCase();

    // Status
    if (lower.includes('status')) {
        if (lower.includes('on hold') || lower.includes('pause')) updates.status = 'On Hold';
        else if (lower.includes('complete') || lower.includes('close')) updates.status = 'Completed';
        else if (lower.includes('active') || lower.includes('resume')) updates.status = 'Active';
        else if (lower.includes('cancel')) updates.status = 'Cancelled';
    }

    // Name
    const renameMatch = message.match(/rename\s+(?:project\s+)?(?:to|as)\s+["']([^"']+)["']/i);
    if (renameMatch) updates.name = renameMatch[1];

    // Dates
    const startMatch = message.match(/start\s+date\s+(?:to\s+)?(\d{4}-\d{2}-\d{2})/i);
    if (startMatch) updates.start_date = startMatch[1];
    const endMatch = message.match(/end\s+date\s+(?:to\s+)?(\d{4}-\d{2}-\d{2})/i);
    if (endMatch) updates.end_date = endMatch[1];

    if (Object.keys(updates).length === 0) {
        return {
            executed: false,
            summary: '⚠️ Could not determine what to update. Try: "Set project status to On Hold" or "Rename project to \'New Name\'"',
        };
    }

    const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId)
        .select('name')
        .single();

    if (error) throw error;

    const changeDesc = Object.entries(updates).map(([k, v]) => `${k}: ${v}`).join(', ');
    return {
        executed: true,
        summary: `✅ Project "${data.name}" updated: ${changeDesc}`,
        data: { projectId, updates },
    };
}

// ─── DELETE HANDLERS ─────────────────────────────────────────────────────────

export async function deleteTask(
    projectId: string,
    message: string,
    supabase: any,
): Promise<HandlerResult> {
    const taskName = extractEntityName(message, ['task', 'activity']);
    if (!taskName) {
        return { executed: false, summary: '⚠️ Please specify the task name to delete.' };
    }

    const { data: tasks } = await supabase
        .from('tasks')
        .select('id, name')
        .eq('project_id', projectId)
        .ilike('name', `%${taskName}%`)
        .limit(5);

    if (!tasks?.length) {
        return { executed: false, summary: `🔍 No task found matching "${taskName}".` };
    }

    if (tasks.length > 1) {
        const names = tasks.map((t: any) => `- ${t.name}`).join('\n');
        return {
            executed: false,
            summary: `Found ${tasks.length} matching tasks. Please be more specific:\n${names}`,
        };
    }

    const task = tasks[0];
    const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', task.id);

    if (error) throw error;

    return {
        executed: true,
        summary: `🗑️ Task "${task.name}" has been deleted.`,
        data: { deletedTaskId: task.id },
    };
}

export async function deletePhase(
    projectId: string,
    message: string,
    supabase: any,
): Promise<HandlerResult> {
    const phaseName = extractEntityName(message, ['phase']);
    if (!phaseName) {
        return { executed: false, summary: '⚠️ Please specify the phase name to delete.' };
    }

    const { data: phases } = await supabase
        .from('tasks')
        .select('id, name')
        .eq('project_id', projectId)
        .eq('type', 'summary')
        .ilike('name', `%${phaseName}%`)
        .limit(1);

    if (!phases?.length) {
        return { executed: false, summary: `🔍 No phase found matching "${phaseName}".` };
    }

    const phase = phases[0];
    const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', phase.id);

    if (error) throw error;

    return {
        executed: true,
        summary: `🗑️ Phase "${phase.name}" has been deleted.`,
        data: { deletedPhaseId: phase.id },
    };
}

export async function deleteRisk(
    projectId: string,
    message: string,
    supabase: any,
): Promise<HandlerResult> {
    const riskName = extractEntityName(message, ['risk']);
    if (!riskName) {
        return { executed: false, summary: '⚠️ Please specify the risk to delete.' };
    }

    const { data: risks } = await supabase
        .from('risks')
        .select('id, title')
        .eq('project_id', projectId)
        .ilike('title', `%${riskName}%`)
        .limit(1);

    if (!risks?.length) {
        return { executed: false, summary: `🔍 No risk found matching "${riskName}".` };
    }

    const risk = risks[0];
    const { error } = await supabase
        .from('risks')
        .delete()
        .eq('id', risk.id);

    if (error) throw error;

    return {
        executed: true,
        summary: `🗑️ Risk "${risk.title}" has been deleted.`,
        data: { deletedRiskId: risk.id },
    };
}

export async function deleteIssue(
    projectId: string,
    message: string,
    supabase: any,
): Promise<HandlerResult> {
    const issueName = extractEntityName(message, ['issue']);
    if (!issueName) {
        return { executed: false, summary: '⚠️ Please specify the issue to delete.' };
    }

    const { data: issues } = await supabase
        .from('issues')
        .select('id, title')
        .eq('project_id', projectId)
        .ilike('title', `%${issueName}%`)
        .limit(1);

    if (!issues?.length) {
        return { executed: false, summary: `🔍 No issue found matching "${issueName}".` };
    }

    const issue = issues[0];
    const { error } = await supabase
        .from('issues')
        .delete()
        .eq('id', issue.id);

    if (error) throw error;

    return {
        executed: true,
        summary: `🗑️ Issue "${issue.title}" has been deleted.`,
        data: { deletedIssueId: issue.id },
    };
}

export async function deleteMember(
    projectId: string,
    message: string,
    supabase: any,
): Promise<HandlerResult> {
    const memberName = extractEntityName(message, ['member', 'user', 'person', 'teammate']);
    if (!memberName) {
        return { executed: false, summary: '⚠️ Please specify the member name or email to remove.' };
    }

    // Find by name or email in profiles
    const { data: profiles } = await (supabase as any)
        .from('profiles')
        .select('id, email, full_name')
        .or(`full_name.ilike.%${memberName}%,email.ilike.%${memberName}%`)
        .limit(5);

    if (!profiles?.length) {
        return { executed: false, summary: `🔍 No team member found matching "${memberName}".` };
    }

    // Verify they're on this project
    const userId = profiles[0].id;
    const { error } = await supabase
        .from('user_roles')
        .delete()
        .match({ project_id: projectId, user_id: userId });

    if (error) throw error;

    return {
        executed: true,
        summary: `🗑️ Team member "${profiles[0].full_name || profiles[0].email}" removed from project.`,
        data: { removedUserId: userId },
    };
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/**
 * Extract an entity name from the message using quotes or keyword proximity.
 *
 * Patterns matched:
 * - "task 'Design Review'"
 * - "task called Design Review"
 * - "task named Design Review"
 * - "the Design Review task"
 */
function extractEntityName(message: string, entityWords: string[]): string | null {
    // 1. Quoted name
    const quotedMatch = message.match(/["'"]([^"'"]+)["'"]/);
    if (quotedMatch) return quotedMatch[1];

    // 2. "called X" or "named X"
    const calledMatch = message.match(/(?:called|named)\s+(.+?)(?:\s+(?:as|to|from|is|was|status)|\.|,|$)/i);
    if (calledMatch) return calledMatch[1].trim();

    // 3. After entity keyword: "task Design Review"
    for (const word of entityWords) {
        const regex = new RegExp(`${word}\\s+([A-Z][a-zA-Z0-9\\s]+?)(?:\\s+(?:as|to|from|is|was|status|complete|done|progress|high|low|medium|close|delete|remove)|\\.|\,|$)`, 'i');
        const match = message.match(regex);
        if (match) return match[1].trim();
    }

    return null;
}
