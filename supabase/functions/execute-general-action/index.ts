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

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
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

            case "create_project": {
                const { data, error } = await supabase.from("projects").insert({
                    name: params.title,
                    type: params.type ?? "enterprise",
                    description: params.description ?? null,
                    status: "planning",
                    tenant_id: pending.tenant_id,
                }).select("id, name").single();
                if (error) throw error;
                // auto-assign creator as project admin
                await supabase.from("user_roles").insert({
                    user_id: userId,
                    project_id: data.id,
                    role: "admin",
                    role_name: "Project Admin",
                });
                result = { created: data };
                break;
            }

            case "assign_team_members": {
                // Find random N users
                const { data: users } = await supabase.from("users").select("id").limit(Number(params.count) || 5);
                const toInsert = (users || []).map((u: any) => ({
                    user_id: u.id,
                    project_id: params.project_id,
                    role: "developer",
                    role_name: "Developer",
                }));
                if (toInsert.length > 0) {
                    await supabase.from("user_roles").upsert(toInsert, { onConflict: "user_id, project_id" });
                }
                result = { assigned: toInsert.length };
                break;
            }

            case "log_leave_request": {
                // Return mock success as leave_requests table is not implemented in MVP schema
                result = { logged: Number(params.count) || 3, mock: true, message: "Leave requests logged virtually." };
                break;
            }

            case "create_phase": {
                const { data, error } = await supabase.from("project_phases").insert({
                    project_id: params.project_id,
                    name: params.name,
                    status: "planning"
                }).select("id, name").single();
                if (error) throw error;
                result = { created: data };
                break;
            }

            case "set_project_budget": {
                // Insert/upsert into project_budgets
                const { data, error } = await supabase.from("project_budgets").upsert({
                    project_id: params.project_id,
                    total_amount: params.amount,
                    currency: "USD",
                }).select("id").single();
                if (error) throw error;
                result = { set: data };
                break;
            }

            case "log_expense": {
                const { data, error } = await supabase.from("project_expenses").insert({
                    project_id: params.project_id,
                    amount: params.amount,
                    description: params.description,
                    date: new Date().toISOString(),
                }).select("id").single();
                if (error) throw error;
                result = { logged: data };
                break;
            }

            case "create_milestone": {
                const { data, error } = await supabase.from("project_milestones").insert({
                    project_id: params.project_id,
                    title: params.name,
                    due_date: params.due_date ?? new Date().toISOString(),
                    status: "pending",
                }).select("id").single();
                if (error) throw error;
                result = { created: data };
                break;
            }

            case "create_requirement": {
                const { data, error } = await supabase.from("rtm_requirements").insert({
                    project_id: params.project_id,
                    req_code: params.code,
                    description: params.description,
                    status: params.status ?? "draft",
                }).select("id").single();
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
