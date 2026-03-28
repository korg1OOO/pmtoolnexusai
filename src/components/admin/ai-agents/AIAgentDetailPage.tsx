/**
 * AI Agent Detail Page
 *
 * Full-detail view for a single AI agent, navigated to from the admin AI Agents list.
 * Shows all metadata from the documentation: capabilities, system prompt, role access, model config.
 */

import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft, Bot, Calendar, DollarSign, AlertTriangle, Users, Video,
    FileText, Lightbulb, Target, MessageCircle, Network, Settings,
    Shield, Zap, Code, Activity, Play, Edit, ToggleLeft, ToggleRight,
    Clock, Cpu, BookOpen, CheckCircle, XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useAllAIAgents, useToggleAIAgent } from "@/hooks/useAIAgents";
import { toast } from "sonner";

// Static enrichment data from documentation
const AGENT_ENRICHMENT: Record<string, {
    emoji: string;
    purpose: string;
    capabilities: string[];
    systemPrompt: string;
    intentCategories: string[];
    permissionSummary: Record<string, string[]>;
    icon: React.ComponentType<{ className?: string }>;
    gradient: string;
    accentColor: string;
}> = {
    scheduler: {
        emoji: "📅",
        purpose: "Timeline and schedule management across projects",
        capabilities: [
            "Schedule query and analysis",
            "Timeline modification",
            "Milestone tracking",
            "Dependency management",
            "Critical path analysis",
        ],
        systemPrompt: "You are a scheduling assistant specialized in project timelines, milestones, and critical path analysis.",
        intentCategories: ["SCHEDULE_QUERY", "SCHEDULE_MODIFY"],
        permissionSummary: {
            "admin": ["query", "modify", "analyze"],
            "pm": ["query", "modify", "analyze"],
            "lead": ["query", "analyze"],
            "developer": ["query"],
            "analyst": ["query"],
            "viewer": ["query (read-only)"],
        },
        icon: Calendar,
        gradient: "from-blue-500/20 to-indigo-500/10",
        accentColor: "text-blue-500",
    },
    finance: {
        emoji: "💰",
        purpose: "Budget tracking, cost forecasting, and financial analysis",
        capabilities: [
            "Budget queries and analysis",
            "Cost forecasting",
            "Spend tracking",
            "Financial reporting",
            "Variance analysis",
        ],
        systemPrompt: "You are a financial analyst specialized in project budgets, cost tracking, and financial forecasting.",
        intentCategories: ["BUDGET_QUERY", "BUDGET_ANALYSIS"],
        permissionSummary: {
            "admin": ["query", "analyze", "report", "modify"],
            "pm": ["query", "analyze", "report"],
            "lead": ["query", "analyze"],
            "developer": ["query"],
            "analyst": ["query", "analyze"],
            "viewer": ["query (read-only)"],
        },
        icon: DollarSign,
        gradient: "from-green-500/20 to-emerald-500/10",
        accentColor: "text-green-500",
    },
    risk: {
        emoji: "⚠️",
        purpose: "Risk identification, scoring, and mitigation strategy",
        capabilities: [
            "Risk assessment",
            "Risk analysis and scoring",
            "Mitigation strategy recommendations",
            "Risk monitoring",
            "Issue tracking",
        ],
        systemPrompt: "You are a risk management specialist focused on identifying, analyzing, and mitigating project risks.",
        intentCategories: ["RISK_QUERY", "RISK_ANALYZE"],
        permissionSummary: {
            "admin": ["all"],
            "pm": ["query", "analyze", "recommend"],
            "lead": ["query", "analyze"],
            "developer": ["query"],
            "analyst": ["query", "analyze"],
            "viewer": ["query (read-only)"],
        },
        icon: AlertTriangle,
        gradient: "from-orange-500/20 to-amber-500/10",
        accentColor: "text-orange-500",
    },
    assignment: {
        emoji: "👥",
        purpose: "Resource allocation, skill matching, and workload balancing",
        capabilities: [
            "Resource queries",
            "Team member assignment",
            "Workload balancing",
            "Skill matching",
            "Capacity planning",
        ],
        systemPrompt: "You are a resource management specialist focused on optimal team assignments and workload distribution.",
        intentCategories: ["RESOURCE_QUERY", "RESOURCE_ASSIGN"],
        permissionSummary: {
            "admin": ["all"],
            "pm": ["query", "assign", "plan"],
            "lead": ["query", "plan"],
            "developer": ["query"],
            "analyst": ["query"],
            "viewer": ["query (read-only)"],
        },
        icon: Users,
        gradient: "from-purple-500/20 to-violet-500/10",
        accentColor: "text-purple-500",
    },
    meeting: {
        emoji: "🎥",
        purpose: "Meeting management, agenda generation, and action tracking",
        capabilities: [
            "Meeting queries",
            "Agenda generation",
            "Meeting summaries",
            "Action item extraction",
            "Follow-up tracking",
        ],
        systemPrompt: "You are a meeting facilitator specialized in generating agendas, summarizing discussions, and tracking action items.",
        intentCategories: ["MEETING_QUERY", "MEETING_GENERATE"],
        permissionSummary: {
            "admin": ["all"],
            "pm": ["all"],
            "lead": ["query", "generate", "summarize"],
            "developer": ["query", "generate"],
            "analyst": ["query", "generate"],
            "viewer": ["query (read-only)"],
        },
        icon: Video,
        gradient: "from-pink-500/20 to-rose-500/10",
        accentColor: "text-pink-500",
    },
    document: {
        emoji: "📄",
        purpose: "Document generation, template creation, and content summarization",
        capabilities: [
            "Report generation",
            "Document queries",
            "Template creation",
            "Content summarization",
            "Documentation standards",
        ],
        systemPrompt: "You are a documentation specialist focused on generating clear, comprehensive project reports and documents.",
        intentCategories: ["REPORT_GENERATE"],
        permissionSummary: {
            "admin": ["all"],
            "pm": ["generate", "query", "template"],
            "lead": ["generate", "query"],
            "developer": ["generate", "query"],
            "analyst": ["generate", "query"],
            "viewer": ["query (read-only)"],
        },
        icon: FileText,
        gradient: "from-indigo-500/20 to-blue-500/10",
        accentColor: "text-indigo-500",
    },
    insight: {
        emoji: "💡",
        purpose: "Data analysis, trend recognition, and predictive insights",
        capabilities: [
            "Insight requests",
            "Trend analysis",
            "Pattern recognition",
            "Performance metrics",
            "Predictive analytics",
        ],
        systemPrompt: "You are a data analyst specialized in extracting insights from project data and identifying trends.",
        intentCategories: ["INSIGHT_REQUEST"],
        permissionSummary: {
            "admin": ["all"],
            "pm": ["all"],
            "lead": ["query", "analyze"],
            "developer": ["query"],
            "analyst": ["query", "analyze"],
            "viewer": ["query (read-only)"],
        },
        icon: Lightbulb,
        gradient: "from-yellow-500/20 to-amber-500/10",
        accentColor: "text-yellow-500",
    },
    strategic: {
        emoji: "🎯",
        purpose: "Portfolio optimization, long-term planning, and goal alignment",
        capabilities: [
            "Strategic analysis",
            "Portfolio optimization",
            "Long-term planning",
            "Goal alignment",
            "Initiative prioritization",
        ],
        systemPrompt: "You are a strategic advisor focused on portfolio optimization and long-term planning.",
        intentCategories: ["STRATEGIC_ANALYSIS"],
        permissionSummary: {
            "admin": ["all"],
            "pm": ["analyze", "plan"],
            "lead": ["analyze"],
            "developer": [],
            "analyst": ["analyze"],
            "viewer": ["query (read-only)"],
        },
        icon: Target,
        gradient: "from-red-500/20 to-rose-500/10",
        accentColor: "text-red-500",
    },
    communication: {
        emoji: "💬",
        purpose: "Stakeholder engagement, sentiment analysis, and communication strategy",
        capabilities: [
            "Communication scanning",
            "Stakeholder analysis",
            "Sentiment analysis",
            "Communication recommendations",
            "Engagement tracking",
        ],
        systemPrompt: "You are a communication specialist focused on stakeholder engagement and effective messaging.",
        intentCategories: ["COMMUNICATION_SCAN"],
        permissionSummary: {
            "admin": ["all"],
            "pm": ["all"],
            "lead": ["query", "analyze"],
            "developer": ["query"],
            "analyst": ["query", "analyze"],
            "viewer": ["query (read-only)"],
        },
        icon: MessageCircle,
        gradient: "from-cyan-500/20 to-teal-500/10",
        accentColor: "text-cyan-500",
    },
    system: {
        emoji: "🤖",
        purpose: "General system assistance, navigation help, and feature guidance",
        capabilities: [
            "General chat",
            "System queries",
            "Help and guidance",
            "Navigation assistance",
            "Feature explanations",
        ],
        systemPrompt: "You are a helpful system assistant providing general guidance and support.",
        intentCategories: ["GENERAL_CHAT"],
        permissionSummary: {
            "admin": ["all"],
            "pm": ["all"],
            "lead": ["all"],
            "developer": ["all"],
            "analyst": ["all"],
            "viewer": ["all"],
        },
        icon: Bot,
        gradient: "from-gray-500/20 to-slate-500/10",
        accentColor: "text-gray-500",
    },
    "multi-agent": {
        emoji: "🌐",
        purpose: "Multi-agent orchestration for complex, cross-domain queries",
        capabilities: [
            "Intent classification",
            "Agent routing",
            "Multi-agent coordination",
            "Complex query handling",
            "Workflow orchestration",
        ],
        systemPrompt: "You are an orchestrator that coordinates multiple specialized agents to handle complex queries.",
        intentCategories: ["SCHEDULE_QUERY", "BUDGET_QUERY", "RISK_QUERY", "RESOURCE_QUERY", "INSIGHT_REQUEST", "GENERAL_CHAT"],
        permissionSummary: {
            "admin": ["all"],
            "pm": ["all"],
            "lead": ["orchestrate"],
            "developer": ["query"],
            "analyst": ["query", "orchestrate"],
            "viewer": ["query (read-only)"],
        },
        icon: Network,
        gradient: "from-primary/20 to-violet-500/10",
        accentColor: "text-primary",
    },
};

