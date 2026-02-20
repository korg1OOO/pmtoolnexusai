import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { deductCredits, getTenantId } from "../_shared/creditDeduction.ts";

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
        const openAiKey = Deno.env.get("OPENAI_API_KEY");
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        if (!openAiKey) {
            throw new Error("OPENAI_API_KEY is not set");
        }

        // Identify caller for credit billing
        const authHeader = req.headers.get("Authorization");
        let userId: string | null = null;
        if (authHeader) {
            const token = authHeader.replace("Bearer ", "");
            const { data: { user } } = await supabase.auth.getUser(token);
            userId = user?.id ?? null;
        }

        // Fetch project context
        const { data: project } = await supabase.from("projects").select("*").eq("id", projectId).single();
        const { data: tasks } = await supabase.from("tasks").select("*").eq("project_id", projectId);
        const { data: risks } = await supabase.from("risks").select("*").eq("project_id", projectId);

        const projectContext = {
            project,
            tasks: tasks?.length || 0,
            criticalTasks: tasks?.filter((t: any) => t.is_critical).length || 0,
            existingRisks: risks?.length || 0,
            milestones: tasks?.filter((t: any) => t.type === 'milestone') || [],
        };

        const systemPrompt = `You are a Project Risk Management AI. 
Analyze the project context for project ${projectId}.
Identify:
1. Discovered Risks: Risks evident from the current schedule or known issues.
2. Hidden Risks: Inferred risks based on data patterns (e.g., knowledge concentration, seasonal timing).
3. Risk Connections: How risks relate to specific tasks or milestones.
4. Timing Risks: Seasonal or regulatory deadline risks.
5. Contractor Risks: Risks associated with external dependencies.

Output ONLY valid JSON in this format:
{
  "discoveredRisks": [{"id": "string", "title": "string", "description": "string", "source": "data-analysis|pattern-matching|dependency-analysis", "probability": "high|medium|low", "impact": "critical|high|medium|low", "linkedItems": ["task_id"], "confidence": 0.82, "explanation": "string"}],
  "hiddenRisks": [{"id": "string", "title": "string", "inference": "string", "indicators": ["string"], "potentialImpact": "string", "recommendation": "string", "confidence": 0.75}],
  "riskConnections": [{"riskId": "string", "connectedTo": "string", "connectionType": "scope-item|milestone|resource", "relationship": "string"}],
  "timingRisks": [{"id": "string", "type": "seasonal|regulatory-deadline", "description": "string", "period": "string", "impact": "string", "mitigation": "string"}],
  "contractorRisks": [{"id": "string", "contractorName": "string", "riskType": "performance|capacity", "description": "string", "indicators": ["string"], "recommendation": "string"}]
}`;

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${openAiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Context:\n${JSON.stringify(projectContext)}` },
                ],
                temperature: 0.1,
                response_format: { type: "json_object" },
            }),
        });

        const aiData = await response.json();
        const result = JSON.parse(aiData.choices[0].message.content);

        // Deduct AI credits — 2× billing multiplier applied inside helper
        const usage = aiData.usage ?? {};
        const tenantId = userId ? await getTenantId(supabase, userId) : null;
        await deductCredits(supabase, userId, tenantId, {
            featureType: "analyze_risks",
            requestId: `risk-${projectId}-${Date.now()}`,
            modelName: "gpt-4o",
            promptTokens: usage.prompt_tokens ?? 0,
            completionTokens: usage.completion_tokens ?? 0,
        });

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
