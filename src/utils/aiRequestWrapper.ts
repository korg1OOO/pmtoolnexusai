import { aiCreditsService } from '@/services/aiCreditsService';
import { v4 as uuidv4 } from 'uuid';

// =====================================================
// AI REQUEST WRAPPER
// =====================================================

export interface AIRequestParams {
    featureType: string;
    prompt: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
}

export interface AIResponse<T = string> {
    content: T;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
        creditsUsed: number;
    };
}

/**
 * Wrapper for AI API requests with automatic credit deduction
 * 
 * @example
 * const result = await makeAIRequest({
 *   featureType: 'meeting_summary',
 *   prompt: 'Summarize this meeting...',
 *   model: 'gpt-4'
 * });
 */
export async function makeAIRequest<T = string>(
    params: AIRequestParams
): Promise<AIResponse<T>> {
    const requestId = uuidv4();
    const model = params.model || 'gpt-4';

    // Estimate credits needed (rough estimate: 1 credit per 1000 tokens)
    const estimatedCredits = Math.ceil((params.prompt.length / 4) / 1000) + 2;

    // Check if user has sufficient credits
    const hasCredits = await aiCreditsService.hasCredits(estimatedCredits);

    if (!hasCredits) {
        throw new Error(
            'Insufficient AI credits. Please purchase more credits to continue using AI features.'
        );
    }

    try {
        // Make AI API request via secure Edge Function proxy
        const response = await callAIAPI({
            model,
            prompt: params.prompt,
            maxTokens: params.maxTokens,
            temperature: params.temperature
        });

        // Extract token usage
        const usage = {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
            creditsUsed: Math.ceil(response.usage.total_tokens / 1000)
        };

        // Deduct credits
        await aiCreditsService.deductCredits({
            featureType: params.featureType,
            requestId,
            modelName: model,
            promptTokens: usage.promptTokens,
            completionTokens: usage.completionTokens
        });

        return {
            content: response.content as T,
            usage
        };

    } catch (error: any) {
        // Log failed request (no credits deducted)
        console.error('AI request failed:', error);

        // Re-throw with user-friendly message
        if (error.message.includes('Insufficient credits')) {
            throw error;
        }

        throw new Error(`AI request failed: ${error.message}`);
    }
}

/**
 * Calls the ai-proxy Supabase Edge Function, which forwards the request
 * to the Lovable AI gateway using a server-side API key.
 */
async function callAIAPI(params: {
    model: string;
    prompt: string;
    maxTokens?: number;
    temperature?: number;
}): Promise<{
    content: string;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}> {
    // Dynamic import to avoid bundling supabase client at the module level
    const { supabase } = await import('@/integrations/supabase/client');

    const { data, error } = await (supabase as any).functions.invoke('ai-proxy', {
        body: {
            model: params.model,
            prompt: params.prompt,
            maxTokens: params.maxTokens,
            temperature: params.temperature,
        },
    });

    if (error) {
        throw new Error(error.message ?? 'AI proxy invocation failed');
    }

    if (data?.error) {
        throw new Error(data.error);
    }

    return {
        content: data.content ?? '',
        usage: {
            prompt_tokens: data.usage?.prompt_tokens ?? 0,
            completion_tokens: data.usage?.completion_tokens ?? 0,
            total_tokens: data.usage?.total_tokens ?? 0,
        },
    };
}


// =====================================================
// FEATURE-SPECIFIC HELPERS
// =====================================================

/**
 * Generate meeting summary using AI
 */
export async function generateMeetingSummary(
    transcript: string
): Promise<string> {
    const response = await makeAIRequest({
        featureType: 'meeting_summary',
        prompt: `Summarize the following meeting transcript:\n\n${transcript}`,
        model: 'gpt-4',
        maxTokens: 500
    });

    return response.content;
}

/**
 * Generate action items from meeting
 */
export async function generateActionItems(
    transcript: string
): Promise<string[]> {
    const response = await makeAIRequest<string>({
        featureType: 'action_items',
        prompt: `Extract action items from this meeting transcript. Return as a JSON array of strings:\n\n${transcript}`,
        model: 'gpt-4',
        maxTokens: 300
    });

    try {
        return JSON.parse(response.content);
    } catch {
        // Fallback: split by newlines
        return response.content.split('\n').filter(line => line.trim());
    }
}

/**
 * Analyze document using AI
 */
export async function analyzeDocument(
    content: string,
    analysisType: 'summary' | 'key_points' | 'sentiment'
): Promise<string> {
    const prompts = {
        summary: `Provide a concise summary of this document:\n\n${content}`,
        key_points: `Extract the key points from this document:\n\n${content}`,
        sentiment: `Analyze the sentiment of this document:\n\n${content}`
    };

    const response = await makeAIRequest({
        featureType: 'document_analysis',
        prompt: prompts[analysisType],
        model: 'gpt-4',
        maxTokens: 400
    });

    return response.content;
}

/**
 * Generate task suggestions using AI
 */
export async function generateTaskSuggestions(
    projectContext: string
): Promise<string[]> {
    const response = await makeAIRequest<string>({
        featureType: 'task_generation',
        prompt: `Based on this project context, suggest 5-10 tasks. Return as a JSON array:\n\n${projectContext}`,
        model: 'gpt-3.5-turbo',
        maxTokens: 300
    });

    try {
        return JSON.parse(response.content);
    } catch {
        return response.content.split('\n').filter(line => line.trim());
    }
}

/**
 * Smart search using AI
 */
export async function aiSearch(
    query: string,
    context: string
): Promise<string> {
    const response = await makeAIRequest({
        featureType: 'ai_search',
        prompt: `Answer this query based on the context:\n\nQuery: ${query}\n\nContext: ${context}`,
        model: 'gpt-3.5-turbo',
        maxTokens: 200
    });

    return response.content;
}
