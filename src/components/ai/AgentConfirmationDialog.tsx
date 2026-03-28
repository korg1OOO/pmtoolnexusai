/**
 * AgentConfirmationDialog.tsx
 *
 * UI for the agentic AI maker-checker pattern.
 * Rendered when the AI agent returns requiresConfirmation=true.
 *
 * Shows a structured diff of the proposed action and lets the user
 * approve or cancel before the DB write is executed.
 */

import { useState } from "react";
import {
    AlertTriangle,
    CheckCircle2,
    XCircle,
    ChevronDown,
    ChevronRight,
    Zap,
    Shield,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AgentConfirmationRequest {
    pendingActionId: string;
    toolName: string;
    diff: Record<string, unknown>;
    summary?: string;
}

interface AgentConfirmationDialogProps {
    request: AgentConfirmationRequest | null;
    onClose: () => void;
    onApproved: (result: unknown) => void;
}

// ─── Tool display metadata ────────────────────────────────────────────────────

const TOOL_META: Record<string, { label: string; color: string; icon: string; risk: "low" | "medium" | "high" }> = {
    create_task: { label: "Create Task", color: "text-blue-500", icon: "📋", risk: "low" },
    update_task: { label: "Update Task", color: "text-amber-500", icon: "✏️", risk: "low" },
    bulk_create_tasks: { label: "Bulk Create Tasks", color: "text-blue-500", icon: "📋", risk: "medium" },
    move_task_to_sprint: { label: "Move Task to Sprint", color: "text-violet-500", icon: "🚀", risk: "low" },
    auto_schedule_project: { label: "Auto-Schedule Project", color: "text-orange-500", icon: "📅", risk: "high" },
    create_risk: { label: "Create Risk", color: "text-red-500", icon: "⚠️", risk: "low" },
    update_risk_status: { label: "Update Risk Status", color: "text-amber-500", icon: "🔄", risk: "low" },
    escalate_risk: { label: "Escalate Risk", color: "text-red-600", icon: "🚨", risk: "high" },
    create_tasks_from_action_items: { label: "Create Tasks from Meeting", color: "text-teal-500", icon: "📝", risk: "low" },
    send_mom_email: { label: "Send MoM Email", color: "text-cyan-500", icon: "📧", risk: "medium" },
    import_project_plan: { label: "Import Project Plan", color: "text-indigo-500", icon: "📊", risk: "high" },
    level_resources: { label: "Level Resources", color: "text-violet-500", icon: "⚖️", risk: "high" },
    create_change_request: { label: "Create Change Request", color: "text-orange-500", icon: "📝", risk: "medium" },
    plan_sprint: { label: "Plan Sprint", color: "text-blue-500", icon: "🏃", risk: "medium" },
    create_task_from_email: { label: "Create Task from Email", color: "text-cyan-500", icon: "📧", risk: "low" },
    create_issue_from_email: { label: "Create Issue from Email", color: "text-red-500", icon: "🐛", risk: "low" },
    send_stakeholder_briefing: { label: "Send Stakeholder Briefing", color: "text-pink-500", icon: "📬", risk: "high" },
    save_document: { label: "Save Document", color: "text-emerald-500", icon: "💾", risk: "low" },
};

// ─── Diff Viewer ──────────────────────────────────────────────────────────────

function DiffValue({ value }: { value: unknown }) {
    if (value === null || value === undefined) return <span className="text-muted-foreground italic">null</span>;
    if (typeof value === "boolean") return <Badge variant={value ? "default" : "secondary"}>{String(value)}</Badge>;
    if (typeof value === "number") return <span className="font-mono text-amber-500">{value}</span>;
    if (Array.isArray(value)) {
        return (
            <div className="space-y-0.5">
                {value.map((v, i) => (
                    <div key={i} className="text-xs pl-2 border-l border-muted">
                        <DiffValue value={v} />
                    </div>
                ))}
            </div>
        );
    }
    if (typeof value === "object") {
        return (
            <div className="space-y-0.5">
                {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
                    <div key={k} className="text-xs flex gap-2">
                        <span className="text-muted-foreground shrink-0">{k}:</span>
                        <DiffValue value={v} />
                    </div>
                ))}
            </div>
        );
    }
    return <span className="font-medium">{String(value)}</span>;
}

