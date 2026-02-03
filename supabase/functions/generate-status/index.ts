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
        const { projectId, audience } = await req.json();
        const openAiKey = Deno.env.get("OPENAI_API_KEY");
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        if (!openAiKey) {
            throw new Error("OPENAI_API_KEY is not set");
        }

        // Fetch project data for reporting
        const { data: project } = await supabase.from("projects").select("*").eq("id", projectId).single();
        const { data: tasks } = await supabase.from("tasks").select("*").eq("project_id", projectId);

        const context = {
            project,
            tasks: tasks?.length || 0,
            completedTasks: tasks?.filter(t => t.status === 'completed').length || 0,
            milestones: tasks?.filter(t => t.type === 'milestone') || [],
        };

        const systemPrompt = `You are an Executive Project Reporter. 
Generate a status report for project ${projectId} tailored for the audience: ${audience}.
Audiences:
- steering-committee: Focus on budget, strategic risks, and timeline.
- sponsor: Focus on business value and critical decisions.
- board: High-level summary of health and major milestones.
- team: Focus on upcoming deliverables and blockers.

Output ONLY valid JSON in this format:
{
  "period": "string",
  "audience": "string",
  "sections": [{"title": "string", "content": "string", "highlights": ["string"], "concerns": ["string"]}],
  "ragStatus": {"overall": "red|amber|green", "schedule": "red|amber|green", "budget": "red|amber|green", "scope": "red|amber|green", "quality": "red|amber|green", "resources": "red|amber|green"},
  "keyChanges": [{"category": "decision|risk|milestone", "description": "string", "impact": "string", "date": "YYYY-MM-DD"}],
  "recommendations": ["string"]
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
                    { role: "user", content: `Context:\n${JSON.stringify(context)}` },
                ],
                temperature: 0.3,
                response_format: { type: "json_object" },
            }),
        });

        const aiData = await response.json();
        const result = JSON.parse(aiData.choices[0].message.content);
        result.id = `STATUS-${Date.now()}`;
        result.generatedAt = new Date().toISOString();

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
