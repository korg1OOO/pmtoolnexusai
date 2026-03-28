// =============================================================================
// Agent Pipeline — Phase 3: Extended CRUD Handlers
// =============================================================================
// Covers remaining UI operations: documents, deliverables, change requests,
// approvals, stakeholders, requirements, quality, calendar, notes, resources
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
        const regex = new RegExp(`${word}\\s+([A-Z][a-zA-Z0-9\\s]+?)(?:\\s+(?:as|to|from|is|was|status|complete|done|progress|approve|reject|close|delete|remove)|\\.|\,|$)`, 'i');
        const match = message.match(regex);
        if (match) return match[1].trim();
    }
    return null;
}

// ─── DOCUMENTS ───────────────────────────────────────────────────────────────

export async function queryDocuments(projectId: string, supabase: any): Promise<HandlerResult> {
    const { data, error } = await supabase
        .from('documents').select('name, file_type, status, version, created_at')
        .eq('project_id', projectId).eq('is_deleted', false)
        .order('created_at', { ascending: false }).limit(15);
    if (error) throw error;
    if (!data?.length) return { executed: true, summary: 'No documents found.', data: [] };
    const lines = [`📄 **Documents** (${data.length}):`, '',
        '| # | Document | Type | Status | Version |',
        '|---|----------|------|--------|---------|'];
    data.forEach((d: any, i: number) => {
        lines.push(`| ${i + 1} | ${d.name} | ${d.file_type || '-'} | ${d.status || 'draft'} | ${d.version || '1.0'} |`);
    });
    return { executed: true, summary: lines.join('\n'), data };
}

export async function updateDocumentStatus(projectId: string, message: string, supabase: any): Promise<HandlerResult> {
    const lower = message.toLowerCase();
    let newStatus: string;
    if (lower.includes('approve')) newStatus = 'approved';
    else if (lower.includes('review')) newStatus = 'review';
    else if (lower.includes('archive')) newStatus = 'archived';
    else newStatus = 'draft';

    const docName = extractEntityName(message, ['document', 'doc', 'file']);
    if (!docName) return { executed: false, summary: '⚠️ Please specify the document name.' };

    const { data: docs } = await supabase.from('documents').select('id, name, status')
        .eq('project_id', projectId).ilike('name', `%${docName}%`).limit(1);
    if (!docs?.length) return { executed: false, summary: `🔍 No document found matching "${docName}".` };

    const doc = docs[0];
    const { error } = await supabase.from('documents').update({ status: newStatus }).eq('id', doc.id);
    if (error) throw error;
    return { executed: true, summary: `✅ Document "${doc.name}" updated: **${doc.status}** → **${newStatus}**`, data: { docId: doc.id, newStatus } };
}

export async function deleteDocument(projectId: string, message: string, supabase: any): Promise<HandlerResult> {
    const docName = extractEntityName(message, ['document', 'doc', 'file']);
    if (!docName) return { executed: false, summary: '⚠️ Please specify the document name to delete.' };

    const { data: docs } = await supabase.from('documents').select('id, name')
        .eq('project_id', projectId).ilike('name', `%${docName}%`).limit(1);
    if (!docs?.length) return { executed: false, summary: `🔍 No document found matching "${docName}".` };

    const { error } = await supabase.from('documents').update({ is_deleted: true, deleted_at: new Date().toISOString() }).eq('id', docs[0].id);
    if (error) throw error;
    return { executed: true, summary: `🗑️ Document "${docs[0].name}" moved to trash.`, data: { deletedDocId: docs[0].id } };
}

// ─── DELIVERABLES ────────────────────────────────────────────────────────────

