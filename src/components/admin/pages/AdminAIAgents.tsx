/**
 * Admin AI Agents Management Page
 *
 * Premium grid of all AI agents with on/off toggles.
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
} from "lucide-react";
import { useAllAIAgents, useToggleAIAgent, useDeleteAIAgent } from "@/hooks/useAIAgents";
import { AIAgentEditor } from "@/components/admin/ai-agents/AIAgentEditor";
import { AIAgentTester } from "@/components/admin/ai-agents/AIAgentTester";
import { AgentAnalytics } from "@/components/admin/ai-agents/AgentAnalytics";
import { toast } from "sonner";
import type { AIAgent } from "@/services/aiAgentService";

// Static metadata for each agent type
const AGENT_META: Record<string, {
    icon: React.ComponentType<{ className?: string }>;
    emoji: string;
    gradient: string;
    accentBg: string;
    accentText: string;
    purpose: string;
}> = {
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

function AgentCard({
    agent,
    onToggle,
    isToggling,
    onClick,
}: {
    agent: AIAgent;
    onToggle: (e: React.MouseEvent) => void;
    isToggling: boolean;
    onClick: () => void;
}) {
    const meta = AGENT_META[agent.agent_type];
    const IconComponent = meta?.icon ?? Bot;

    return (
        <Card
            className={`group relative cursor-pointer border transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/30 ${!agent.is_active ? "opacity-60" : ""}`}
            onClick={onClick}
        >
            {/* Background gradient */}
            <div className={`absolute inset-0 rounded-lg bg-gradient-to-br ${meta?.gradient ?? "from-primary/10 to-primary/5"} opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`} />

            <CardHeader className="pb-3 relative">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        {/* Icon */}
                        <div className={`h-10 w-10 rounded-xl ${meta?.accentBg ?? "bg-primary/10"} flex items-center justify-center shrink-0 transition-transform group-hover:scale-110`}>
                            <IconComponent className={`h-5 w-5 ${meta?.accentText ?? "text-primary"}`} />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                                <CardTitle className="text-base leading-tight">{agent.label}</CardTitle>
                                <span className="text-base">{meta?.emoji}</span>
                            </div>
                            <CardDescription className="text-xs font-mono mt-0.5">{agent.agent_type}</CardDescription>
                        </div>
                    </div>
                    {/* Toggle */}
                    <div
                        className="shrink-0"
                        onClick={onToggle}
                        role="button"
                        tabIndex={0}
                        aria-label={`Toggle ${agent.label}`}
                        onKeyDown={(e) => e.key === "Enter" && onToggle(e as any)}
                    >
                        <Switch
                            checked={agent.is_active}
                            disabled={isToggling}
                            className="pointer-events-none"
                        />
                    </div>
                </div>
            </CardHeader>

            <CardContent className="relative space-y-3 pt-0">
                {/* Purpose */}
                <p className="text-xs text-muted-foreground leading-relaxed">
                    {meta?.purpose ?? agent.description ?? "AI-powered assistant"}
                </p>

                {/* Model + config badges */}
                <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs gap-1 px-2 py-0.5">
                        <Cpu className="h-3 w-3" />
                        {agent.model_name}
                    </Badge>
                    <Badge variant="outline" className="text-xs gap-1 px-2 py-0.5">
                        <Zap className="h-3 w-3" />
                        {agent.temperature}
                    </Badge>
                    <Badge variant="outline" className="text-xs px-2 py-0.5">
                        {agent.max_tokens.toLocaleString()} tk
                    </Badge>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-1 border-t">
                    <Badge
                        variant={agent.is_active ? "default" : "secondary"}
                        className={`text-xs ${agent.is_active ? "bg-green-500/15 text-green-600 border-green-500/20 hover:bg-green-500/20" : ""}`}
                    >
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

