/**
 * _shared/confirmationGate.ts
 *
 * Wraps potentially destructive AI tool executions behind a
 * maker-checker confirmation pattern.
 *
 * Non-destructive tools (reads, reports) execute immediately.
 * Destructive tools (DB writes) are stored as pending actions
 * and must be approved by the user before execution.
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

export type ActionStatus = "pending" | "approved" | "rejected" | "executed";

export interface PendingAction {
    id: string;
    user_id: string;
    tenant_id?: string;
    tool_name: string;
    params: Record<string, unknown>;
    diff: Record<string, unknown>;
    status: ActionStatus;
    created_at: string;
}

export interface ConfirmationResult {
    requiresConfirmation: true;
    pendingActionId: string;
    diff: Record<string, unknown>;
    summary: string;
}

export interface ImmediateResult {
    requiresConfirmation: false;
    result: unknown;
}

// Tools that require user confirmation before execution
const CONFIRMATION_REQUIRED = new Set<string>([
    "create_task",
    "update_task",
    "move_task_to_sprint",
    "bulk_create_tasks",
    "auto_schedule_project",
    "create_risk",
    "update_risk_status",
    "escalate_risk",
    "create_tasks_from_action_items",
    "send_mom_email",
    "import_project_plan",
    "level_resources",
    "create_change_request",
    "plan_sprint",
    "create_task_from_email",
    "create_issue_from_email",
    "send_stakeholder_briefing",
    "save_document",
    "create_project",
    "assign_team_members",
    "log_leave_request",
    "create_phase",
    "set_project_budget",
    "log_expense",
    "create_milestone",
    "create_requirement",
]);

// Tools that are safe to execute immediately (reads / generations)
const IMMEDIATE_TOOLS = new Set<string>([
    "generate_pdf_report",
    "extract_action_items",
    "validate_requirements",
]);

/**
 * Store a pending action and return confirmation metadata to the UI.
 */
export async function storePendingAction(
    supabase: SupabaseClient,
    userId: string,
    toolName: string,
    params: Record<string, unknown>,
    diff: Record<string, unknown>,
    summary: string
): Promise<ConfirmationResult> {
    const { data, error } = await (supabase as any)
        .from("ai_pending_actions")
        .insert({
            user_id: userId,
            tool_name: toolName,
            params,
            diff,
            status: "pending",
        })
        .select("id")
        .single();

    if (error) {
        console.error("[confirmationGate] Failed to store pending action:", error);
        throw error;
    }

    return {
        requiresConfirmation: true,
        pendingActionId: data.id,
        diff,
        summary,
    };
}

/**
 * Check if a tool requires user confirmation.
 */
export function requiresConfirmation(toolName: string): boolean {
    return CONFIRMATION_REQUIRED.has(toolName);
}

/**
 * Mark a pending action as approved / rejected.
 */
export async function updatePendingActionStatus(
    supabase: SupabaseClient,
    pendingActionId: string,
    status: "approved" | "rejected" | "executed"
): Promise<void> {
    const { error } = await (supabase as any)
        .from("ai_pending_actions")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", pendingActionId);

    if (error) throw error;
}

/**
 * Fetch a pending action by ID for execution after user approval.
 */
export async function getPendingAction(
    supabase: SupabaseClient,
    pendingActionId: string
): Promise<PendingAction | null> {
    const { data, error } = await (supabase as any)
        .from("ai_pending_actions")
        .select("*")
        .eq("id", pendingActionId)
        .single();

    if (error) return null;
    return data as PendingAction;
}