export async function queryDeliverables(projectId: string, supabase: any): Promise<HandlerResult> {
    const { data, error } = await (supabase as any).from('deliverables')
        .select('name, status, progress, due_date, phase, type')
        .eq('project_id', projectId).order('due_date', { ascending: true }).limit(15);
    if (error) throw error;
    if (!data?.length) return { executed: true, summary: 'No deliverables found.', data: [] };
    const lines = [`📦 **Deliverables** (${data.length}):`, '',
        '| # | Deliverable | Status | Progress | Due | Phase |',
        '|---|-------------|--------|----------|-----|-------|'];
    data.forEach((d: any, i: number) => {
        lines.push(`| ${i + 1} | ${d.name} | ${d.status} | ${d.progress || 0}% | ${d.due_date || '-'} | ${d.phase || '-'} |`);
    });
    return { executed: true, summary: lines.join('\n'), data };
}

export async function updateDeliverable(projectId: string, message: string, supabase: any): Promise<HandlerResult> {
    const lower = message.toLowerCase();
    const name = extractEntityName(message, ['deliverable']);
    if (!name) return { executed: false, summary: '⚠️ Please specify the deliverable name.' };

    const { data: items } = await (supabase as any).from('deliverables').select('id, name, status')
        .eq('project_id', projectId).ilike('name', `%${name}%`).limit(1);
    if (!items?.length) return { executed: false, summary: `🔍 No deliverable found matching "${name}".` };

    const updates: Record<string, any> = {};
    if (lower.includes('approve')) updates.status = 'approved';
    else if (lower.includes('reject')) updates.status = 'rejected';
    else if (lower.includes('review')) updates.status = 'review';
    else if (lower.includes('progress') || lower.includes('start')) updates.status = 'in-progress';
    const progressMatch = message.match(/(\d+)\s*%/);
    if (progressMatch) updates.progress = parseInt(progressMatch[1], 10);

    if (Object.keys(updates).length === 0) return { executed: false, summary: '⚠️ Could not determine update. Try: "Approve deliverable \'X\'" or "Set deliverable \'X\' progress to 80%"' };

    const { error } = await (supabase as any).from('deliverables').update(updates).eq('id', items[0].id);
    if (error) throw error;
    return { executed: true, summary: `✅ Deliverable "${items[0].name}" updated: ${Object.entries(updates).map(([k, v]) => `${k}: ${v}`).join(', ')}`, data: { id: items[0].id, updates } };
}

export async function deleteDeliverable(projectId: string, message: string, supabase: any): Promise<HandlerResult> {
    const name = extractEntityName(message, ['deliverable']);
    if (!name) return { executed: false, summary: '⚠️ Please specify the deliverable to delete.' };

    const { data: items } = await (supabase as any).from('deliverables').select('id, name')
        .eq('project_id', projectId).ilike('name', `%${name}%`).limit(1);
    if (!items?.length) return { executed: false, summary: `🔍 No deliverable found matching "${name}".` };

    const { error } = await (supabase as any).from('deliverables').delete().eq('id', items[0].id);
    if (error) throw error;
    return { executed: true, summary: `🗑️ Deliverable "${items[0].name}" deleted.`, data: { deletedId: items[0].id } };
}

// ─── CHANGE REQUESTS ─────────────────────────────────────────────────────────

export async function queryChangeRequests(projectId: string, supabase: any): Promise<HandlerResult> {
    const { data, error } = await supabase.from('change_requests').select('title, status, priority, impact, created_at')
        .eq('project_id', projectId).order('created_at', { ascending: false }).limit(10);
    if (error) throw error;
    if (!data?.length) return { executed: true, summary: 'No change requests found.', data: [] };
    const lines = [`📋 **Change Requests** (${data.length}):`, '',
        '| # | Title | Status | Priority | Impact |',
        '|---|-------|--------|----------|--------|'];
    data.forEach((cr: any, i: number) => {
        lines.push(`| ${i + 1} | ${cr.title} | ${cr.status || '-'} | ${cr.priority || '-'} | ${cr.impact || '-'} |`);
    });
    return { executed: true, summary: lines.join('\n'), data };
}

