import { supabase } from "@/integrations/supabase/client";

export interface TimelineSwimlane {
    id: string;
    label: string;
    color: string;
    collapsed: boolean;
    order_index: number;
    project_id: string;
    target_duration?: number;
    site_ids?: string[];
    team_ids?: string[];
    activities?: TimelineActivity[];
}

export interface TimelineActivity {
    id: string;
    swimlane_id: string;
    name: string;
    start_month: number;
    duration_months: number;
    color: string;
    tags?: string[];
    notes?: string;
    resources_per_month?: Record<string, number>;
    dependencies?: TimelineDependency[];
    order_index: number;
}

export interface TimelineDependency {
    id?: string;
    source_activity_id: string;
    target_activity_id: string;
    type: 'FS' | 'SS' | 'FF' | 'SF';
}

export interface TimelineMilestone {
    id: string;
    project_id: string;
    name: string;
    month_index: number;
    color: string;
}

export interface TimelineSnapshot {
    id: string;
    project_id: string;
    name: string;
    description?: string;
    timestamp: string;
    data: any;
}

export const timelineService = {
    async fetchTimelineData(projectId: string) {
        // Fetch Swimlanes with Activities
        const { data: swimlanes, error: swimlaneError } = await supabase
            .from('timeline_swimlanes')
            .select(`
                *,
                activities:timeline_activities(*)
            `)
            .eq('project_id', projectId)
            .order('order_index', { foreignTable: 'timeline_swimlanes' })
            .order('order_index', { foreignTable: 'timeline_activities' });

        if (swimlaneError) throw swimlaneError;

        // Fetch Dependencies separately or via nested (dependencies might be cross-swimlane, so fetching all for project or doing a separate fetch is often easier)
        // For now, let's fetch all activities to get their IDs, then fetch dependencies for them.
        // Or simpler: fetch all dependencies where source or target is in the fetched activities.
        // Actually, fetching all dependencies for the project's activities is robust.

        // Get all activity IDs
        const activityIds = swimlanes?.flatMap(s => s.activities?.map((a: any) => a.id) || []) || [];

        let dependencies: TimelineDependency[] = [];
        if (activityIds.length > 0) {
            const { data: deps, error: depsError } = await supabase
                .from('timeline_dependencies')
                .select('*')
                .in('source_activity_id', activityIds);

            if (depsError) throw depsError;
            dependencies = deps as TimelineDependency[];
        }

        // Attach dependencies to activities (client-side join for convenience or just return raw)
        // We will return raw structure and let the component assemble it

        const { data: milestones, error: milestoneError } = await supabase
            .from('timeline_milestones')
            .select('*')
            .eq('project_id', projectId);

        if (milestoneError) throw milestoneError;

        return {
            swimlanes: swimlanes as TimelineSwimlane[],
            dependencies,
            milestones: milestones as TimelineMilestone[]
        };
    },

    async saveSwimlane(swimlane: Partial<TimelineSwimlane>) {
        const { data, error } = await supabase
            .from('timeline_swimlanes')
            .upsert(swimlane)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deleteSwimlane(id: string) {
        const { error } = await supabase
            .from('timeline_swimlanes')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    async saveActivity(activity: Partial<TimelineActivity>) {
        const { data, error } = await supabase
            .from('timeline_activities')
            .upsert(activity)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deleteActivity(id: string) {
        const { error } = await supabase
            .from('timeline_activities')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    async saveDependency(dependency: TimelineDependency) {
        const { data, error } = await supabase
            .from('timeline_dependencies')
            .upsert(dependency)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deleteDependency(sourceId: string, targetId: string) {
        const { error } = await supabase
            .from('timeline_dependencies')
            .delete()
            .match({ source_activity_id: sourceId, target_activity_id: targetId });
        if (error) throw error;
    },

    async saveMilestone(milestone: Partial<TimelineMilestone>) {
        const { data, error } = await supabase
            .from('timeline_milestones')
            .upsert(milestone)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deleteMilestone(id: string) {
        const { error } = await supabase
            .from('timeline_milestones')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    async createSnapshot(snapshot: Partial<TimelineSnapshot>) {
        const { data, error } = await supabase
            .from('timeline_snapshots')
            .insert(snapshot)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async getSnapshots(projectId: string) {
        const { data, error } = await supabase
            .from('timeline_snapshots')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },
    async deleteSnapshot(id: string) {
        const { error } = await supabase
            .from('timeline_snapshots')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    // Sites
    async fetchSites(projectId: string) {
        const { data, error } = await supabase
            .from('timeline_sites')
            .select('*')
            .eq('project_id', projectId);
        if (error) throw error;
        return data;
    },
    async saveSite(site: any) {
        const { data, error } = await supabase
            .from('timeline_sites')
            .upsert(site)
            .select()
            .single();
        if (error) throw error;
        return data;
    },
    async deleteSite(id: string) {
        const { error } = await supabase
            .from('timeline_sites')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    // Teams
    async fetchTeams(projectId: string) {
        const { data, error } = await supabase
            .from('timeline_teams')
            .select('*')
            .eq('project_id', projectId);
        if (error) throw error;
        return data;
    },
    async saveTeam(team: any) {
        const { data, error } = await supabase
            .from('timeline_teams')
            .upsert(team)
            .select()
            .single();
        if (error) throw error;
        return data;
    },
    async deleteTeam(id: string) {
        const { error } = await supabase
            .from('timeline_teams')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }
};
