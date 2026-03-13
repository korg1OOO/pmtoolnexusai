/**
 * ai-classify-intent — Lightweight Edge Function
 *
 * Classifies a user message into an action intent using GPT-4o-mini.
 * Returns the action type that maps to the useAIActionDispatcher switch cases.
 *
 * This is intentionally minimal — it does NOT execute actions, just classifies.
 * ~150ms average latency with gpt-4o-mini.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { deductCredits } from "../_shared/creditDeduction.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

// All supported action types (mirrors useAIActionDispatcher switch cases)
const SUPPORTED_ACTIONS = [
    "create_project",
    "assign_members",
    "log_leave",
    "create_phase",
    "create_activities",
    "create_phases_and_activities",
    "set_budget",
    "log_expense",
    "setup_financials",
    "log_issue",
    "log_risk",
    "log_project_controls",
    "create_milestone",
    "create_epic",
    "create_story",
    "create_sprint",
    "complete_sprint",
    "schedule_meeting",
    "log_decision",
    "resolve_issue",
    "log_requirement",
    "validate_requirements",
    "create_change_request",
    "generate_presentation",
    "create_stakeholder",
    "log_lesson_learned",
    "generate_final_report",
    "build_phase_from_description",
    "create_charter",
    "create_deliverables",
    "map_traceability",
    "setup_agile_backlog",
    "log_governance_meetings",
    "close_sprint_cycle",
    "generate_charter_and_deliverables",
] as const;

const CLASSIFICATION_PROMPT = `You are an intent classifier for a project management AI system.

Given a user message, determine if it contains an actionable intent. If so, classify it into exactly one action type from this list:

${SUPPORTED_ACTIONS.map((a) => `- ${a}`).join("\n")}

Rules:
- Return "none" if the message is a question, general chat, or doesn't match any action.
- For compound requests (e.g. "create a project and add phases"), pick the FIRST action.
- Match the user's intent, not their exact words. "Set up a new project called X" → create_project.
- "Build me a plan with 5 phases and 10 tasks" → create_phases_and_activities.
- Be conservative: if unsure, return "none". It's better to miss than to misclassify.

Output ONLY valid JSON:
{
  "action": "action_type_or_none",
  "confidence": 0.0-1.0,
  "reasoning": "one line explanation"
}`;

serve(async (req) => {
    // CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
        if (!OPENAI_API_KEY) {
            throw new Error("OPENAI_API_KEY not configured");
        }

        // Auth
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "Missing authorization" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } },
        });

        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
            return new Response(JSON.stringify({ error: "Not authenticated" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Parse request
        const { message } = await req.json();
        if (!message || typeof message !== "string") {
            return new Response(
                JSON.stringify({ error: "Missing 'message' field" }),
                {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );
        }

        // Strip "[Action Mode]" prefix if present
        const cleanMessage = message.replace(/\[Action Mode\]\s*/i, "").trim();

        // Call GPT-4o-mini for classification
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${OPENAI_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                response_format: { type: "json_object" },
                messages: [
                    { role: "system", content: CLASSIFICATION_PROMPT },
                    { role: "user", content: cleanMessage },
                ],
                temperature: 0.05,
                max_tokens: 100,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[ai-classify-intent] OpenAI error:", errorText);
            return new Response(
                JSON.stringify({ action: null, error: "Classification failed" }),
                {
                    status: 200, // Still 200 — caller falls back to regex
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "{}";

        // Deduct credits (minimal — gpt-4o-mini is cheap)
        const usage = data.usage ?? {};
        const serviceSupabase = createClient(
            supabaseUrl,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        await deductCredits(serviceSupabase, user.id, null, {
            featureType: "ai_classify_intent",
            requestId: `classify-${Date.now()}`,
            modelName: "gpt-4o-mini",
            promptTokens: usage.prompt_tokens ?? 0,
            completionTokens: usage.completion_tokens ?? 0,
        });

        // Parse response
        let result: { action: string; confidence: number; reasoning?: string };
        try {
            result = JSON.parse(content);
        } catch {
            result = { action: "none", confidence: 0 };
        }

        // Validate action is in our supported list
        const action =
            result.action && result.action !== "none" && SUPPORTED_ACTIONS.includes(result.action as any)
                ? result.action
                : null;

        return new Response(
            JSON.stringify({
                action,
                confidence: result.confidence ?? 0,
                reasoning: result.reasoning ?? null,
            }),
            {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    } catch (err: any) {
        console.error("[ai-classify-intent] Error:", err.message);
        return new Response(
            JSON.stringify({ action: null, error: err.message }),
            {
                status: 200, // Still 200 — caller falls back to regex
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});