export async function updateChangeRequest(projectId: string, message: string, supabase: any): Promise<HandlerResult> {
    const lower = message.toLowerCase();
    const name = extractEntityName(message, ['change request', 'cr']);
    if (!name) return { executed: false, summary: '⚠️ Please specify the change request title.' };

    const { data: items } = await supabase.from('change_requests').select('id, title, status')
        .eq('project_id', projectId).ilike('title', `%${name}%`).limit(1);
    if (!items?.length) return { executed: false, summary: `🔍 No change request found matching "${name}".` };

    let newStatus: string;
    if (lower.includes('approve')) newStatus = 'approved';
    else if (lower.includes('reject')) newStatus = 'rejected';
    else if (lower.includes('defer')) newStatus = 'deferred';
    else if (lower.includes('review')) newStatus = 'under_review';
    else newStatus = 'approved';

    const { error } = await supabase.from('change_requests').update({ status: newStatus }).eq('id', items[0].id);
    if (error) throw error;
    return { executed: true, summary: `✅ Change Request "${items[0].title}" updated: **${items[0].status}** → **${newStatus}**`, data: { id: items[0].id, newStatus } };
}

// ─── APPROVALS ───────────────────────────────────────────────────────────────

export async function queryApprovals(projectId: string, supabase: any): Promise<HandlerResult> {
    const { data, error } = await (supabase as any).from('approvals')
        .select('title, type, status, created_at')
        .eq('project_id', projectId).order('created_at', { ascending: false }).limit(10);
    if (error) throw error;
    if (!data?.length) return { executed: true, summary: 'No pending approvals.', data: [] };
    const lines = [`✅ **Approvals** (${data.length}):`, '',
        '| # | Title | Type | Status |',
        '|---|-------|------|--------|'];
    data.forEach((a: any, i: number) => {
        lines.push(`| ${i + 1} | ${a.title} | ${a.type || '-'} | ${a.status} |`);
    });
    return { executed: true, summary: lines.join('\n'), data };
}

export async function approveItem(projectId: string, message: string, supabase: any): Promise<HandlerResult> {
    const name = extractEntityName(message, ['approval', 'item', 'request']);
    if (!name) return { executed: false, summary: '⚠️ Please specify the approval title.' };

    const { data: items } = await (supabase as any).from('approvals').select('id, title, status')
        .eq('project_id', projectId).ilike('title', `%${name}%`).eq('status', 'pending').limit(1);
    if (!items?.length) return { executed: false, summary: `🔍 No pending approval found matching "${name}".` };

    const { error } = await (supabase as any).from('approvals')
        .update({ status: 'approved', approved_at: new Date().toISOString() }).eq('id', items[0].id);
    if (error) throw error;
    return { executed: true, summary: `✅ Approved: "${items[0].title}"`, data: { approvalId: items[0].id } };
}

export async function rejectItem(projectId: string, message: string, supabase: any): Promise<HandlerResult> {
    const name = extractEntityName(message, ['approval', 'item', 'request']);
    if (!name) return { executed: false, summary: '⚠️ Please specify the approval title.' };

    const { data: items } = await (supabase as any).from('approvals').select('id, title')
        .eq('project_id', projectId).ilike('title', `%${name}%`).eq('status', 'pending').limit(1);
    if (!items?.length) return { executed: false, summary: `🔍 No pending approval found matching "${name}".` };

    const reasonMatch = message.match(/(?:reason|because)\s*:?\s*(.+?)(?:\.|$)/i);
    const { error } = await (supabase as any).from('approvals')
        .update({ status: 'rejected', rejected_at: new Date().toISOString(), rejection_reason: reasonMatch?.[1] || null }).eq('id', items[0].id);
    if (error) throw error;
    return { executed: true, summary: `❌ Rejected: "${items[0].title}"${reasonMatch?.[1] ? ` — Reason: ${reasonMatch[1]}` : ''}`, data: { approvalId: items[0].id } };
}

// ─── STAKEHOLDERS ────────────────────────────────────────────────────────────

