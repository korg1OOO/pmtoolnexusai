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
        // Make AI API request
        // NOTE: Replace this with your actual AI API integration (OpenAI, Anthropic, etc.)
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
 * Mock AI API call (replace with actual implementation)
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
    // TODO: Replace with actual OpenAI/Anthropic/etc. API call
    // Example with OpenAI:
    /*
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const response = await openai.chat.completions.create({
        model: params.model,
        messages: [{ role: 'user', content: params.prompt }],
        max_tokens: params.maxTokens,
        temperature: params.temperature
    });
    
    return {
        content: response.choices[0].message.content || '',
        usage: {
            prompt_tokens: response.usage!.prompt_tokens,
            completion_tokens: response.usage!.completion_tokens,
            total_tokens: response.usage!.total_tokens
        }
    };
    */

    // Mock response for now
    return {
        content: `Mock AI response for: ${params.prompt.substring(0, 50)}...`,
        usage: {
            prompt_tokens: Math.ceil(params.prompt.length / 4),
            completion_tokens: 100,
            total_tokens: Math.ceil(params.prompt.length / 4) + 100
        }
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
