/**
 * AI Provider Admin Page
 *
 * Platform admin page for:
 * 1. Configuring AI providers (OpenAI, Anthropic, Google, Lovable)
 * 2. Validating Action Agents (scheduler, finance, risk, assignment, communication)
 * 3. Validating Plan Agents (insight, strategic, meeting, document, multi-agent)
 *
 * Route: /admin/ai-providers
 */

import { useState } from "react";
import {
    Bot, Settings2, Zap, Play, CheckCircle2, XCircle, Clock,
    Loader2, ChevronRight, AlertTriangle, Cpu, BarChart3,
    Calendar, DollarSign, AlertCircle, Users, MessageCircle,
    Lightbulb, Target, Video, FileText, Network, RefreshCw,
    FlaskConical, Shield,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AIProviderSettings } from "./AIProviderSettings";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Agent Definitions ──────────────────────────────────────────────────────

type AgentCategory = "action" | "plan";

interface AgentDef {
    type: string;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    category: AgentCategory;
    color: string;
    gradient: string;
    sampleQueries: string[];
}

const AGENTS: AgentDef[] = [
    // ── ACTION AGENTS ──
    {
        type: "scheduler",
        label: "Scheduler Agent",
        description: "Analyzes timelines, detects schedule risks, and recommends optimizations.",
        icon: Calendar,
        category: "action",
        color: "text-blue-500",
        gradient: "from-blue-500/20 to-indigo-500/10",
        sampleQueries: [
            "What tasks are at risk of being delayed?",
            "Show me the critical path for this project",
            "Which milestones are overdue?",
        ],
    },
    {
        type: "finance",
        label: "Finance Agent",
        description: "Budget tracking, EVM analysis, cost forecasting, and variance reporting.",
        icon: DollarSign,
        category: "action",
        color: "text-emerald-500",
        gradient: "from-emerald-500/20 to-green-500/10",
        sampleQueries: [
            "What is the current budget burn rate?",
            "Calculate CPI and SPI for this project",
            "Are we within budget on development tasks?",
        ],
    },
    {
        type: "risk",
        label: "Risk Agent",
        description: "Identifies hidden risks, scores impact/probability, and recommends mitigations.",
        icon: AlertCircle,
        category: "action",
        color: "text-red-500",
        gradient: "from-red-500/20 to-orange-500/10",
        sampleQueries: [
            "What are the top 3 risks right now?",
            "Identify any unmitigated high-probability risks",
            "What risks are linked to the deployment milestone?",
        ],
    },
    {
        type: "assignment",
        label: "Assignment Agent",
        description: "Recommends optimal task assignments, balances workload, and tracks capacity.",
        icon: Users,
        category: "action",
        color: "text-violet-500",
        gradient: "from-violet-500/20 to-purple-500/10",
        sampleQueries: [
            "Who is over-allocated this sprint?",
            "Recommend the best person for this backend task",
            "Show team capacity utilization",
        ],
    },
    {
        type: "communication",
        label: "Communication Agent",
        description: "Analyzes communication patterns, detects delay signals, and assesses sentiment.",
        icon: MessageCircle,
        category: "action",
        color: "text-cyan-500",
        gradient: "from-cyan-500/20 to-sky-500/10",
        sampleQueries: [
            "Summarize recent communication blockers",
            "Are there any escalation patterns in team messages?",
            "What is the overall project sentiment?",
        ],
    },
    // ── PLAN AGENTS ──
    {
        type: "insight",
        label: "Insight Agent",
        description: "Overall project health, trend analysis, predictions, and proactive issue identification.",
        icon: Lightbulb,
        category: "plan",
        color: "text-yellow-500",
        gradient: "from-yellow-500/20 to-amber-500/10",
        sampleQueries: [
            "What is the overall project health?",
            "Give me a predictive analysis for the next 2 weeks",
            "What are the top improvement opportunities?",
        ],
    },
    {
        type: "strategic",
        label: "Strategic Agent",
        description: "Value engineering, trade-off analysis, stakeholder mapping, and strategic alignment.",
        icon: Target,
        category: "plan",
        color: "text-pink-500",
        gradient: "from-pink-500/20 to-rose-500/10",
        sampleQueries: [
            "What is the strategic alignment of this project?",
            "Identify key stakeholder risks",
            "What trade-offs should we consider for scope reduction?",
        ],
    },
    {
        type: "meeting",
        label: "Meeting Agent",
        description: "Meeting summaries, action item extraction, decisions tracking, and follow-up monitoring.",
        icon: Video,
        category: "plan",
        color: "text-teal-500",
        gradient: "from-teal-500/20 to-emerald-500/10",
        sampleQueries: [
            "Summarize the last project meeting",
            "What action items are pending from previous meetings?",
            "List all open decisions from this project",
        ],
    },
    {
        type: "document",
        label: "Document Agent",
        description: "Status reports, executive summaries, progress narratives, and stakeholder communications.",
        icon: FileText,
        category: "plan",
        color: "text-orange-500",
        gradient: "from-orange-500/20 to-amber-500/10",
        sampleQueries: [
            "Generate a status report for the steering committee",
            "Write an executive summary for this week",
            "Create a milestone completion notice",
        ],
    },
    {
        type: "multi-agent",
        label: "Multi-Agent Orchestrator",
        description: "Coordinates multiple agents to solve complex, multi-faceted problems.",
        icon: Network,
        category: "plan",
        color: "text-indigo-500",
        gradient: "from-indigo-500/20 to-blue-500/10",
        sampleQueries: [
            "What are the biggest risks to our budget and timeline combined?",
            "Give me a full project health dashboard",
            "Who should I assign to resolve the top blocked task?",
        ],
    },
];