export async function queryStakeholders(projectId: string, supabase: any): Promise<HandlerResult> {
    const { data, error } = await supabase.from('stakeholders').select('name, role, organization, influence, interest')
        .eq('project_id', projectId).order('created_at', { ascending: false }).limit(15);
    if (error) throw error;
    if (!data?.length) return { executed: true, summary: 'No stakeholders registered.', data: [] };
    const lines = [`👤 **Stakeholders** (${data.length}):`, '',
        '| # | Name | Role | Organization | Influence | Interest |',
        '|---|------|------|-------------|-----------|----------|'];
    data.forEach((s: any, i: number) => {
        lines.push(`| ${i + 1} | ${s.name} | ${s.role || '-'} | ${s.organization || '-'} | ${s.influence || '-'} | ${s.interest || '-'} |`);
    });
    return { executed: true, summary: lines.join('\n'), data };
}

export async function deleteStakeholder(projectId: string, message: string, supabase: any): Promise<HandlerResult> {
    const name = extractEntityName(message, ['stakeholder']);
    if (!name) return { executed: false, summary: '⚠️ Please specify the stakeholder name.' };

    const { data: items } = await supabase.from('stakeholders').select('id, name')
        .eq('project_id', projectId).ilike('name', `%${name}%`).limit(1);
    if (!items?.length) return { executed: false, summary: `🔍 No stakeholder found matching "${name}".` };

    const { error } = await supabase.from('stakeholders').delete().eq('id', items[0].id);
    if (error) throw error;
    return { executed: true, summary: `🗑️ Stakeholder "${items[0].name}" removed.`, data: { deletedId: items[0].id } };
}

// ─── REQUIREMENTS ────────────────────────────────────────────────────────────

export async function queryRequirements(projectId: string, supabase: any): Promise<HandlerResult> {
    const { data, error } = await supabase.from('requirement_traceability_items')
        .select('code, description, type, priority, status').eq('project_id', projectId)
        .order('created_at', { ascending: false }).limit(15);
    if (error) throw error;
    if (!data?.length) return { executed: true, summary: 'No requirements found.', data: [] };
    const lines = [`📝 **Requirements** (${data.length}):`, '',
        '| # | Code | Description | Type | Priority | Status |',
        '|---|------|-------------|------|----------|--------|'];
    data.forEach((r: any, i: number) => {
        lines.push(`| ${i + 1} | ${r.code || '-'} | ${(r.description || '').substring(0, 40)} | ${r.type || '-'} | ${r.priority || '-'} | ${r.status || '-'} |`);
    });
    return { executed: true, summary: lines.join('\n'), data };
}

export async function deleteRequirement(projectId: string, message: string, supabase: any): Promise<HandlerResult> {
    const name = extractEntityName(message, ['requirement', 'req']);
    if (!name) return { executed: false, summary: '⚠️ Please specify the requirement code or name.' };

    const { data: items } = await supabase.from('requirement_traceability_items').select('id, code, description')
        .eq('project_id', projectId).or(`code.ilike.%${name}%,description.ilike.%${name}%`).limit(1);
    if (!items?.length) return { executed: false, summary: `🔍 No requirement found matching "${name}".` };

    const { error } = await supabase.from('requirement_traceability_items').delete().eq('id', items[0].id);
    if (error) throw error;
    return { executed: true, summary: `🗑️ Requirement "${items[0].code}" deleted.`, data: { deletedId: items[0].id } };
}

// ─── QUALITY ─────────────────────────────────────────────────────────────────

export async function queryQualityItems(projectId: string, supabase: any): Promise<HandlerResult> {
    const { data, error } = await (supabase as any).from('quality_items')
        .select('title, status, category, severity, responsible').eq('project_id', projectId)
        .order('created_at', { ascending: false }).limit(15);
    if (error) {
        if (error.code === '42P01') return { executed: true, summary: 'Quality register not configured for this project.', data: [] };
        throw error;
    }
    if (!data?.length) return { executed: true, summary: 'No quality items found.', data: [] };
    const lines = [`🔍 **Quality Register** (${data.length}):`, '',
        '| # | Item | Status | Category | Severity |',
        '|---|------|--------|----------|----------|'];
    data.forEach((q: any, i: number) => {
        lines.push(`| ${i + 1} | ${q.title} | ${q.status || '-'} | ${q.category || '-'} | ${q.severity || '-'} |`);
    });
    return { executed: true, summary: lines.join('\n'), data };
}

