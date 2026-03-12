/**
 * Notification Scheduler Edge Function
 * Cron job to check for notification triggers and queue notifications
 * Runs daily to check for trial expiration, renewals, card expiry, etc.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const results = {
            trial_expiring: 0,
            renewal_reminder: 0,
            card_expiring: 0,
            inactive_user: 0,
            monthly_summary: 0,
        };

        // 1. Check for expiring trials (7, 3, 1 days)
        const trialChecks = [7, 3, 1];
        for (const days of trialChecks) {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + days);
            const expiryDateStr = expiryDate.toISOString().split('T')[0];

            const { data: expiringTrials } = await supabase
                .from('profiles')
                .select('id, email, full_name')
                .eq('subscription_status', 'trial')
                .eq('trial_end_date', expiryDateStr);

            if (expiringTrials) {
                for (const user of expiringTrials) {
                    // Queue notification
                    await supabase.from('notifications').insert({
                        user_id: user.id,
                        type: 'trial_expiring',
                        title: `Your trial expires in ${days} days`,
                        message: `Upgrade your account to continue using all features.`,
                        data: {
                            days_remaining: days,
                            user_name: user.full_name || 'there',
                        },
                    });

                    // Track analytics
                    await supabase.from('notification_analytics').insert({
                        channel: 'email',
                        template_key: 'trial_expiring',
                        user_id: user.id,
                        status: 'sent',
                    });

                    results.trial_expiring++;
                }
            }
        }

        // 2. Check for upcoming renewals (3 days before)
        const renewalDate = new Date();
        renewalDate.setDate(renewalDate.getDate() + 3);
        const renewalDateStr = renewalDate.toISOString().split('T')[0];

        const { data: upcomingRenewals } = await supabase
            .from('profiles')
            .select('id, email, full_name, subscription_plan')
            .in('subscription_status', ['active', 'paid'])
            .eq('next_billing_date', renewalDateStr);

        if (upcomingRenewals) {
            for (const user of upcomingRenewals) {
                await supabase.from('notifications').insert({
                    user_id: user.id,
                    type: 'renewal_reminder',
                    title: 'Your subscription renews in 3 days',
                    message: `Your ${user.subscription_plan} plan will automatically renew.`,
                    data: {
                        renewal_date: renewalDateStr,
                        user_name: user.full_name || 'there',
                    },
                });

                await supabase.from('notification_analytics').insert({
                    channel: 'email',
                    template_key: 'renewal_reminder',
                    user_id: user.id,
                    status: 'sent',
                });

                results.renewal_reminder++;
            }
        }

        // 3. Check for expiring cards (30 days)
        const cardExpiryDate = new Date();
        cardExpiryDate.setDate(cardExpiryDate.getDate() + 30);
        const cardMonth = cardExpiryDate.getMonth() + 1;
        const cardYear = cardExpiryDate.getFullYear();

        // This would require a payment methods table
        // Placeholder for demonstration
        console.log(`Checking for cards expiring in ${cardMonth}/${cardYear}`);

        // 4. Check for inactive users (30+ days)
        const inactiveDate = new Date();
        inactiveDate.setDate(inactiveDate.getDate() - 30);
        const inactiveDateStr = inactiveDate.toISOString();

        const { data: inactiveUsers } = await supabase
            .from('profiles')
            .select('id, email, full_name, last_login_at')
            .lt('last_login_at', inactiveDateStr)
            .is('inactive_email_sent_at', null);

        if (inactiveUsers) {
            for (const user of inactiveUsers) {
                await supabase.from('notifications').insert({
                    user_id: user.id,
                    type: 'inactive_user',
                    title: 'We miss you!',
                    message: 'Come back and see what\'s new.',
                    data: {
                        user_name: user.full_name || 'there',
                        days_inactive: Math.floor(
                            (Date.now() - new Date(user.last_login_at).getTime()) / (1000 * 60 * 60 * 24)
                        ),
                    },
                });

                await supabase.from('notification_analytics').insert({
                    channel: 'email',
                    template_key: 'inactive_user',
                    user_id: user.id,
                    status: 'sent',
                });

                // Mark as sent
                await supabase
                    .from('profiles')
                    .update({ inactive_email_sent_at: new Date().toISOString() })
                    .eq('id', user.id);

                results.inactive_user++;
            }
        }

        // 5. Monthly summary (1st of month)
        const today = new Date();
        if (today.getDate() === 1) {
            const { data: activeUsers } = await supabase
                .from('profiles')
                .select('id, email, full_name')
                .in('subscription_status', ['active', 'paid', 'trial']);

            if (activeUsers) {
                for (const user of activeUsers) {
                    // Generate summary data
                    const lastMonth = new Date();
                    lastMonth.setMonth(lastMonth.getMonth() - 1);

                    await supabase.from('notifications').insert({
                        user_id: user.id,
                        type: 'monthly_summary',
                        title: `Your ${lastMonth.toLocaleString('default', { month: 'long' })} Summary`,
                        message: 'See your activity highlights from last month.',
                        data: {
                            month: lastMonth.toLocaleString('default', { month: 'long' }),
                            user_name: user.full_name || 'there',
                        },
                    });

                    await supabase.from('notification_analytics').insert({
                        channel: 'email',
                        template_key: 'monthly_summary',
                        user_id: user.id,
                        status: 'sent',
                    });

                    results.monthly_summary++;
                }
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                results,
                timestamp: new Date().toISOString(),
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        );
    } catch (error) {
        console.error('Error:', error);
        return new Response(
            JSON.stringify({
                success: false,
                error: (error as any).message,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            }
        );
    }
});
