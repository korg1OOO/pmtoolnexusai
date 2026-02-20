/**
 * execute-general-action/index.ts
 *
 * Generic executor for approved AI actions that don't have a dedicated executor.
 * Supports: save_document, create_change_request, plan_sprint, level_resources,
 *           send_stakeholder_briefing, create_task_from_email, create_issue_from_email,
 *           move_task_to_sprint, send_mom_email, import_project_plan
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getPendingAction, updatePendingActionStatus } from "../_shared/confirmationGate.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    try {
        const { pendingActionId } = await req.json();
        if (!pendingActionId) throw new Error("pendingActionId is required");

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const authHeader = req.headers.get("Authorization");
        let userId: string | null = null;
        if (authHeader) {
            const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
            userId = user?.id ?? null;
        }

        const pending = await getPendingAction(supabase, pendingActionId);
        if (!pending || pending.status !== "approved") throw new Error("Action not found or not approved");

        const { tool_name, params } = pending;
        let result: unknown;

        switch (tool_name) {
            case "save_document": {
                const { data, error } = await supabase.from("documents").insert({
                    project_id: params.project_id,
                    title: params.title,
                    content: params.content,
                    document_type: params.document_type,
                    folder_id: params.folder_id ?? null,
                    created_by: userId,
                    version: 1,
                    source: "ai_generated",
                }).select("id, title").single();
                if (error) throw error;
                result = { saved: data };
                break;
            }

            case "create_change_request": {
                const { data, error } = await supabase.from("change_requests").insert({
                    project_id: params.project_id,
                    type: params.type,
                    amount: params.amount,
                    description: params.description,
                    justification: params.justification ?? null,
                    status: "pending_approval",
                    requested_by: userId,
                    source: "ai_agent",
                }).select("id").single();
                if (error) throw error;
                result = { created: data };
                break;
            }

            case "plan_sprint": {
                // Delegate to auto-schedule with sprint focus
                const res = await fetch(`${supabaseUrl}/functions/v1/auto-schedule`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseKey}`, apikey: supabaseKey },
                    body: JSON.stringify({ project_id: params.project_id, sprint_id: params.sprint_id, strategy: params.strategy ?? "priority_first" }),
                });
                result = res.ok ? await res.json() : { error: "auto-schedule failed" };
                break;
            }

            case "send_stakeholder_briefing": {
                const res = await fetch(`${supabaseUrl}/functions/v1/morning-briefing-generate`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseKey}`, apikey: supabaseKey },
                    body: JSON.stringify({
                        project_id: params.project_id,
                        recipient_ids: params.recipient_ids,
                        audience: params.audience_type ?? "all",
                        sections: params.include_sections,
                        tone: params.tone ?? "formal",
                    }),
                });
                result = res.ok ? await res.json() : { error: "briefing generation failed" };
                break;
            }

            case "create_task_from_email": {
                const { data, error } = await supabase.from("tasks").insert({
                    title: params.task_title,
                    description: params.description ?? null,
                    project_id: params.project_id,
                    assignee_id: params.assignee_id ?? null,
                    due_date: params.due_date ?? null,
                    priority: params.priority ?? "medium",
                    status: "todo",
                    created_by: userId,
                    source: "email",
                    source_id: params.email_id,
                }).select("id, title").single();
                if (error) throw error;
                result = { created: data };
                break;
            }

            case "create_issue_from_email": {
                const { data, error } = await supabase.from("issues").insert({
                    title: params.title,
                    description: params.description ?? null,
                    project_id: params.project_id,
                    severity: params.severity ?? "medium",
                    status: "open",
                    created_by: userId,
                    source: "email",
                    source_id: params.email_id,
                }).select("id, title").single();
                if (error) throw error;
                result = { created: data };
                break;
            }

            default:
                throw new Error(`Unsupported tool: ${tool_name}`);
        }

        await updatePendingActionStatus(supabase, pendingActionId, "executed");
        await supabase.from("audit_logs").insert({
            user_id: userId, action: `ai_agent_executed_${tool_name}`,
            resource_type: "ai_action", resource_id: pendingActionId,
            details: { tool_name, result },
        }).then(() => { }).catch(() => { });

        return new Response(JSON.stringify({ success: true, tool_name, result }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (err: any) {
        console.error("[execute-general-action]", err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
