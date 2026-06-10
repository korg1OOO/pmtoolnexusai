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
        const { projectId, content } = await req.json();
        const openAiKey = Deno.env.get("OPENAI_API_KEY");
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
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

        const systemPrompt = `You are an expert Project Management AI assistant. 
Analyze the following communication (email or chat) related to project ${projectId}.
Extract:
1. Delay Signals: Any indication of schedule slippage or late delivery.
2. Blocker Patterns: Persistent issues preventing progress.
3. Scope Creep Indicators: Requests or discussions about features/work outside original scope.
4. Budget Pressure: Mention of costs exceeding allocations.
5. Actionable Items: Specific tasks that need attention.
6. Sentiment: Overall tone (positive, neutral, negative, urgent).

Output ONLY valid JSON in this format:
{
  "delaySignals": [{"description": "string", "severity": "critical|warning|info", "affectedItems": ["task_id"], "suggestedAction": "string"}],
  "blockerPatterns": [{"description": "string", "frequency": 1, "owner": "string", "resolution": "string"}],
  "scopeCreepIndicators": [{"description": "string", "source": "string", "impact": "schedule|budget|resources", "recommendation": "string"}],
  "budgetPressureSignals": [{"description": "string", "severity": "critical|warning|info", "category": "string", "recommendation": "string"}],
  "actionableItems": [{"title": "string", "owner": "string", "dueDate": "YYYY-MM-DD", "priority": "high|medium|low", "source": "string"}],
  "sentiment": "positive|neutral|negative|urgent",
  "confidence": 0.0
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
                    { role: "user", content: `Content to analyze:\n${content}` },
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
            featureType: "process_communication",
            requestId: `comm-${projectId}-${Date.now()}`,
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
