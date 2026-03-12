import { supabase as _supabase } from '@/integrations/supabase/client';

const supabase = _supabase as any;

// =====================================================
// TYPES
// =====================================================

export interface CreditBalance {
    id: string;
    tenant_id: string;
    user_id: string;
    total_credits: number;
    used_credits: number;
    available_credits: number;
    low_balance_threshold: number;
    auto_recharge_enabled: boolean;
    auto_recharge_amount: number;
    auto_recharge_threshold: number;
    last_recharged_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface UsageLog {
    id: string;
    tenant_id: string;
    user_id: string;
    feature_type: string;
    request_id: string;
    model_name: string;
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    credits_used: number;
    credits_before: number;
    credits_after: number;
    request_duration_ms: number | null;
    success: boolean;
    error_message: string | null;
    created_at: string;
}

export interface CreditPurchase {
    id: string;
    tenant_id: string;
    user_id: string;
    credits_purchased: number;
    amount_paid: number;
    currency: string;
    payment_method: string;
    payment_id: string;
    payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
    purchased_at: string;
    applied_at: string | null;
}

export interface PricingTier {
    id: string;
    tier_name: string;
    credits: number;
    price: number;
    currency: string;
    discount_percentage: number;
    is_active: boolean;
    is_featured: boolean;
    display_order: number;
    description: string | null;
}

export interface UsageStats {
    total_credits_used: number;
    total_tokens: number;
    total_requests: number;
    avg_credits_per_request: number;
    by_feature: Array<{
        feature_type: string;
        count: number;
        credits: number;
        avg_tokens: number;
    }>;
}

// =====================================================
// AI CREDITS SERVICE
// =====================================================

class AICreditsService {
    /**
     * Get current credit balance for user
     */
    async getBalance(tenantId?: string, userId?: string): Promise<CreditBalance> {
        const { data: { user } } = await supabase.auth.getUser();

        const effectiveUserId = userId || user?.id;
        const effectiveTenantId = tenantId || await this.getCurrentTenantId().catch(() => 'default');

        if (!effectiveUserId) {
            return this.defaultBalance(effectiveTenantId, 'unknown');
        }

        const { data, error } = await supabase
            .from('ai_credits')
            .select('*')
            .eq('tenant_id', effectiveTenantId)
            .eq('user_id', effectiveUserId)
            .single();

        if (error) {
            // 406 = table doesn't exist (missing migration), PGRST116 = no rows
            if (error.code === '42P01' || error.message?.includes('Not Acceptable') || String(error.code) === '406') {
                // Table doesn't exist yet — return safe defaults silently
                return this.defaultBalance(effectiveTenantId, effectiveUserId);
            }
            if (error.code === 'PGRST116') {
                try {
                    return await this.initializeCredits(effectiveTenantId, effectiveUserId, 10);
                } catch {
                    // RPC also missing — return defaults
                    return this.defaultBalance(effectiveTenantId, effectiveUserId);
                }
            }
            // Unknown error — return defaults rather than crashing
            console.warn('[AI Credits] getBalance error:', error.message);
            return this.defaultBalance(effectiveTenantId, effectiveUserId);
        }

        return data;
    }

