/**
 * Notification Service
 * Handles in-app notifications and email queueing
 */

import { supabase as _supabase } from '@/integrations/supabase/client';
const supabase = _supabase as any;

export interface Notification {
    id: string;
    user_id: string;
    type: 'billing' | 'usage' | 'feature' | 'system' | 'engagement';
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    message: string;
    action_url?: string;
    action_label?: string;
    read: boolean;
    expires_at?: string;
    created_at: string;
}

export interface EmailQueueItem {
    id: string;
    template: string;
    recipients: { email: string; name: string }[];
    subject: string;
    data: Record<string, any>;
    status: 'pending' | 'sent' | 'failed' | 'cancelled';
    sent_at?: string;
}

/**
 * Create an in-app notification
 */
export async function createNotification(
    userId: string,
    type: Notification['type'],
    priority: Notification['priority'],
    title: string,
    message: string,
    options?: {
        actionUrl?: string;
        actionLabel?: string;
        expiresHours?: number;
    }
) {
    const { data, error } = await supabase.rpc('create_notification', {
        p_user_id: userId,
        p_type: type,
        p_priority: priority,
        p_title: title,
        p_message: message,
        p_action_url: options?.actionUrl || null,
        p_action_label: options?.actionLabel || null,
        p_expires_hours: options?.expiresHours || 168, // 7 days default
    });

    if (error) {
        console.error('Failed to create notification:', error);
        throw error;
    }

    return data;
}

/**
 * Queue an email to be sent
 */
export async function queueEmail(
    userId: string,
    template: string,
    recipients: { email: string; name: string }[],
    subject: string,
    data: Record<string, any>,
    scheduledFor?: Date
) {
    const { data: emailId, error } = await supabase.rpc('queue_email', {
        p_user_id: userId,
        p_template: template,
        p_recipients: recipients,
        p_subject: subject,
        p_data: data,
        p_scheduled_for: scheduledFor?.toISOString() || new Date().toISOString(),
    });

    if (error) {
        console.error('Failed to queue email:', error);
        throw error;
    }

    return emailId;
}

/**
 * Common notification triggers
 */
