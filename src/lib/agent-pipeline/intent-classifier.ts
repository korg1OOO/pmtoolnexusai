// =============================================================================
// Agent Pipeline — LLM Intent Classifier
// =============================================================================
//
// Classifies user messages into action intents using a lightweight LLM call
// (ai-classify-intent edge function). Falls back to the existing regex-based
// detectIntent() when the LLM is unavailable or returns no match.
//
// Design:
// - LLM first: more accurate for natural language variations
// - Regex fallback: ensures the system always works even without API access
// - Confidence threshold: only uses LLM result if confidence >= 0.7
// =============================================================================

import { supabase } from '@/integrations/supabase/client';

export interface ClassificationResult {
    /** The detected action intent, or null if no action detected */
    action: string | null;
    /** Confidence score (0-1) — only present for LLM results */
    confidence: number;
    /** Which method produced the result */
    source: 'llm' | 'regex' | 'none';
    /** Optional reasoning from the LLM */
    reasoning?: string;
}

// Minimum confidence to trust the LLM classification
const CONFIDENCE_THRESHOLD = 0.7;

/**
 * Classify a user message into an action intent.
 *
 * Tries the LLM classifier first, falls back to regex on failure.
 *
 * @param message       - The raw user message
 * @param regexFallback - The existing regex detectIntent function
 * @param options       - Optional configuration
 * @returns Classification result with action, confidence, and source
 *
 * @example
 * ```ts
 * const result = await classifyIntent(
 *   "Create a new project called MyApp",
 *   detectIntent  // existing regex function
 * );
 * // → { action: "create_project", confidence: 0.95, source: "llm" }
 * ```
 */
export async function classifyIntent(
    message: string,
    regexFallback: (msg: string) => string | null,
    options?: {
        /** Skip LLM and use regex only */
        regexOnly?: boolean;
        /** Custom confidence threshold */
        confidenceThreshold?: number;
    },
): Promise<ClassificationResult> {
    // Option to skip LLM entirely (useful for tests or when API is known down)
    if (options?.regexOnly) {
        return regexClassify(message, regexFallback);
    }

    // Try LLM classification first
    try {
        const llmResult = await callLLMClassifier(message);

        if (llmResult.action && llmResult.confidence >= (options?.confidenceThreshold ?? CONFIDENCE_THRESHOLD)) {
            return {
                action: llmResult.action,
                confidence: llmResult.confidence,
                source: 'llm',
                reasoning: llmResult.reasoning,
            };
        }

        // LLM returned low confidence or no action — try regex
        const regexResult = regexClassify(message, regexFallback);

        // If regex found something but LLM didn't, use regex
        if (regexResult.action && !llmResult.action) {
            return regexResult;
        }

        // If both found something but LLM was low confidence, prefer LLM action with regex confidence boost
        if (llmResult.action && regexResult.action && llmResult.action === regexResult.action) {
            return {
                action: llmResult.action,
                confidence: Math.max(llmResult.confidence, 0.85), // boost — both agree
                source: 'llm',
                reasoning: llmResult.reasoning,
            };
        }

        // LLM had an action but below threshold, regex disagrees or has nothing
        if (llmResult.action) {
            return {
                action: llmResult.action,
                confidence: llmResult.confidence,
                source: 'llm',
                reasoning: llmResult.reasoning,
            };
        }

        return regexResult;
    } catch (error) {
        // LLM call failed entirely — fall back to regex
        console.warn('[intent-classifier] LLM classification failed, using regex fallback:', error);
        return regexClassify(message, regexFallback);
    }
}

// ─── LLM Call ────────────────────────────────────────────────────────────────

async function callLLMClassifier(message: string): Promise<{
    action: string | null;
    confidence: number;
    reasoning?: string;
}> {
    const { data: { session } } = await (supabase as any).auth.getSession();
    if (!session) {
        throw new Error('Not authenticated');
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const response = await fetch(`${supabaseUrl}/functions/v1/ai-classify-intent`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
            apikey: anonKey,
        },
        body: JSON.stringify({ message }),
    });

    if (!response.ok) {
        throw new Error(`Classifier returned ${response.status}`);
    }

    const data = await response.json();

    return {
        action: data.action ?? null,
        confidence: data.confidence ?? 0,
        reasoning: data.reasoning ?? undefined,
    };
}

// ─── Regex Fallback ──────────────────────────────────────────────────────────

function regexClassify(
    message: string,
    detectIntent: (msg: string) => string | null,
): ClassificationResult {
    const action = detectIntent(message);

    if (action) {
        return {
            action,
            confidence: 0.8, // Regex matches have decent but not perfect confidence
            source: 'regex',
        };
    }

    return {
        action: null,
        confidence: 0,
        source: 'none',
    };
}
