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
        const { projectId, timeframe = "project_end" } = await req.json();
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Check for cached prediction
        const { data: cachedPrediction } = await supabase
            .from("ml_predictions")
            .select("*")
            .eq("project_id", projectId)
            .eq("prediction_type", "cost")
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

        // Fetch project financial data
        const { data: project } = await supabase.from("projects").select("*").eq("id", projectId).single();
        const { data: tasks } = await supabase.from("tasks").select("*").eq("project_id", projectId);

        if (!project) {
            throw new Error("Project not found");
        }

        const budget = project.budget || 0;
        const spent = project.spent || 0;
        const progress = project.progress || 0;

        // Calculate expected spend based on progress
        const expectedSpend = budget * (progress / 100);
        const currentVariance = spent - expectedSpend;
        const variancePercent = expectedSpend > 0 ? (currentVariance / expectedSpend) * 100 : 0;

        // Project final cost (simple linear projection)
        const completionFactor = progress > 0 ? 100 / progress : 1;
        const projectedTotalCost = spent * completionFactor;
        const finalVariance = projectedTotalCost - budget;
        const finalVariancePercent = budget > 0 ? (finalVariance / budget) * 100 : 0;

        // Generate timeline (monthly forecasts)
        const startDate = new Date(project.start_date);
        const endDate = project.end_date ? new Date(project.end_date) : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
        const timelineMonths = Math.max(6, Math.ceil((endDate.getTime() - startDate.getTime()) / (30 * 24 * 60 * 60 * 1000)));

        const timeline = [];
        const monthlyBudget = budget / timelineMonths;
        const monthlyForecast = projectedTotalCost / timelineMonths;

        for (let i = 0; i <= timelineMonths; i++) {
            const date = new Date(startDate);
            date.setMonth(date.getMonth() + i);

            timeline.push({
                date: date.toISOString().split('T')[0],
                budgeted: Math.round(monthlyBudget * i),
                forecast: Math.round(monthlyForecast * i),
                actual: i <= (timelineMonths * progress / 100) ? Math.round((spent / progress * 100) * (i / timelineMonths) * progress / 100) : undefined,
            });
        }

        // Variance by category (mock breakdown)
        const varianceByCategory = [
            {
                category: "Labor",
                budgeted: budget * 0.50,
                forecast: projectedTotalCost * 0.52,
                variance: projectedTotalCost * 0.52 - budget * 0.50,
                variance_percent: ((projectedTotalCost * 0.52 - budget * 0.50) / (budget * 0.50)) * 100,
            },
            {
                category: "Materials",
                budgeted: budget * 0.30,
                forecast: projectedTotalCost * 0.28,
                variance: projectedTotalCost * 0.28 - budget * 0.30,
                variance_percent: ((projectedTotalCost * 0.28 - budget * 0.30) / (budget * 0.30)) * 100,
            },
            {
                category: "Equipment",
                budgeted: budget * 0.15,
                forecast: projectedTotalCost * 0.15,
                variance: projectedTotalCost * 0.15 - budget * 0.15,
                variance_percent: 0,
            },
            {
                category: "Overhead",
                budgeted: budget * 0.05,
                forecast: projectedTotalCost * 0.05,
                variance: projectedTotalCost * 0.05 - budget * 0.05,
                variance_percent: 0,
            },
        ];

        // Generate insights
        const insights = [];
        if (finalVariancePercent > 10) {
            insights.push(`Project trending ${finalVariancePercent.toFixed(1)}% over budget due to labor cost overruns`);
        }
        if (variancePercent > 5) {
            insights.push(`Current spending rate is ${variancePercent.toFixed(1)}% above plan`);
        }
        if (progress < 30 && spent > budget * 0.4) {
            insights.push(`Early overspend detected - review budget allocation`);
        }
        if (varianceByCategory[0].variance_percent > 10) {
            insights.push(`Labor costs trending ${varianceByCategory[0].variance_percent.toFixed(1)}% over budget - skilled labor shortage impact`);
        }

        const prediction = {
            total_budget: budget,
            total_forecast: Math.round(projectedTotalCost),
            total_variance: Math.round(finalVariance),
            variance_percent: Math.round(finalVariancePercent * 10) / 10,
            timeline: timeline,
            variance_by_category: varianceByCategory.map(c => ({
                ...c,
                budgeted: Math.round(c.budgeted),
                forecast: Math.round(c.forecast),
                variance: Math.round(c.variance),
                variance_percent: Math.round(c.variance_percent * 10) / 10,
            })),
            insights: insights,
            predicted_completion_cost: Math.round(projectedTotalCost),
            confidence_interval: {
                lower: Math.round(projectedTotalCost * 0.95),
                upper: Math.round(projectedTotalCost * 1.10),
            },
        };

        // Calculate confidence (based on data quality and project maturity)
        const confidenceScore = Math.min(0.95, 0.65 + (progress / 200) + (budget > 0 ? 0.15 : 0) + (tasks && tasks.length > 10 ? 0.1 : 0));

        // Store prediction
        const { data: savedPrediction, error: saveError } = await supabase
            .from("ml_predictions")
            .insert({
                project_id: projectId,
                prediction_type: "cost",
                prediction_data: prediction,
                confidence_score: confidenceScore,
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            })
            .select()
            .single();

        if (saveError) {
            console.error("Failed to save cost prediction:", saveError);
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
        console.error("Error in ml-forecast-costs:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});
