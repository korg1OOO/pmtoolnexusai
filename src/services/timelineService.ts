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

export interface TimelineSite {
    id: string;
    project_id: string;
    name: string;
    location?: string;
    color?: string;
}

export interface TimelineTeam {
    id: string;
    project_id: string;
    name: string;
    color?: string;
    description?: string;
}

export interface TimelineSnapshot {
    id: string;
    project_id: string;
    name: string;
    description?: string;
    timestamp: string;
    data: Record<string, unknown>;
}

export const timelineService = {
    async fetchTimelineData(projectId: string) {
        // Fetch Swimlanes with Activities
        const { data: swimlanes, error: swimlaneError } = await (supabase as any)
            .from('timeline_swimlanes')
            .select(`
                *,
                activities:timeline_activities(*)
            `)
            .eq('project_id', projectId);

        if (swimlaneError) throw swimlaneError;

        // Get all activity IDs
        const activityIds = swimlanes?.flatMap((s: any) => s.activities?.map((a: any) => a.id) || []) || [];

        let dependencies: TimelineDependency[] = [];
        if (activityIds.length > 0) {
            const { data: deps, error: depsError } = await (supabase as any)
                .from('timeline_dependencies')
                .select('*')
                .in('from_activity_id', activityIds);

            if (depsError) throw depsError;

            // Map database columns to interface
            dependencies = (deps || []).map((d: any) => ({
                id: d.id,
                source_activity_id: d.from_activity_id,
                target_activity_id: d.to_activity_id,
                type: d.dependency_type as 'FS' | 'SS' | 'FF' | 'SF',
            }));
        }

        const { data: milestones, error: milestoneError } = await (supabase as any)
            .from('timeline_milestones')
            .select('*')
            .eq('project_id', projectId);

        if (milestoneError) throw milestoneError;

        // Map swimlanes to interface
        const mappedSwimlanes: TimelineSwimlane[] = (swimlanes || []).map((s: any) => ({
            id: s.id,
            label: s.label,
            color: s.color,
            collapsed: s.collapsed,
            order_index: s.order_index || 0,
            project_id: s.project_id,
            target_duration: s.target_duration,
            site_ids: s.site_ids,
            team_ids: s.team_ids,
            activities: (s.activities || []).map((a: any) => ({
                id: a.id,
                swimlane_id: a.swimlane_id,
                name: a.label || a.name || 'Activity',
                start_month: a.start_month,
                duration_months: a.duration_months,
                color: a.color,
                order_index: a.order_index || 0,
            })),
        }));

        // Map milestones to interface
        const mappedMilestones: TimelineMilestone[] = (milestones || []).map((m: any) => ({
            id: m.id,
            project_id: m.project_id,
            name: m.label || m.name || 'Milestone',
            month_index: m.month || m.month_index || 0,
            color: m.color,
        }));

        return {
            swimlanes: mappedSwimlanes,
            dependencies,
            milestones: mappedMilestones
        };
    },

    async saveSwimlane(swimlane: Partial<TimelineSwimlane>) {
        const { data, error } = await (supabase as any)
            .from('timeline_swimlanes')
            .upsert(swimlane)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deleteSwimlane(id: string) {
        const { error } = await (supabase as any)
            .from('timeline_swimlanes')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    async saveActivity(activity: Partial<TimelineActivity>) {
        const { data, error } = await (supabase as any)
            .from('timeline_activities')
            .upsert(activity)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deleteActivity(id: string) {
        const { error } = await (supabase as any)
            .from('timeline_activities')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    async saveDependency(dependency: TimelineDependency) {
        const dbDep = {
            from_activity_id: dependency.source_activity_id,
            to_activity_id: dependency.target_activity_id,
            dependency_type: dependency.type,
        };
        const { data, error } = await (supabase as any)
            .from('timeline_dependencies')
            .upsert(dbDep)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deleteDependency(sourceId: string, targetId: string) {
        const { error } = await (supabase as any)
            .from('timeline_dependencies')
            .delete()
            .match({ from_activity_id: sourceId, to_activity_id: targetId });
        if (error) throw error;
    },

    async saveMilestone(milestone: Partial<TimelineMilestone>) {
        const dbMilestone = {
            id: milestone.id,
            project_id: milestone.project_id,
            label: milestone.name,
            month: milestone.month_index,
            color: milestone.color,
        };
        const { data, error } = await (supabase as any)
            .from('timeline_milestones')
            .upsert(dbMilestone)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deleteMilestone(id: string) {
        const { error } = await (supabase as any)
            .from('timeline_milestones')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    async createSnapshot(snapshot: Partial<TimelineSnapshot>) {
        const { data, error } = await (supabase as any)
            .from('timeline_snapshots')
            .insert(snapshot)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async getSnapshots(projectId: string) {
        const { data, error } = await (supabase as any)
            .from('timeline_snapshots')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },
    async deleteSnapshot(id: string) {
        const { error } = await (supabase as any)
            .from('timeline_snapshots')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    // Sites
    async fetchSites(projectId: string) {
        const { data, error } = await (supabase as any)
            .from('timeline_sites')
            .select('*')
            .eq('project_id', projectId);
        if (error) throw error;
        return data;
    },
    async saveSite(site: Partial<TimelineSite>) {
        const { data, error } = await (supabase as any)
            .from('timeline_sites')
            .upsert(site)
            .select()
            .single();
        if (error) throw error;
        return data;
    },
    async deleteSite(id: string) {
        const { error } = await (supabase as any)
            .from('timeline_sites')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    // Teams
    async fetchTeams(projectId: string) {
        const { data, error } = await (supabase as any)
            .from('timeline_teams')
            .select('*')
            .eq('project_id', projectId);
        if (error) throw error;
        return data;
    },
    async saveTeam(team: Partial<TimelineTeam>) {
        const { data, error } = await (supabase as any)
            .from('timeline_teams')
            .upsert(team)
            .select()
            .single();
        if (error) throw error;
        return data;
    },
    async deleteTeam(id: string) {
        const { error } = await (supabase as any)
            .from('timeline_teams')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }
};