export async function createQualityItem(projectId: string, message: string, supabase: any): Promise<HandlerResult> {
    const title = extractEntityName(message, ['quality item', 'quality issue', 'defect', 'finding']);
    if (!title) return { executed: false, summary: '⚠️ Please specify the quality item title.' };

    const lower = message.toLowerCase();
    let severity = 'medium';
    if (lower.includes('critical')) severity = 'critical';
    else if (lower.includes('high')) severity = 'high';
    else if (lower.includes('low')) severity = 'low';

    const { data, error } = await (supabase as any).from('quality_items')
        .insert({ project_id: projectId, title, status: 'open', severity, category: 'general' })
        .select().single();
    if (error) throw error;
    return { executed: true, summary: `✅ Quality item "${title}" created (severity: ${severity}).`, data };
}

// ─── NOTES ───────────────────────────────────────────────────────────────────

export async function queryNotes(projectId: string, supabase: any): Promise<HandlerResult> {
    const { data, error } = await (supabase as any).from('notes')
        .select('title, content, created_at, updated_at').eq('project_id', projectId)
        .order('updated_at', { ascending: false }).limit(10);
    if (error) {
        if (error.code === '42P01') return { executed: true, summary: 'Notes not available for this project.', data: [] };
        throw error;
    }
    if (!data?.length) return { executed: true, summary: 'No notes found.', data: [] };
    const lines = [`📝 **Notes** (${data.length}):`, ''];
    data.forEach((n: any, i: number) => {
        lines.push(`${i + 1}. **${n.title || 'Untitled'}** — ${(n.content || '').substring(0, 60)}...`);
    });
    return { executed: true, summary: lines.join('\n'), data };
}

export async function createNote(projectId: string, message: string, supabase: any): Promise<HandlerResult> {
    const title = extractEntityName(message, ['note']);
    if (!title) return { executed: false, summary: '⚠️ Please specify the note title.' };

    const contentMatch = message.match(/(?:content|text|body)[:\s]+(.+?)(?:\.|$)/i);
    const { data, error } = await (supabase as any).from('notes')
        .insert({ project_id: projectId, title, content: contentMatch?.[1] || '' })
        .select().single();
    if (error) throw error;
    return { executed: true, summary: `✅ Note "${title}" created.`, data };
}

export async function deleteNote(projectId: string, message: string, supabase: any): Promise<HandlerResult> {
    const name = extractEntityName(message, ['note']);
    if (!name) return { executed: false, summary: '⚠️ Please specify the note title to delete.' };

    const { data: items } = await (supabase as any).from('notes').select('id, title')
        .eq('project_id', projectId).ilike('title', `%${name}%`).limit(1);
    if (!items?.length) return { executed: false, summary: `🔍 No note found matching "${name}".` };

    const { error } = await (supabase as any).from('notes').delete().eq('id', items[0].id);
    if (error) throw error;
    return { executed: true, summary: `🗑️ Note "${items[0].title}" deleted.`, data: { deletedId: items[0].id } };
}

// ─── CALENDAR ────────────────────────────────────────────────────────────────

export async function queryCalendar(projectId: string, supabase: any): Promise<HandlerResult> {
    const now = new Date().toISOString().split('T')[0];
    const { data, error } = await (supabase as any).from('calendar_events')
        .select('title, event_date, start_time, end_time, event_type')
        .eq('project_id', projectId).gte('event_date', now)
        .order('event_date', { ascending: true }).limit(10);

    if (error) {
        // Fallback: try meetings table
        const { data: meetings } = await supabase.from('meetings')
            .select('title, date, start_time, end_time, meeting_type')
            .eq('project_id', projectId).gte('date', now)
            .order('date', { ascending: true }).limit(10);
        if (!meetings?.length) return { executed: true, summary: 'No upcoming events.', data: [] };
        const lines = [`📅 **Upcoming Events** (${meetings.length}):`, ''];
        meetings.forEach((m: any, i: number) => {
            lines.push(`${i + 1}. **${m.title}** — ${m.date} at ${m.start_time || '-'}`);
        });
        return { executed: true, summary: lines.join('\n'), data: meetings };
    }

    if (!data?.length) return { executed: true, summary: 'No upcoming events.', data: [] };
    const lines = [`📅 **Upcoming Events** (${data.length}):`, ''];
    data.forEach((e: any, i: number) => {
        lines.push(`${i + 1}. **${e.title}** — ${e.event_date} at ${e.start_time || '-'} (${e.event_type || 'event'})`);
    });
    return { executed: true, summary: lines.join('\n'), data };
}