export default function AdminAIAgents() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
    const [selectedAgent, setSelectedAgent] = useState<string | null>(
        searchParams.get("edit") ?? searchParams.get("test") ?? null
    );
    const [activeTab, setActiveTab] = useState<"list" | "editor" | "tester" | "analytics">(
        searchParams.get("edit") ? "editor" : searchParams.get("test") ? "tester" : "list"
    );

    const { data: agents, isLoading } = useAllAIAgents();
    const toggleAgent = useToggleAIAgent();
    const deleteAgent = useDeleteAIAgent();

    const filteredAgents = agents?.filter(agent => {
        const matchesSearch = agent.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            agent.agent_type.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === "all" ||
            (filterStatus === "active" && agent.is_active) ||
            (filterStatus === "inactive" && !agent.is_active);
        return matchesSearch && matchesStatus;
    }) || [];

    const activeCount = agents?.filter(a => a.is_active).length ?? 0;
    const inactiveCount = agents?.filter(a => !a.is_active).length ?? 0;

    const handleToggleAgent = async (e: React.MouseEvent, agentId: string, agentLabel: string) => {
        e.stopPropagation();
        try {
            await toggleAgent.mutateAsync(agentId);
            toast.success(`${agentLabel} status updated`);
        } catch {
            toast.error("Failed to update agent status");
        }
    };

    const handleEditAgent = (agentId: string) => {
        setSelectedAgent(agentId);
        setActiveTab("editor");
    };

    const handleTestAgent = (agentId: string) => {
        setSelectedAgent(agentId);
        setActiveTab("tester");
    };

    return (
        <div className="container mx-auto py-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Bot className="h-8 w-8" />
                        AI Agents
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage and configure your AI agent fleet
                    </p>
                </div>
                <Button
                    onClick={() => { setSelectedAgent(null); setActiveTab("editor"); }}
                    className="gap-2"
                >
                    <Plus className="h-4 w-4" />
                    New Agent
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                    <CardHeader className="pb-2">
                        <CardDescription>Total Agents</CardDescription>
                        <CardTitle className="text-3xl">{agents?.length ?? 0}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
                    <CardHeader className="pb-2">
                        <CardDescription>Active</CardDescription>
                        <CardTitle className="text-3xl text-green-600">{activeCount}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="bg-gradient-to-br from-gray-500/5 to-gray-500/10 border-gray-500/20">
                    <CardHeader className="pb-2">
                        <CardDescription>Inactive</CardDescription>
                        <CardTitle className="text-3xl text-muted-foreground">{inactiveCount}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
                    <CardHeader className="pb-2">
                        <CardDescription>Providers</CardDescription>
                        <CardTitle className="text-3xl">
                            {[...new Set(agents?.map(a => a.model_provider))].length ?? 0}
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Main Content */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
                <TabsList>
                    <TabsTrigger value="list" className="gap-2">
                        <Activity className="h-4 w-4" />
                        Agent List
                    </TabsTrigger>
                    <TabsTrigger value="editor" className="gap-2">
                        <Settings className="h-4 w-4" />
                        Editor {selectedAgent && "(Editing)"}
                    </TabsTrigger>
                    <TabsTrigger value="tester" className="gap-2">
                        <Play className="h-4 w-4" />
                        Tester {selectedAgent && "(Testing)"}
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="gap-2">
                        <Activity className="h-4 w-4" />
                        Analytics
                    </TabsTrigger>
                </TabsList>

                {/* Agent List */}
                <TabsContent value="list" className="space-y-4">
                    {/* Search & Filters */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search agents..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            {(["all", "active", "inactive"] as const).map(s => (
                                <Button
                                    key={s}
                                    variant={filterStatus === s ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setFilterStatus(s)}
                                    className="capitalize"
                                >
                                    {s}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <Card key={i} className="h-44 animate-pulse bg-muted/30" />
                            ))}
                        </div>
                    ) : filteredAgents.length === 0 ? (
                        <Card>
                            <CardContent className="py-16 text-center">
                                <Bot className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                                <p className="text-muted-foreground">No agents found matching your criteria</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredAgents.map((agent) => (
                                <AgentCard
                                    key={agent.id}
                                    agent={agent}
                                    onToggle={(e) => handleToggleAgent(e, agent.id, agent.label)}
                                    isToggling={toggleAgent.isPending}
                                    onClick={() => navigate(`/admin/ai-agents/${agent.agent_type}`)}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="editor">
                    <AIAgentEditor
                        agentId={selectedAgent}
                        onSave={() => setActiveTab("list")}
                        onCancel={() => setActiveTab("list")}
                    />
                </TabsContent>

                <TabsContent value="tester">
                    <AIAgentTester
                        agentId={selectedAgent}
                        onClose={() => setActiveTab("list")}
                    />
                </TabsContent>

                <TabsContent value="analytics">
                    <AgentAnalytics />
                </TabsContent>
            </Tabs>
        </div>
    );
}
