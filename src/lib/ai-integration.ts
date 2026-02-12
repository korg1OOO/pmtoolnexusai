/**
 * AI Integration Utilities
 * Wrappers for AI providers with automatic usage tracking
 */

import { useLogAIUsage } from '@/hooks/useAIUsage';

// =============================================
// OPENAI INTEGRATION
// =============================================

export interface OpenAIOptions {
    model?: string;
    temperature?: number;
    max_tokens?: number;
    [key: string]: any;
}

/**
 * OpenAI wrapper with usage tracking
 * Automatically logs tokens and calculates costs
 */
export async function callOpenAI(
    prompt: string,
    options: OpenAIOptions = {}
): Promise<string> {
    const { model = 'gpt-4', ...otherOptions } = options;
    const start = Date.now();

    try {
        // Make OpenAI API call
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model,
                messages: [{ role: 'user', content: prompt }],
                ...otherOptions,
            }),
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json();
        const duration = Date.now() - start;

        // Log usage (cost auto-calculated by database)
        await logAIUsage({
            provider: 'openai',
            model,
            operation: 'chat_completion',
            prompt_tokens: data.usage.prompt_tokens,
            completion_tokens: data.usage.completion_tokens,
            duration_ms: duration,
            success: true,
            metadata: {
                temperature: options.temperature,
                finish_reason: data.choices[0].finish_reason,
            },
        });

        return data.choices[0].message.content;

    } catch (error: any) {
        // Log failed attempt
        await logAIUsage({
            provider: 'openai',
            model,
            operation: 'chat_completion',
            prompt_tokens: 0,
            completion_tokens: 0,
            duration_ms: Date.now() - start,
            success: false,
            error_message: error.message,
            metadata: { prompt_length: prompt.length },
        });

        throw error;
    }
}

// =============================================
// ANTHROPIC INTEGRATION
// =============================================

export interface AnthropicOptions {
    model?: string;
    max_tokens?: number;
    temperature?: number;
    [key: string]: any;
}

/**
 * Anthropic Claude wrapper with usage tracking
 */
export async function callAnthropic(
    prompt: string,
    options: AnthropicOptions = {}
): Promise<string> {
    const { model = 'claude-3-sonnet-20240229', max_tokens = 1024, ...otherOptions } = options;
    const start = Date.now();

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY || '',
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model,
                max_tokens,
                messages: [{ role: 'user', content: prompt }],
                ...otherOptions,
            }),
        });

        if (!response.ok) {
            throw new Error(`Anthropic API error: ${response.statusText}`);
        }

        const data = await response.json();
        const duration = Date.now() - start;

        // Log usage
        await logAIUsage({
            provider: 'anthropic',
            model,
            operation: 'completion',
            prompt_tokens: data.usage.input_tokens,
            completion_tokens: data.usage.output_tokens,
            duration_ms: duration,
            success: true,
            metadata: {
                stop_reason: data.stop_reason,
            },
        });

        return data.content[0].text;

    } catch (error: any) {
        await logAIUsage({
            provider: 'anthropic',
            model,
            operation: 'completion',
            prompt_tokens: 0,
            completion_tokens: 0,
            duration_ms: Date.now() - start,
            success: false,
            error_message: error.message,
        });

        throw error;
    }
}

// =============================================
// GOOGLE AI INTEGRATION
// =============================================

export interface GoogleAIOptions {
    model?: string;
    temperature?: number;
    maxOutputTokens?: number;
    [key: string]: any;
}

/**
 * Google Gemini wrapper with usage tracking
 */
export async function callGoogleAI(
    prompt: string,
    options: GoogleAIOptions = {}
): Promise<string> {
    const { model = 'gemini-pro', ...otherOptions } = options;
    const start = Date.now();

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: otherOptions,
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`Google AI API error: ${response.statusText}`);
        }

        const data = await response.json();
        const duration = Date.now() - start;

        // Log usage
        await logAIUsage({
            provider: 'google',
            model,
            operation: 'generate_content',
            prompt_tokens: data.usageMetadata?.promptTokenCount || 0,
            completion_tokens: data.usageMetadata?.candidatesTokenCount || 0,
            duration_ms: duration,
            success: true,
        });

        return data.candidates[0].content.parts[0].text;

    } catch (error: any) {
        await logAIUsage({
            provider: 'google',
            model,
            operation: 'generate_content',
            prompt_tokens: 0,
            completion_tokens: 0,
            duration_ms: Date.now() - start,
            success: false,
            error_message: error.message,
        });

        throw error;
    }
}

// =============================================
// REACT HOOK FOR AI CALLS
// =============================================

/**
 * React hook for AI calls with automatic tracking
 */
export function useAI() {
    const logUsage = useLogAIUsage();

    const makeAICall = async (
        provider: 'openai' | 'anthropic' | 'google',
        prompt: string,
        options?: any
    ): Promise<string> => {
        switch (provider) {
            case 'openai':
                return callOpenAI(prompt, options);
            case 'anthropic':
                return callAnthropic(prompt, options);
            case 'google':
                return callGoogleAI(prompt, options);
            default:
                throw new Error(`Unknown provider: ${provider}`);
        }
    };

    return { makeAICall };
}

// =============================================
// HELPER FUNCTIONS
// =============================================

async function logAIUsage(params: {
    provider: string;
    model: string;
    operation: string;
    prompt_tokens: number;
    completion_tokens: number;
    duration_ms: number;
    success: boolean;
    error_message?: string;
    metadata?: Record<string, any>;
}) {
    try {
        // This would use the Supabase RPC in production
        // For now, just log to console in dev
        if (process.env.NODE_ENV === 'development') {
            console.log('AI Usage:', params);
        }

        // In production, call the Supabase RPC:
        // await supabase.rpc('log_ai_usage', { ... });
    } catch (error) {
        console.error('Failed to log AI usage:', error);
    }
}

// =============================================
// USAGE EXAMPLES
// =============================================

export const examples = {
    // Example 1: Simple OpenAI call
    async simpleOpenAI() {
        const response = await callOpenAI('Summarize this document...');
        console.log(response);
    },

    // Example 2: OpenAI with options
    async openAIWithOptions() {
        const response = await callOpenAI('Generate a summary...', {
            model: 'gpt-4-turbo',
            temperature: 0.7,
            max_tokens: 500,
        });
        console.log(response);
    },

    // Example 3: Anthropic Claude
    async anthropicCall() {
        const response = await callAnthropic('Analyze this text...', {
            model: 'claude-3-opus-20240229',
            max_tokens: 1024,
        });
        console.log(response);
    },

    // Example 4: Google Gemini
    async googleCall() {
        const response = await callGoogleAI('Create a blog post...', {
            temperature: 0.9,
            maxOutputTokens: 800,
        });
        console.log(response);
    },

    // Example 5: Using React hook
    useAIHookExample() {
        const { makeAICall } = useAI();

        const handleSubmit = async (prompt: string) => {
            try {
                const result = await makeAICall('openai', prompt, {
                    model: 'gpt-4',
                    temperature: 0.7,
                });
                console.log('Result:', result);
            } catch (error) {
                console.error('AI call failed:', error);
            }
        };

        return handleSubmit;
    },
};