export const NotificationTriggers = {
    /**
     * Payment failed notification
     */
    async paymentFailed(userId: string, amount: number, currency: string, portalUrl: string) {
        // In-app notification
        await createNotification(
            userId,
            'billing',
            'critical',
            'Payment Failed',
            `We couldn't process your payment of ${currency.toUpperCase()} ${(amount / 100).toFixed(2)}. Please update your payment method.`,
            {
                actionUrl: portalUrl,
                actionLabel: 'Update Payment',
                expiresHours: 168, // 7 days
            }
        );

        // Email notification
        const { data: user } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', userId)
            .single();

        if (user) {
            await queueEmail(
                userId,
                'payment_failed',
                [{ email: user.email, name: user.full_name || 'User' }],
                'Payment Failed - Action Required',
                {
                    user_name: user.full_name || 'User',
                    amount: (amount / 100).toFixed(2),
                    currency: currency.toUpperCase(),
                    portal_url: portalUrl,
                    grace_period_days: 7,
                }
            );
        }
    },

    /**
     * Payment succeeded notification
     */
    async paymentSucceeded(
        userId: string,
        amount: number,
        currency: string,
        invoiceUrl: string,
        invoiceNumber: string
    ) {
        // In-app notification
        await createNotification(
            userId,
            'billing',
            'low',
            'Payment Received',
            `Thank you! Your payment of ${currency.toUpperCase()} ${(amount / 100).toFixed(2)} was successful.`,
            {
                actionUrl: invoiceUrl,
                actionLabel: 'View Invoice',
                expiresHours: 720, // 30 days
            }
        );

        // Email notification
        const { data: user } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', userId)
            .single();

        if (user) {
            await queueEmail(
                userId,
                'payment_success',
                [{ email: user.email, name: user.full_name || 'User' }],
                'Payment Received - Thank You!',
                {
                    user_name: user.full_name || 'User',
                    amount: (amount / 100).toFixed(2),
                    currency: currency.toUpperCase(),
                    invoice_url: invoiceUrl,
                    invoice_number: invoiceNumber,
                }
            );
        }
    },

    /**
     * Usage limit warning
     */
    async usageWarning(userId: string, usagePercent: number, limit: number, upgradeUrl: string) {
        await createNotification(
            userId,
            'usage',
            'medium',
            'Usage Limit Warning',
            `You've used ${usagePercent}% of your plan. Consider upgrading to avoid service interruption.`,
            {
                actionUrl: upgradeUrl,
                actionLabel: 'Upgrade Plan',
                expiresHours: 168,
            }
        );

        const { data: user } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', userId)
            .single();

        if (user) {
            await queueEmail(
                userId,
                'usage_warning',
                [{ email: user.email, name: user.full_name || 'User' }],
                'Usage Limit Warning',
                {
                    user_name: user.full_name || 'User',
                    usage_percent: usagePercent,
                    limit,
                    upgrade_url: upgradeUrl,
                }
            );
        }
    },

    /**
     * Trial expiring soon
     */
    async trialExpiring(userId: string, daysRemaining: number, upgradeUrl: string) {
        await createNotification(
            userId,
            'engagement',
            'medium',
            'Trial Ending Soon',
            `Your trial ends in ${daysRemaining} days. Upgrade now to keep your access.`,
            {
                actionUrl: upgradeUrl,
                actionLabel: 'Upgrade Now',
                expiresHours: daysRemaining * 24,
            }
        );

        const { data: user } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', userId)
            .single();

        if (user) {
            await queueEmail(
                userId,
                'trial_expiring',
                [{ email: user.email, name: user.full_name || 'User' }],
                'Your Trial Ends Soon',
                {
                    user_name: user.full_name || 'User',
                    trial_end_date: new Date(
                        Date.now() + daysRemaining * 24 * 60 * 60 * 1000
                    ).toLocaleDateString(),
                    upgrade_url: upgradeUrl,
                }
            );
        }
    },

    /**
     * Subscription cancelled
     */
    async subscriptionCancelled(userId: string, tier: string, endDate: string) {
        await createNotification(
            userId,
            'billing',
            'high',
            'Subscription Cancelled',
            `Your ${tier} subscription has been cancelled. Access ends on ${endDate}.`,
            {
                actionUrl: '/pricing',
                actionLabel: 'Reactivate',
                expiresHours: 720, // 30 days
            }
        );

        const { data: user } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', userId)
            .single();

        if (user) {
            await queueEmail(
                userId,
                'subscription_cancelled',
                [{ email: user.email, name: user.full_name || 'User' }],
                'Subscription Cancelled',
                {
                    user_name: user.full_name || 'User',
                    tier,
                    end_date: endDate,
                    reactivation_url: `${window.location.origin}/pricing`,
                }
            );
        }
    },

    /**
     * AI Credits low balance warning
     */
    async aiCreditsLowBalance(
        userId: string,
        currentBalance: number,
        threshold: number,
        severity: 'warning' | 'critical'
    ) {
        await createNotification(
            userId,
            'usage',
            severity === 'critical' ? 'critical' : 'medium',
            severity === 'critical' ? 'Critical: AI Credits Almost Depleted' : 'Low AI Credits',
            `You have ${currentBalance} credits remaining. ${severity === 'critical' ? 'AI features will be disabled when balance reaches 0.' : 'Consider purchasing more credits.'}`,
            {
                actionUrl: '/credits/purchase',
                actionLabel: 'Buy Credits',
                expiresHours: 168,
            }
        );

        const { data: user } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', userId)
            .single();

        if (user) {
            await queueEmail(
                userId,
                'ai_credits_low_balance',
                [{ email: user.email, name: user.full_name || 'User' }],
                severity === 'critical' ? '🚨 Critical: AI Credits Almost Depleted' : '⚠️ Low AI Credits Warning',
                {
                    user_name: user.full_name || 'User',
                    current_balance: currentBalance,
                    threshold,
                    severity,
                    purchase_url: `${window.location.origin}/credits/purchase`,
                }
            );
        }
    },

    /**
     * AI Credits auto-recharge success
     */
    async aiCreditsAutoRechargeSuccess(
        userId: string,
        creditsAdded: number,
        amountCharged: number,
        newBalance: number
    ) {
        await createNotification(
            userId,
            'billing',
            'low',
            'AI Credits Auto-Recharged',
            `${creditsAdded} credits added automatically. New balance: ${newBalance} credits.`,
            {
                actionUrl: '/credits',
                actionLabel: 'View Balance',
                expiresHours: 168,
            }
        );

        const { data: user } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', userId)
            .single();

        if (user) {
            await queueEmail(
                userId,
                'ai_credits_auto_recharge_success',
                [{ email: user.email, name: user.full_name || 'User' }],
                '✅ AI Credits Auto-Recharged',
                {
                    user_name: user.full_name || 'User',
                    credits_added: creditsAdded,
                    amount_charged: amountCharged.toFixed(2),
                    new_balance: newBalance,
                    dashboard_url: `${window.location.origin}/credits`,
                }
            );
        }
    },

    /**
     * AI Credits auto-recharge failed
     */
    async aiCreditsAutoRechargeFailed(userId: string, reason: string) {
        await createNotification(
            userId,
            'billing',
            'high',
            'Auto-Recharge Failed',
            `Failed to auto-recharge credits: ${reason}. Please add credits manually.`,
            {
                actionUrl: '/credits/purchase',
                actionLabel: 'Buy Credits',
                expiresHours: 48,
            }
        );

        const { data: user } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', userId)
            .single();

        if (user) {
            await queueEmail(
                userId,
                'ai_credits_auto_recharge_failed',
                [{ email: user.email, name: user.full_name || 'User' }],
                '❌ Auto-Recharge Failed',
                {
                    user_name: user.full_name || 'User',
                    reason,
                    purchase_url: `${window.location.origin}/credits/purchase`,
                    settings_url: `${window.location.origin}/settings/credits`,
                }
            );
        }
    },

    /**
     * AI Credits purchase confirmation
     */
    async aiCreditsPurchaseConfirmation(
        userId: string,
        credits: number,
        amount: number,
        receiptUrl?: string
    ) {
        await createNotification(
            userId,
            'billing',
            'low',
            'AI Credits Purchase Confirmed',
            `${credits} credits added to your account. Thank you for your purchase!`,
            {
                actionUrl: receiptUrl || '/credits',
                actionLabel: receiptUrl ? 'View Receipt' : 'View Balance',
                expiresHours: 720, // 30 days
            }
        );

        const { data: user } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', userId)
            .single();

        if (user) {
            await queueEmail(
                userId,
                'ai_credits_purchase_confirmation',
                [{ email: user.email, name: user.full_name || 'User' }],
                '🎉 AI Credits Purchase Confirmed',
                {
                    user_name: user.full_name || 'User',
                    credits,
                    amount: amount.toFixed(2),
                    receipt_url: receiptUrl,
                    dashboard_url: `${window.location.origin}/credits`,
                }
            );
        }
    },
};
