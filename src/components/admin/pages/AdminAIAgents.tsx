/**
 * Admin AI Agents Management Page
 * 
 * Allows admins to view, edit, and manage AI agents from the database
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Bot,
    Settings,
    Play,
    Plus,
    Search,
    Filter,
    Activity,
    Zap,
    Power,
    Edit,
    Trash2
} from "lucide-react";
import { useAIAgents, useAllAIAgents, useToggleAIAgent, useDeleteAIAgent } from "@/hooks/useAIAgents";
import { AIAgentEditor } from "@/components/admin/ai-agents/AIAgentEditor";
import { AIAgentTester } from "@/components/admin/ai-agents/AIAgentTester";
import { AgentAnalytics } from "@/components/admin/ai-agents/AgentAnalytics";
import { toast } from "sonner";

export default function AdminAIAgents() {
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
    const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"list" | "editor" | "tester" | "analytics">("list");


    // Fetch all agents (including inactive)
    const { data: agents, isLoading } = useAllAIAgents();
    const toggleAgent = useToggleAIAgent();
    const deleteAgent = useDeleteAIAgent();

    // Filter agents based on search and status
    const filteredAgents = agents?.filter(agent => {
        const matchesSearch = agent.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            agent.agent_type.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === "all" ||
            (filterStatus === "active" && agent.is_active) ||
            (filterStatus === "inactive" && !agent.is_active);
        return matchesSearch && matchesStatus;
    }) || [];

    const handleToggleAgent = async (agentId: string) => {
        try {
            await toggleAgent.mutateAsync(agentId);
            toast.success("Agent status updated");
        } catch (error) {
            toast.error("Failed to update agent status");
            console.error(error);
        }
    };

    const handleDeleteAgent = async (agentId: string, agentName: string) => {
        if (!confirm(`Are you sure you want to delete "${agentName}"? This action cannot be undone.`)) {
            return;
        }

        try {
            await deleteAgent.mutateAsync(agentId);
            toast.success(`Agent "${agentName}" deleted`);
        } catch (error) {
            toast.error("Failed to delete agent");
            console.error(error);
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

    const getModelBadgeColor = (provider: string) => {
        switch (provider) {
            case "openai": return "bg-green-500/10 text-green-500 border-green-500/20";
            case "anthropic": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
            case "google": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
            default: return "bg-gray-500/10 text-gray-500 border-gray-500/20";
        }
    };

    return (
        <div className="container mx-auto py-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Bot className="h-8 w-8" />
                        AI Agents Management
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Configure and manage AI agents from the database
                    </p>
                </div>
                <Button
                    onClick={() => {
                        setSelectedAgent(null);
                        setActiveTab("editor");
                    }}
                    className="gap-2"
                >
                    <Plus className="h-4 w-4" />
                    New Agent
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Agents</CardDescription>
                        <CardTitle className="text-2xl">{agents?.length || 0}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Active</CardDescription>
                        <CardTitle className="text-2xl text-green-600">
                            {agents?.filter(a => a.is_active).length || 0}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Inactive</CardDescription>
                        <CardTitle className="text-2xl text-gray-600">
                            {agents?.filter(a => !a.is_active).length || 0}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Providers</CardDescription>
                        <CardTitle className="text-2xl">
                            {[...new Set(agents?.map(a => a.model_provider))].length || 0}
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

                {/* Agent List View */}
                <TabsContent value="list" className="space-y-4">
                    {/* Search and Filters */}
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search agents by name or type..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <Button
                                variant={filterStatus === "all" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setFilterStatus("all")}
                            >
                                All
                            </Button>
                            <Button
                                variant={filterStatus === "active" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setFilterStatus("active")}
                            >
                                Active
                            </Button>
                            <Button
                                variant={filterStatus === "inactive" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setFilterStatus("inactive")}
                            >
                                Inactive
                            </Button>
                        </div>
                    </div>

                    {/* Agents Grid */}
                    {isLoading ? (
                        <div className="text-center py-12 text-muted-foreground">
                            Loading agents...
                        </div>
                    ) : filteredAgents.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center text-muted-foreground">
                                No agents found matching your criteria
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredAgents.map((agent) => (
                                <Card key={agent.id} className={!agent.is_active ? "opacity-60" : ""}>
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                <Bot className="h-5 w-5" style={{ color: agent.color.replace('text-', '') }} />
                                                <div>
                                                    <CardTitle className="text-lg">{agent.label}</CardTitle>
                                                    <CardDescription className="text-xs mt-1">
                                                        {agent.agent_type}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                            <Badge variant={agent.is_active ? "default" : "secondary"} className="gap-1">
                                                <Power className="h-3 w-3" />
                                                {agent.is_active ? "Active" : "Inactive"}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {/* Model Info */}
                                        <div className="flex items-center gap-2">
                                            <Badge className={getModelBadgeColor(agent.model_provider)}>
                                                {agent.model_provider}
                                            </Badge>
                                            <span className="text-sm text-muted-foreground">
                                                {agent.model_name}
                                            </span>
                                        </div>

                                        {/* Config */}
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Zap className="h-3 w-3" />
                                                Temp: {agent.temperature}
                                            </div>
                                            <div>
                                                Tokens: {agent.max_tokens}
                                            </div>
                                            <div>
                                                v{agent.version}
                                            </div>
                                        </div>

                                        {/* Description */}
                                        {agent.description && (
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {agent.description}
                                            </p>
                                        )}

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 pt-2 border-t">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleEditAgent(agent.id)}
                                                className="flex-1 gap-1"
                                            >
                                                <Edit className="h-3 w-3" />
                                                Edit
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleTestAgent(agent.id)}
                                                className="flex-1 gap-1"
                                            >
                                                <Play className="h-3 w-3" />
                                                Test
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleToggleAgent(agent.id)}
                                            >
                                                <Power className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleDeleteAgent(agent.id, agent.label)}
                                                className="text-destructive"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Editor View */}
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

                {/* Analytics View */}
                <TabsContent value="analytics">
                    <AgentAnalytics />
                </TabsContent>
            </Tabs>
        </div>
    );
}