// ─── LESSONS LEARNED ─────────────────────────────────────────────────────────

export async function queryLessonsLearned(projectId: string, supabase: any): Promise<HandlerResult> {
    const { data, error } = await supabase.from('lessons_learned')
        .select('title, category, impact, recommendation, created_at')
        .eq('project_id', projectId).order('created_at', { ascending: false }).limit(10);
    if (error) throw error;
    if (!data?.length) return { executed: true, summary: 'No lessons learned logged.', data: [] };
    const lines = [`📖 **Lessons Learned** (${data.length}):`, ''];
    data.forEach((l: any, i: number) => {
        lines.push(`${i + 1}. **${l.title}** (${l.category || '-'}) — Impact: ${l.impact || '-'}`);
        if (l.recommendation) lines.push(`   💡 ${l.recommendation}`);
    });
    return { executed: true, summary: lines.join('\n'), data };
}

export async function deleteLessonLearned(projectId: string, message: string, supabase: any): Promise<HandlerResult> {
    const name = extractEntityName(message, ['lesson']);
    if (!name) return { executed: false, summary: '⚠️ Please specify the lesson title.' };

    const { data: items } = await supabase.from('lessons_learned').select('id, title')
        .eq('project_id', projectId).ilike('title', `%${name}%`).limit(1);
    if (!items?.length) return { executed: false, summary: `🔍 No lesson found matching "${name}".` };

    const { error } = await supabase.from('lessons_learned').delete().eq('id', items[0].id);
    if (error) throw error;
    return { executed: true, summary: `🗑️ Lesson "${items[0].title}" deleted.`, data: { deletedId: items[0].id } };
}

// ─── RESOURCES ───────────────────────────────────────────────────────────────

export async function queryResources(projectId: string, supabase: any): Promise<HandlerResult> {
    // Get team members with their allocation
    const { data: roles, error } = await supabase.from('user_roles')
        .select('user_id, role, created_at').eq('project_id', projectId);
    if (error) throw error;
    if (!roles?.length) return { executed: true, summary: 'No resources allocated.', data: [] };

    const userIds = roles.map((r: any) => r.user_id);
    const { data: profiles } = await (supabase as any).from('profiles')
        .select('id, email, full_name').in('id', userIds);

    const resources = roles.map((r: any) => {
        const p = profiles?.find((pr: any) => pr.id === r.user_id);
        return { name: p?.full_name || 'Unknown', email: p?.email || '-', role: r.role, since: r.created_at?.split('T')[0] || '-' };
    });

    const lines = [`👥 **Resources** (${resources.length}):`, '',
        '| # | Name | Email | Role | Since |', '|---|------|-------|------|-------|'];
    resources.forEach((r: any, i: number) => {
        lines.push(`| ${i + 1} | ${r.name} | ${r.email} | ${r.role} | ${r.since} |`);
    });
    return { executed: true, summary: lines.join('\n'), data: resources };
}

// ─── ACTION ITEMS ────────────────────────────────────────────────────────────