// ─── Agent Test Result ───────────────────────────────────────────────────────

interface AgentResult {
    query: string;
    response: string;
    durationMs: number;
    success: boolean;
    error?: string;
    model?: string;
}

// ─── Single Agent Card ───────────────────────────────────────────────────────

function AgentValidationCard({ agent }: { agent: AgentDef }) {
    const [query, setQuery] = useState(agent.sampleQueries[0]);
    const [result, setResult] = useState<AgentResult | null>(null);
    const [loading, setLoading] = useState(false);
    const Icon = agent.icon;

    const runTest = async () => {
        if (!query.trim()) return;
        setLoading(true);
        setResult(null);
        const t0 = Date.now();

        try {
            const { data: auth } = await supabase.auth.getSession();
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
            const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

            const res = await fetch(`${supabaseUrl}/functions/v1/ai-orchestrator`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${auth.session?.access_token || anonKey}`,
                    apikey: anonKey,
                },
                body: JSON.stringify({
                    message: query,
                    agentType: agent.type,
                    projectId: "validation-test",
                    conversationId: null,
                    conversationHistory: [],
                }),
            });

            const durationMs = Date.now() - t0;
            const data = await res.json();

            if (!res.ok) {
                setResult({ query, response: "", durationMs, success: false, error: data.error || `HTTP ${res.status}` });
                toast.error(`${agent.label} failed`);
            } else {
                setResult({
                    query,
                    response: data.response || data.message || JSON.stringify(data),
                    durationMs,
                    success: true,
                    model: data.model || "gpt-4o",
                });
                toast.success(`${agent.label} responded in ${durationMs}ms`);
            }
        } catch (err: any) {
            const durationMs = Date.now() - t0;
            setResult({ query, response: "", durationMs, success: false, error: err.message });
            toast.error(`${agent.label} error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className={cn("relative overflow-hidden border-border/60 hover:border-border transition-colors")}>
            {/* Gradient accent */}
            <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", agent.gradient)} />

            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg bg-muted", agent.color)}>
                            <Icon className="h-4 w-4" />
                        </div>
                        <div>
                            <CardTitle className="text-sm font-semibold">{agent.label}</CardTitle>
                            <CardDescription className="text-xs mt-0.5">{agent.description}</CardDescription>
                        </div>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-xs capitalize">
                        {agent.category}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-3">
                {/* Sample queries */}
                <div className="flex flex-wrap gap-1.5">
                    {agent.sampleQueries.map((q) => (
                        <button
                            key={q}
                            onClick={() => setQuery(q)}
                            className={cn(
                                "text-xs px-2 py-1 rounded-full border transition-colors",
                                query === q
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border text-muted-foreground hover:border-primary/50"
                            )}
                        >
                            {q.length > 40 ? q.slice(0, 40) + "…" : q}
                        </button>
                    ))}
                </div>

                {/* Custom query */}
                <Textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter a custom query..."
                    className="text-sm min-h-[64px] resize-none"
                    rows={2}
                />

                {/* Run button */}
                <Button
                    size="sm"
                    className="w-full gap-2"
                    onClick={runTest}
                    disabled={loading || !query.trim()}
                >
                    {loading ? (
                        <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Testing…</>
                    ) : (
                        <><Play className="h-3.5 w-3.5" /> Run Test</>
                    )}
                </Button>

                {/* Result */}
                {result && (
                    <div className={cn(
                        "rounded-lg border p-3 space-y-2 text-sm",
                        result.success ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"
                    )}>
                        {/* Status bar */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                {result.success
                                    ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                    : <XCircle className="h-3.5 w-3.5 text-red-500" />}
                                <span>{result.success ? "Success" : "Failed"}</span>
                                {result.model && <Badge variant="secondary" className="text-[10px] h-4">{result.model}</Badge>}
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {result.durationMs}ms
                            </div>
                        </div>

                        {/* Response or error */}
                        {result.success ? (
                            <ScrollArea className="max-h-40">
                                <p className="text-xs leading-relaxed whitespace-pre-wrap">{result.response}</p>
                            </ScrollArea>
                        ) : (
                            <p className="text-xs text-red-500">{result.error}</p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// ─── Agent Grid ──────────────────────────────────────────────────────────────

function AgentGrid({ category, runAll }: { category: AgentCategory; runAll: boolean }) {
    const agents = AGENTS.filter((a) => a.category === category);
    return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {agents.map((agent) => (
                <AgentValidationCard key={agent.type} agent={agent} />
            ))}
        </div>
    );
}

// ─── Batch Validator ─────────────────────────────────────────────────────────

interface BatchResult {
    agentType: string;
    label: string;
    category: AgentCategory;
    success: boolean;
    durationMs: number;
    error?: string;
}

function BatchValidator() {
    const [results, setResults] = useState<BatchResult[]>([]);
    const [running, setRunning] = useState(false);

    const runAll = async () => {
        setRunning(true);
        setResults([]);
        const { data: auth } = await supabase.auth.getSession();
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

        const newResults: BatchResult[] = [];

        for (const agent of AGENTS) {
            const t0 = Date.now();
            try {
                const res = await fetch(`${supabaseUrl}/functions/v1/ai-orchestrator`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${auth.session?.access_token || anonKey}`,
                        apikey: anonKey,
                    },
                    body: JSON.stringify({
                        message: agent.sampleQueries[0],
                        agentType: agent.type,
                        projectId: "batch-validation",
                        conversationId: null,
                        conversationHistory: [],
                    }),
                });
                const durationMs = Date.now() - t0;
                if (res.ok) {
                    newResults.push({ agentType: agent.type, label: agent.label, category: agent.category, success: true, durationMs });
                } else {
                    const d = await res.json();
                    newResults.push({ agentType: agent.type, label: agent.label, category: agent.category, success: false, durationMs, error: d.error || `HTTP ${res.status}` });
                }
            } catch (err: any) {
                newResults.push({ agentType: agent.type, label: agent.label, category: agent.category, success: false, durationMs: Date.now() - t0, error: err.message });
            }
            // Show progress immediately
            setResults([...newResults]);
        }

        setRunning(false);
        const passed = newResults.filter((r) => r.success).length;
        toast[passed === AGENTS.length ? "success" : "warning"](
            `Validation complete: ${passed}/${AGENTS.length} agents passed`
        );
    };

    const passed = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-base flex items-center gap-2">
                            <FlaskConical className="h-4 w-4 text-primary" />
                            Batch Validation — All Agents
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                            Run a smoke test against every agent using its first sample query. Validates that OpenAI calls succeed end-to-end.
                        </CardDescription>
                    </div>
                    <Button onClick={runAll} disabled={running} className="gap-2 shrink-0">
                        {running ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Running…</>
                        ) : (
                            <><Zap className="h-4 w-4" /> Run All ({AGENTS.length})</>
                        )}
                    </Button>
                </div>
            </CardHeader>

            {results.length > 0 && (
                <CardContent className="space-y-3">
                    {/* Summary bar */}
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5 text-emerald-500">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="font-medium">{passed} passed</span>
                        </div>
                        {failed > 0 && (
                            <div className="flex items-center gap-1.5 text-red-500">
                                <XCircle className="h-4 w-4" />
                                <span className="font-medium">{failed} failed</span>
                            </div>
                        )}
                        {running && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>{AGENTS.length - results.length} remaining</span>
                            </div>
                        )}
                    </div>

                    {/* Results table */}
                    <div className="rounded-lg border overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-muted/50 border-b">
                                    <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Agent</th>
                                    <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Category</th>
                                    <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Status</th>
                                    <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Duration</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((r) => (
                                    <tr key={r.agentType} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                        <td className="px-3 py-2 font-medium">{r.label}</td>
                                        <td className="px-3 py-2">
                                            <Badge variant="secondary" className="text-[10px] capitalize">{r.category}</Badge>
                                        </td>
                                        <td className="px-3 py-2">
                                            {r.success ? (
                                                <span className="flex items-center gap-1 text-emerald-500">
                                                    <CheckCircle2 className="h-3.5 w-3.5" /> Pass
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-red-500" title={r.error}>
                                                    <XCircle className="h-3.5 w-3.5" /> Fail
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2 text-muted-foreground text-xs">{r.durationMs}ms</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            )}
        </Card>
    );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function AIProviderAdminPage() {
    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="space-y-1">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <Cpu className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">AI Provider Configuration</h1>
                        <p className="text-sm text-muted-foreground">
                            Configure AI providers, models, and API keys. Validate Action and Plan agents end-to-end.
                        </p>
                    </div>
                </div>

                {/* Quick stats */}
                <div className="flex items-center gap-4 pt-2">
                    <Badge variant="outline" className="gap-1.5">
                        <Settings2 className="h-3 w-3" />
                        {AGENTS.filter((a) => a.category === "action").length} Action Agents
                    </Badge>
                    <Badge variant="outline" className="gap-1.5">
                        <Lightbulb className="h-3 w-3" />
                        {AGENTS.filter((a) => a.category === "plan").length} Plan Agents
                    </Badge>
                    <Badge variant="outline" className="gap-1.5 text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20">
                        <Bot className="h-3 w-3" />
                        Provider: OpenAI gpt-4o
                    </Badge>
                </div>
            </div>

            <Separator />

            <Tabs defaultValue="provider" className="space-y-6">
                <TabsList className="grid w-full max-w-lg grid-cols-4">
                    <TabsTrigger value="provider" className="gap-1.5">
                        <Settings2 className="h-3.5 w-3.5" /> Provider
                    </TabsTrigger>
                    <TabsTrigger value="action" className="gap-1.5">
                        <Zap className="h-3.5 w-3.5" /> Action
                    </TabsTrigger>
                    <TabsTrigger value="plan" className="gap-1.5">
                        <Lightbulb className="h-3.5 w-3.5" /> Plan
                    </TabsTrigger>
                    <TabsTrigger value="validate" className="gap-1.5">
                        <FlaskConical className="h-3.5 w-3.5" /> Validate
                    </TabsTrigger>
                </TabsList>

                {/* ── Tab 1: Provider Settings ── */}
                <TabsContent value="provider">
                    <div className="max-w-2xl">
                        <AIProviderSettings />
                    </div>
                </TabsContent>

                {/* ── Tab 2: Action Agents ── */}
                <TabsContent value="action" className="space-y-4">
                    <div className="space-y-1">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Zap className="h-5 w-5 text-yellow-500" />
                            Action Agents
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Real-time execution agents that analyze data and recommend direct actions.
                            These use OpenAI gpt-4o directly via the ai-orchestrator Edge Function.
                        </p>
                    </div>
                    <AgentGrid category="action" runAll={false} />
                </TabsContent>

                {/* ── Tab 3: Plan Agents ── */}
                <TabsContent value="plan" className="space-y-4">
                    <div className="space-y-1">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Lightbulb className="h-5 w-5 text-yellow-400" />
                            Plan Agents
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Strategic planning and synthesis agents that produce insights, documents, and recommendations.
                            Also powered by OpenAI gpt-4o via ai-orchestrator.
                        </p>
                    </div>
                    <AgentGrid category="plan" runAll={false} />
                </TabsContent>

                {/* ── Tab 4: Batch Validation ── */}
                <TabsContent value="validate" className="space-y-4">
                    <div className="space-y-1">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary" />
                            Batch Validation
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Run a smoke-test against all {AGENTS.length} agents simultaneously. Confirms that every agent
                            successfully calls OpenAI and returns a valid response. Use this after changing the provider or model.
                        </p>
                    </div>
                    <BatchValidator />
                </TabsContent>
            </Tabs>
        </div>
    );
}
