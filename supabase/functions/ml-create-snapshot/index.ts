/**
 * ML Snapshot Collection Edge Function
 * Creates snapshots of all active projects for training data
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SupabaseClient {
    from: (table: string) => any;
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Fetch all active projects
        const { data: projects, error: projectsError } = await supabase
            .from('projects')
            .select('id, name, status')
            .in('status', ['active', 'planning', 'in_progress']);

        if (projectsError) throw projectsError;

        if (!projects || projects.length === 0) {
            return new Response(
                JSON.stringify({ message: 'No active projects found', snapshots_created: 0 }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );
        }

        const results = [];
        let successCount = 0;
        let failureCount = 0;

        // Create snapshot for each project
        for (const project of projects) {
            try {
                const snapshot = await createProjectSnapshot(supabase, project.id);
                results.push({ project_id: project.id, project_name: project.name, status: 'success', snapshot_id: snapshot.id });
                successCount++;
            } catch (err: any) {
                results.push({ project_id: project.id, project_name: project.name, status: 'failed', error: err.message });
                failureCount++;
            }
        }

        return new Response(
            JSON.stringify({
                message: 'Snapshot collection completed',
                total_projects: projects.length,
                snapshots_created: successCount,
                failures: failureCount,
                results: results
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );

    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
});

async function createProjectSnapshot(supabase: SupabaseClient, projectId: string) {
    // Fetch project data
    const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

    if (projectError) throw projectError;

    // Fetch tasks
    const { data: tasks } = await supabase
        .from('actions')
        .select('*')
        .eq('project_id', projectId);

    // Fetch risks
    const { data: risks } = await supabase
        .from('risks')
        .select('*')
        .eq('project_id', projectId);

    // Aggregate data
    const totalTasks = tasks?.length || 0;
    const completedTasks = tasks?.filter((t: any) => t.status === 'Done').length || 0;
    const overdueTasks = tasks?.filter((t: any) => {
        if (!t.due_date || t.status === 'Done') return false;
        return new Date(t.due_date) < new Date();
    }).length || 0;

    const openRisks = risks?.filter((r: any) => r.status !== 'closed').length || 0;
    const highSeverityRisks = risks?.filter((r: any) => r.severity === 'high' || r.severity === 'critical').length || 0;

    const budget = project.budget || 0;
    const totalCosts = project.total_spent || 0;
    const budgetVariance = budget - totalCosts;
    const budgetVariancePercent = budget > 0 ? ((budgetVariance / budget) * 100) : 0;

    const startDate = new Date(project.start_date);
    const endDate = project.end_date ? new Date(project.end_date) : new Date();
    const plannedDurationDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const elapsedDays = (new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

    const snapshotData = {
        name: project.name,
        status: project.status,
        progress: project.progress || 0,
        start_date: project.start_date,
        end_date: project.end_date,
        budget: budget,
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        overdue_tasks: overdueTasks,
        total_costs: totalCosts,
        budget_variance: budgetVariance,
        budget_variance_percent: budgetVariancePercent,
        open_risks: openRisks,
        high_severity_risks: highSeverityRisks,
        planned_duration_days: plannedDurationDays,
        elapsed_days: elapsedDays
    };

    // Calculate data quality score
    let qualityScore = 0.5; // Base score
    if (totalTasks > 10) qualityScore += 0.2;
    if (budget > 0) qualityScore += 0.15;
    if (risks && risks.length > 0) qualityScore += 0.15;

    // Store snapshot
    const { data: snapshot, error: snapshotError } = await supabase
        .from('ml_training_data')
        .insert({
            project_id: projectId,
            snapshot_date: new Date().toISOString(),
            snapshot_data: snapshotData,
            data_quality_score: Math.min(1, qualityScore)
        })
        .select()
        .single();

    if (snapshotError) throw snapshotError;

    return snapshot;
}
