import { supabase as _supabase } from '@/integrations/supabase/client';
const supabase = _supabase as any;

// =====================================================
// TYPES
// =====================================================

export interface CollaborationSpaceAnalytics {
    id: string;
    tenant_id: string;
    space_id: string;
    document_count: number;
    meeting_count: number;
    task_count: number;
    member_count: number;
    active_members_7d: number;
    active_members_30d: number;
    messages_count: number;
    snapshot_date: string;
    created_at: string;
}

export interface SpaceActivityMetrics {
    total_documents: number;
    total_meetings: number;
    total_tasks: number;
    total_members: number;
    active_members: number;
    engagement_score: number;
}

export interface MemberEngagement {
    user_id: string;
    documents_shared: number;
    meetings_attended: number;
    tasks_completed: number;
    messages_sent: number;
    engagement_score: number;
}

export interface CrossProjectMetrics {
    project_id: string;
    project_name: string;
    collaboration_count: number;
    shared_documents: number;
    joint_meetings: number;
}

// =====================================================
// COLLABORATION SPACE ANALYTICS
// =====================================================

/**
 * Get analytics for a specific collaboration space
 */
export async function getSpaceAnalytics(
    spaceId: string,
    startDate: string,
    endDate: string
): Promise<SpaceActivityMetrics> {
    // Fetch space data
    const { data: space, error: spaceError } = await supabase
        .from('collaboration_spaces')
        .select(`
            id,
            collaboration_space_members (count),
            collaboration_space_documents (count),
            collaboration_space_meetings (count),
            collaboration_space_tasks (count)
        `)
        .eq('id', spaceId)
        .single();

    if (spaceError) {
        console.error('Error fetching space analytics:', spaceError);
        return {
            total_documents: 0,
            total_meetings: 0,
            total_tasks: 0,
            total_members: 0,
            active_members: 0,
            engagement_score: 0
        };
    }

    // Calculate active members (members with activity in date range)
    const { data: activeMembers } = await supabase
        .from('collaboration_space_members')
        .select('user_id')
        .eq('space_id', spaceId)
        .gte('last_active', startDate)
        .lte('last_active', endDate);

    const metrics = {
        total_documents: space.collaboration_space_documents?.[0]?.count || 0,
        total_meetings: space.collaboration_space_meetings?.[0]?.count || 0,
        total_tasks: space.collaboration_space_tasks?.[0]?.count || 0,
        total_members: space.collaboration_space_members?.[0]?.count || 0,
        active_members: activeMembers?.length || 0,
        engagement_score: 0
    };

    // Calculate engagement score
    metrics.engagement_score = calculateEngagementScore(metrics);

    return metrics;
}

/**
 * Calculate engagement score for a space
 */
function calculateEngagementScore(metrics: SpaceActivityMetrics): number {
    const {
        total_documents,
        total_meetings,
        total_tasks,
        total_members,
        active_members
    } = metrics;

    if (total_members === 0) return 0;

    // Weighted scoring
    const documentScore = Math.min(total_documents * 2, 30);
    const meetingScore = Math.min(total_meetings * 5, 30);
    const taskScore = Math.min(total_tasks * 3, 20);
    const activityRate = total_members > 0 ? (active_members / total_members) * 20 : 0;

    return Math.min(documentScore + meetingScore + taskScore + activityRate, 100);
}

/**
 * Get member engagement for a space
 */
export async function getMemberEngagement(
    spaceId: string,
    startDate: string,
    endDate: string
): Promise<MemberEngagement[]> {
    // Get all members
    const { data: members, error } = await supabase
        .from('collaboration_space_members')
        .select('user_id')
        .eq('space_id', spaceId);

    if (error || !members) {
        console.error('Error fetching members:', error);
        return [];
    }

    // Calculate engagement for each member
    const engagementPromises = members.map(async (member) => {
        // Count documents shared
        const { count: documentsCount } = await supabase
            .from('collaboration_space_documents')
            .select('*', { count: 'exact', head: true })
            .eq('space_id', spaceId)
            .eq('uploaded_by', member.user_id)
            .gte('created_at', startDate)
            .lte('created_at', endDate);

        // Count meetings attended
        const { count: meetingsCount } = await supabase
            .from('collaboration_space_meetings')
            .select('*', { count: 'exact', head: true })
            .eq('space_id', spaceId)
            .contains('attendees', [member.user_id])
            .gte('created_at', startDate)
            .lte('created_at', endDate);

        // Count tasks completed
        const { count: tasksCount } = await supabase
            .from('collaboration_space_tasks')
            .select('*', { count: 'exact', head: true })
            .eq('space_id', spaceId)
            .eq('assigned_to', member.user_id)
            .eq('status', 'completed')
            .gte('completed_at', startDate)
            .lte('completed_at', endDate);

        const documents_shared = documentsCount || 0;
        const meetings_attended = meetingsCount || 0;
        const tasks_completed = tasksCount || 0;

        // Count messages sent in the date range. project_chat_messages stores sender as user_id
        const { count: msgCount } = await supabase
            .from('project_chat_messages' as any)
            .select('*', { count: 'exact', head: true })
            .eq('user_id', member.user_id)
            .gte('created_at', startDate)
            .lte('created_at', endDate);
        const messages_sent = msgCount || 0;

        // Calculate engagement score
        const engagement_score = (
            (documents_shared * 2) +
            (meetings_attended * 3) +
            (tasks_completed * 5) +
            (messages_sent * 1)
        );

        return {
            user_id: member.user_id,
            documents_shared,
            meetings_attended,
            tasks_completed,
            messages_sent,
            engagement_score
        };
    });

    const engagement = await Promise.all(engagementPromises);
    return engagement.sort((a, b) => b.engagement_score - a.engagement_score);
}

