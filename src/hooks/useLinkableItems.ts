/**
 * useLinkableItems Hook
 * Fetches linkable items (tasks, risks, decisions, actions, meetings, issues) for cross-referencing
 */

import { useQuery } from '@tanstack/react-query';
import { supabase as _supabase } from '@/integrations/supabase/client';
const supabase = _supabase as any;
import { LinkableItem, LinkableItemType } from '@/components/linking/LinkDialog';

/**
 * Fetch linkable items of a specific type for a project
 */
export function useLinkableItems(projectId: string, type: LinkableItemType) {
    return useQuery({
        queryKey: ['linkable-items', projectId, type],
        queryFn: async (): Promise<LinkableItem[]> => {
            if (!projectId || projectId === 'skip') return [];

            try {
                switch (type) {
                    case 'task': {
                        const { data, error } = await supabase
                            .from('tasks')
                            .select('id, wbs, name, status, assigned_to')
                            .eq('project_id', projectId)
                            .order('wbs', { ascending: true });

                        if (error) throw error;
                        return (data || []).map(task => ({
                            id: task.wbs || task.id,
                            title: task.name,
                            type: 'task',
                            status: task.status || 'not-started',
                            assignee: task.assigned_to,
                        }));
                    }

                    case 'risk': {
                        const { data, error } = await supabase
                            .from('risks')
                            .select('id, key, title, status, owner')
                            .eq('project_id', projectId)
                            .order('key', { ascending: true });

                        if (error) throw error;
                        return (data || []).map(risk => ({
                            id: risk.key || risk.id,
                            title: risk.title,
                            type: 'risk',
                            status: risk.status || 'identified',
                            assignee: risk.owner,
                        }));
                    }

                    case 'decision': {
                        const { data, error } = await supabase
                            .from('decisions')
                            .select('id, key, title, status, decision_maker, decision_date')
                            .eq('project_id', projectId)
                            .order('created_at', { ascending: false });

                        if (error) throw error;
                        return (data || []).map(decision => ({
                            id: decision.key || decision.id,
                            title: decision.title,
                            type: 'decision',
                            status: decision.status || 'active',
                            assignee: decision.decision_maker,
                            date: decision.decision_date,
                        }));
                    }

                    case 'action': {
                        const { data, error } = await supabase
                            .from('meeting_action_items')
                            .select('id, title, status, assignee, due_date')
                            .eq('project_id', projectId)
                            .order('created_at', { ascending: false });

                        if (error) throw error;
                        return (data || []).map((action, index) => ({
                            id: `ACT-${String(index + 1).padStart(3, '0')}`,
                            title: action.title,
                            type: 'action',
                            status: action.status || 'not-started',
                            assignee: action.assignee,
                            date: action.due_date,
                        }));
                    }

                    case 'meeting': {
                        const { data, error } = await supabase
                            .from('meetings')
                            .select('id, title, status, scheduled_date')
                            .eq('project_id', projectId)
                            .order('scheduled_date', { ascending: false });

                        if (error) throw error;
                        return (data || []).map((meeting, index) => ({
                            id: `MTG-${String(index + 1).padStart(3, '0')}`,
                            title: meeting.title,
                            type: 'meeting',
                            status: meeting.status || 'scheduled',
                            date: meeting.scheduled_date,
                        }));
                    }

                    case 'issue': {
                        const { data, error } = await supabase
                            .from('issues')
                            .select('id, key, title, status, assignee')
                            .eq('project_id', projectId)
                            .order('created_at', { ascending: false });

                        if (error) throw error;
                        return (data || []).map(issue => ({
                            id: issue.key || issue.id,
                            title: issue.title,
                            type: 'issue',
                            status: issue.status || 'open',
                            assignee: issue.assignee,
                        }));
                    }

                    default:
                        return [];
                }
            } catch (error) {
                console.error(`Error fetching ${type}s:`, error);
                return [];
            }
        },
        enabled: !!projectId && projectId !== 'skip',
    });
}

/**
 * Fetch all linkable items for a project (all types)
 */
export function useAllLinkableItems(projectId: string) {
    const tasks = useLinkableItems(projectId, 'task');
    const risks = useLinkableItems(projectId, 'risk');
    const decisions = useLinkableItems(projectId, 'decision');
    const actions = useLinkableItems(projectId, 'action');
    const meetings = useLinkableItems(projectId, 'meeting');
    const issues = useLinkableItems(projectId, 'issue');

    return {
        tasks: tasks.data || [],
        risks: risks.data || [],
        decisions: decisions.data || [],
        actions: actions.data || [],
        meetings: meetings.data || [],
        issues: issues.data || [],
        isLoading: tasks.isLoading || risks.isLoading || decisions.isLoading ||
            actions.isLoading || meetings.isLoading || issues.isLoading,
    };
}
