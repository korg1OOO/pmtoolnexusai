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
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Check for cached prediction (valid for 24 hours)
        const { data: cachedPrediction } = await supabase
            .from("ml_predictions")
            .select("*")
            .eq("project_id", projectId)
            .eq("prediction_type", "risk")
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

        // Fetch project data for risk analysis
        const { data: project } = await supabase.from("projects").select("*").eq("id", projectId).single();
        const { data: tasks } = await supabase.from("tasks").select("*").eq("project_id", projectId);
        const { data: risks } = await supabase.from("risks").select("*").eq("project_id", projectId);
        const { data: issues } = await supabase.from("issues").select("*").eq("project_id", projectId);
        const { data: resources } = await supabase.from("resources").select("*").eq("project_id", projectId);

        if (!project) {
            throw new Error("Project not found");
        }

        // Mock ML Risk Prediction Logic (heuristic-based)
        const totalTasks = tasks?.length || 0;
        const completedTasks = tasks?.filter((t) => t.status === "completed").length || 0;
        const delayedTasks = tasks?.filter((t) => t.status === "delayed" || t.actual_end && new Date(t.actual_end) > new Date(t.end_date)).length || 0;
        const highRisks = risks?.filter((r) => r.severity === "high" || r.severity === "critical").length || 0;
        const criticalIssues = issues?.filter((i) => i.severity === "high" || i.severity === "critical").length || 0;

        const budget = project.budget || 0;
        const spent = project.spent || 0;
        const costVariance = budget > 0 ? ((spent - budget) / budget) * 100 : 0;

        const resourceCount = resources?.length || 0;
        const resourceUtilization = resourceCount > 0 ? 75 + Math.random() * 20 : 50; // Mock: 75-95%

        // Calculate category scores (0-100 scale)
        const financialScore = Math.min(100, Math.max(0,
            50 + (costVariance * 2) + (highRisks * 10)
        ));

        const scheduleScore = Math.min(100, Math.max(0,
            40 + (delayedTasks / Math.max(1, totalTasks)) * 100 + (highRisks * 5)
        ));

        const resourceScore = Math.min(100, Math.max(0,
            30 + (resourceUtilization > 90 ? 50 : resourceUtilization > 80 ? 30 : 10) + (criticalIssues * 15)
        ));

        // Overall risk score (0-200 scale as per user requirements)
        const overallScore = Math.round((financialScore + scheduleScore + resourceScore) / 3 * 2);

        const riskLevel = overallScore > 150 ? "critical" : overallScore > 100 ? "high" : overallScore > 50 ? "medium" : "low";

        // Determine trend (mock: based on recent issues/risks)
        const recentRisks = risks?.filter((r) => {
            const createdAt = new Date(r.created_at);
            const daysAgo = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
            return daysAgo <= 14;
        }).length || 0;

        const trend = recentRisks > 3 ? "increasing" : recentRisks > 0 ? "stable" : "decreasing";

        // Generate risk factors
        const riskFactors = [];

        if (costVariance > 10) {
            riskFactors.push({
                id: `rf-cost-${Date.now()}`,
                title: "Cost Overrun Risk",
                description: `Project spending is ${costVariance.toFixed(1)}% over budget`,
                category: "financial",
                probability: Math.min(100, Math.round(costVariance * 5)),
                impact: costVariance > 20 ? "critical" : costVariance > 10 ? "high" : "medium",
                mitigation_status: "none",
                estimated_cost_impact: spent - budget,
            });
        }

        if (delayedTasks > 0) {
            riskFactors.push({
                id: `rf-schedule-${Date.now()}`,
                title: "Schedule Delay Risk",
                description: `${delayedTasks} tasks are currently delayed`,
                category: "schedule",
                probability: Math.min(100, Math.round((delayedTasks / Math.max(1, totalTasks)) * 100)),
                impact: delayedTasks > 5 ? "high" : "medium",
                mitigation_status: "none",
                estimated_delay_days: delayedTasks * 3,
            });
        }

        if (resourceUtilization > 85) {
            riskFactors.push({
                id: `rf-resource-${Date.now()}`,
                title: "Resource Constraint Risk",
                description: `Resource utilization at ${resourceUtilization.toFixed(0)}% - nearing capacity`,
                category: "resource",
                probability: 85,
                impact: "high",
                mitigation_status: "none",
            });
        }

        if (highRisks > 3) {
            riskFactors.push({
                id: `rf-risk-${Date.now()}`,
                title: "High Risk Concentration",
                description: `${highRisks} high-severity risks identified`,
                category: "financial",
                probability: 75,
                impact: "critical",
                mitigation_status: "none",
            });
        }

        const prediction = {
            overall_score: overallScore,
            risk_level: riskLevel,
            categories: [
                {
                    category: "financial",
                    score: Math.round(financialScore),
                    trend: trend,
                    contributing_factors: costVariance > 10 ? ["Budget overrun", "High-risk items"] : ["Normal variance"],
                },
                {
                    category: "schedule",
                    score: Math.round(scheduleScore),
                    trend: trend,
                    contributing_factors: delayedTasks > 0 ? ["Delayed tasks", "Schedule pressure"] : ["On track"],
                },
                {
                    category: "resource",
                    score: Math.round(resourceScore),
                    trend: trend,
                    contributing_factors: resourceUtilization > 85 ? ["High utilization", "Limited capacity"] : ["Adequate resources"],
                },
            ],
            risk_factors: riskFactors,
            trend: trend,
            predicted_at: new Date().toISOString(),
            summary: `Project risk level is ${riskLevel.toUpperCase()} with an overall score of ${overallScore}/200. ${riskFactors.length} key risk factors identified.`,
        };

        // Calculate confidence score (based on data availability)
        const dataQuality = (
            (totalTasks > 10 ? 0.3 : totalTasks / 30) +
            (risks && risks.length > 0 ? 0.3 : 0) +
            (budget > 0 ? 0.2 : 0) +
            (resourceCount > 0 ? 0.2 : 0)
        );
        const confidenceScore = Math.min(0.95, 0.7 + dataQuality);

        // Store prediction in database
        const { data: savedPrediction, error: saveError } = await supabase
            .from("ml_predictions")
            .insert({
                project_id: projectId,
                prediction_type: "risk",
                prediction_data: prediction,
                confidence_score: confidenceScore,
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            })
            .select()
            .single();

        if (saveError) {
            console.error("Failed to save prediction:", saveError);
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
        console.error("Error in ml-predict-risks:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});