/**
 * Get cross-project collaboration metrics
 */
export async function getCrossProjectMetrics(
    programId: string,
    startDate: string,
    endDate: string
): Promise<CrossProjectMetrics[]> {
    // Get all collaboration spaces for the program
    const { data: spaces, error } = await supabase
        .from('collaboration_spaces')
        .select(`
            id,
            name,
            project_ids
        `)
        .eq('program_id', programId)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

    if (error || !spaces) {
        console.error('Error fetching spaces:', error);
        return [];
    }

    // Aggregate by project
    const projectMetrics: { [key: string]: CrossProjectMetrics } = {};

    for (const space of spaces) {
        const projectIds = space.project_ids || [];

        for (const projectId of projectIds) {
            if (!projectMetrics[projectId]) {
                projectMetrics[projectId] = {
                    project_id: projectId,
                    project_name: '', // Will fetch later
                    collaboration_count: 0,
                    shared_documents: 0,
                    joint_meetings: 0
                };
            }

            projectMetrics[projectId].collaboration_count++;

            // Count documents
            const { count: docsCount } = await supabase
                .from('collaboration_space_documents')
                .select('*', { count: 'exact', head: true })
                .eq('space_id', space.id);

            projectMetrics[projectId].shared_documents += docsCount || 0;

            // Count meetings
            const { count: meetingsCount } = await supabase
                .from('collaboration_space_meetings')
                .select('*', { count: 'exact', head: true })
                .eq('space_id', space.id);

            projectMetrics[projectId].joint_meetings += meetingsCount || 0;
        }
    }

    // Fetch project names
    const projectIds = Object.keys(projectMetrics);
    if (projectIds.length > 0) {
        const { data: projects } = await supabase
            .from('projects')
            .select('id, name')
            .in('id', projectIds);

        projects?.forEach(project => {
            if (projectMetrics[project.id]) {
                projectMetrics[project.id].project_name = project.name;
            }
        });
    }

    return Object.values(projectMetrics);
}

/**
 * Get activity timeline for a space
 */
export async function getActivityTimeline(
    spaceId: string,
    startDate: string,
    endDate: string
): Promise<{ date: string; documents: number; meetings: number; tasks: number }[]> {
    // Get documents by date
    const { data: documents } = await supabase
        .from('collaboration_space_documents')
        .select('created_at')
        .eq('space_id', spaceId)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

    // Get meetings by date
    const { data: meetings } = await supabase
        .from('collaboration_space_meetings')
        .select('created_at')
        .eq('space_id', spaceId)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

    // Get tasks by date
    const { data: tasks } = await supabase
        .from('collaboration_space_tasks')
        .select('created_at')
        .eq('space_id', spaceId)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

    // Group by date
    const timeline: { [key: string]: { documents: number; meetings: number; tasks: number } } = {};

    documents?.forEach(doc => {
        const date = doc.created_at.split('T')[0];
        if (!timeline[date]) timeline[date] = { documents: 0, meetings: 0, tasks: 0 };
        timeline[date].documents++;
    });

    meetings?.forEach(meeting => {
        const date = meeting.created_at.split('T')[0];
        if (!timeline[date]) timeline[date] = { documents: 0, meetings: 0, tasks: 0 };
        timeline[date].meetings++;
    });

    tasks?.forEach(task => {
        const date = task.created_at.split('T')[0];
        if (!timeline[date]) timeline[date] = { documents: 0, meetings: 0, tasks: 0 };
        timeline[date].tasks++;
    });

    // Convert to array and sort
    return Object.entries(timeline)
        .map(([date, counts]) => ({ date, ...counts }))
        .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get top performing spaces
 */
export async function getTopSpaces(
    programId: string,
    startDate: string,
    endDate: string,
    limit: number = 10
): Promise<{ space_id: string; space_name: string; engagement_score: number }[]> {
    const { data: spaces, error } = await supabase
        .from('collaboration_spaces')
        .select('id, name')
        .eq('program_id', programId)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

    if (error || !spaces) {
        console.error('Error fetching spaces:', error);
        return [];
    }

    // Calculate engagement for each space
    const spaceScores = await Promise.all(
        spaces.map(async (space) => {
            const metrics = await getSpaceAnalytics(space.id, startDate, endDate);
            return {
                space_id: space.id,
                space_name: space.name,
                engagement_score: metrics.engagement_score
            };
        })
    );

    return spaceScores
        .sort((a, b) => b.engagement_score - a.engagement_score)
        .slice(0, limit);
}

/**
 * Track space activity (for real-time updates)
 */
export async function trackSpaceActivity(
    spaceId: string,
    activityType: 'document' | 'meeting' | 'task' | 'message',
    metadata?: any
): Promise<void> {
    // Update last_active for the user and record the activity type
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        await supabase
            .from('collaboration_space_members')
            .update({ last_active: new Date().toISOString() })
            .eq('space_id', spaceId)
            .eq('user_id', user.id);
    }
}
