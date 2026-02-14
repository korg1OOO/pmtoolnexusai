import { supabase } from '@/integrations/supabase/client';
import { aiCreditsService, PricingTier } from './aiCreditsService';

// =====================================================
// TYPES
// =====================================================

export interface StripePaymentIntent {
    id: string;
    client_secret: string;
    amount: number;
    currency: string;
    status: string;
}

export interface PurchaseResult {
    success: boolean;
    purchase_id?: string;
    credits_added?: number;
    new_balance?: number;
    error?: string;
}

// =====================================================
// STRIPE PAYMENT SERVICE
// =====================================================

class StripePaymentService {
    /**
     * Create payment intent for credit purchase
     */
    async createPaymentIntent(
        pricingTierId: string
    ): Promise<StripePaymentIntent> {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            throw new Error('User not authenticated');
        }

        // Get pricing tier
        const tier = await aiCreditsService.getPricingTier(pricingTierId);

        // Call Supabase Edge Function to create Stripe payment intent
        const { data, error } = await supabase.functions.invoke('create-payment-intent', {
            body: {
                amount: tier.price * 100, // Convert to cents
                currency: tier.currency.toLowerCase(),
                metadata: {
                    user_id: user.id,
                    pricing_tier_id: pricingTierId,
                    credits: tier.credits,
                    tier_name: tier.tier_name
                }
            }
        });

        if (error) {
            throw new Error(`Failed to create payment intent: ${error.message}`);
        }

        return data;
    }

    /**
     * Confirm payment and process credit purchase
     */
    async confirmPurchase(
        paymentIntentId: string,
        pricingTierId: string
    ): Promise<PurchaseResult> {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                throw new Error('User not authenticated');
            }

            // Get tenant ID
            const { data: tenantData } = await supabase
                .from('user_tenants')
                .select('tenant_id')
                .eq('user_id', user.id)
                .limit(1)
                .single();

            if (!tenantData) {
                throw new Error('No tenant found for user');
            }

            const tenantId = tenantData.tenant_id;

            // Get pricing tier
            const tier = await aiCreditsService.getPricingTier(pricingTierId);

            // Record purchase
            const { data: purchase, error: purchaseError } = await supabase
                .from('ai_credit_purchases')
                .insert({
                    tenant_id: tenantId,
                    user_id: user.id,
                    credits_purchased: tier.credits,
                    amount_paid: tier.price,
                    currency: tier.currency,
                    payment_method: 'stripe',
                    payment_id: paymentIntentId,
                    payment_status: 'completed',
                    applied_at: new Date().toISOString()
                })
                .select()
                .single();

            if (purchaseError) {
                throw purchaseError;
            }

            // Add credits to balance
            const newBalance = await aiCreditsService.addCredits(
                tenantId,
                user.id,
                tier.credits
            );

            return {
                success: true,
                purchase_id: purchase.id,
                credits_added: tier.credits,
                new_balance: newBalance
            };

        } catch (error: any) {
            console.error('Purchase confirmation failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Handle failed payment
     */
    async handleFailedPayment(
        paymentIntentId: string,
        pricingTierId: string,
        errorMessage: string
    ): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return;

        const { data: tenantData } = await supabase
            .from('user_tenants')
            .select('tenant_id')
            .eq('user_id', user.id)
            .limit(1)
            .single();

        if (!tenantData) return;

        const tier = await aiCreditsService.getPricingTier(pricingTierId);

        // Record failed purchase
        await supabase
            .from('ai_credit_purchases')
            .insert({
                tenant_id: tenantData.tenant_id,
                user_id: user.id,
                credits_purchased: tier.credits,
                amount_paid: tier.price,
                currency: tier.currency,
                payment_method: 'stripe',
                payment_id: paymentIntentId,
                payment_status: 'failed'
            });
    }

    /**
     * Get purchase by ID
     */
    async getPurchase(purchaseId: string) {
        const { data, error } = await supabase
            .from('ai_credit_purchases')
            .select('*')
            .eq('id', purchaseId)
            .single();

        if (error) throw error;

        return data;
    }
}

// Export singleton instance
export const stripePaymentService = new StripePaymentService();
