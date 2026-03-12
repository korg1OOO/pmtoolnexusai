import { supabase as _supabase } from '@/integrations/supabase/client';
const supabase = _supabase as any;

// =====================================================
// TYPES
// =====================================================

export interface MeetingAnalytics {
    id: string;
    tenant_id: string;
    meeting_id: string;
    total_invites: number;
    total_accepted: number;
    total_declined: number;
    total_tentative: number;
    total_attended: number;
    total_no_shows: number;
    attendance_rate: number;
    action_items_created: number;
    action_items_completed: number;
    action_items_pending: number;
    completion_rate: number;
    notes_count: number;
    scheduled_duration: number;
    actual_duration: number;
    duration_efficiency: number;
    effectiveness_score: number;
    calculated_at: string;
    created_at: string;
    updated_at: string;
}

export interface AttendancePattern {
    id: string;
    tenant_id: string;
    user_id: string;
    total_meetings_invited: number;
    total_meetings_accepted: number;
    total_meetings_declined: number;
    total_meetings_tentative: number;
    total_meetings_attended: number;
    total_no_shows: number;
    avg_response_time_hours: number;
    acceptance_rate: number;
    attendance_rate: number;
    period_start: string;
    period_end: string;
}

export interface MeetingStats {
    total_meetings: number;
    avg_attendance_rate: number;
    avg_completion_rate: number;
    avg_effectiveness_score: number;
    total_action_items: number;
    completed_action_items: number;
}

export interface MeetingTrend {
    date: string;
    meetings_count: number;
    avg_attendance: number;
    avg_effectiveness: number;
}

// =====================================================
// MEETING ANALYTICS
// =====================================================

/**
 * Get analytics for a specific meeting
 */
export async function getMeetingAnalytics(meetingId: string): Promise<MeetingAnalytics | null> {
    const { data, error } = await supabase
        .from('meeting_analytics')
        .select('*')
        .eq('meeting_id', meetingId)
        .single();

    if (error) {
        console.error('Error fetching meeting analytics:', error);
        return null;
    }

    return data;
}

/**
 * Calculate analytics for a meeting (calls database function)
 */
export async function calculateMeetingAnalytics(meetingId: string): Promise<string | null> {
    const { data, error } = await supabase.rpc('calculate_meeting_analytics', {
        p_meeting_id: meetingId
    });

    if (error) {
        console.error('Error calculating meeting analytics:', error);
        return null;
    }

    return data;
}

/**
 * Get meeting statistics for a program within a date range
 */
export async function getMeetingStats(
    programId: string,
    startDate: string,
    endDate: string
): Promise<MeetingStats> {
    const { data: meetings, error } = await supabase
        .from('meetings')
        .select(`
            id,
            meeting_analytics (
                attendance_rate,
                completion_rate,
                effectiveness_score,
                action_items_created,
                action_items_completed
            )
        `)
        .eq('program_id', programId)
        .gte('date', startDate)
        .lte('date', endDate);

    if (error) {
        console.error('Error fetching meeting stats:', error);
        return {
            total_meetings: 0,
            avg_attendance_rate: 0,
            avg_completion_rate: 0,
            avg_effectiveness_score: 0,
            total_action_items: 0,
            completed_action_items: 0
        };
    }

    const stats = meetings.reduce((acc, meeting: any) => {
        const analytics = meeting.meeting_analytics;
        if (analytics) {
            acc.total_meetings++;
            acc.avg_attendance_rate += analytics.attendance_rate || 0;
            acc.avg_completion_rate += analytics.completion_rate || 0;
            acc.avg_effectiveness_score += analytics.effectiveness_score || 0;
            acc.total_action_items += analytics.action_items_created || 0;
            acc.completed_action_items += analytics.action_items_completed || 0;
        }
        return acc;
    }, {
        total_meetings: 0,
        avg_attendance_rate: 0,
        avg_completion_rate: 0,
        avg_effectiveness_score: 0,
        total_action_items: 0,
        completed_action_items: 0
    });

    // Calculate averages
    if (stats.total_meetings > 0) {
        stats.avg_attendance_rate = stats.avg_attendance_rate / stats.total_meetings;
        stats.avg_completion_rate = stats.avg_completion_rate / stats.total_meetings;
        stats.avg_effectiveness_score = stats.avg_effectiveness_score / stats.total_meetings;
    }

    return stats;
}

