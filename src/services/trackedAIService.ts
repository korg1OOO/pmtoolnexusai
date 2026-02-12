/**
 * Enhanced AI Service with Cost Tracking
 * Wraps existing aiService with automatic usage logging
 */

import { aiService, ChatMessage, AIResponse, AIChatResponse } from './aiService';
import { supabase } from '@/integrations/supabase/client';

// =============================================
// TRACKED AI SERVICE
// =============================================

export class TrackedAIService {
    /**
     * Log AI usage to database
     */
    private static async logUsage(params: {
        operation: string;
        promptTokens: number;
        completionTokens: number;
        durationMs: number;
        success: boolean;
        model?: string;
        error?: string;
    }) {
        try {
            // Estimate tokens if not provided (rough approximation)
            const estimatedPrompt = params.promptTokens || 100;
            const estimatedCompletion = params.completionTokens || 200;

            await supabase.rpc('log_ai_usage', {
                p_user_id: (await supabase.auth.getUser()).data.user?.id,
                p_provider: 'google', // Default to built-in provider
                p_model: params.model || 'gemini-3-flash-preview',
                p_operation: params.operation,
                p_prompt_tokens: estimatedPrompt,
                p_completion_tokens: estimatedCompletion,
                p_duration_ms: params.durationMs,
                p_success: params.success,
                p_error_message: params.error,
            });
        } catch (error) {
            console.error('Failed to log AI usage:', error);
        }
    }

    /**
     * Process communication with tracking
     */
    static async processCommunication(projectId: string, content: string) {
        const start = Date.now();
        const estimatedTokens = Math.ceil(content.length / 4);

        try {
            const result = await aiService.processCommunication(projectId, content);

            await this.logUsage({
                operation: 'process_communication',
                promptTokens: estimatedTokens,
                completionTokens: 300, // Estimated
                durationMs: Date.now() - start,
                success: !result.error,
                error: result.error || undefined,
            });

            return result;
        } catch (error: any) {
            await this.logUsage({
                operation: 'process_communication',
                promptTokens: estimatedTokens,
                completionTokens: 0,
                durationMs: Date.now() - start,
                success: false,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Analyze risks with tracking
     */
    static async analyzeRisks(projectId: string) {
        const start = Date.now();

        try {
            const result = await aiService.analyzeRisks(projectId);

            await this.logUsage({
                operation: 'analyze_risks',
                promptTokens: 500, // Estimated
                completionTokens: 1000, // Estimated
                durationMs: Date.now() - start,
                success: !result.error,
                error: result.error || undefined,
            });

            return result;
        } catch (error: any) {
            await this.logUsage({
                operation: 'analyze_risks',
                promptTokens: 500,
                completionTokens: 0,
                durationMs: Date.now() - start,
                success: false,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Generate executive status with tracking
     */
    static async generateExecutiveStatus(projectId: string, audience: string) {
        const start = Date.now();

        try {
            const result = await aiService.generateExecutiveStatus(projectId, audience);

            await this.logUsage({
                operation: 'generate_executive_status',
                promptTokens: 600, // Estimated
                completionTokens: 800, // Estimated
                durationMs: Date.now() - start,
                success: !result.error,
                error: result.error || undefined,
            });

            return result;
        } catch (error: any) {
            await this.logUsage({
                operation: 'generate_executive_status',
                promptTokens: 600,
                completionTokens: 0,
                durationMs: Date.now() - start,
                success: false,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Simulate scenarios with tracking
     */
    static async simulateScenarios(projectId: string, adjustments: any[]) {
        const start = Date.now();
        const estimatedTokens = 400 + (adjustments.length * 50);

        try {
            const result = await aiService.simulateScenarios(projectId, adjustments);

            await this.logUsage({
                operation: 'simulate_scenarios',
                promptTokens: estimatedTokens,
                completionTokens: 600, // Estimated
                durationMs: Date.now() - start,
                success: !result.error,
                error: result.error || undefined,
            });

            return result;
        } catch (error: any) {
            await this.logUsage({
                operation: 'simulate_scenarios',
                promptTokens: estimatedTokens,
                completionTokens: 0,
                durationMs: Date.now() - start,
                success: false,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Chat with tracking
     */
    static async chat(projectId: string, message: string, conversationHistory: ChatMessage[] = []) {
        const start = Date.now();
        const historyTokens = conversationHistory.reduce((sum, msg) =>
            sum + Math.ceil(msg.content.length / 4), 0
        );
        const messageTokens = Math.ceil(message.length / 4);

        try {
            const result = await aiService.chat(projectId, message, conversationHistory);
            const completionTokens = result.data ? Math.ceil((result.data.reply?.length || 0) / 4) : 0;

            await this.logUsage({
                operation: 'ai_chat',
                promptTokens: historyTokens + messageTokens,
                completionTokens,
                durationMs: Date.now() - start,
                success: !result.error,
                error: result.error || undefined,
            });

            return result;
        } catch (error: any) {
            await this.logUsage({
                operation: 'ai_chat',
                promptTokens: historyTokens + messageTokens,
                completionTokens: 0,
                durationMs: Date.now() - start,
                success: false,
                error: error.message,
            });
            throw error;
        }
    }
}

// Re-export original for backwards compatibility
export { aiService };