const ROLE_COLORS: Record<string, string> = {
    admin: "bg-red-500/10 text-red-400 border-red-500/20",
    pm: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    lead: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    developer: "bg-green-500/10 text-green-400 border-green-500/20",
    analyst: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    viewer: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

export default function AIAgentDetailPage() {
    const { agentType } = useParams<{ agentType: string }>();
    const navigate = useNavigate();
    const { data: agents, isLoading } = useAllAIAgents();
    const toggleAgent = useToggleAIAgent();

    const agent = agents?.find(a => a.agent_type === agentType);
    const enrichment = agentType ? AGENT_ENRICHMENT[agentType] : undefined;

    const handleToggle = async () => {
        if (!agent) return;
        try {
            await toggleAgent.mutateAsync(agent.id);
            toast.success(`Agent ${agent.is_active ? "disabled" : "enabled"} successfully`);
        } catch {
            toast.error("Failed to update agent status");
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto py-12 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-muted-foreground">Loading agent...</p>
                </div>
            </div>
        );
    }

    if (!agent) {
        return (
            <div className="container mx-auto py-12 text-center space-y-4">
                <XCircle className="h-12 w-12 text-destructive mx-auto" />
                <h2 className="text-xl font-semibold">Agent not found</h2>
                <p className="text-muted-foreground">No agent with type "{agentType}" exists in the database.</p>
                <Button onClick={() => navigate("/admin/ai-agents")} variant="outline" className="gap-2">
                    <ArrowLeft className="h-4 w-4" /> Back to Agents
                </Button>
            </div>
        );
    }

    const IconComponent = enrichment?.icon ?? Bot;

    return (
        <div className="container mx-auto py-8 space-y-8 max-w-5xl">
            {/* Back Button */}
            <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/admin/ai-agents")}
                className="gap-2 -ml-2"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to AI Agents
            </Button>

            {/* Hero Header */}
            <div className={`relative rounded-2xl bg-gradient-to-br ${enrichment?.gradient ?? "from-primary/10 to-primary/5"} border p-8 overflow-hidden`}>
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute top-4 right-8 text-9xl">{enrichment?.emoji}</div>
                </div>
                <div className="relative flex items-start justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className={`h-16 w-16 rounded-2xl bg-background/80 backdrop-blur-sm border flex items-center justify-center shadow-lg`}>
                            <IconComponent className={`h-8 w-8 ${enrichment?.accentColor ?? "text-primary"}`} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-2xl font-bold">{agent.label}</h1>
                                <span className="text-2xl">{enrichment?.emoji}</span>
                            </div>
                            <p className="text-muted-foreground text-sm font-mono">{agent.agent_type}</p>
                            <p className="text-muted-foreground mt-2 max-w-xl">
                                {enrichment?.purpose ?? agent.description ?? "No description available."}
                            </p>
                        </div>
                    </div>

                    {/* Status Toggle */}
                    <div className="flex flex-col items-center gap-2 shrink-0">
                        <Switch
                            checked={agent.is_active}
                            onCheckedChange={handleToggle}
                            disabled={toggleAgent.isPending}
                        />
                        <span className={`text-xs font-medium ${agent.is_active ? "text-green-500" : "text-muted-foreground"}`}>
                            {agent.is_active ? "Active" : "Inactive"}
                        </span>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="mt-6 flex flex-wrap gap-4">
                    <div className="flex items-center gap-2 bg-background/60 backdrop-blur-sm rounded-lg px-3 py-2 border">
                        <Cpu className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{agent.model_name}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-background/60 backdrop-blur-sm rounded-lg px-3 py-2 border">
                        <Zap className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Temp: {agent.temperature}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-background/60 backdrop-blur-sm rounded-lg px-3 py-2 border">
                        <Code className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{agent.max_tokens.toLocaleString()} tokens</span>
                    </div>
                    <div className="flex items-center gap-2 bg-background/60 backdrop-blur-sm rounded-lg px-3 py-2 border">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">v{agent.version}</span>
                    </div>
                    <Badge variant={agent.model_provider === "openai" ? "default" : "secondary"} className="px-3 py-1.5">
                        {agent.model_provider.toUpperCase()}
                    </Badge>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Capabilities */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                Capabilities
                            </CardTitle>
                            <CardDescription>What this agent can do</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {(enrichment?.capabilities ?? []).map((cap) => (
                                    <div key={cap} className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
                                        <div className={`h-2 w-2 rounded-full ${enrichment?.accentColor?.replace("text-", "bg-") ?? "bg-primary"}`} />
                                        <span className="text-sm">{cap}</span>
                                    </div>
                                ))}
                                {(enrichment?.capabilities ?? []).length === 0 && (
                                    <p className="text-muted-foreground text-sm col-span-2">No capabilities documented.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* System Prompt */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-primary" />
                                System Prompt
                            </CardTitle>
                            <CardDescription>The core instruction that defines this agent's behavior</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-muted/50 rounded-lg p-4 border font-mono text-sm leading-relaxed">
                                {agent.system_prompt ?? enrichment?.systemPrompt ?? "No system prompt configured."}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Intent Categories */}
                    {enrichment?.intentCategories && enrichment.intentCategories.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="h-5 w-5 text-orange-500" />
                                    Intent Categories
                                </CardTitle>
                                <CardDescription>The types of user intent this agent handles</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {enrichment.intentCategories.map(intent => (
                                        <Badge key={intent} variant="outline" className="font-mono text-xs px-3 py-1">
                                            {intent}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Model Configuration */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Settings className="h-4 w-4" />
                                Model Configuration
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Provider</p>
                                <p className="font-medium capitalize">{agent.model_provider}</p>
                            </div>
                            <Separator />
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Model</p>
                                <p className="font-medium">{agent.model_name}</p>
                            </div>
                            <Separator />
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Temperature</p>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary rounded-full transition-all"
                                            data-temp={agent.temperature}
                                            style={{ width: `${Math.min((agent.temperature / 2) * 100, 100)}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-medium">{agent.temperature}</span>
                                </div>
                            </div>
                            <Separator />
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Max Tokens</p>
                                <p className="font-medium">{agent.max_tokens.toLocaleString()}</p>
                            </div>
                            <Separator />
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Version</p>
                                <p className="font-medium">v{agent.version}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Role Access */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Shield className="h-4 w-4" />
                                Role-Based Access
                            </CardTitle>
                            <CardDescription>Permissions per user role</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {Object.entries(enrichment?.permissionSummary ?? {}).map(([role, perms]) => (
                                <div key={role} className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <Badge variant="outline" className={`capitalize text-xs ${ROLE_COLORS[role] ?? ""}`}>
                                            {role}
                                        </Badge>
                                    </div>
                                    {perms.length > 0 ? (
                                        <div className="flex flex-wrap gap-1 pl-1">
                                            {perms.map(p => (
                                                <span key={p} className="text-xs text-muted-foreground bg-muted/60 rounded px-2 py-0.5">
                                                    {p}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-xs text-muted-foreground pl-1">No access</span>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Timestamps */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Clock className="h-4 w-4" />
                                Timestamps
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Created</p>
                                <p>{new Date(agent.created_at).toLocaleDateString("en-US", { dateStyle: "medium" })}</p>
                            </div>
                            <Separator />
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Last Updated</p>
                                <p>{new Date(agent.updated_at).toLocaleDateString("en-US", { dateStyle: "medium" })}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-3 pt-2 pb-8">
                <Button
                    variant="default"
                    className="gap-2"
                    onClick={() => navigate(`/admin/ai-agents?edit=${agent.id}`)}
                >
                    <Edit className="h-4 w-4" />
                    Edit Configuration
                </Button>
                <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => navigate(`/admin/ai-agents?test=${agent.id}`)}
                >
                    <Play className="h-4 w-4" />
                    Test Agent
                </Button>
                <Button
                    variant="outline"
                    className={`gap-2 ${agent.is_active ? "text-destructive hover:bg-destructive/10" : "text-green-500 hover:bg-green-500/10"}`}
                    onClick={handleToggle}
                    disabled={toggleAgent.isPending}
                >
                    {agent.is_active ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
                    {agent.is_active ? "Disable Agent" : "Enable Agent"}
                </Button>
            </div>
        </div>
    );
}
