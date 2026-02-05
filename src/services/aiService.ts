import { supabase } from "@/integrations/supabase/client";

export interface AIResponse<T> {
    data: T | null;
    error: string | null;
}

export interface ProjectSignal {
    type: 'action' | 'issue' | 'risk' | 'decision';
    content: string;
    relevance: number;
    confidence: number;
    extractedFrom: string;
}

export interface RiskDiscovery {
    id: string;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    mitigation?: string;
}

export interface RiskAnalysisResult {
    discoveredRisks: RiskDiscovery[];
    summary: string;
    analyzedAt: string;
}

export interface ExecutiveStatusReport {
    summary: string;
    kpis: {
        label: string;
        value: string | number;
        trend: 'up' | 'down' | 'stable';
        status: 'on-track' | 'at-risk' | 'critical';
    }[];
    highlights: string[];
    blockers: string[];
    nextSteps: string[];
}

export interface ScenarioImpact {
    scenarioId: string;
    originalValue: number;
    projectedValue: number;
    variance: number;
    impactLevel: 'low' | 'medium' | 'high';
    justification: string;
}

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: string;
}

export interface AIChatResponse {
    reply: string;
    suggestions?: string[];
    context?: Record<string, unknown>;
}

export interface ScenarioAdjustment {
    field: string;
    value: unknown; // Dynamic value depending on field
}

export const aiService = {
    /**
     * Analyzes communication content (emails, chats) for project signals.
     */
    async processCommunication(projectId: string, content: string): Promise<AIResponse<ProjectSignal[]>> {
        try {
            const { data, error } = await supabase.functions.invoke('process-communication', {
                body: { projectId, content },
            });

            if (error) throw error;
            return { data: data as ProjectSignal[], error: null };
        } catch (err: unknown) {
            const error = err as Error;
            console.error('Error in processCommunication:', error);
            return { data: null, error: error.message };
        }
    },

    /**
     * Analyzes project context for risks and generates hidden insights.
     */
    async analyzeRisks(projectId: string): Promise<AIResponse<RiskAnalysisResult>> {
        try {
            const { data, error } = await supabase.functions.invoke('analyze-risks', {
                body: { projectId },
            });

            if (error) throw error;

            // Persist valid result to database
            if (data && (data as RiskAnalysisResult).discoveredRisks) {
                // Remove existing risk discovery insights for this project to avoid duplicates
                await (supabase as any).from('strategic_insights').delete().eq('project_id', projectId).eq('type', 'risk-discovery');

                // Insert new insight
                const { error: insertError } = await (supabase as any).from('strategic_insights').insert({
                    project_id: projectId,
                    type: 'risk-discovery',
                    data: data
                });

                if (insertError) {
                    console.error('Failed to persist risk analysis:', insertError);
                }
            }

            return { data: data as RiskAnalysisResult, error: null };
        } catch (err: unknown) {
            const error = err as Error;
            console.error('Error in analyzeRisks:', error);
            return { data: null, error: error.message };
        }
    },

    /**
     * Generates executive status reports based on latest project data.
     */
    async generateExecutiveStatus(projectId: string, audience: string): Promise<AIResponse<ExecutiveStatusReport>> {
        try {
            const { data, error } = await supabase.functions.invoke('generate-status', {
                body: { projectId, audience },
            });

            if (error) throw error;
            return { data: data as ExecutiveStatusReport, error: null };
        } catch (err: unknown) {
            const error = err as Error;
            console.error('Error in generateExecutiveStatus:', error);
            return { data: null, error: error.message };
        }
    },

    /**
     * Simulates project impact for a set of adjustments (What-If scenario).
     */
    async simulateScenarios(projectId: string, adjustments: ScenarioAdjustment[]): Promise<AIResponse<ScenarioImpact[]>> {
        try {
            const { data, error } = await supabase.functions.invoke('simulate-scenarios', {
                body: { projectId, adjustments },
            });

            if (error) throw error;
            return { data: data as ScenarioImpact[], error: null };
        } catch (err: unknown) {
            const error = err as Error;
            console.error('Error in simulateScenarios:', error);
            return { data: null, error: error.message };
        }
    },

    /**
     * AI Orchestrator Chat
     */
    async chat(projectId: string, message: string, conversationHistory: ChatMessage[] = []): Promise<AIResponse<AIChatResponse>> {
        try {
            const { data, error } = await supabase.functions.invoke('ai-orchestrator', {
                body: { projectId, message, conversationHistory },
            });
            if (error) {
                return { data: null, error: (error as Error).message || 'Unknown error' };
            }
            return { data: data as AIChatResponse, error: null };
        } catch (err: unknown) {
            const error = err as Error;
            return { data: null, error: error.message };
        }
    },
};
