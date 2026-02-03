import { supabase } from "@/integrations/supabase/client";

export interface AIResponse<T> {
    data: T | null;
    error: string | null;
}

export const aiService = {
    /**
     * Analyzes communication content (emails, chats) for project signals.
     */
    async processCommunication(projectId: string, content: string): Promise<AIResponse<any>> {
        try {
            const { data, error } = await supabase.functions.invoke('process-communication', {
                body: { projectId, content },
            });

            if (error) throw error;
            return { data, error: null };
        } catch (err: any) {
            console.error('Error in processCommunication:', err);
            return { data: null, error: err.message };
        }
    },

    /**
     * Analyzes project context for risks and generates hidden insights.
     */
    async analyzeRisks(projectId: string): Promise<AIResponse<any>> {
        try {
            const { data, error } = await supabase.functions.invoke('analyze-risks', {
                body: { projectId },
            });

            if (error) throw error;
            return { data, error: null };
        } catch (err: any) {
            console.error('Error in analyzeRisks:', err);
            return { data: null, error: err.message };
        }
    },

    /**
     * Generates executive status reports based on latest project data.
     */
    async generateExecutiveStatus(projectId: string, audience: string): Promise<AIResponse<any>> {
        try {
            const { data, error } = await supabase.functions.invoke('generate-status', {
                body: { projectId, audience },
            });

            if (error) throw error;
            return { data, error: null };
        } catch (err: any) {
            console.error('Error in generateExecutiveStatus:', err);
            return { data: null, error: err.message };
        }
    },

    /**
     * Simulates project impact for a set of adjustments (What-If scenario).
     */
    async simulateScenarios(projectId: string, adjustments: any[]): Promise<AIResponse<any>> {
        try {
            const { data, error } = await supabase.functions.invoke('simulate-scenarios', {
                body: { projectId, adjustments },
            });

            if (error) throw error;
            return { data, error: null };
        } catch (err: any) {
            console.error('Error in simulateScenarios:', err);
            return { data: null, error: err.message };
        }
    },

    async chat(projectId: string, message: string, conversationHistory: any[] = []): Promise<AIResponse<any>> {
        try {
            const { data, error } = await supabase.functions.invoke('ai-orchestrator', {
                body: { projectId, message, conversationHistory },
            });
            if (error) return { data: null, error: error.message };
            return { data, error: null };
        } catch (err: any) {
            return { data: null, error: err.message };
        }
    },
};