function DiffSection({ diff }: { diff: Record<string, unknown> }) {
    const [expanded, setExpanded] = useState(true);
    const entries = Object.entries(diff).filter(([k]) => k !== "action");

    return (
        <div className="rounded-lg border bg-muted/30 overflow-hidden">
            <button
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <span>Proposed Changes</span>
                {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
            {expanded && (
                <div className="px-3 pb-3 space-y-2 border-t">
                    {entries.map(([key, value]) => (
                        <div key={key} className="flex gap-3 text-sm pt-2">
                            <span className="text-muted-foreground text-xs uppercase tracking-wide min-w-[120px] shrink-0 pt-0.5">
                                {key.replace(/_/g, " ")}
                            </span>
                            <div className="flex-1 overflow-hidden">
                                <DiffValue value={value} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Main Dialog ──────────────────────────────────────────────────────────────

export function AgentConfirmationDialog({
    request,
    onClose,
    onApproved,
}: AgentConfirmationDialogProps) {
    const [loading, setLoading] = useState(false);

    if (!request) return null;

    const meta = TOOL_META[request.toolName] ?? {
        label: request.toolName.replace(/_/g, " "),
        color: "text-primary",
        icon: "🤖",
        risk: "medium" as const,
    };

    const riskColors = {
        low: "border-emerald-500/30 bg-emerald-500/5",
        medium: "border-amber-500/30 bg-amber-500/5",
        high: "border-red-500/30 bg-red-500/5",
    };

    const handleApprove = async () => {
        setLoading(true);
        try {
            // Update pending action status → approved
            const { error } = await (supabase as any)
                .from("ai_pending_actions")
                .update({ status: "approved", updated_at: new Date().toISOString() })
                .eq("id", request.pendingActionId);

            if (error) throw error;

            toast.success(`Action approved: ${meta.label}`);
            onApproved({ pendingActionId: request.pendingActionId, toolName: request.toolName });
            onClose();
        } catch (err: any) {
            toast.error(`Failed to approve: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        try {
            await (supabase as any)
                .from("ai_pending_actions")
                .update({ status: "rejected", updated_at: new Date().toISOString() })
                .eq("id", request.pendingActionId);
            toast.info("Action cancelled");
        } catch {
            // non-fatal
        }
        onClose();
    };

    return (
        <Dialog open={!!request} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg bg-muted text-xl")}>
                            {meta.icon}
                        </div>
                        <div>
                            <DialogTitle className={cn("text-base", meta.color)}>
                                {meta.label}
                            </DialogTitle>
                            <DialogDescription className="text-xs mt-0.5">
                                AI agent is requesting permission to perform this action.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* Risk indicator */}
                <div className={cn("rounded-lg border px-3 py-2 flex items-center gap-2 text-sm", riskColors[meta.risk])}>
                    <Shield className="h-3.5 w-3.5 shrink-0" />
                    <span>
                        <strong>Risk level: {meta.risk.toUpperCase()}</strong>
                        {meta.risk === "high" && " — This action is irreversible or affects many records."}
                        {meta.risk === "medium" && " — This action modifies data in the project."}
                        {meta.risk === "low" && " — This action creates new records only."}
                    </span>
                </div>

                {/* Summary */}
                {request.summary && (
                    <p className="text-sm text-muted-foreground border-l-2 border-primary pl-3">
                        {request.summary}
                    </p>
                )}

                {/* Diff */}
                <ScrollArea className="max-h-64">
                    <DiffSection diff={request.diff} />
                </ScrollArea>

                <Separator />

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={handleReject} disabled={loading}>
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancel
                    </Button>
                    <Button onClick={handleApprove} disabled={loading} className="gap-2">
                        {loading ? (
                            <Zap className="h-4 w-4 animate-pulse" />
                        ) : (
                            <CheckCircle2 className="h-4 w-4" />
                        )}
                        Approve & Execute
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
