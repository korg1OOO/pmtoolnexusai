/**
 * AI Agent Editor Component
 * 
 * Edit AI agent configuration including system prompts, model settings, and parameters
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, X, Sparkles, Settings2, FileText } from "lucide-react";
import { useAIAgent, useCreateAIAgent, useUpdateAIAgent } from "@/hooks/useAIAgents";
import { toast } from "sonner";

interface AIAgentEditorProps {
    agentId: string | null;
    onSave: () => void;
    onCancel: () => void;
}

const MODEL_PROVIDERS = {
    openai: {
        label: "OpenAI",
        models: ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"],
    },
    anthropic: {
        label: "Anthropic",
        models: ["claude-3-opus", "claude-3-sonnet", "claude-3-haiku"],
    },
    google: {
        label: "Google",
        models: ["gemini-pro", "gemini-3-flash-preview"],
    },
};

const ICON_OPTIONS = ["Bot", "Brain", "Zap", "Target", "Shield", "Users", "FileText", "Calendar", "DollarSign"];
const COLOR_OPTIONS = [
    "text-blue-500",
    "text-green-500",
    "text-purple-500",
    "text-orange-500",
    "text-red-500",
    "text-pink-500",
    "text-cyan-500",
    "text-yellow-500",
];

export function AIAgentEditor({ agentId, onSave, onCancel }: AIAgentEditorProps) {
    const { data: existingAgent } = useAIAgent(agentId || "");
    const createAgent = useCreateAIAgent();
    const updateAgent = useUpdateAIAgent();

    const isEditing = !!agentId;

    // Form state
    const [formData, setFormData] = useState({
        agent_type: "",
        label: "",
        description: "",
        icon: "Bot",
        color: "text-blue-500",
        system_prompt: "",
        model_provider: "google" as keyof typeof MODEL_PROVIDERS,
        model_name: "gemini-3-flash-preview",
        max_tokens: 2000,
        temperature: 0.7,
        is_active: true,
    });

    // Load existing agent data
    useEffect(() => {
        if (existingAgent) {
            setFormData({
                agent_type: existingAgent.agent_type,
                label: existingAgent.label,
                description: existingAgent.description || "",
                icon: existingAgent.icon,
                color: existingAgent.color,
                system_prompt: existingAgent.system_prompt || "",
                model_provider: existingAgent.model_provider as keyof typeof MODEL_PROVIDERS,
                model_name: existingAgent.model_name,
                max_tokens: existingAgent.max_tokens,
                temperature: existingAgent.temperature,
                is_active: existingAgent.is_active,
            });
        }
    }, [existingAgent]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (isEditing && agentId) {
                await updateAgent.mutateAsync({
                    id: agentId,
                    updates: formData,
                });
                toast.success("Agent updated successfully");
            } else {
                await createAgent.mutateAsync(formData);
                toast.success("Agent created successfully");
            }
            onSave();
        } catch (error) {
            toast.error(isEditing ? "Failed to update agent" : "Failed to create agent");
            console.error(error);
        }
    };

    const availableModels = MODEL_PROVIDERS[formData.model_provider].models;

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5" />
                                {isEditing ? `Edit Agent: ${formData.label}` : "Create New AI Agent"}
                            </CardTitle>
                            <CardDescription className="mt-1">
                                Configure the agent's behavior, model, and parameters
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button type="button" variant="outline" onClick={onCancel}>
                                <X className="h-4 w-4 mr-1" />
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createAgent.isPending || updateAgent.isPending}>
                                <Save className="h-4 w-4 mr-1" />
                                {isEditing ? "Update" : "Create"} Agent
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="basic" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="basic">Basic Info</TabsTrigger>
                            <TabsTrigger value="model">Model Config</TabsTrigger>
                            <TabsTrigger value="prompt">System Prompt</TabsTrigger>
                        </TabsList>

                        {/* Basic Info Tab */}
                        <TabsContent value="basic" className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="agent_type">Agent Type *</Label>
                                    <Input
                                        id="agent_type"
                                        value={formData.agent_type}
                                        onChange={(e) => setFormData({ ...formData, agent_type: e.target.value })}
                                        placeholder="e.g., scheduler, finance, risk"
                                        required
                                        disabled={isEditing}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Unique identifier (lowercase, no spaces)
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="label">Display Label *</Label>
                                    <Input
                                        id="label"
                                        value={formData.label}
                                        onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                                        placeholder="e.g., Scheduler Agent"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Brief description of what this agent does..."
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="icon">Icon</Label>
                                    <Select
                                        value={formData.icon}
                                        onValueChange={(value) => setFormData({ ...formData, icon: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ICON_OPTIONS.map((icon) => (
                                                <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="color">Color</Label>
                                    <Select
                                        value={formData.color}
                                        onValueChange={(value) => setFormData({ ...formData, color: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {COLOR_OPTIONS.map((color) => (
                                                <SelectItem key={color} value={color}>
                                                    <span className={color}>{color.replace('text-', '')}</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <Label>Active Status</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Enable or disable this agent
                                    </p>
                                </div>
                                <Switch
                                    checked={formData.is_active}
                                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                />
                            </div>
                        </TabsContent>

                        {/* Model Config Tab */}
                        <TabsContent value="model" className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="model_provider">Model Provider *</Label>
                                    <Select
                                        value={formData.model_provider}
                                        onValueChange={(value: keyof typeof MODEL_PROVIDERS) => {
                                            const newProvider = MODEL_PROVIDERS[value];
                                            setFormData({
                                                ...formData,
                                                model_provider: value,
                                                model_name: newProvider.models[0],
                                            });
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(MODEL_PROVIDERS).map(([key, { label }]) => (
                                                <SelectItem key={key} value={key}>{label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="model_name">Model Name *</Label>
                                    <Select
                                        value={formData.model_name}
                                        onValueChange={(value) => setFormData({ ...formData, model_name: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableModels.map((model) => (
                                                <SelectItem key={model} value={model}>{model}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="temperature">Temperature: {formData.temperature.toFixed(2)}</Label>
                                    <span className="text-sm text-muted-foreground">
                                        {formData.temperature < 0.3 ? "Focused" : formData.temperature < 0.7 ? "Balanced" : "Creative"}
                                    </span>
                                </div>
                                <Slider
                                    value={[formData.temperature]}
                                    onValueChange={([value]) => setFormData({ ...formData, temperature: value })}
                                    min={0}
                                    max={1}
                                    step={0.1}
                                    className="my-4"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Lower = more deterministic, Higher = more creative
                                </p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="max_tokens">Max Tokens: {formData.max_tokens}</Label>
                                    <span className="text-sm text-muted-foreground">
                                        ~{Math.round(formData.max_tokens * 0.75)} words
                                    </span>
                                </div>
                                <Slider
                                    value={[formData.max_tokens]}
                                    onValueChange={([value]) => setFormData({ ...formData, max_tokens: value })}
                                    min={500}
                                    max={4000}
                                    step={100}
                                    className="my-4"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Maximum length of agent responses
                                </p>
                            </div>
                        </TabsContent>

                        {/* System Prompt Tab */}
                        <TabsContent value="prompt" className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="system_prompt">System Prompt</Label>
                                    <span className="text-sm text-muted-foreground">
                                        {formData.system_prompt.length} characters
                                    </span>
                                </div>
                                <Textarea
                                    id="system_prompt"
                                    value={formData.system_prompt}
                                    onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                                    placeholder="You are an AI agent specialized in..."
                                    rows={15}
                                    className="font-mono text-sm"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Define the agent's personality, capabilities, and behavior. Leave empty for default prompt.
                                </p>
                            </div>

                            <Card className="bg-muted/50">
                                <CardHeader>
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        Prompt Best Practices
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm space-y-2">
                                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                        <li>Start with "You are [AgentName], an expert in..."</li>
                                        <li>List specific capabilities and what the agent can do</li>
                                        <li>Include constraints and what the agent should NOT do</li>
                                        <li>Reference the project context available to the agent</li>
                                        <li>Specify output format preferences (concise, detailed, structured, etc.)</li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </form>
    );
}
