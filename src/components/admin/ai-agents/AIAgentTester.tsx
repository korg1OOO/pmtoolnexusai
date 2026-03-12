/**
 * AI Agent Tester Component
 * 
 * Test AI agents with sample queries and see responses in real-time
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Play, X, Clock, Zap, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useAIAgent, useLogAIInteraction, useUpdateInteractionFeedback } from "@/hooks/useAIAgents";
import { AIFeedback } from "@/components/ai/AIFeedback";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AIAgentTesterProps {
    agentId: string | null;
    onClose: () => void;
}

interface TestResult {
    query: string;
    response: string;
    executionTime: number;
    timestamp: Date;
    success: boolean;
    error?: string;
    logId?: string;
}

export function AIAgentTester({ agentId, onClose }: AIAgentTesterProps) {
    const { data: agent } = useAIAgent(agentId || "");
    const [query, setQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [testResults, setTestResults] = useState<TestResult[]>([]);

    const logInteraction = useLogAIInteraction();
    const updateFeedback = useUpdateInteractionFeedback();

    const getContextualQueries = (agentType: string | undefined): string[] => {
        switch (agentType) {
            case 'project_manager':
                return [
                    'What tasks are overdue and who owns them?',
                    'Which milestones are at risk this sprint?',
                    'Summarise project health for stakeholders',
                    'Who is blocked and needs unblocking?',
                    'Generate a sprint retrospective summary',
                ];
            case 'financial_advisor':
                return [
                    'What is our current budget burn rate?',
                    'Which cost centres are over budget this quarter?',
                    'Show me the MRR trend for the last 6 months',
                    'Forecast cash position for the next 90 days',
                    'Identify top 5 revenue risk items',
                ];
            case 'risk_analyzer':
                return [
                    'List all high-severity open risks',
                    'Which risks have escalated since last week?',
                    'What is the overall risk score for this project?',
                    'Identify risks with no mitigation plans',
                    'Generate a risk summary for the board report',
                ];
            case 'hr_assistant':
                return [
                    'Who is over-allocated on the team this week?',
                    'Show upcoming leave clashes with key deadlines',
                    'Which roles are currently understaffed?',
                    'Summarise recent team performance metrics',
                    'What is the average team utilisation rate?',
                ];
            case 'procurement_agent':
                return [
                    'Which purchase orders are pending approval?',
                    'Show me contracts expiring in the next 60 days',
                    'Identify suppliers with late deliveries',
                    'What is our top spending category this month?',
                    'Generate a procurement status report',
                ];
            case 'customer_support':
                return [
                    'How many open support tickets are critical?',
                    'What is the average resolution time this week?',
                    'Which issues are most frequently reported?',
                    'List tickets that have breached SLA',
                    'Summarise customer satisfaction scores',
                ];
            default:
                return [
                    'What is the current status of this work?',
                    'What are the key risks and blockers?',
                    'Show me the latest performance metrics',
                    'What tasks are due this week?',
                    'Generate a concise executive summary',
                ];
        }
    };

    const sampleQueries = getContextualQueries(agent?.agent_type);

    const handleTest = async (testQuery: string) => {
        if (!agent || !testQuery.trim()) return;

        setIsLoading(true);
        const startTime = Date.now();

        try {
            // Call the ai-orchestrator Edge Function
            const { data: authData } = await supabase.auth.getSession();

            const response = await fetch(`${(supabase as any)['supabaseUrl'] || import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-orchestrator`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authData.session?.access_token || ""}`,
                },
                body: JSON.stringify({
                    message: testQuery,
                    projectId: "test-project",
                    conversationId: null,
                    conversationHistory: [],
                }),
            });

            const data = await response.json();
            const executionTime = Date.now() - startTime;

            if (response.ok) {
                // Log successful interaction
                let logId: string | undefined;
                try {
                    logId = await logInteraction.mutateAsync({
                        agentId: agent.id,
                        query: testQuery,
                        responseTimeMs: executionTime,
                        tokens: Math.ceil(testQuery.length / 4) + Math.ceil((data.response?.length || 0) / 4), // Estimate tokens
                        provider: agent.model_provider,
                        model: agent.model_name
                    });
                } catch (err) {
                    console.error("Failed to log interaction", err);
                }

                setTestResults((prev) => [
                    {
                        query: testQuery,
                        response: data.response || "No response",
                        executionTime,
                        timestamp: new Date(),
                        success: true,
                        logId
                    },
                    ...prev,
                ]);
            } else {
                setTestResults((prev) => [
                    {
                        query: testQuery,
                        response: "",
                        executionTime,
                        timestamp: new Date(),
                        success: false,
                        error: data.error || "Unknown error",
                    },
                    ...prev,
                ]);
            }

            setQuery("");
        } catch (error) {
            const executionTime = Date.now() - startTime;
            setTestResults((prev) => [
                {
                    query: testQuery,
                    response: "",
                    executionTime,
                    timestamp: new Date(),
                    success: false,
                    error: error instanceof Error ? error.message : "Network error",
                },
                ...prev,
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFeedback = (logId: string, score: number, text?: string) => {
        updateFeedback.mutate({ logId, score, text }, {
            onSuccess: () => toast.success("Feedback submitted")
        });
    };

    if (!agent) {
        return (
            <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                    No agent selected. Please select an agent to test.
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Play className="h-5 w-5" />
                                Test Agent: {agent.label}
                            </CardTitle>
                            <CardDescription className="mt-1">
                                Try sample queries or write your own to test the agent's responses
                            </CardDescription>
                        </div>
                        <Button variant="outline" onClick={onClose}>
                            <X className="h-4 w-4 mr-1" />
                            Close
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Agent Info */}
                    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                        <div className="flex-1">
                            <div className="text-sm font-medium">Model Configuration</div>
                            <div className="text-xs text-muted-foreground mt-1">
                                {agent.model_provider} / {agent.model_name} • Temp: {agent.temperature} • Max Tokens: {agent.max_tokens}
                            </div>
                        </div>
                        <Badge variant={agent.is_active ? "default" : "secondary"}>
                            {agent.is_active ? "Active" : "Inactive"}
                        </Badge>
                    </div>

                    {/* Query Input */}
                    <div className="space-y-2">
                        <Textarea
                            placeholder="Enter your test query here..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            rows={3}
                            disabled={isLoading}
                        />
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() => handleTest(query)}
                                disabled={isLoading || !query.trim()}
                                className="gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Testing...
                                    </>
                                ) : (
                                    <>
                                        <Play className="h-4 w-4" />
                                        Test Query
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setTestResults([])}
                                disabled={testResults.length === 0}
                            >
                                Clear Results
                            </Button>
                        </div>
                    </div>

                    {/* Sample Queries */}
                    <div className="space-y-2">
                        <div className="text-sm font-medium">Sample Queries:</div>
                        <div className="flex flex-wrap gap-2">
                            {sampleQueries.map((sample, index) => (
                                <Button
                                    key={index}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleTest(sample)}
                                    disabled={isLoading}
                                >
                                    {sample}
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Test Results */}
            {testResults.length > 0 && (
                <div className="space-y-3">
                    <div className="text-sm font-medium">Test Results ({testResults.length})</div>
                    {testResults.map((result, index) => (
                        <Card key={index} className={!result.success ? "border-destructive" : ""}>
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            {result.success ? (
                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <AlertCircle className="h-4 w-4 text-destructive" />
                                            )}
                                            <span className="text-sm font-medium">
                                                {result.query}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {result.executionTime}ms
                                            </div>
                                            <div>
                                                {result.timestamp.toLocaleTimeString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {result.success ? (
                                    <div className="space-y-3">
                                        <div className="prose prose-sm max-w-none">
                                            <div className="whitespace-pre-wrap text-sm">{result.response}</div>
                                        </div>
                                        {(result as any).logId && (
                                            <div className="pt-2 border-t flex justify-end">
                                                <AIFeedback
                                                    onFeedback={(score, text) => handleFeedback((result as any).logId, score, text)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-sm text-destructive">
                                        <strong>Error:</strong> {result.error}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {testResults.length === 0 && !isLoading && (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No test results yet</p>
                        <p className="text-sm mt-1">Try a sample query or write your own to test the agent</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
