/**
 * _shared/creditDeduction.ts
 *
 * Shared helper for deducting AI credits after each Edge Function call.
 * Applies the enterprise 2× billing multiplier (charges 2× actual tokens used).
 *
 * Matches the live RPC signature from 20260214120002_ai_credits_system_simplified.sql:
 *   deduct_ai_credits(p_user_id, p_credits, p_feature_type, p_model_used, p_tokens_used, p_metadata)
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

export interface CreditDeductionParams {
    /** Feature / agent type, e.g. "ai_orchestrator", "analyze_risks" */
    featureType: string;
    /** Unique ID for this request (stored in metadata for traceability) */
    requestId: string;
    /** Model name as reported by the AI provider, e.g. "gpt-4o" */
    modelName: string;
    /** Actual prompt tokens consumed */
    promptTokens: number;
    /** Actual completion tokens consumed */
    completionTokens: number;
}

/**
 * Deduct credits for an AI call using the simplified RPC.
 *
 * Billing formula (2× enterprise multiplier):
 *   billedTokens = (promptTokens + completionTokens) × 2
 *   credits      = billedTokens / 1000   (minimum 0.001)
 *
 * @param supabase  Service-role Supabase client
 * @param userId    The authenticated user (null = system call, skipped)
 * @param params    Credit deduction parameters
 */
export async function deductCredits(
    supabase: SupabaseClient,
    userId: string | null,
    _tenantId: string | null,           // kept for API compat; not used by simplified RPC
    params: CreditDeductionParams
): Promise<boolean> {
    if (!userId) {
        // Unauthenticated / system call — skip deduction
        return true;
    }

    try {
        // Apply 2× billing multiplier
        const actualTokens = params.promptTokens + params.completionTokens;
        const billedTokens = actualTokens * 2;
        const credits = Math.max(billedTokens / 1000, 0.001); // minimum 0.001 credits

        const { error } = await supabase.rpc("deduct_ai_credits", {
            p_user_id: userId,
            p_credits: credits,
            p_feature_type: params.featureType,
            p_model_used: params.modelName,
            p_tokens_used: billedTokens,
            p_metadata: {
                request_id: params.requestId,
                actual_tokens: actualTokens,
                billed_tokens: billedTokens,
                multiplier: 2,
                prompt_tokens: params.promptTokens,
                completion_tokens: params.completionTokens,
            },
        });

        if (error) {
            console.error("[creditDeduction] RPC error:", error.message);
            return false;
        }

        console.log(
            `[creditDeduction] user=${userId} feature=${params.featureType} ` +
            `actual=${actualTokens} billed=${billedTokens} credits=${credits.toFixed(4)}`
        );
        return true;
    } catch (err) {
        console.error("[creditDeduction] Unexpected error:", err);
        return false;
    }
}

/**
 * Stub — tenant_id not needed by the simplified schema.
 * Kept so all Edge Function code compiles without changes.
 */
export async function getTenantId(
    _supabase: SupabaseClient,
    _userId: string
): Promise<string | null> {
    return null;
}
