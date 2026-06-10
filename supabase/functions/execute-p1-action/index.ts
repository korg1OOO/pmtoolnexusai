/**
 * execute-p1-action/index.ts
 *
 * Executor for all P1 agent approved actions:
 * - P1.1 Resource Leveler:    level_resources
 * - P1.2 Budget Controller:   create_change_request (handled in execute-general-action)
 * - P1.3 Sprint Planner:      plan_sprint
 * - P1.4 Approval Router:     route_for_approval, escalate_approval  
 * - P1.5 Email Triage:        create_task_from_email, create_issue_from_email (handled in execute-general-action)
 * - P1.6 Stakeholder Briefer: send_stakeholder_briefing (handled in execute-general-action)
 * - P1.7 Document Drafter:    save_document (handled in execute-general-action)
 * - P1.8 ML Retrain Trigger:  trigger_model_retrain
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
        if (!pending || pending.status !== "approved") {
            return new Response(JSON.stringify({ error: "Pending action not found or not approved" }), {
                status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const { tool_name, params } = pending;
        let result: unknown;

        // ─── P1.1 Resource Leveler ────────────────────────────────────────────────

        if (tool_name === "level_resources") {
            // Call the auto-schedule edge function with resource-leveling strategy
            const res = await fetch(`${supabaseUrl}/functions/v1/auto-schedule`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${supabaseKey}`,
                    apikey: supabaseKey,
                },
                body: JSON.stringify({
                    project_id: params.project_id,
                    strategy: "resource_leveled",
                    max_hours_per_day: params.max_hours_per_day ?? 8,
                    preserve_critical_path: params.preserve_critical_path ?? true,
                }),
            });
            const scheduleResult = res.ok ? await res.json() : { error: "Auto-schedule failed" };

            // Log the leveling event
            await supabase.from("audit_logs").insert({
                user_id: userId,
                action: "ai_resource_leveling",
                resource_type: "project",
                resource_id: params.project_id as string,
                details: { strategy: "resource_leveled", result: scheduleResult },
            }).then(() => { }).catch(() => { });

            result = {
                leveled: true,
                tasks_adjusted: scheduleResult.tasks_adjusted ?? scheduleResult.task_count ?? 0,
                schedule_result: scheduleResult,
            };

            // ─── P1.3 Sprint Planner ──────────────────────────────────────────────────

        } else if (tool_name === "plan_sprint") {
            // Fetch backlog items ordered by priority
            const { data: backlogItems, error: backlogErr } = await supabase
                .from("tasks")
                .select("id, title, priority, estimated_hours, sprint_id")
                .eq("project_id", params.project_id)
                .is("sprint_id", null)
                .eq("status", "todo")
                .order("priority", { ascending: false });

            if (backlogErr) throw backlogErr;

            const strategy = (params.strategy as string) ?? "priority_first";
            const targetVelocity = (params.target_velocity as number) ?? 40; // default 40 hours
            let assigned = 0;
            const toAssign: string[] = [];

            // Simple greedy selection by priority
            for (const item of (backlogItems ?? [])) {
                const hours = (item.estimated_hours ?? 4);
                if (assigned + hours <= targetVelocity) {
                    toAssign.push(item.id);
                    assigned += hours;
                }
            }

            if (toAssign.length > 0) {
                const { error: updateErr } = await supabase
                    .from("tasks")
                    .update({ sprint_id: params.sprint_id, updated_at: new Date().toISOString() })
                    .in("id", toAssign);
                if (updateErr) throw updateErr;
            }

            result = {
                sprint_id: params.sprint_id,
                tasks_assigned: toAssign.length,
                total_hours: assigned,
                strategy,
            };

            // ─── P1.4 Approval Router ─────────────────────────────────────────────────

        } else if (tool_name === "route_for_approval") {
            const approverIds = params.approver_ids as string[];
            const steps = approverIds.map((approver_id: string, index: number) => ({
                approval_id: null, // set after workflow created
                approver_id,
                step_order: index + 1,
                status: "pending",
            }));

            // Create approval workflow
            const { data: workflow, error: workflowErr } = await supabase
                .from("approval_workflows")
                .insert({
                    document_id: params.document_id ?? null,
                    approval_type: params.approval_type,
                    deadline: params.deadline ?? null,
                    created_by: userId,
                    status: "in_progress",
                    source: "ai_agent",
                })
                .select("id")
                .single();

            if (workflowErr) throw workflowErr;

            // Create individual step records
            const stepsWithWorkflow = steps.map(s => ({ ...s, approval_id: workflow.id }));
            await supabase.from("approval_steps").insert(stepsWithWorkflow);

            // Notify first approver
            await supabase.from("notifications").insert({
                user_id: approverIds[0],
                title: "Approval Required",
                message: `You have a new ${params.approval_type} item requiring your approval.`,
                type: "approval_request",
                metadata: { workflow_id: workflow.id },
                created_by: userId,
            });

            result = { workflow_id: workflow.id, steps: stepsWithWorkflow.length };

        } else if (tool_name === "escalate_approval") {
            const { data, error } = await supabase
                .from("approval_workflows")
                .update({ status: "escalated", escalated_at: new Date().toISOString(), updated_at: new Date().toISOString() })
                .eq("id", params.approval_id)
                .select("id")
                .single();
            if (error) throw error;

            await supabase.from("notifications").insert({
                user_id: userId,
                title: "Approval Escalated",
                message: params.reason as string,
                type: "approval_escalation",
                metadata: { approval_id: params.approval_id },
                created_by: userId,
            });

            result = { escalated: true, approval_id: data.id };

            // ─── P1.8 ML Retrain Trigger ──────────────────────────────────────────────

        } else if (tool_name === "trigger_model_retrain") {
            const res = await fetch(`${supabaseUrl}/functions/v1/ml-retrain-model`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${supabaseKey}`,
                    apikey: supabaseKey,
                },
                body: JSON.stringify({
                    model_id: params.model_id,
                    reason: params.reason ?? "AI agent triggered retraining",
                    priority: params.priority ?? "normal",
                    triggered_by: userId,
                }),
            });
            const retrainResult = res.ok ? await res.json() : { error: "Retrain request failed" };
            result = { triggered: true, model_id: params.model_id, ...retrainResult };

        } else if (tool_name === "check_model_accuracy") {
            const { data, error } = await supabase
                .from("ml_models")
                .select("id, name, accuracy, last_trained_at, status")
                .eq("id", params.model_id)
                .single();
            if (error) throw error;
            result = data;

        } else if (tool_name === "schedule_retrain") {
            const { data, error } = await supabase
                .from("ml_model_schedules")
                .upsert({
                    model_id: params.model_id,
                    cron_expression: params.cron_expression,
                    enabled: true,
                    updated_by: userId,
                    updated_at: new Date().toISOString(),
                }, { onConflict: "model_id" })
                .select("id")
                .single();
            if (error) throw error;
            result = { scheduled: true, schedule_id: data?.id };

        } else {
            return new Response(JSON.stringify({ error: `Unsupported P1 tool: ${tool_name}` }), {
                status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        await updatePendingActionStatus(supabase, pendingActionId, "executed");
        await supabase.from("audit_logs").insert({
            user_id: userId,
            action: `ai_p1_agent_executed_${tool_name}`,
            resource_type: "ai_action",
            resource_id: pendingActionId,
            details: { tool_name, result },
        }).then(() => { }).catch(() => { });

        return new Response(JSON.stringify({ success: true, tool_name, result }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (err: any) {
        console.error("[execute-p1-action]", err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