    /**
     * Return a safe default balance when the ai_credits table is missing
     */
    private defaultBalance(tenantId: string, userId: string): CreditBalance {
        return {
            id: 'default',
            tenant_id: tenantId,
            user_id: userId,
            total_credits: 0,
            used_credits: 0,
            available_credits: 0,
            low_balance_threshold: 5,
            auto_recharge_enabled: false,
            auto_recharge_amount: 100,
            auto_recharge_threshold: 10,
            last_recharged_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
    }

    /**
     * Check if user has sufficient credits
     */
    async hasCredits(required: number, tenantId?: string, userId?: string): Promise<boolean> {
        try {
            const balance = await this.getBalance(tenantId, userId);
            return balance.available_credits >= required;
        } catch (error) {
            console.error('Error checking credits:', error);
            return false;
        }
    }

    /**
     * Deduct credits and log usage (atomic operation)
     */
    async deductCredits(params: {
        tenantId?: string;
        userId?: string;
        featureType: string;
        requestId: string;
        modelName: string;
        promptTokens: number;
        completionTokens: number;
    }): Promise<UsageLog> {
        const { data: { user } } = await supabase.auth.getUser();

        const effectiveUserId = params.userId || user?.id;
        const effectiveTenantId = params.tenantId || await this.getCurrentTenantId();

        if (!effectiveUserId || !effectiveTenantId) {
            throw new Error('User or tenant not found');
        }

        const totalTokens = params.promptTokens + params.completionTokens;
        // Credits = 2 × total tokens (tokens are doubled per billing policy)
        const creditsUsed = totalTokens / 1000 * 2;

        const { data, error } = await supabase.from('ai_usage_logs').insert({
            user_id: effectiveUserId,
            operation: params.featureType,
            model: params.modelName,
            input_tokens: params.promptTokens,
            output_tokens: params.completionTokens,
            provider: 'openai', // or extracted from model
            success: true,
            cost: (totalTokens / 1000) * 0.002, // dummy cost calculation
            metadata: {
                credits_used: creditsUsed,
                request_id: params.requestId,
                tenant_id: effectiveTenantId
            }
        });

        if (error) {
            throw new Error(`Credit deduction failed: ${error.message}`);
        }

        // Check for low balance alert
        await this.checkLowBalanceAlert(effectiveTenantId, effectiveUserId);

        // Fetch the created usage log
        const { data: usageLog, error: logError } = await supabase
            .from('ai_usage_logs')
            .select('*')
            .eq('id', data[0].usage_id)
            .single();

        if (logError) throw logError;

        return usageLog;
    }

    /**
     * Initialize credits for new user
     */
    async initializeCredits(
        tenantId: string,
        userId: string,
        initialCredits: number = 10
    ): Promise<CreditBalance> {
        const { data, error } = await supabase.rpc('initialize_ai_credits', {
            p_tenant_id: tenantId,
            p_user_id: userId,
            p_initial_credits: initialCredits
        });

        if (error) throw error;

        // Fetch the created record
        return await this.getBalance(tenantId, userId);
    }

    /**
     * Add credits to balance
     */
    async addCredits(
        tenantId: string,
        userId: string,
        credits: number
    ): Promise<number> {
        const { data, error } = await supabase.rpc('add_ai_credits', {
            p_tenant_id: tenantId,
            p_user_id: userId,
            p_credits: credits
        });

        if (error) throw error;

        return data;
    }

    /**
     * Get pricing tiers
     */
    async getPricingTiers(): Promise<PricingTier[]> {
        const { data, error } = await supabase
            .from('ai_credit_pricing')
            .select('*')
            .eq('is_active', true)
            .order('display_order');

        if (error) throw error;

        return data || [];
    }

    /**
     * Get single pricing tier
     */
    async getPricingTier(tierId: string): Promise<PricingTier> {
        const { data, error } = await supabase
            .from('ai_credit_pricing')
            .select('*')
            .eq('id', tierId)
            .single();

        if (error) throw error;

        return data;
    }

    /**
     * Get usage history
     */
    async getUsageHistory(
        days: number = 30,
        tenantId?: string,
        userId?: string
    ): Promise<UsageLog[]> {
        const { data: { user } } = await supabase.auth.getUser();

        const effectiveUserId = userId || user?.id;
        const effectiveTenantId = tenantId || await this.getCurrentTenantId();

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data, error } = await supabase
            .from('ai_usage_logs')
            .select('*')
            .eq('tenant_id', effectiveTenantId)
            .eq('user_id', effectiveUserId)
            .gte('created_at', startDate.toISOString())
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data || [];
    }

