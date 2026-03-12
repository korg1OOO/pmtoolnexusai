/**
 * AI Agent Capabilities Component
 * 
 * Manage capabilities for AI agents including required roles
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Shield } from "lucide-react";
import {
    useAgentCapabilities,
    useAddAgentCapability,
    useRemoveAgentCapability
} from "@/hooks/useAIAgents";
import { toast } from "sonner";

interface AIAgentCapabilitiesProps {
    agentId: string;
}

const AVAILABLE_ROLES = ["admin", "pm", "lead", "developer", "analyst", "viewer"];

export function AIAgentCapabilities({ agentId }: AIAgentCapabilitiesProps) {
    const { data: capabilities, isLoading } = useAgentCapabilities(agentId);
    const addCapability = useAddAgentCapability();
    const removeCapability = useRemoveAgentCapability();

    const [isAdding, setIsAdding] = useState(false);
    const [newCapability, setNewCapability] = useState({
        key: "",
        description: "",
        roles: [] as string[],
    });

    const handleAddCapability = async () => {
        if (!newCapability.key || newCapability.roles.length === 0) {
            toast.error("Please provide a capability key and at least one role");
            return;
        }

        try {
            await addCapability.mutateAsync({
                agentId,
                capabilityKey: newCapability.key,
                description: newCapability.description,
                requiresRole: newCapability.roles,
            });

            toast.success("Capability added");
            setNewCapability({ key: "", description: "", roles: [] });
            setIsAdding(false);
        } catch (error) {
            toast.error("Failed to add capability");
            console.error(error);
        }
    };

    const handleRemoveCapability = async (capabilityId: string, capabilityKey: string) => {
        if (!confirm(`Remove capability "${capabilityKey}"?`)) return;

        try {
            await removeCapability.mutateAsync(capabilityId);
            toast.success("Capability removed");
        } catch (error) {
            toast.error("Failed to remove capability");
            console.error(error);
        }
    };

    const toggleRole = (role: string) => {
        setNewCapability(prev => ({
            ...prev,
            roles: prev.roles.includes(role)
                ? prev.roles.filter(r => r !== role)
                : [...prev.roles, role]
        }));
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Agent Capabilities
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Manage what this agent can do and which roles can use each capability
                        </CardDescription>
                    </div>
                    <Button onClick={() => setIsAdding(!isAdding)} variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Capability
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Add New Capability Form */}
                {isAdding && (
                    <Card className="bg-muted/50">
                        <CardContent className="pt-6 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="capability-key">Capability Key *</Label>
                                <Input
                                    id="capability-key"
                                    placeholder="e.g., schedule_edit, budget_view"
                                    value={newCapability.key}
                                    onChange={(e) => setNewCapability({ ...newCapability, key: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="capability-desc">Description</Label>
                                <Input
                                    id="capability-desc"
                                    placeholder="Brief description of this capability"
                                    value={newCapability.description}
                                    onChange={(e) => setNewCapability({ ...newCapability, description: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Required Roles *</Label>
                                <div className="flex flex-wrap gap-2">
                                    {AVAILABLE_ROLES.map(role => (
                                        <Badge
                                            key={role}
                                            variant={newCapability.roles.includes(role) ? "default" : "outline"}
                                            className="cursor-pointer"
                                            onClick={() => toggleRole(role)}
                                        >
                                            {role}
                                        </Badge>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Select which roles can use this capability
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <Button onClick={handleAddCapability} disabled={addCapability.isPending}>
                                    Add Capability
                                </Button>
                                <Button variant="outline" onClick={() => setIsAdding(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Capabilities List */}
                {isLoading ? (
                    <div className="text-center py-8 text-muted-foreground">
                        Loading capabilities...
                    </div>
                ) : !capabilities || capabilities.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        No capabilities configured for this agent
                    </div>
                ) : (
                    <div className="space-y-3">
                        {capabilities.map((capability) => (
                            <div
                                key={capability.id}
                                className="flex items-start justify-between p-4 border rounded-lg"
                            >
                                <div className="flex-1">
                                    <div className="font-medium">{capability.capability_key}</div>
                                    {capability.description && (
                                        <div className="text-sm text-muted-foreground mt-1">
                                            {capability.description}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xs text-muted-foreground">Roles:</span>
                                        {capability.requires_role.map((role) => (
                                            <Badge key={role} variant="secondary" className="text-xs">
                                                {role}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveCapability(capability.id, capability.capability_key)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