export async function queryActionItems(projectId: string, supabase: any): Promise<HandlerResult> {
    const { data, error } = await (supabase as any).from('meeting_action_items')
        .select('title, owner_name, due_date, priority, status')
        .order('due_date', { ascending: true }).limit(15);

    if (error) {
        if (error.code === '42P01') return { executed: true, summary: 'No action items found.', data: [] };
        throw error;
    }
    if (!data?.length) return { executed: true, summary: 'No action items found.', data: [] };

    const lines = [`📌 **Action Items** (${data.length}):`, '',
        '| # | Action | Owner | Due | Priority | Status |',
        '|---|--------|-------|-----|----------|--------|'];
    data.forEach((a: any, i: number) => {
        lines.push(`| ${i + 1} | ${a.title} | ${a.owner_name || '-'} | ${a.due_date || '-'} | ${a.priority || '-'} | ${a.status || '-'} |`);
    });
    return { executed: true, summary: lines.join('\n'), data };
}

export async function updateActionItem(projectId: string, message: string, supabase: any): Promise<HandlerResult> {
    const lower = message.toLowerCase();
    const name = extractEntityName(message, ['action item', 'action', 'item']);
    if (!name) return { executed: false, summary: '⚠️ Please specify the action item name.' };

    const { data: items } = await (supabase as any).from('meeting_action_items').select('id, title, status')
        .ilike('title', `%${name}%`).limit(1);
    if (!items?.length) return { executed: false, summary: `🔍 No action item found matching "${name}".` };

    let newStatus: string;
    if (lower.includes('complete') || lower.includes('done')) newStatus = 'completed';
    else if (lower.includes('progress')) newStatus = 'in-progress';
    else if (lower.includes('cancel')) newStatus = 'cancelled';
    else newStatus = 'completed';

    const updates: any = { status: newStatus };
    if (newStatus === 'completed') updates.completed_at = new Date().toISOString();

    const { error } = await (supabase as any).from('meeting_action_items').update(updates).eq('id', items[0].id);
    if (error) throw error;
    return { executed: true, summary: `✅ Action item "${items[0].title}" updated: **${items[0].status}** → **${newStatus}**`, data: { id: items[0].id, newStatus } };
}

// ─── MEETING MANAGEMENT ─────────────────────────────────────────────────────

export async function updateMeeting(projectId: string, message: string, supabase: any): Promise<HandlerResult> {
    const name = extractEntityName(message, ['meeting']);
    if (!name) return { executed: false, summary: '⚠️ Please specify the meeting name.' };

    const { data: meetings } = await supabase.from('meetings').select('id, title, status')
        .eq('project_id', projectId).ilike('title', `%${name}%`).limit(1);
    if (!meetings?.length) return { executed: false, summary: `🔍 No meeting found matching "${name}".` };

    const lower = message.toLowerCase();
    const updates: Record<string, any> = {};
    if (lower.includes('complete') || lower.includes('done')) updates.status = 'completed';
    else if (lower.includes('cancel')) updates.status = 'cancelled';
    else if (lower.includes('reschedule')) {
        const dateMatch = message.match(/(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) updates.date = dateMatch[1];
    }

    if (Object.keys(updates).length === 0) return { executed: false, summary: '⚠️ Could not determine update. Try: "Cancel meeting \'X\'" or "Complete meeting \'X\'"' };

    const { error } = await supabase.from('meetings').update(updates).eq('id', meetings[0].id);
    if (error) throw error;
    return { executed: true, summary: `✅ Meeting "${meetings[0].title}" updated: ${Object.entries(updates).map(([k, v]) => `${k}: ${v}`).join(', ')}`, data: { id: meetings[0].id, updates } };
}

export async function cancelMeeting(projectId: string, message: string, supabase: any): Promise<HandlerResult> {
    const name = extractEntityName(message, ['meeting']);
    if (!name) return { executed: false, summary: '⚠️ Please specify the meeting to cancel.' };

    const { data: meetings } = await supabase.from('meetings').select('id, title')
        .eq('project_id', projectId).ilike('title', `%${name}%`).limit(1);
    if (!meetings?.length) return { executed: false, summary: `🔍 No meeting found matching "${name}".` };

    const { error } = await supabase.from('meetings').update({ status: 'cancelled' }).eq('id', meetings[0].id);
    if (error) throw error;
    return { executed: true, summary: `✅ Meeting "${meetings[0].title}" cancelled.`, data: { cancelledId: meetings[0].id } };
}
