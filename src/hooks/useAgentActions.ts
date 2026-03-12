/**
 * useAgentActions.ts
 *
 * Frontend hook that:
 * 1. Wraps the ai-orchestrator Edge Function call
 * 2. Detects when the AI returns requiresConfirmation=true
 * 3. Surfaces the pending action data for AgentConfirmationDialog
 * 4. Executes the approved action via the correct executor Edge Function
 * 5. Returns results back into the chat flow
 */

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { AgentConfirmationRequest } from "@/components/ai/AgentConfirmationDialog";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AgentChatMessage {
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    metadata?: {
        toolName?: string;
        toolResult?: unknown;
        requiresConfirmation?: boolean;
        pendingActionId?: string;
        diff?: Record<string, unknown>;
    };
}

export interface AgentCallOptions {
    message: string;
    projectId: string;
    conversationHistory?: AgentChatMessage[];
    agentType?: string; // override intent routing
    enableTools?: boolean;
}

// ─── Tool → executor mapping ──────────────────────────────────────────────────

const TOOL_EXECUTOR_MAP: Record<string, string> = {
    // P0 — Task tools
    create_task: "execute-task-action",
    update_task: "execute-task-action",
    move_task_to_sprint: "execute-task-action",
    bulk_create_tasks: "execute-task-action",
    // P0 — Risk tools
    create_risk: "execute-risk-action",
    update_risk_status: "execute-risk-action",
    escalate_risk: "execute-risk-action",
    // P0 — Meeting tools
    create_tasks_from_action_items: "execute-meeting-action",
    send_mom_email: "execute-meeting-action",
    // P0 / P1 — General tools
    save_document: "execute-general-action",
    create_change_request: "execute-general-action",
    send_stakeholder_briefing: "execute-general-action",
    create_task_from_email: "execute-general-action",
    create_issue_from_email: "execute-general-action",
    create_project: "execute-general-action",
    assign_team_members: "execute-general-action",
    log_leave_request: "execute-general-action",
    create_phase: "execute-general-action",
    set_project_budget: "execute-general-action",
    log_expense: "execute-general-action",
    create_milestone: "execute-general-action",
    create_requirement: "execute-general-action",
    // P1 — Resource & Sprint
    level_resources: "execute-p1-action",
    plan_sprint: "execute-p1-action",
    // P1 — Approval Router
    route_for_approval: "execute-p1-action",
    escalate_approval: "execute-p1-action",
    // P1 — ML Retrain
    trigger_model_retrain: "execute-p1-action",
    check_model_accuracy: "execute-p1-action",
    schedule_retrain: "execute-p1-action",
    // P2 — Change Impact
    analyze_change_impact: "execute-p2-action",
    // P2 — Scenario Write-Back
    write_back_scenario: "execute-p2-action",
    // P2 — Presentation Builder
    build_presentation: "execute-p2-action",
    // P2 — SoD Checker
    check_sod_conflicts: "execute-p2-action",
    // P2 — Compliance
    flag_compliance_violation: "execute-p2-action",
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAgentActions() {
    const [loading, setLoading] = useState(false);
    const [confirmationRequest, setConfirmationRequest] = useState<AgentConfirmationRequest | null>(null);

    /**
     * Call ai-orchestrator with function calling enabled.
     * Returns the AI response text + any tool action metadata.
     */
    const callAgent = useCallback(async (options: AgentCallOptions): Promise<AgentChatMessage | null> => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error("Not authenticated");
                return null;
            }

            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

            const history = (options.conversationHistory ?? []).map(m => ({
                role: m.role,
                content: m.content,
            }));

            const res = await fetch(`${supabaseUrl}/functions/v1/ai-orchestrator`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                    apikey: anonKey,
                },
                body: JSON.stringify({
                    message: options.message,
                    projectId: options.projectId,
                    conversationHistory: history,
                    agentType: options.agentType,
                    enableTools: options.enableTools ?? true,
                }),
            });

            if (!res.ok) {
                const err = await res.text();
                throw new Error(`Agent call failed: ${err}`);
            }

            const data = await res.json();

            // Check if AI wants to execute a tool action (requires user confirmation)
            if (data.requiresConfirmation && data.pendingActionId) {
                const confirmReq: AgentConfirmationRequest = {
                    pendingActionId: data.pendingActionId,
                    toolName: data.toolName ?? "unknown_tool",
                    diff: data.diff ?? {},
                    summary: data.summary,
                };
                setConfirmationRequest(confirmReq);
            }

            return {
                role: "assistant",
                content: data.response ?? "Done.",
                timestamp: new Date(),
                metadata: {
                    toolName: data.toolName,
                    toolResult: data.toolResult,
                    requiresConfirmation: data.requiresConfirmation,
                    pendingActionId: data.pendingActionId,
                    diff: data.diff,
                },
            };

        } catch (err: any) {
            toast.error(`Agent error: ${err.message}`);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Execute an approved pending action using the correct executor Edge Function.
     * Called after the user clicks "Approve" in AgentConfirmationDialog.
     */
    const executeApprovedAction = useCallback(async (
        pendingActionId: string,
        toolName: string
    ): Promise<{ success: boolean; result?: unknown }> => {
        const executorFn = TOOL_EXECUTOR_MAP[toolName] ?? "execute-general-action";

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Not authenticated");

            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

            const res = await fetch(`${supabaseUrl}/functions/v1/${executorFn}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                    apikey: anonKey,
                },
                body: JSON.stringify({ pendingActionId }),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error ?? "Execution failed");
            }

            toast.success(`Action completed: ${toolName.replace(/_/g, " ")}`);
            return { success: true, result: data.result };

        } catch (err: any) {
            toast.error(`Execution failed: ${err.message}`);
            return { success: false };
        }
    }, []);

    /**
     * Clear the current confirmation request (user cancelled).
     */
    const dismissConfirmation = useCallback(() => {
        setConfirmationRequest(null);
    }, []);

    const triggerConfirmation = useCallback((request: AgentConfirmationRequest) => {
        setConfirmationRequest(request);
    }, []);

    return {
        loading,
        confirmationRequest,
        callAgent,
        executeApprovedAction,
        dismissConfirmation,
        triggerConfirmation,
    };
}