/**
 * Get meeting trends over time
 */
export async function getMeetingTrends(
    programId: string,
    startDate: string,
    endDate: string,
    groupBy: 'day' | 'week' | 'month' = 'day'
): Promise<MeetingTrend[]> {
    const { data: meetings, error } = await supabase
        .from('meetings')
        .select(`
            date,
            meeting_analytics (
                attendance_rate,
                effectiveness_score
            )
        `)
        .eq('program_id', programId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date');

    if (error) {
        console.error('Error fetching meeting trends:', error);
        return [];
    }

    // Group by date
    const grouped = meetings.reduce((acc: any, meeting: any) => {
        const date = meeting.date;
        if (!acc[date]) {
            acc[date] = {
                date,
                meetings_count: 0,
                total_attendance: 0,
                total_effectiveness: 0
            };
        }
        acc[date].meetings_count++;
        if (meeting.meeting_analytics) {
            acc[date].total_attendance += meeting.meeting_analytics.attendance_rate || 0;
            acc[date].total_effectiveness += meeting.meeting_analytics.effectiveness_score || 0;
        }
        return acc;
    }, {});

    // Calculate averages and format
    return Object.values(grouped).map((item: any) => ({
        date: item.date,
        meetings_count: item.meetings_count,
        avg_attendance: item.meetings_count > 0 ? item.total_attendance / item.meetings_count : 0,
        avg_effectiveness: item.meetings_count > 0 ? item.total_effectiveness / item.meetings_count : 0
    }));
}

/**
 * Get meeting type distribution
 */
export async function getMeetingTypeDistribution(
    programId: string,
    startDate: string,
    endDate: string
): Promise<{ type: string; count: number }[]> {
    const { data, error } = await supabase
        .from('meetings')
        .select('meeting_type')
        .eq('program_id', programId)
        .gte('date', startDate)
        .lte('date', endDate);

    if (error) {
        console.error('Error fetching meeting type distribution:', error);
        return [];
    }

    // Count by type
    const distribution = data.reduce((acc: any, meeting) => {
        const type = meeting.meeting_type || 'general';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {});

    return Object.entries(distribution).map(([type, count]) => ({
        type,
        count: count as number
    }));
}

// =====================================================
// ATTENDANCE ANALYTICS
// =====================================================

/**
 * Get attendance patterns for a user
 */
export async function getAttendancePatterns(
    userId: string,
    startDate: string,
    endDate: string
): Promise<AttendancePattern | null> {
    const { data, error } = await supabase
        .from('attendance_patterns')
        .select('*')
        .eq('user_id', userId)
        .eq('period_start', startDate)
        .eq('period_end', endDate)
        .single();

    if (error) {
        console.error('Error fetching attendance patterns:', error);
        return null;
    }

    return data;
}

/**
 * Update attendance patterns for a user (calls database function)
 */
export async function updateAttendancePatterns(
    userId: string,
    startDate: string,
    endDate: string
): Promise<string | null> {
    const { data, error } = await supabase.rpc('update_attendance_patterns', {
        p_user_id: userId,
        p_period_start: startDate,
        p_period_end: endDate
    });

    if (error) {
        console.error('Error updating attendance patterns:', error);
        return null;
    }

    return data;
}

/**
 * Get top attendees for a program
 */
export async function getTopAttendees(
    programId: string,
    startDate: string,
    endDate: string,
    limit: number = 10
): Promise<{ user_id: string; attendance_count: number; attendance_rate: number }[]> {
    const { data: meetings, error } = await supabase
        .from('meetings')
        .select(`
            id,
            meeting_attendees (
                user_id,
                status
            )
        `)
        .eq('program_id', programId)
        .gte('date', startDate)
        .lte('date', endDate);

    if (error) {
        console.error('Error fetching top attendees:', error);
        return [];
    }

    // Count attendance by user
    const userStats: any = {};
    meetings.forEach((meeting: any) => {
        meeting.meeting_attendees?.forEach((attendee: any) => {
            if (!userStats[attendee.user_id]) {
                userStats[attendee.user_id] = {
                    user_id: attendee.user_id,
                    total_invited: 0,
                    total_attended: 0
                };
            }
            userStats[attendee.user_id].total_invited++;
            if (attendee.status === 'attended') {
                userStats[attendee.user_id].total_attended++;
            }
        });
    });

    // Calculate rates and sort
    const attendees = Object.values(userStats).map((stats: any) => ({
        user_id: stats.user_id,
        attendance_count: stats.total_attended,
        attendance_rate: stats.total_invited > 0 ? (stats.total_attended / stats.total_invited) * 100 : 0
    }));

    return attendees
        .sort((a, b) => b.attendance_count - a.attendance_count)
        .slice(0, limit);
}

/**
 * Get RSVP analytics for a program
 */
export async function getRSVPAnalytics(
    programId: string,
    startDate: string,
    endDate: string
): Promise<{
    total_invites: number;
    accepted: number;
    declined: number;
    tentative: number;
    no_response: number;
}> {
    const { data: meetings, error } = await supabase
        .from('meetings')
        .select(`
            id,
            meeting_attendees (
                status
            )
        `)
        .eq('program_id', programId)
        .gte('date', startDate)
        .lte('date', endDate);

    if (error) {
        console.error('Error fetching RSVP analytics:', error);
        return {
            total_invites: 0,
            accepted: 0,
            declined: 0,
            tentative: 0,
            no_response: 0
        };
    }

    const stats = {
        total_invites: 0,
        accepted: 0,
        declined: 0,
        tentative: 0,
        no_response: 0
    };

    meetings.forEach((meeting: any) => {
        meeting.meeting_attendees?.forEach((attendee: any) => {
            stats.total_invites++;
            switch (attendee.status) {
                case 'accepted':
                    stats.accepted++;
                    break;
                case 'declined':
                    stats.declined++;
                    break;
                case 'tentative':
                    stats.tentative++;
                    break;
                case 'pending':
                    stats.no_response++;
                    break;
            }
        });
    });

    return stats;
}

// =====================================================
// ACTION ITEM ANALYTICS
// =====================================================

/**
 * Get action item completion rate for a program
 */
export async function getActionItemCompletionRate(
    programId: string,
    startDate: string,
    endDate: string
): Promise<{
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    completion_rate: number;
}> {
    const { data: meetings, error } = await supabase
        .from('meetings')
        .select(`
            id,
            meeting_action_items (
                id,
                status,
                due_date
            )
        `)
        .eq('program_id', programId)
        .gte('date', startDate)
        .lte('date', endDate);

    if (error) {
        console.error('Error fetching action item completion rate:', error);
        return {
            total: 0,
            completed: 0,
            pending: 0,
            overdue: 0,
            completion_rate: 0
        };
    }

    const now = new Date();
    const stats = {
        total: 0,
        completed: 0,
        pending: 0,
        overdue: 0,
        completion_rate: 0
    };

    meetings.forEach((meeting: any) => {
        meeting.meeting_action_items?.forEach((item: any) => {
            stats.total++;
            if (item.status === 'completed') {
                stats.completed++;
            } else {
                stats.pending++;
                if (item.due_date && new Date(item.due_date) < now) {
                    stats.overdue++;
                }
            }
        });
    });

    stats.completion_rate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

    return stats;
}
