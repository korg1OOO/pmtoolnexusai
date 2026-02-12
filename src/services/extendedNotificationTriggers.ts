/**
 * Comprehensive Notification Triggers
 * Extends notificationService with all recommended notifications
 */

import { supabase } from '@/integrations/supabase/client';
import { NotificationTriggers as BaseNotificationTriggers } from './notificationService';

// Re-export base triggers
export { NotificationTriggers } from './notificationService';

/**
 * Additional Notification Triggers for comprehensive coverage
 */
export const ExtendedNotificationTriggers = {
    /**
     * Trial expiring soon (3 days before)
     */
    async trialExpiring3Days(userId: string, endDate: string) {
        const { data: user } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', userId)
            .single();

        if (!user) return;

        // In-app notification
        await supabase.rpc('create_notification', {
            p_user_id: userId,
            p_type: 'engagement',
            p_priority: 'high',
            p_title: 'Trial Ending in 3 Days',
            p_message: `Your trial ends on ${endDate}. Upgrade now to keep access to all features.`,
            p_action_url: '/pricing',
            p_action_label: 'Upgrade Now',
            p_expires_hours: 72,
        });

        // Email
        await supabase.rpc('queue_email', {
            p_user_id: userId,
            p_template: 'trial_expiring',
            p_recipients: [{ email: user.email, name: user.full_name || 'User' }],
            p_subject: 'Your Trial Ends in 3 Days',
            p_data: {
                user_name: user.full_name || 'User',
                trial_end_date: endDate,
                upgrade_url: `${window.location.origin}/pricing`,
                days_remaining: 3,
            },
        });
    },

    /**
     * Usage warning at 80% limit
     */
    async usageWarning80Percent(userId: string, resourceType: string, current: number, limit: number) {
        const percent = Math.round((current / limit) * 100);

        await supabase.rpc('create_notification', {
            p_user_id: userId,
            p_type: 'usage',
            p_priority: 'medium',
            p_title: `${resourceType} Limit Warning`,
            p_message: `You've used ${percent}% of your ${resourceType} allocation (${current}/${limit}). Consider upgrading to avoid service interruption.`,
            p_action_url: '/pricing',
            p_action_label: 'Upgrade Plan',
            p_expires_hours: 168,
        });

        const { data: user } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', userId).single();

        if (user) {
            await supabase.rpc('queue_email', {
                p_user_id: userId,
                p_template: 'usage_warning',
                p_recipients: [{ email: user.email, name: user.full_name || 'User' }],
                p_subject: `${resourceType} Usage Warning`,
                p_data: {
                    user_name: user.full_name || 'User',
                    resource_type: resourceType,
                    usage_percent: percent,
                    current_usage: current,
                    limit,
                    upgrade_url: `${window.location.origin}/pricing`,
                },
            });
        }
    },

    /**
     * Renewal reminder (3 days before)
     */
    async renewalReminder(userId: string, renewalDate: string, amount: number, currency: string) {
        await supabase.rpc('create_notification', {
            p_user_id: userId,
            p_type: 'billing',
            p_priority: 'low',
            p_title: 'Upcoming Renewal',
            p_message: `Your subscription will renew on ${renewalDate} for ${currency} ${amount}.`,
            p_action_url: '/settings/billing',
            p_action_label: 'View Details',
            p_expires_hours: 72,
        });

        const { data: user } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', userId)
            .single();

        if (user) {
            await supabase.rpc('queue_email', {
                p_user_id: userId,
                p_template: 'renewal_reminder',
                p_recipients: [{ email: user.email, name: user.full_name || 'User' }],
                p_subject: 'Your Subscription Renews Soon',
                p_data: {
                    user_name: user.full_name || 'User',
                    renewal_date: renewalDate,
                    amount: (amount / 100).toFixed(2),
                    currency: currency.toUpperCase(),
                    portal_url: `${window.location.origin}/settings/billing`,
                },
            });
        }
    },

    /**
     * Payment method expiring soon
     */
    async paymentMethodExpiring(userId: string, last4: string, expiryMonth: string, expiryYear: string) {
        await supabase.rpc('create_notification', {
            p_user_id: userId,
            p_type: 'billing',
            p_priority: 'medium',
            p_title: 'Payment Method Expiring',
            p_message: `Your card ending in ${last4} expires ${expiryMonth}/${expiryYear}. Update your payment method to avoid service interruption.`,
            p_action_url: '/settings/billing',
            p_action_label: 'Update Card',
            p_expires_hours: 720, // 30 days
        });

        const { data: user } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', userId)
            .single();

        if (user) {
            await supabase.rpc('queue_email', {
                p_user_id: userId,
                p_template: 'payment_method_expiring',
                p_recipients: [{ email: user.email, name: user.full_name || 'User' }],
                p_subject: 'Update Your Payment Method',
                p_data: {
                    user_name: user.full_name || 'User',
                    card_last4: last4,
                    expiry_date: `${expiryMonth}/${expiryYear}`,
                    portal_url: `${window.location.origin}/settings/billing`,
                },
            });
        }
    },

    /**
     * Team member added
     */
    async teamMemberAdded(userId: string, memberName: string, memberEmail: string, addedBy: string) {
        await supabase.rpc('create_notification', {
            p_user_id: userId,
            p_type: 'system',
            p_priority: 'low',
            p_title: 'New Team Member',
            p_message: `${addedBy} added ${memberName} to your team.`,
            p_action_url: '/settings/team',
            p_action_label: 'View Team',
            p_expires_hours: 168,
        });
    },

    /**
     * Monthly usage summary
     */
    async monthlyUsageSummary(
        userId: string,
        projectsCreated: number,
        tasksCompleted: number,
        hoursTracked: number,
        teamSize: number
    ) {
        const { data: user } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', userId)
            .single();

        if (user) {
            await supabase.rpc('queue_email', {
                p_user_id: userId,
                p_template: 'monthly_summary',
                p_recipients: [{ email: user.email, name: user.full_name || 'User' }],
                p_subject: 'Your Monthly ProjectOye Summary',
                p_data: {
                    user_name: user.full_name || 'User',
                    month: new Date().toLocaleDateString('en-US', { month: 'long' }),
                    projects_created: projectsCreated,
                    tasks_completed: tasksCompleted,
                    hours_tracked: hoursTracked,
                    team_size: teamSize,
                    dashboard_url: `${window.location.origin}/dashboard`,
                },
            });
        }
    },

    /**
     * Feature announcement
     */
    async featureAnnouncement(userId: string, featureName: string, description: string, learnMoreUrl: string) {
        await supabase.rpc('create_notification', {
            p_user_id: userId,
            p_type: 'feature',
            p_priority: 'low',
            p_title: `New: ${featureName}`,
            p_message: description,
            p_action_url: learnMoreUrl,
            p_action_label: 'Learn More',
            p_expires_hours: 720, // 30 days
        });
    },

    /**
     * Inactive user reminder (30 days)
     */
    async inactiveUserReminder(userId: string, lastActiveDate: string) {
        const { data: user } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', userId)
            .single();

        if (user) {
            await supabase.rpc('queue_email', {
                p_user_id: userId,
                p_template: 'inactive_reminder',
                p_recipients: [{ email: user.email, name: user.full_name || 'User' }],
                p_subject: 'We Miss You at ProjectOye!',
                p_data: {
                    user_name user.full_name || 'User',
                    last_active: lastActiveDate,
                    dashboard_url: `${window.location.origin}/dashboard`,
                    whats_new_url: `${window.location.origin}/whats-new`,
                },
            });
        }
    },

    /**
     * Subscription upgraded
     */
    async subscriptionUpgraded(
        userId: string,
        oldTier: string,
        newTier: string,
        newPrice: number,
        prorationAmount: number,
        currency: string
    ) {
        await supabase.rpc('create_notification', {
            p_user_id: userId,
            p_type: 'billing',
            p_priority: 'low',
            p_title: 'Subscription Upgraded',
            p_message: `Welcome to ${newTier}! Your new features are now active.`,
            p_action_url: '/dashboard',
            p_action_label: 'Explore Features',
            p_expires_hours: 168,
        });

        const { data: user } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', userId)
            .single();

        if (user) {
            await supabase.rpc('queue_email', {
                p_user_id: userId,
                p_template: 'upgrade_success',
                p_recipients: [{ email: user.email, name: user.full_name || 'User' }],
                p_subject: `Welcome to ${newTier}!`,
                p_data: {
                    user_name: user.full_name || 'User',
                    old_tier: oldTier,
                    new_tier: newTier,
                    new_price: (newPrice / 100).toFixed(2),
                    proration_amount: (prorationAmount / 100).toFixed(2),
                    currency: currency.toUpperCase(),
                    dashboard_url: `${window.location.origin}/dashboard`,
                },
            });
        }
    },

    /**
     * Milestone achievement
     */
    async milestoneAchieved(userId: string, milestone: string, description: string) {
        await supabase.rpc('create_notification', {
            p_user_id: userId,
            p_type: 'engagement',
            p_priority: 'low',
            p_title: `🎉 ${milestone} Achieved!`,
            p_message: description,
            p_action_url: '/dashboard',
            p_expires_hours: 168,
        });
    },
};
