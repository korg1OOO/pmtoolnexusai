/**
 * Admin AI Agents Management Page
 *
 * Premium grid of all AI agents with on/off toggles, tier grouping, and priority badges.
 * Click any agent card to navigate to its detail page.
 */

import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Bot, Settings, Play, Plus, Search, Filter, Activity, Zap,
    Calendar, DollarSign, AlertTriangle, Users, Video, FileText,
    Lightbulb, Target, MessageCircle, Network, ChevronRight, Cpu,
    ClipboardList, FileSpreadsheet, Brain, GitBranch, BarChart3,
    Database, ClipboardCheck, Shield,
} from "lucide-react";
import { useAllAIAgents, useToggleAIAgent } from "@/hooks/useAIAgents";
import { AIAgentEditor } from "@/components/admin/ai-agents/AIAgentEditor";
import { AIAgentTester } from "@/components/admin/ai-agents/AIAgentTester";
import { AgentAnalytics } from "@/components/admin/ai-agents/AgentAnalytics";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { AIAgent } from "@/services/aiAgentService";

// ── Priority Tier metadata ────────────────────────────────────────────────────
const TIER_META = {
    P0: { label: "P0 — High Value", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    P1: { label: "P1 — Significant", color: "bg-violet-500/10 text-violet-600 border-violet-500/20" },
    P2: { label: "P2 — Strategic", color: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
} as const;

type TierKey = keyof typeof TIER_META;

// Tier assignment by agent_type
const AGENT_TIER: Record<string, TierKey> = {
    "task-orchestrator": "P0",
    "pdf-report-generator": "P0",
    "auto-scheduler": "P0",
    "risk-mitigator": "P0",
    "meeting-mom-generator": "P0",
    "excel-importer": "P0",
    "resource-leveler": "P1",
    "sprint-planner": "P1",
    "approval-router": "P1",
    "ml-retrain-trigger": "P1",
    "change-impact-analyzer": "P2",
    "scenario-write-back": "P2",
    "presentation-builder": "P2",
    "sod-checker": "P2",
    "compliance-action": "P2",
    // legacy
    scheduler: "P0", risk: "P0", meeting: "P0", system: "P0",
    finance: "P1", assignment: "P1", document: "P1",
    insight: "P2", strategic: "P2", communication: "P2", "multi-agent": "P2",
};

// Static display metadata per agent_type
const AGENT_META: Record<string, {
    icon: React.ComponentType<{ className?: string }>;
    emoji: string;
    gradient: string;
    accentBg: string;
    accentText: string;
    purpose: string;
}> = {
    // ── P0 ──────────────────────────────────────────────────────────────────
    "task-orchestrator": { icon: ClipboardList, emoji: "✅", gradient: "from-blue-500/10 to-indigo-500/5", accentBg: "bg-blue-500/10", accentText: "text-blue-500", purpose: "Creates, updates & bulk-manages tasks across sprints" },
    "pdf-report-generator": { icon: FileText, emoji: "📄", gradient: "from-indigo-500/10 to-blue-500/5", accentBg: "bg-indigo-500/10", accentText: "text-indigo-500", purpose: "Generates professional PDF status reports & summaries" },
    "auto-scheduler": { icon: Calendar, emoji: "📅", gradient: "from-cyan-500/10 to-blue-500/5", accentBg: "bg-cyan-500/10", accentText: "text-cyan-500", purpose: "Optimizes project schedules & resolves conflicts" },
    "risk-mitigator": { icon: AlertTriangle, emoji: "⚠️", gradient: "from-orange-500/10 to-amber-500/5", accentBg: "bg-orange-500/10", accentText: "text-orange-500", purpose: "Identifies, escalates & mitigates project risks" },
    "meeting-mom-generator": { icon: Video, emoji: "🎥", gradient: "from-pink-500/10 to-rose-500/5", accentBg: "bg-pink-500/10", accentText: "text-pink-500", purpose: "Extracts action items & generates MoM documents" },
    "excel-importer": { icon: FileSpreadsheet, emoji: "📊", gradient: "from-green-500/10 to-emerald-500/5", accentBg: "bg-green-500/10", accentText: "text-green-500", purpose: "Imports project plans from Excel / CSV files" },
    // ── P1 ──────────────────────────────────────────────────────────────────
    "resource-leveler": { icon: Users, emoji: "⚖️", gradient: "from-purple-500/10 to-violet-500/5", accentBg: "bg-purple-500/10", accentText: "text-purple-500", purpose: "Levels resource workloads & resolves over-allocation" },
    "sprint-planner": { icon: Zap, emoji: "🚀", gradient: "from-amber-500/10 to-yellow-500/5", accentBg: "bg-amber-500/10", accentText: "text-amber-500", purpose: "Plans sprints using velocity & team capacity" },
    "approval-router": { icon: GitBranch, emoji: "🔀", gradient: "from-blue-500/10 to-sky-500/5", accentBg: "bg-sky-500/10", accentText: "text-sky-500", purpose: "Routes change requests through formal approval flows" },
    "ml-retrain-trigger": { icon: Brain, emoji: "🧠", gradient: "from-violet-500/10 to-purple-500/5", accentBg: "bg-violet-500/10", accentText: "text-violet-500", purpose: "Monitors ML accuracy & triggers retraining pipelines" },
    // ── P2 ──────────────────────────────────────────────────────────────────
    "change-impact-analyzer": { icon: BarChart3, emoji: "📈", gradient: "from-red-500/10 to-rose-500/5", accentBg: "bg-red-500/10", accentText: "text-red-500", purpose: "Assesses timeline, budget & resource impact of changes" },
    "scenario-write-back": { icon: Database, emoji: "💾", gradient: "from-teal-500/10 to-cyan-500/5", accentBg: "bg-teal-500/10", accentText: "text-teal-500", purpose: "Saves financial scenarios & budgets with version control" },
    "presentation-builder": { icon: FileText, emoji: "🎞️", gradient: "from-rose-500/10 to-pink-500/5", accentBg: "bg-rose-500/10", accentText: "text-rose-500", purpose: "Auto-builds executive slide decks from project data" },
    "sod-checker": { icon: Shield, emoji: "🛡️", gradient: "from-emerald-500/10 to-green-500/5", accentBg: "bg-emerald-500/10", accentText: "text-emerald-500", purpose: "Detects Segregation of Duties conflicts in roles" },
    "compliance-action": { icon: ClipboardCheck, emoji: "✔️", gradient: "from-orange-500/10 to-amber-500/5", accentBg: "bg-orange-500/10", accentText: "text-orange-500", purpose: "Flags compliance violations & creates remediation plans" },
    // ── Legacy ───────────────────────────────────────────────────────────────
    scheduler: { icon: Calendar, emoji: "📅", gradient: "from-blue-500/10 to-indigo-500/5", accentBg: "bg-blue-500/10", accentText: "text-blue-500", purpose: "Timeline & schedule management" },
    finance: { icon: DollarSign, emoji: "💰", gradient: "from-green-500/10 to-emerald-500/5", accentBg: "bg-green-500/10", accentText: "text-green-500", purpose: "Budget & financial analysis" },
    risk: { icon: AlertTriangle, emoji: "⚠️", gradient: "from-orange-500/10 to-amber-500/5", accentBg: "bg-orange-500/10", accentText: "text-orange-500", purpose: "Risk identification & mitigation" },
    assignment: { icon: Users, emoji: "👥", gradient: "from-purple-500/10 to-violet-500/5", accentBg: "bg-purple-500/10", accentText: "text-purple-500", purpose: "Resource allocation & team mgmt" },
    meeting: { icon: Video, emoji: "🎥", gradient: "from-pink-500/10 to-rose-500/5", accentBg: "bg-pink-500/10", accentText: "text-pink-500", purpose: "Meeting management & agendas" },
    document: { icon: FileText, emoji: "📄", gradient: "from-indigo-500/10 to-blue-500/5", accentBg: "bg-indigo-500/10", accentText: "text-indigo-500", purpose: "Document generation & templates" },
    insight: { icon: Lightbulb, emoji: "💡", gradient: "from-yellow-500/10 to-amber-500/5", accentBg: "bg-yellow-500/10", accentText: "text-yellow-500", purpose: "Data analysis & predictive insights" },
    strategic: { icon: Target, emoji: "🎯", gradient: "from-red-500/10 to-rose-500/5", accentBg: "bg-red-500/10", accentText: "text-red-500", purpose: "Portfolio optimization & planning" },
    communication: { icon: MessageCircle, emoji: "💬", gradient: "from-cyan-500/10 to-teal-500/5", accentBg: "bg-cyan-500/10", accentText: "text-cyan-500", purpose: "Stakeholder & sentiment analysis" },
    system: { icon: Bot, emoji: "🤖", gradient: "from-gray-500/10 to-slate-500/5", accentBg: "bg-gray-500/10", accentText: "text-gray-500", purpose: "General assistance & navigation" },
    "multi-agent": { icon: Network, emoji: "🌐", gradient: "from-primary/10 to-violet-500/5", accentBg: "bg-primary/10", accentText: "text-primary", purpose: "Multi-agent orchestration" },
};

// ── Tier Badge ────────────────────────────────────────────────────────────────
function TierBadge({ tier }: { tier?: TierKey }) {
    if (!tier) return null;
    return (
        <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border", TIER_META[tier].color)}>
            {tier}
        </span>
    );
}

// ── Agent Card ────────────────────────────────────────────────────────────────
function AgentCard({ agent, onToggle, isToggling, onClick }: {
    agent: AIAgent;
    onToggle: (e: React.MouseEvent) => void;
    isToggling: boolean;
    onClick: () => void;
}) {
    const meta = AGENT_META[agent.agent_type];
    const IconComponent = meta?.icon ?? Bot;
    const tier = AGENT_TIER[agent.agent_type];

    return (
        <Card
            className={cn(
                "group relative cursor-pointer border transition-all duration-200",
                "hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/30",
                !agent.is_active && "opacity-60"
            )}
            onClick={onClick}
        >
            <div className={cn(
                "absolute inset-0 rounded-lg bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none",
                meta?.gradient ?? "from-primary/10 to-primary/5"
            )} />

            <CardHeader className="pb-3 relative">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", meta?.accentBg ?? "bg-primary/10")}>
                            <IconComponent className={cn("h-5 w-5", meta?.accentText ?? "text-primary")} />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <CardTitle className="text-base leading-tight">{agent.label}</CardTitle>
                                <span className="text-base">{meta?.emoji}</span>
                                <TierBadge tier={tier} />
                            </div>
                            <CardDescription className="text-xs font-mono mt-0.5">{agent.agent_type}</CardDescription>
                        </div>
                    </div>
                    <div className="shrink-0" onClick={onToggle} role="button" tabIndex={0}
                        aria-label={`Toggle ${agent.label}`}
                        onKeyDown={(e) => e.key === "Enter" && onToggle(e as any)}>
                        <Switch checked={agent.is_active} disabled={isToggling} className="pointer-events-none" />
                    </div>
                </div>
            </CardHeader>

            <CardContent className="relative space-y-3 pt-0">
                <p className="text-xs text-muted-foreground leading-relaxed">
                    {meta?.purpose ?? agent.description ?? "AI-powered assistant"}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs gap-1 px-2 py-0.5">
                        <Cpu className="h-3 w-3" />{agent.model_name}
                    </Badge>
                    <Badge variant="outline" className="text-xs gap-1 px-2 py-0.5">
                        <Zap className="h-3 w-3" />{agent.temperature}
                    </Badge>
                    <Badge variant="outline" className="text-xs px-2 py-0.5">
                        {agent.max_tokens.toLocaleString()} tk
                    </Badge>
                </div>
                <div className="flex items-center justify-between pt-1 border-t">
                    <Badge variant={agent.is_active ? "default" : "secondary"}
                        className={cn("text-xs", agent.is_active && "bg-green-500/15 text-green-600 border-green-500/20 hover:bg-green-500/20")}>
                        {agent.is_active ? "● Active" : "○ Inactive"}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 group-hover:text-primary transition-colors">
                        View details <ChevronRight className="h-3 w-3" />
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}

// ── Tier Section ──────────────────────────────────────────────────────────────
function TierSection({ tier, agents, onToggle, isToggling, onNavigate }: {
    tier: TierKey;
    agents: AIAgent[];
    onToggle: (e: React.MouseEvent, id: string, label: string) => void;
    isToggling: boolean;
    onNavigate: (type: string) => void;
}) {
    if (agents.length === 0) return null;
    const meta = TIER_META[tier];
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-3">
                <span className={cn("px-2.5 py-1 rounded-md text-sm font-semibold border", meta.color)}>
                    {meta.label}
                </span>
                <span className="text-xs text-muted-foreground">{agents.length} agent{agents.length !== 1 ? "s" : ""}</span>
                <div className="flex-1 h-px bg-border" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {agents.map(agent => (
                    <AgentCard key={agent.id} agent={agent}
                        onToggle={(e) => onToggle(e, agent.id, agent.label)}
                        isToggling={isToggling}
                        onClick={() => onNavigate(agent.agent_type)} />
                ))}
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminAIAgents() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
    const [filterTier, setFilterTier] = useState<"all" | TierKey>("all");
    const [selectedAgent, setSelectedAgent] = useState<string | null>(
        searchParams.get("edit") ?? searchParams.get("test") ?? null
    );
    const [activeTab, setActiveTab] = useState<"list" | "editor" | "tester" | "analytics">(
        searchParams.get("edit") ? "editor" : searchParams.get("test") ? "tester" : "list"
    );

    const { data: agents, isLoading } = useAllAIAgents();
    const toggleAgent = useToggleAIAgent();

    const filteredAgents = agents?.filter(agent => {
        const q = searchQuery.toLowerCase();
        const matchesSearch = !q || agent.label.toLowerCase().includes(q) ||
            agent.agent_type.toLowerCase().includes(q) ||
            (agent.description ?? "").toLowerCase().includes(q);
        const matchesStatus = filterStatus === "all" ||
            (filterStatus === "active" && agent.is_active) ||
            (filterStatus === "inactive" && !agent.is_active);
        const matchesTier = filterTier === "all" || AGENT_TIER[agent.agent_type] === filterTier;
        return matchesSearch && matchesStatus && matchesTier;
    }) ?? [];

    const activeCount = agents?.filter(a => a.is_active).length ?? 0;
    const p0Count = agents?.filter(a => AGENT_TIER[a.agent_type] === "P0").length ?? 0;
    const p1Count = agents?.filter(a => AGENT_TIER[a.agent_type] === "P1").length ?? 0;
    const p2Count = agents?.filter(a => AGENT_TIER[a.agent_type] === "P2").length ?? 0;

    const handleToggle = async (e: React.MouseEvent, agentId: string, agentLabel: string) => {
        e.stopPropagation();
        try { await toggleAgent.mutateAsync(agentId); toast.success(`${agentLabel} status updated`); }
        catch { toast.error("Failed to update agent status"); }
    };

    const byTier = (tier: TierKey) => filteredAgents.filter(a => AGENT_TIER[a.agent_type] === tier);
    const showGrouped = !searchQuery && filterStatus === "all" && filterTier === "all";

    return (
        <div className="container mx-auto py-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Bot className="h-8 w-8" /> AI Agents
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your full AI agent fleet — P0, P1, and P2 tiers
                    </p>
                </div>
                <Button onClick={() => { setSelectedAgent(null); setActiveTab("editor"); }} className="gap-2">
                    <Plus className="h-4 w-4" /> New Agent
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                    <CardHeader className="pb-2"><CardDescription>Total</CardDescription><CardTitle className="text-3xl">{agents?.length ?? 0}</CardTitle></CardHeader>
                </Card>
                <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
                    <CardHeader className="pb-2"><CardDescription>Active</CardDescription><CardTitle className="text-3xl text-green-600">{activeCount}</CardTitle></CardHeader>
                </Card>
                {(["P0", "P1", "P2"] as TierKey[]).map((tier, i) => {
                    const count = [p0Count, p1Count, p2Count][i];
                    const colors = ["blue", "violet", "rose"] as const;
                    const c = colors[i];
                    return (
                        <Card key={tier} className={cn(`bg-gradient-to-br from-${c}-500/5 to-${c}-500/10 border-${c}-500/20 cursor-pointer`)}
                            onClick={() => setFilterTier(filterTier === tier ? "all" : tier)}>
                            <CardHeader className="pb-2">
                                <CardDescription>{TIER_META[tier].label}</CardDescription>
                                <CardTitle className={cn("text-3xl", `text-${c}-600`)}>{count}</CardTitle>
                            </CardHeader>
                        </Card>
                    );
                })}
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
                <TabsList>
                    <TabsTrigger value="list" className="gap-2"><Activity className="h-4 w-4" />Agent List</TabsTrigger>
                    <TabsTrigger value="editor" className="gap-2"><Settings className="h-4 w-4" />Editor {selectedAgent && "(Editing)"}</TabsTrigger>
                    <TabsTrigger value="tester" className="gap-2"><Play className="h-4 w-4" />Tester {selectedAgent && "(Testing)"}</TabsTrigger>
                    <TabsTrigger value="analytics" className="gap-2"><Activity className="h-4 w-4" />Analytics</TabsTrigger>
                </TabsList>

                {/* Agent List Tab */}
                <TabsContent value="list" className="space-y-6">
                    {/* Search & Filters */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search agents…" value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            {(["all", "active", "inactive"] as const).map(s => (
                                <Button key={s} variant={filterStatus === s ? "default" : "outline"} size="sm"
                                    onClick={() => setFilterStatus(s)} className="capitalize text-xs">{s}</Button>
                            ))}
                        </div>
                        <div className="flex items-center gap-1.5">
                            {(["all", "P0", "P1", "P2"] as const).map(t => (
                                <Button key={t} variant={filterTier === t ? "default" : "outline"} size="sm"
                                    onClick={() => setFilterTier(t)} className="text-xs">{t === "all" ? "All Tiers" : t}</Button>
                            ))}
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {Array.from({ length: 12 }).map((_, i) => <Card key={i} className="h-44 animate-pulse bg-muted/30" />)}
                        </div>
                    ) : filteredAgents.length === 0 ? (
                        <Card><CardContent className="py-16 text-center">
                            <Bot className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                            <p className="text-muted-foreground">No agents found matching your criteria</p>
                        </CardContent></Card>
                    ) : showGrouped ? (
                        <div className="space-y-8">
                            {(["P0", "P1", "P2"] as TierKey[]).map(tier => (
                                <TierSection key={tier} tier={tier} agents={byTier(tier)}
                                    onToggle={handleToggle} isToggling={toggleAgent.isPending}
                                    onNavigate={(type) => navigate(`/admin/ai-agents/${type}`)} />
                            ))}
                            {/* Legacy / untiered */}
                            {(() => {
                                const untiered = filteredAgents.filter(a => !AGENT_TIER[a.agent_type]);
                                if (untiered.length === 0) return null;
                                return (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <span className="px-2.5 py-1 rounded-md text-sm font-semibold border bg-muted/50 text-muted-foreground">Legacy</span>
                                            <div className="flex-1 h-px bg-border" />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                            {untiered.map(agent => (
                                                <AgentCard key={agent.id} agent={agent}
                                                    onToggle={e => handleToggle(e, agent.id, agent.label)}
                                                    isToggling={toggleAgent.isPending}
                                                    onClick={() => navigate(`/admin/ai-agents/${agent.agent_type}`)} />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredAgents.map(agent => (
                                <AgentCard key={agent.id} agent={agent}
                                    onToggle={e => handleToggle(e, agent.id, agent.label)}
                                    isToggling={toggleAgent.isPending}
                                    onClick={() => navigate(`/admin/ai-agents/${agent.agent_type}`)} />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="editor">
                    <AIAgentEditor agentId={selectedAgent} onSave={() => setActiveTab("list")} onCancel={() => setActiveTab("list")} />
                </TabsContent>
                <TabsContent value="tester">
                    <AIAgentTester agentId={selectedAgent} onClose={() => setActiveTab("list")} />
                </TabsContent>
                <TabsContent value="analytics">
                    <AgentAnalytics />
                </TabsContent>
            </Tabs>
        </div>
    );
}