    /**
     * Get usage statistics
     */
    async getUsageStats(
        days: number = 30,
        tenantId?: string,
        userId?: string
    ): Promise<UsageStats> {
        const usage = await this.getUsageHistory(days, tenantId, userId);

        const totalCreditsUsed = usage.reduce((sum, log) => sum + log.credits_used, 0);
        const totalTokens = usage.reduce((sum, log) => sum + log.total_tokens, 0);
        const totalRequests = usage.length;
        const avgCreditsPerRequest = totalRequests > 0 ? totalCreditsUsed / totalRequests : 0;

        // Group by feature
        const byFeature = usage.reduce((acc, log) => {
            const existing = acc.find(f => f.feature_type === log.feature_type);
            if (existing) {
                existing.count++;
                existing.credits += log.credits_used;
                existing.avg_tokens = (existing.avg_tokens * (existing.count - 1) + log.total_tokens) / existing.count;
            } else {
                acc.push({
                    feature_type: log.feature_type,
                    count: 1,
                    credits: log.credits_used,
                    avg_tokens: log.total_tokens
                });
            }
            return acc;
        }, [] as UsageStats['by_feature']);

        return {
            total_credits_used: totalCreditsUsed,
            total_tokens: totalTokens,
            total_requests: totalRequests,
            avg_credits_per_request: avgCreditsPerRequest,
            by_feature: byFeature
        };
    }

    /**
     * Get purchase history
     */
    async getPurchaseHistory(
        tenantId?: string,
        userId?: string
    ): Promise<CreditPurchase[]> {
        const { data: { user } } = await supabase.auth.getUser();

        const effectiveUserId = userId || user?.id;
        const effectiveTenantId = tenantId || await this.getCurrentTenantId();

        const { data, error } = await supabase
            .from('ai_credit_purchases')
            .select('*')
            .eq('tenant_id', effectiveTenantId)
            .eq('user_id', effectiveUserId)
            .order('purchased_at', { ascending: false });

        if (error) throw error;

        return data || [];
    }

    /**
     * Update auto-recharge settings
     */
    async updateAutoRecharge(
        enabled: boolean,
        amount?: number,
        threshold?: number,
        tenantId?: string,
        userId?: string
    ): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();

        const effectiveUserId = userId || user?.id;
        const effectiveTenantId = tenantId || await this.getCurrentTenantId();

        const updates: any = {
            auto_recharge_enabled: enabled,
            updated_at: new Date().toISOString()
        };

        if (amount !== undefined) updates.auto_recharge_amount = amount;
        if (threshold !== undefined) updates.auto_recharge_threshold = threshold;

        const { error } = await supabase
            .from('ai_credits')
            .update(updates)
            .eq('tenant_id', effectiveTenantId)
            .eq('user_id', effectiveUserId);

        if (error) throw error;
    }

    /**
     * Check for low balance and send alert
     */
    private async checkLowBalanceAlert(tenantId: string, userId: string): Promise<void> {
        const balance = await this.getBalance(tenantId, userId);

        if (balance.available_credits <= balance.low_balance_threshold) {
            // Send in-app / email notification via edge function (fire-and-forget)
            supabase.functions.invoke('send-notification', {
                body: {
                    user_id: userId,
                    tenant_id: tenantId,
                    type: 'low_ai_credits',
                    title: 'Low AI Credit Balance',
                    message: `You have ${balance.available_credits} AI credits remaining. Consider purchasing more to avoid service interruption.`,
                    metadata: { available_credits: balance.available_credits, threshold: balance.low_balance_threshold }
                }
            }).catch((err: any) => console.warn('Low balance notification failed:', err));

            // Trigger auto-recharge if the balance is also below the auto-recharge threshold
            if (
                balance.auto_recharge_enabled &&
                balance.available_credits <= balance.auto_recharge_threshold
            ) {
                supabase.functions.invoke('auto-recharge-credits', {
                    body: {
                        tenant_id: tenantId,
                        user_id: userId,
                        recharge_amount: balance.auto_recharge_amount
                    }
                }).catch((err: any) => console.warn('Auto-recharge invocation failed:', err));
            }
        }
    }

    /**
     * Get current tenant ID from context
     */
    private async getCurrentTenantId(): Promise<string> {
        // This should be implemented based on your app's context
        // For now, we'll try to get it from user_tenants
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('user_tenants')
            .select('tenant_id')
            .eq('user_id', user.id)
            .limit(1)
            .single();

        if (error || !data) {
            throw new Error('No tenant found for user');
        }

        return data.tenant_id;
    }
}

// Export singleton instance
export const aiCreditsService = new AICreditsService();
