import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { projectId } = await req.json();
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Check for cached prediction
        const { data: cachedPrediction } = await supabase
            .from("ml_predictions")
            .select("*")
            .eq("project_id", projectId)
            .eq("prediction_type", "schedule")
            .gt("expires_at", new Date().toISOString())
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        if (cachedPrediction) {
            return new Response(
                JSON.stringify({
                    ...cachedPrediction.prediction_data,
                    from_cache: true,
                    confidence_score: cachedPrediction.confidence_score,
                    prediction_id: cachedPrediction.id,
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Fetch project and task data
        const { data: project } = await supabase.from("projects").select("*").eq("id", projectId).single();
        const { data: tasks } = await supabase.from("tasks").select("*").eq("project_id", projectId);
        const { data: risks } = await supabase.from("risks").select("*").eq("project_id", projectId);

        if (!project) {
            throw new Error("Project not found");
        }

        const startDate = new Date(project.start_date);
        const plannedEndDate = project.end_date ? new Date(project.end_date) : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
        const plannedDurationDays = Math.ceil((plannedEndDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));

        // Analyze tasks for delay prediction
        const taskPredictions = [];
        let totalPredictedDelay = 0;
        const criticalPathTasks: string[] = [];

        for (const task of tasks || []) {
            const taskStart = new Date(task.start_date);
            const taskEnd = new Date(task.end_date);
            const taskDuration = Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (24 * 60 * 60 * 1000));

            // Calculate delay probability based on task characteristics
            let delayProbability = 20; // base probability
            const delayFactors: string[] = [];

            // Factor: Task complexity (based on duration)
            if (taskDuration > 30) {
                delayProbability += 20;
                delayFactors.push("Complex/long-duration task");
            }

            // Factor: Dependencies
            if (task.dependencies && Array.isArray(task.dependencies) && task.dependencies.length > 2) {
                delayProbability += 15;
                delayFactors.push("Multiple dependencies");
            }

            // Factor: Current status
            if (task.status === "delayed" || (task.actual_end && new Date(task.actual_end) > taskEnd)) {
                delayProbability += 40;
                delayFactors.push("Already delayed");
            }

            // Factor: Resource assignment
            if (!task.assigned_to || (Array.isArray(task.assigned_to) && task.assigned_to.length === 0)) {
                delayProbability += 25;
                delayFactors.push("No assigned resources");
            }

            // Factor: Related risks
            const relatedRisks = risks?.filter(r =>
                r.linked_tasks && Array.isArray(r.linked_tasks) && r.linked_tasks.includes(task.id)
            ) || [];

            if (relatedRisks.length > 0) {
                delayProbability += relatedRisks.length * 10;
                delayFactors.push(`${relatedRisks.length} associated risk(s)`);
            }

            // Factor: Progress vs. time elapsed
            const now = Date.now();
            const elapsed = (now - taskStart.getTime()) / (taskEnd.getTime() - taskStart.getTime());
            const progress = (task.progress || 0) / 100;

            if (elapsed > progress + 0.2 && taskStart.getTime() < now) {
                delayProbability += 30;
                delayFactors.push("Behind schedule");
            }

            // Cap at 95%
            delayProbability = Math.min(95, delayProbability);

            // Estimate delay days
            const estimatedDelayDays = Math.round((delayProbability / 100) * taskDuration * 0.3);

            const delayLevel = delayProbability > 75 ? "critical" : delayProbability > 50 ? "high" : delayProbability > 25 ? "medium" : "low";

            // Critical path detection (simplified: tasks with high delay probability and dependencies)
            const isCritical = task.is_critical || delayProbability > 60;
            if (isCritical) {
                criticalPathTasks.push(task.id);
                totalPredictedDelay += estimatedDelayDays;
            }

            taskPredictions.push({
                task_id: task.id,
                task_name: task.title,
                planned_duration_days: taskDuration,
                predicted_duration_days: taskDuration + estimatedDelayDays,
                delay_days: estimatedDelayDays,
                delay_probability: delayProbability,
                delay_level: delayLevel,
                delay_factors: delayFactors,
                impact_on_critical_path: isCritical ? estimatedDelayDays : 0,
                is_critical: isCritical,
                mitigation_priority: delayLevel === "critical" || delayLevel === "high" ? "high" : delayLevel === "medium" ? "medium" : "low",
            });
        }

        // Calculate overall schedule prediction
        const predictedDurationDays = plannedDurationDays + totalPredictedDelay;
        const onTimeProbability = Math.max(5, 100 - (totalPredictedDelay / plannedDurationDays) * 100);

        // Generate recommended actions
        const recommendedActions = [];
        const highRiskTasks = taskPredictions.filter(t => t.delay_level === "critical" || t.delay_level === "high");

        if (highRiskTasks.length > 0) {
            recommendedActions.push(`Focus on ${highRiskTasks.length} high-risk task(s) immediately`);
        }

        const noResourceTasks = taskPredictions.filter(t => t.delay_factors.includes("No assigned resources"));
        if (noResourceTasks.length > 0) {
            recommendedActions.push(`Assign resources to ${noResourceTasks.length} unassigned task(s)`);
        }

        if (totalPredictedDelay > plannedDurationDays * 0.1) {
            recommendedActions.push("Consider schedule compression techniques or scope reduction");
        }

        const prediction = {
            total_planned_days: plannedDurationDays,
            total_predicted_days: predictedDurationDays,
            total_delay_days: totalPredictedDelay,
            completion_probability_on_time: Math.round(onTimeProbability),
            task_predictions: taskPredictions.sort((a, b) => b.delay_probability - a.delay_probability), // Sort by risk
            critical_path_tasks: criticalPathTasks,
            summary: `Project scheduled for ${plannedDurationDays} days, predicted to complete in ${predictedDurationDays} days (+${totalPredictedDelay} days delay). ${highRiskTasks.length} high-risk tasks identified.`,
            recommended_actions: recommendedActions,
        };

        // Calculate confidence based on data availability
        const confidenceScore = Math.min(0.95, 0.70 +
            (tasks && tasks.length > 5 ? 0.15 : 0) +
            (risks && risks.length > 0 ? 0.05 : 0) +
            ((tasks || []).filter(t => t.progress !== null).length / Math.max(1, (tasks || []).length) * 0.05)
        );

        // Store prediction
        const { data: savedPrediction, error: saveError } = await supabase
            .from("ml_predictions")
            .insert({
                project_id: projectId,
                prediction_type: "schedule",
                prediction_data: prediction,
                confidence_score: confidenceScore,
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            })
            .select()
            .single();

        if (saveError) {
            console.error("Failed to save schedule prediction:", saveError);
        }

        return new Response(
            JSON.stringify({
                ...prediction,
                confidence_score: confidenceScore,
                prediction_id: savedPrediction?.id,
                from_cache: false,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error: any) {
        console.error("Error in ml-predict-delays:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});
