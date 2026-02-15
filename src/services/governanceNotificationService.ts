import { supabase } from '@/lib/supabase';
import type {
    NotificationPreferences,
    NotificationLog,
    NotificationTemplate,
    NotificationData,
    NotificationFilters,
} from '@/types/analytics';

// ============================================================================
// GOVERNANCE NOTIFICATION SERVICE
// Handles notifications for governance events (approvals, delegations, overrides)
// ============================================================================

// ============================================================================
// NOTIFICATION PREFERENCES
// ============================================================================

/**
 * Get user notification preferences
 * Creates default preferences if none exist
 */
export async function getUserPreferences(
    userId: string
): Promise<NotificationPreferences | null> {
    try {
        const { data, error } = await supabase
            .from('notification_preferences')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            // If no preferences exist, create default ones
            if (error.code === 'PGRST116') {
                return await createDefaultPreferences(userId);
            }
            console.error('Error fetching notification preferences:', error);
            return null;
        }

        return mapPreferencesFromDb(data);
    } catch (error) {
        console.error('Error in getUserPreferences:', error);
        return null;
    }
}

/**
 * Create default notification preferences for a user
 */
async function createDefaultPreferences(
    userId: string
): Promise<NotificationPreferences | null> {
    try {
        const { data, error } = await supabase
            .from('notification_preferences')
            .insert({
                user_id: userId,
                email_enabled: true,
                slack_enabled: false,
                push_enabled: true,
                approval_assigned: true,
                approval_approved: true,
                approval_rejected: true,
                approval_delegated: true,
                delegation_received: true,
                delegation_revoked: false,
                admin_override: true,
                digest_enabled: false,
                digest_frequency: 'daily',
                digest_time: '09:00:00',
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating default preferences:', error);
            return null;
        }

        return mapPreferencesFromDb(data);
    } catch (error) {
        console.error('Error in createDefaultPreferences:', error);
        return null;
    }
}

/**
 * Update user notification preferences
 */
export async function updateUserPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
): Promise<boolean> {
    try {
        const dbPreferences = mapPreferencesToDb(preferences);

        const { error } = await supabase
            .from('notification_preferences')
            .update({
                ...dbPreferences,
                updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId);

        if (error) {
            console.error('Error updating notification preferences:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error in updateUserPreferences:', error);
        return false;
    }
}

// ============================================================================
// NOTIFICATION SENDING
// ============================================================================

/**
 * Send a notification to a user
 * Respects user preferences and sends via enabled channels
 */
export async function sendNotification(
    userId: string,
    eventType: string,
    eventId: string,
    data: NotificationData
): Promise<void> {
    try {
        // Get user preferences
        const preferences = await getUserPreferences(userId);
        if (!preferences) {
            console.warn('No preferences found for user:', userId);
            return;
        }

        // Check if user is subscribed to this event type
        if (!isEventSubscribed(preferences, eventType)) {
            console.log(`User ${userId} not subscribed to ${eventType}`);
            return;
        }

        // Send via enabled channels
        const channels: Array<'email' | 'slack' | 'push'> = [];
        if (preferences.emailEnabled) channels.push('email');
        if (preferences.slackEnabled && preferences.slackWebhookUrl) channels.push('slack');
        if (preferences.pushEnabled) channels.push('push');

        // Send notification for each channel
        for (const channel of channels) {
            await sendChannelNotification(userId, eventType, eventId, channel, data);
        }
    } catch (error) {
        console.error('Error in sendNotification:', error);
    }
}

/**
 * Send notification via specific channel
 */
async function sendChannelNotification(
    userId: string,
    eventType: string,
    eventId: string,
    channel: 'email' | 'slack' | 'push',
    data: NotificationData
): Promise<void> {
    try {
        // Get template for this event and channel
        const template = await getTemplate(eventType, channel);
        if (!template) {
            console.warn(`No template found for ${eventType} on ${channel}`);
            return;
        }

        // Render template with data
        const subject = renderTemplate(template.subjectTemplate, data);
        const body = renderTemplate(template.bodyTemplate, data);

        // Create notification log entry
        const { data: logEntry, error: logError } = await supabase
            .from('notification_log')
            .insert({
                user_id: userId,
                event_type: eventType,
                event_id: eventId,
                channel,
                subject,
                body,
                metadata: data,
                status: 'pending',
            })
            .select()
            .single();

        if (logError) {
            console.error('Error creating notification log:', logError);
            return;
        }

        // Actually send the notification via the channel
        if (channel === 'email') {
            await sendEmailNotification(logEntry.id, userId, subject, body, data);
        } else if (channel === 'slack') {
            await sendSlackNotification(logEntry.id, userId, subject, body, data, eventType);
        } else if (channel === 'push') {
            await sendPushNotificationToUser(logEntry.id, userId, subject, body, data);
        }
    } catch (error) {
        console.error('Error in sendChannelNotification:', error);
    }
}

/**
 * Send email notification
 */
async function sendEmailNotification(
    logId: string,
    userId: string,
    subject: string,
    body: string,
    data: NotificationData
): Promise<void> {
    try {
        // Import email service dynamically to avoid circular dependencies
        const { sendEmail } = await import('@/services/emailService');

        // Get user email from profiles
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', userId)
            .single();

        if (profileError || !profile?.email) {
            console.error('Error fetching user email:', profileError);
            await updateNotificationStatus(logId, 'failed', 'User email not found');
            return;
        }

        // Send email
        const result = await sendEmail(profile.email, subject, body, {
            eventType: data.eventType,
            eventId: data.eventId,
        });

        // Update notification log with result
        if (result.success) {
            await updateNotificationStatus(logId, 'sent', undefined, result.messageId);
        } else {
            await updateNotificationStatus(logId, 'failed', result.error);
        }
    } catch (error) {
        console.error('Error sending email notification:', error);
        await updateNotificationStatus(
            logId,
            'failed',
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}

/**
 * Send Slack notification
 */
async function sendSlackNotification(
    logId: string,
    userId: string,
    subject: string,
    body: string | object,
    data: NotificationData,
    eventType: string
): Promise<void> {
    try {
        // Import Slack service dynamically
        const { sendSlackMessage, renderSlackTemplate } = await import('@/services/slackService');

        // Get user's Slack webhook URL from preferences
        const preferences = await getUserPreferences(userId);
        if (!preferences?.slackWebhookUrl) {
            console.error('Slack webhook URL not configured for user');
            await updateNotificationStatus(logId, 'failed', 'Slack webhook URL not configured');
            return;
        }

        // Render template if body is a string (template), otherwise use as-is
        const message = typeof body === 'string'
            ? renderSlackTemplate(body, data)
            : body;

        // Send Slack message
        const result = await sendSlackMessage(preferences.slackWebhookUrl, message);

        // Update notification log with result
        if (result.success) {
            await updateNotificationStatus(logId, 'sent');
        } else {
            await updateNotificationStatus(logId, 'failed', result.error);
        }
    } catch (error) {
        console.error('Error sending Slack notification:', error);
        await updateNotificationStatus(
            logId,
            'failed',
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}

/**
 * Send push notification to user
 */
async function sendPushNotificationToUser(
    logId: string,
    userId: string,
    subject: string,
    body: string,
    data: NotificationData
): Promise<void> {
    try {
        // Import push service dynamically
        const { sendPushNotification } = await import('@/services/pushNotificationService');

        // Send push notification (browser-based, no server needed for now)
        const result = await sendPushNotification(subject, body, data);

        // Update notification log with result
        if (result.success) {
            await updateNotificationStatus(logId, 'sent');
        } else {
            await updateNotificationStatus(logId, 'failed', result.error);
        }
    } catch (error) {
        console.error('Error sending push notification:', error);
        await updateNotificationStatus(
            logId,
            'failed',
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}

/**
 * Update notification log status
 */
async function updateNotificationStatus(
    logId: string,
    status: 'sent' | 'failed',
    errorMessage?: string,
    messageId?: string
): Promise<void> {
    try {
        const updateData: any = {
            status,
            [status === 'sent' ? 'sent_at' : 'failed_at']: new Date().toISOString(),
        };

        if (errorMessage) {
            updateData.error_message = errorMessage;
        }

        if (messageId) {
            updateData.metadata = { messageId };
        }

        await supabase.from('notification_log').update(updateData).eq('id', logId);
    } catch (error) {
        console.error('Error updating notification status:', error);
    }
}

/**
 * Check if user is subscribed to an event type
 */
function isEventSubscribed(
    preferences: NotificationPreferences,
    eventType: string
): boolean {
    const eventMap: Record<string, keyof NotificationPreferences> = {
        approval_assigned: 'approvalAssigned',
        approval_approved: 'approvalApproved',
        approval_rejected: 'approvalRejected',
        approval_delegated: 'approvalDelegated',
        delegation_received: 'delegationReceived',
        delegation_revoked: 'delegationRevoked',
        admin_override: 'adminOverride',
    };

    const prefKey = eventMap[eventType];
    if (!prefKey) return false;

    return Boolean(preferences[prefKey]);
}

// ============================================================================
// NOTIFICATION HISTORY
// ============================================================================

/**
 * Get notification history for a user
 */
export async function getNotificationHistory(
    userId: string,
    filters?: NotificationFilters
): Promise<NotificationLog[]> {
    try {
        let query = supabase
            .from('notification_log')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        // Apply filters
        if (filters?.channel) {
            query = query.eq('channel', filters.channel);
        }
        if (filters?.status) {
            query = query.eq('status', filters.status);
        }
        if (filters?.eventType) {
            query = query.eq('event_type', filters.eventType);
        }
        if (filters?.startDate) {
            query = query.gte('created_at', filters.startDate.toISOString());
        }
        if (filters?.endDate) {
            query = query.lte('created_at', filters.endDate.toISOString());
        }

        // Pagination
        const limit = filters?.limit || 50;
        const offset = filters?.offset || 0;
        query = query.range(offset, offset + limit - 1);

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching notification history:', error);
            return [];
        }

        return (data || []).map(mapLogFromDb);
    } catch (error) {
        console.error('Error in getNotificationHistory:', error);
        return [];
    }
}

/**
 * Mark notification as opened
 */
export async function markNotificationOpened(notificationId: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('notification_log')
            .update({ opened_at: new Date().toISOString() })
            .eq('id', notificationId)
            .is('opened_at', null);

        if (error) {
            console.error('Error marking notification as opened:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error in markNotificationOpened:', error);
        return false;
    }
}

/**
 * Mark notification as clicked
 */
export async function markNotificationClicked(notificationId: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('notification_log')
            .update({ clicked_at: new Date().toISOString() })
            .eq('id', notificationId)
            .is('clicked_at', null);

        if (error) {
            console.error('Error marking notification as clicked:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error in markNotificationClicked:', error);
        return false;
    }
}

// ============================================================================
// TEMPLATES
// ============================================================================

/**
 * Get notification template
 */
async function getTemplate(
    eventType: string,
    channel: 'email' | 'slack' | 'push'
): Promise<NotificationTemplate | null> {
    try {
        const { data, error } = await supabase
            .from('notification_templates')
            .select('*')
            .eq('event_type', eventType)
            .eq('channel', channel)
            .single();

        if (error) {
            console.error('Error fetching template:', error);
            return null;
        }

        return mapTemplateFromDb(data);
    } catch (error) {
        console.error('Error in getTemplate:', error);
        return null;
    }
}

/**
 * Render template with data
 * Replaces {{variable}} placeholders with actual values
 */
function renderTemplate(template: string, data: NotificationData): string {
    let rendered = template;

    // Replace all {{variable}} with data values
    Object.keys(data).forEach((key) => {
        const placeholder = `{{${key}}}`;
        const value = data[key] || '';
        rendered = rendered.replace(new RegExp(placeholder, 'g'), String(value));
    });

    // Remove any remaining placeholders
    rendered = rendered.replace(/\{\{[^}]+\}\}/g, '');

    return rendered;
}

// ============================================================================
// MAPPING FUNCTIONS
// ============================================================================

function mapPreferencesFromDb(data: any): NotificationPreferences {
    return {
        id: data.id,
        userId: data.user_id,
        emailEnabled: data.email_enabled,
        slackEnabled: data.slack_enabled,
        pushEnabled: data.push_enabled,
        approvalAssigned: data.approval_assigned,
        approvalApproved: data.approval_approved,
        approvalRejected: data.approval_rejected,
        approvalDelegated: data.approval_delegated,
        delegationReceived: data.delegation_received,
        delegationRevoked: data.delegation_revoked,
        adminOverride: data.admin_override,
        slackWebhookUrl: data.slack_webhook_url,
        slackChannel: data.slack_channel,
        slackUserId: data.slack_user_id,
        digestEnabled: data.digest_enabled,
        digestFrequency: data.digest_frequency,
        digestTime: data.digest_time,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
    };
}

function mapPreferencesToDb(preferences: Partial<NotificationPreferences>): any {
    const dbPrefs: any = {};

    if (preferences.emailEnabled !== undefined) dbPrefs.email_enabled = preferences.emailEnabled;
    if (preferences.slackEnabled !== undefined) dbPrefs.slack_enabled = preferences.slackEnabled;
    if (preferences.pushEnabled !== undefined) dbPrefs.push_enabled = preferences.pushEnabled;
    if (preferences.approvalAssigned !== undefined) dbPrefs.approval_assigned = preferences.approvalAssigned;
    if (preferences.approvalApproved !== undefined) dbPrefs.approval_approved = preferences.approvalApproved;
    if (preferences.approvalRejected !== undefined) dbPrefs.approval_rejected = preferences.approvalRejected;
    if (preferences.approvalDelegated !== undefined) dbPrefs.approval_delegated = preferences.approvalDelegated;
    if (preferences.delegationReceived !== undefined) dbPrefs.delegation_received = preferences.delegationReceived;
    if (preferences.delegationRevoked !== undefined) dbPrefs.delegation_revoked = preferences.delegationRevoked;
    if (preferences.adminOverride !== undefined) dbPrefs.admin_override = preferences.adminOverride;
    if (preferences.slackWebhookUrl !== undefined) dbPrefs.slack_webhook_url = preferences.slackWebhookUrl;
    if (preferences.slackChannel !== undefined) dbPrefs.slack_channel = preferences.slackChannel;
    if (preferences.slackUserId !== undefined) dbPrefs.slack_user_id = preferences.slackUserId;
    if (preferences.digestEnabled !== undefined) dbPrefs.digest_enabled = preferences.digestEnabled;
    if (preferences.digestFrequency !== undefined) dbPrefs.digest_frequency = preferences.digestFrequency;
    if (preferences.digestTime !== undefined) dbPrefs.digest_time = preferences.digestTime;

    return dbPrefs;
}

function mapLogFromDb(data: any): NotificationLog {
    return {
        id: data.id,
        userId: data.user_id,
        eventType: data.event_type,
        eventId: data.event_id,
        channel: data.channel,
        subject: data.subject,
        body: data.body,
        metadata: data.metadata,
        status: data.status,
        sentAt: data.sent_at ? new Date(data.sent_at) : undefined,
        failedAt: data.failed_at ? new Date(data.failed_at) : undefined,
        errorMessage: data.error_message,
        openedAt: data.opened_at ? new Date(data.opened_at) : undefined,
        clickedAt: data.clicked_at ? new Date(data.clicked_at) : undefined,
        createdAt: new Date(data.created_at),
    };
}

function mapTemplateFromDb(data: any): NotificationTemplate {
    return {
        id: data.id,
        eventType: data.event_type,
        channel: data.channel,
        subjectTemplate: data.subject_template,
        bodyTemplate: data.body_template,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
    };
}
