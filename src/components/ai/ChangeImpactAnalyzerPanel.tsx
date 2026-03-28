/**
 * ChangeImpactAnalyzerPanel.tsx — P2.6 Agent
 *
 * Dedicated UI for the Change Impact Analyzer agent.
 * Lets a PM describe a proposed change, runs the AI analysis,
 * and shows the structured impact report (timeline, cost, resources).
 */

import { useState } from "react";
import {
    AlertTriangle,
    TrendingUp,
    Clock,
    DollarSign,
    Users,
    Zap,
    BarChart3,
    CheckCircle2,
    ChevronRight,
    Loader2,
    RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AgentConfirmationDialog, type AgentConfirmationRequest } from "@/components/ai/AgentConfirmationDialog";
import { useAgentActions } from "@/hooks/useAgentActions";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChangeImpactResult {
    tasks_affected: number;
    open_risks: number;
    estimated_delay_days: number;
    cost_impact_pct: number;
    recommendation: string;
    affected_areas: string[];
    change_description: string;
}

interface ChangeImpactAnalyzerPanelProps {
    projectId: string;
    projectName?: string;
}

const IMPACT_AREAS = [
    { id: "timeline", label: "Timeline", icon: Clock },
    { id: "budget", label: "Budget", icon: DollarSign },
    { id: "resources", label: "Resources", icon: Users },
    { id: "scope", label: "Scope", icon: BarChart3 },
    { id: "risks", label: "Risks", icon: AlertTriangle },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ImpactMetricCard({
    icon: Icon,
    label,
    value,
    sub,
    color,
}: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    sub?: string;
    color: string;
}) {
    return (
        <div className="rounded-lg border bg-card p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <Icon className={cn("h-3.5 w-3.5", color)} />
                {label}
            </div>
            <div className="text-2xl font-bold">{value}</div>
            {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
        </div>
    );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export function ChangeImpactAnalyzerPanel({ projectId, projectName }: ChangeImpactAnalyzerPanelProps) {
    const [changeDescription, setChangeDescription] = useState("");
    const [selectedAreas, setSelectedAreas] = useState<string[]>(["timeline", "budget", "resources"]);
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<ChangeImpactResult | null>(null);
    const [confirmReq, setConfirmReq] = useState<AgentConfirmationRequest | null>(null);
    const { executeApprovedAction } = useAgentActions();

    const toggleArea = (id: string) => {
        setSelectedAreas(prev =>
            prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
        );
    };

    const handleAnalyze = async () => {
        if (!changeDescription.trim()) {
            toast.warning("Please describe the proposed change.");
            return;
        }
        setAnalyzing(true);
        setResult(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Not authenticated");

            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

            const res = await fetch(`${supabaseUrl}/functions/v1/ai-orchestrator`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                    apikey: anonKey,
                },
                body: JSON.stringify({
                    message: `Analyze the impact of this proposed change on the project: "${changeDescription}". Focus on these areas: ${selectedAreas.join(", ")}.`,
                    projectId,
                    agentType: "strategic",
                    enableTools: true,
                }),
            });

            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();

            if (data.requiresConfirmation && data.pendingActionId) {
                // Impact analysis is a write — show confirmation
                setConfirmReq({
                    pendingActionId: data.pendingActionId,
                    toolName: data.toolName ?? "analyze_change_impact",
                    diff: data.diff ?? {},
                    summary: data.summary,
                });
            } else if (data.toolResult) {
                setResult(data.toolResult as ChangeImpactResult);
                toast.success("Impact analysis complete");
            } else if (data.response) {
                // Text-only response — parse as structured result
                setResult({
                    tasks_affected: 0,
                    open_risks: 0,
                    estimated_delay_days: 0,
                    cost_impact_pct: 0,
                    recommendation: data.response,
                    affected_areas: selectedAreas,
                    change_description: changeDescription,
                });
            }
        } catch (err: any) {
            toast.error(`Analysis failed: ${err.message}`);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleApproved = async ({ pendingActionId, toolName }: { pendingActionId: unknown; toolName: unknown }) => {
        const execResult = await executeApprovedAction(pendingActionId as string, toolName as string);
        if (execResult.success) {
            setResult(execResult.result as ChangeImpactResult);
        }
        setConfirmReq(null);
    };

    const riskLevel = result
        ? result.estimated_delay_days > 14 || result.cost_impact_pct > 15
            ? "high"
            : result.estimated_delay_days > 7 || result.cost_impact_pct > 8
                ? "medium"
                : "low"
        : null;

    const riskColors = {
        low: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
        medium: "bg-amber-500/10 text-amber-600 border-amber-500/20",
        high: "bg-red-500/10 text-red-600 border-red-500/20",
    };

    return (
        <div className="space-y-6 p-1">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Zap className="h-5 w-5 text-primary" />
                        Change Impact Analyzer
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        AI-powered assessment of how a change will affect {projectName ?? "the project"}
                    </p>
                </div>
                {result && (
                    <Button variant="outline" size="sm" onClick={() => setResult(null)}>
                        <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                        New Analysis
                    </Button>
                )}
            </div>

            {!result ? (
                /* ─── Input Form ─────────────────────────────────────────────── */
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Describe the Proposed Change</CardTitle>
                        <CardDescription>
                            Be specific — include what will change, why, and any constraints.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Textarea
                            placeholder="e.g. 'Add a new payment gateway integration that requires changes to 3 backend services and the checkout UI. The business needs this live within 4 weeks.'"
                            value={changeDescription}
                            onChange={e => setChangeDescription(e.target.value)}
                            className="min-h-[120px] resize-none"
                        />

                        {/* Impact Areas */}
                        <div>
                            <p className="text-sm font-medium mb-2">Analyse impact on:</p>
                            <div className="flex flex-wrap gap-2">
                                {IMPACT_AREAS.map(({ id, label, icon: Icon }) => (
                                    <label
                                        key={id}
                                        className={cn(
                                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition-colors",
                                            selectedAreas.includes(id)
                                                ? "bg-primary/10 border-primary/40 text-primary font-medium"
                                                : "bg-muted/30 border-muted text-muted-foreground hover:bg-muted/50"
                                        )}
                                    >
                                        <Checkbox
                                            checked={selectedAreas.includes(id)}
                                            onCheckedChange={() => toggleArea(id)}
                                            className="hidden"
                                            id={`area-${id}`}
                                        />
                                        <Icon className="h-3.5 w-3.5" />
                                        {label}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <Button
                            className="w-full gap-2"
                            onClick={handleAnalyze}
                            disabled={analyzing || !changeDescription.trim() || selectedAreas.length === 0}
                        >
                            {analyzing ? (
                                <><Loader2 className="h-4 w-4 animate-spin" /> Analysing…</>
                            ) : (
                                <><BarChart3 className="h-4 w-4" /> Run Impact Analysis</>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                /* ─── Results ────────────────────────────────────────────────── */
                <div className="space-y-4">
                    {/* Risk Banner */}
                    {riskLevel && (
                        <div className={cn("rounded-lg border px-4 py-3 flex items-center gap-3 text-sm font-medium", riskColors[riskLevel])}>
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            Overall Risk: <span className="uppercase">{riskLevel}</span>
                            <Badge className="ml-auto capitalize" variant="outline">{riskLevel} impact</Badge>
                        </div>
                    )}

                    {/* Change Summary */}
                    <div className="rounded-lg border bg-muted/20 px-4 py-3 text-sm">
                        <p className="font-medium text-xs text-muted-foreground uppercase tracking-wide mb-1">Proposed Change</p>
                        <p>{result.change_description}</p>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <ImpactMetricCard
                            icon={Clock}
                            label="Est. Delay"
                            value={`${result.estimated_delay_days}d`}
                            sub="additional days"
                            color="text-amber-500"
                        />
                        <ImpactMetricCard
                            icon={DollarSign}
                            label="Cost Impact"
                            value={`+${result.cost_impact_pct}%`}
                            sub="project budget"
                            color="text-red-500"
                        />
                        <ImpactMetricCard
                            icon={CheckCircle2}
                            label="Tasks Affected"
                            value={result.tasks_affected}
                            sub="active tasks"
                            color="text-blue-500"
                        />
                        <ImpactMetricCard
                            icon={AlertTriangle}
                            label="Open Risks"
                            value={result.open_risks}
                            sub="risk register"
                            color="text-orange-500"
                        />
                    </div>

                    {/* Affected Areas */}
                    <div className="rounded-lg border p-4 space-y-2">
                        <p className="text-sm font-medium">Impact by Area</p>
                        {result.affected_areas.map((area) => {
                            const meta = IMPACT_AREAS.find(a => a.id === area);
                            const Icon = meta?.icon ?? BarChart3;
                            // Deterministic percentages — derived from AI response fields
                            const pct =
                                area === "timeline" ? Math.min(100, result.estimated_delay_days * 5) :
                                    area === "budget" ? Math.min(100, result.cost_impact_pct * 4) :
                                        area === "resources" ? Math.min(100, result.open_risks * 10) :
                                            area === "scope" ? Math.min(100, result.tasks_affected * 3) :
                                                // "risks" — use whichever of delay/cost is higher as proxy
                                                Math.min(100, Math.max(result.estimated_delay_days * 4, result.cost_impact_pct * 3));
                            return (
                                <div key={area} className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="flex items-center gap-1.5 text-muted-foreground capitalize">
                                            <Icon className="h-3 w-3" />
                                            {area}
                                        </span>
                                        <span className="font-medium">{pct}%</span>
                                    </div>
                                    <Progress value={pct} className="h-1.5" />
                                </div>
                            );
                        })}
                    </div>

                    {/* Recommendation */}
                    <div className="rounded-lg border bg-primary/5 border-primary/20 p-4">
                        <p className="text-sm font-semibold flex items-center gap-2 mb-1">
                            <ChevronRight className="h-4 w-4 text-primary" />
                            AI Recommendation
                        </p>
                        <p className="text-sm text-muted-foreground">{result.recommendation}</p>
                    </div>

                    <Separator />

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap">
                        <Button variant="outline" size="sm" onClick={() => setResult(null)}>
                            Analyse Another Change
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => {
                            // Copy analysis as text
                            const text = `Change Impact Analysis\n\nChange: ${result.change_description}\n\nDelay: +${result.estimated_delay_days} days\nCost: +${result.cost_impact_pct}%\nTasks affected: ${result.tasks_affected}\nOpen risks: ${result.open_risks}\n\nRecommendation: ${result.recommendation}`;
                            navigator.clipboard.writeText(text);
                            toast.success("Analysis copied to clipboard");
                        }}>
                            Copy Report
                        </Button>
                    </div>
                </div>
            )}

            {/* Confirmation Gate for analysis write-back */}
            <AgentConfirmationDialog
                request={confirmReq}
                onClose={() => setConfirmReq(null)}
                onApproved={handleApproved}
            />
        </div>
    );
}
