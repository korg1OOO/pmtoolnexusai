/**
 * execute-task-action/index.ts
 *
 * Executes approved task-related AI actions.
 * Called by the frontend AFTER the user approves in AgentConfirmationDialog.
 *
 * Supports tools: create_task, update_task, move_task_to_sprint, bulk_create_tasks
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
        if (!pendingActionId) {
            return new Response(JSON.stringify({ error: "pendingActionId is required" }), {
                status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Get auth
        const authHeader = req.headers.get("Authorization");
        let userId: string | null = null;
        if (authHeader) {
            const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
            userId = user?.id ?? null;
        }

        // Load the pending action
        const pending = await getPendingAction(supabase, pendingActionId);
        if (!pending) {
            return new Response(JSON.stringify({ error: "Pending action not found" }), {
                status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }
        if (pending.status !== "approved") {
            return new Response(JSON.stringify({ error: `Action is in status: ${pending.status}` }), {
                status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const { tool_name, params } = pending;
        let result: unknown;

        // ─── Dispatch by tool name ─────────────────────────────────────────────

        if (tool_name === "create_task") {
            const { data, error } = await supabase.from("tasks").insert({
                title: params.title,
                name: params.title,
                description: params.description ?? null,
                project_id: params.project_id,
                priority: params.priority ?? "medium",
                status: params.status && params.status !== "todo" ? params.status : "not-started",
                due_date: params.due_date ?? null,
                assignee_id: params.assignee_id ?? null,
                sprint_id: params.sprint_id ?? null,
                created_by: userId,
            }).select("id, title").single();
            if (error) throw error;
            result = { created: data };

        } else if (tool_name === "create_sprint") {
            const { data, error } = await supabase.from("sprints").insert({
                project_id: params.project_id,
                name: params.name,
                goal: params.goal ?? null,
                start_date: params.start_date,
                end_date: params.end_date,
                status: params.status ?? "planning",
            }).select("id, name").single();
            if (error) throw error;
            result = { created: data };

        } else if (tool_name === "update_task") {
            const updateFields: Record<string, unknown> = {};
            const allowed = ["title", "description", "assignee_id", "due_date", "priority", "status", "sprint_id"];
            for (const k of allowed) if (params[k] !== undefined) updateFields[k] = params[k];
            updateFields.updated_at = new Date().toISOString();

            const { data, error } = await supabase.from("tasks").update(updateFields).eq("id", params.task_id).select("id, title").single();
            if (error) throw error;
            result = { updated: data };

        } else if (tool_name === "move_task_to_sprint") {
            const { data, error } = await supabase.from("tasks").update({ sprint_id: params.target_sprint_id, updated_at: new Date().toISOString() }).eq("id", params.task_id).select("id").single();
            if (error) throw error;
            result = { moved: data };

        } else if (tool_name === "bulk_create_tasks") {
            const tasks = params.tasks as any[];
            const rows = tasks.map((t: any) => ({
                title: t.title,
                name: t.title,
                description: t.description ?? null,
                project_id: params.project_id,
                priority: t.priority ?? "medium",
                status: "not-started",
                due_date: t.due_date ?? null,
                assignee_id: t.assignee_id ?? null,
                created_by: userId,
            }));
            const { data, error } = await supabase.from("tasks").insert(rows).select("id, title");
            if (error) throw error;
            result = { created: data, count: data?.length ?? 0 };

        } else {
            return new Response(JSON.stringify({ error: `Unsupported tool: ${tool_name}` }), {
                status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Mark as executed
        await updatePendingActionStatus(supabase, pendingActionId, "executed");

        // Audit log
        await supabase.from("audit_logs").insert({
            user_id: userId,
            action: `ai_agent_executed_${tool_name}`,
            resource_type: "task",
            resource_id: pendingActionId,
            details: { tool_name, result },
        }).then(() => { }).catch(() => { });

        return new Response(JSON.stringify({ success: true, tool_name, result }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (err: any) {
        console.error("[execute-task-action]", err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
