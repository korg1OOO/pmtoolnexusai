import { supabase as _supabase } from '@/integrations/supabase/client';
const supabase = _supabase as any;
import { aiCreditsService } from './aiCreditsService';
import { stripePaymentService } from './stripePaymentService';

// =====================================================
// AUTO-RECHARGE SERVICE
// =====================================================

class AutoRechargeService {
    /**
     * Check if auto-recharge should trigger
     */
    async checkAndTriggerAutoRecharge(
        tenantId: string,
        userId: string
    ): Promise<boolean> {
        try {
            // Get current balance
            const balance = await aiCreditsService.getBalance(tenantId, userId);

            // Check if auto-recharge is enabled and threshold reached
            if (!balance.auto_recharge_enabled) {
                return false;
            }

            if (balance.available_credits > balance.auto_recharge_threshold) {
                return false;
            }

            // Get default payment method
            const paymentMethod = await this.getDefaultPaymentMethod(tenantId, userId);

            if (!paymentMethod) {
                console.warn(`No default payment method for user ${userId}`);
                await this.sendAutoRechargeFailedNotification(
                    userId,
                    'No default payment method found'
                );
                return false;
            }

            // Find pricing tier closest to auto_recharge_amount
            const pricingTiers = await aiCreditsService.getPricingTiers();
            const targetTier = pricingTiers.reduce((closest, tier) => {
                const currentDiff = Math.abs(tier.credits - balance.auto_recharge_amount);
                const closestDiff = Math.abs(closest.credits - balance.auto_recharge_amount);
                return currentDiff < closestDiff ? tier : closest;
            });

            // Create payment intent
            const paymentIntent = await stripePaymentService.createPaymentIntent(targetTier.id);

            // Auto-confirm payment (in production, this would use saved payment method)
            const result = await stripePaymentService.confirmPurchase(
                paymentIntent.id,
                targetTier.id
            );

            if (result.success) {
                // Send success notification
                await this.sendAutoRechargeSuccessNotification(
                    userId,
                    targetTier.credits,
                    result.new_balance!
                );

                // Log auto-recharge event
                await this.logAutoRechargeEvent(
                    tenantId,
                    userId,
                    targetTier.credits,
                    targetTier.price,
                    'success'
                );

                return true;
            } else {
                // Send failure notification
                await this.sendAutoRechargeFailedNotification(
                    userId,
                    result.error || 'Payment failed'
                );

                // Log failed event
                await this.logAutoRechargeEvent(
                    tenantId,
                    userId,
                    targetTier.credits,
                    targetTier.price,
                    'failed',
                    result.error
                );

                return false;
            }

        } catch (error: any) {
            console.error('Auto-recharge failed:', error);
            await this.sendAutoRechargeFailedNotification(userId, error.message);
            return false;
        }
    }

    /**
     * Get default payment method for user
     */
    private async getDefaultPaymentMethod(
        tenantId: string,
        userId: string
    ): Promise<{ id: string; type: string } | null> {
        // Payment method storage implemented via stripeIntegrationService
        // See: src/services/stripeIntegrationService.ts
        // Use savePaymentMethod() and listCustomerPaymentMethods()

        const { data, error } = await supabase
            .from('user_payment_methods')
            .select('*')
            .eq('user_id', userId)
            .eq('is_default', true)
            .single();

        if (error || !data) {
            return null;
        }

        return {
            id: data.stripe_payment_method_id,
            type: data.type
        };
    }

    /**
     * Send auto-recharge success notification
     */
    private async sendAutoRechargeSuccessNotification(
        userId: string,
        creditsAdded: number,
        newBalance: number
    ): Promise<void> {
        await supabase.from('notifications').insert({
            user_id: userId,
            type: 'auto_recharge_success',
            title: 'Credits Auto-Recharged',
            message: `${creditsAdded} credits added automatically. New balance: ${newBalance} credits.`,
            data: {
                credits_added: creditsAdded,
                new_balance: newBalance
            }
        });
    }

    /**
     * Send auto-recharge failed notification
     */
    private async sendAutoRechargeFailedNotification(
        userId: string,
        reason: string
    ): Promise<void> {
        await supabase.from('notifications').insert({
            user_id: userId,
            type: 'auto_recharge_failed',
            title: 'Auto-Recharge Failed',
            message: `Failed to auto-recharge credits: ${reason}. Please add credits manually.`,
            data: {
                reason
            },
            priority: 'high'
        });
    }

    /**
     * Log auto-recharge event
     */
    private async logAutoRechargeEvent(
        tenantId: string,
        userId: string,
        credits: number,
        amount: number,
        status: 'success' | 'failed',
        error?: string
    ): Promise<void> {
        await supabase.from('auto_recharge_logs').insert({
            tenant_id: tenantId,
            user_id: userId,
            credits_attempted: credits,
            amount_attempted: amount,
            status,
            error_message: error,
            triggered_at: new Date().toISOString()
        });
    }
}

// Export singleton instance
export const autoRechargeService = new AutoRechargeService();
