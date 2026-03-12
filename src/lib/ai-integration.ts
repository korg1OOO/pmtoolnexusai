/**
 * AI Integration Utilities
 *
 * All AI provider calls are routed through the `ai-proxy` Supabase Edge Function.
 * API keys (OpenAI, Anthropic, Google) live ONLY in Edge Function vault secrets —
 * they are never exposed to the browser bundle.
 *
 * To configure keys server-side:
 *   supabase secrets set OPENAI_API_KEY=sk-...
 *   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
 *   supabase secrets set GOOGLE_AI_API_KEY=AIza...
 */

import { supabase } from '@/integrations/supabase/client';

// =============================================
// SHARED TYPES
// =============================================

export interface OpenAIOptions {
    model?: string;
    temperature?: number;
    max_tokens?: number;
    [key: string]: any;
}

export interface AnthropicOptions {
    model?: string;
    max_tokens?: number;
    temperature?: number;
    [key: string]: any;
}

export interface GoogleAIOptions {
    model?: string;
    temperature?: number;
    maxOutputTokens?: number;
    [key: string]: any;
}

// =============================================
// EDGE FUNCTION PROXY
// =============================================

interface AIProxyRequest {
    provider: 'openai' | 'anthropic' | 'google';
    model: string;
    prompt: string;
    options?: Record<string, any>;
}

interface AIProxyResponse {
    text: string;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
    };
    duration_ms?: number;
}

/**
 * Core proxy — all AI calls go through the `ai-proxy` Edge Function.
 * The Edge Function holds the actual API keys via Supabase vault secrets.
 */
async function callAIProxy(request: AIProxyRequest): Promise<AIProxyResponse> {
    const { data, error } = await supabase.functions.invoke<AIProxyResponse>('ai-proxy', {
        body: request,
    });

    if (error) {
        throw new Error(`AI proxy error: ${error.message}`);
    }

    if (!data) {
        throw new Error('AI proxy returned no data');
    }

    return data;
}

// =============================================
// OPENAI
// =============================================

/**
 * OpenAI wrapper — proxied through `ai-proxy` Edge Function.
 * Automatically logs tokens and usage via the Edge Function.
 */
export async function callOpenAI(
    prompt: string,
    options: OpenAIOptions = {}
): Promise<string> {
    const { model = 'gpt-4', ...otherOptions } = options;

    const result = await callAIProxy({
        provider: 'openai',
        model,
        prompt,
        options: otherOptions,
    });

    return result.text;
}

// =============================================
// ANTHROPIC
// =============================================

/**
 * Anthropic Claude wrapper — proxied through `ai-proxy` Edge Function.
 */
export async function callAnthropic(
    prompt: string,
    options: AnthropicOptions = {}
): Promise<string> {
    const { model = 'claude-3-sonnet-20240229', max_tokens = 1024, ...otherOptions } = options;

    const result = await callAIProxy({
        provider: 'anthropic',
        model,
        prompt,
        options: { max_tokens, ...otherOptions },
    });

    return result.text;
}

// =============================================
// GOOGLE AI
// =============================================

/**
 * Google Gemini wrapper — proxied through `ai-proxy` Edge Function.
 */
export async function callGoogleAI(
    prompt: string,
    options: GoogleAIOptions = {}
): Promise<string> {
    const { model = 'gemini-pro', ...otherOptions } = options;

    const result = await callAIProxy({
        provider: 'google',
        model,
        prompt,
        options: otherOptions,
    });

    return result.text;
}

// =============================================
// REACT HOOK FOR AI CALLS
// =============================================

/**
 * React hook for AI calls with automatic provider routing.
 */
export function useAI() {
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
