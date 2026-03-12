import type { NotificationData } from '@/types/analytics';

// ============================================================================
// SLACK SERVICE
// Handles sending messages to Slack via webhooks
// ============================================================================

/**
 * Slack send result
 */
export interface SlackResult {
    success: boolean;
    error?: string;
}

/**
 * Send message to Slack via webhook
 * 
 * @param webhookUrl - Slack webhook URL
 * @param message - Message payload (text or blocks)
 * @returns Result with success status
 */
export async function sendSlackMessage(
    webhookUrl: string,
    message: string | object
): Promise<SlackResult> {
    try {
        if (!webhookUrl) {
            return {
                success: false,
                error: 'Slack webhook URL not configured',
            };
        }

        // Prepare payload
        const payload = typeof message === 'string'
            ? { text: message }
            : message;

        // Send to Slack webhook
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Slack webhook error:', errorText);
            return {
                success: false,
                error: `Slack API error: ${response.status}`,
            };
        }

        return { success: true };
    } catch (error) {
        console.error('Error sending Slack message:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Create Slack blocks for approval assigned notification
 */
export function createApprovalAssignedBlocks(data: NotificationData): object {
    return {
        blocks: [
            {
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: '🔔 New Approval Required',
                    emoji: true,
                },
            },
            {
                type: 'section',
                fields: [
                    {
                        type: 'mrkdwn',
                        text: `*Title:*\n${data.approvalTitle || 'N/A'}`,
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Entity:*\n${data.entityName || 'N/A'}`,
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Due Date:*\n${data.dueDate || 'N/A'}`,
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Requested By:*\n${data.requesterName || 'N/A'}`,
                    },
                ],
            },
            {
                type: 'divider',
            },
            {
                type: 'context',
                elements: [
                    {
                        type: 'mrkdwn',
                        text: `Type: ${data.entityType || 'N/A'} | Priority: High`,
                    },
                ],
            },
            ...(data.approvalUrl
                ? [
                    {
                        type: 'actions',
                        elements: [
                            {
                                type: 'button',
                                text: {
                                    type: 'plain_text',
                                    text: 'View Approval',
                                    emoji: true,
                                },
                                url: data.approvalUrl,
                                style: 'primary',
                            },
                        ],
                    },
                ]
                : []),
        ],
    };
}

/**
 * Create Slack blocks for approval approved notification
 */
export function createApprovalApprovedBlocks(data: NotificationData): object {
    return {
        blocks: [
            {
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: '✅ Approval Approved',
                    emoji: true,
                },
            },
            {
                type: 'section',
                fields: [
                    {
                        type: 'mrkdwn',
                        text: `*Title:*\n${data.approvalTitle || 'N/A'}`,
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Approved By:*\n${data.approverName || 'N/A'}`,
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Approved At:*\n${data.approvedAt || 'N/A'}`,
                    },
                ],
            },
            ...(data.comments
                ? [
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: `*Comments:*\n${data.comments}`,
                        },
                    },
                ]
                : []),
            {
                type: 'context',
                elements: [
                    {
                        type: 'mrkdwn',
                        text: '✓ This approval has been completed',
                    },
                ],
            },
        ],
    };
}

/**
 * Create Slack blocks for approval rejected notification
 */
export function createApprovalRejectedBlocks(data: NotificationData): object {
    return {
        blocks: [
            {
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: '❌ Approval Rejected',
                    emoji: true,
                },
            },
            {
                type: 'section',
                fields: [
                    {
                        type: 'mrkdwn',
                        text: `*Title:*\n${data.approvalTitle || 'N/A'}`,
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Rejected By:*\n${data.approverName || 'N/A'}`,
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Rejected At:*\n${data.rejectedAt || 'N/A'}`,
                    },
                ],
            },
            ...(data.comments
                ? [
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: `*Reason:*\n${data.comments}`,
                        },
                    },
                ]
                : []),
            {
                type: 'context',
                elements: [
                    {
                        type: 'mrkdwn',
                        text: '⚠️ This approval was rejected',
                    },
                ],
            },
        ],
    };
}

/**
 * Create Slack blocks for delegation received notification
 */
export function createDelegationReceivedBlocks(data: NotificationData): object {
    return {
        blocks: [
            {
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: '🔄 Approval Delegated to You',
                    emoji: true,
                },
            },
            {
                type: 'section',
                fields: [
                    {
                        type: 'mrkdwn',
                        text: `*Title:*\n${data.approvalTitle || 'N/A'}`,
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Delegated By:*\n${data.delegatorName || 'N/A'}`,
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Type:*\n${data.delegationType || 'N/A'}`,
                    },
                ],
            },
            ...(data.delegationReason
                ? [
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: `*Reason:*\n${data.delegationReason}`,
                        },
                    },
                ]
                : []),
            {
                type: 'divider',
            },
            {
                type: 'context',
                elements: [
                    {
                        type: 'mrkdwn',
                        text: 'Please review and take action on this approval',
                    },
                ],
            },
            ...(data.approvalUrl
                ? [
                    {
                        type: 'actions',
                        elements: [
                            {
                                type: 'button',
                                text: {
                                    type: 'plain_text',
                                    text: 'View Approval',
                                    emoji: true,
                                },
                                url: data.approvalUrl,
                                style: 'primary',
                            },
                        ],
                    },
                ]
                : []),
        ],
    };
}

/**
 * Create Slack blocks for admin override notification
 */
export function createAdminOverrideBlocks(data: NotificationData): object {
    return {
        blocks: [
            {
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: '⚡ Admin Override',
                    emoji: true,
                },
            },
            {
                type: 'section',
                fields: [
                    {
                        type: 'mrkdwn',
                        text: `*Title:*\n${data.approvalTitle || 'N/A'}`,
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Admin:*\n${data.adminName || 'N/A'}`,
                    },
                ],
            },
            ...(data.overrideReason
                ? [
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: `*Reason:*\n${data.overrideReason}`,
                        },
                    },
                ]
                : []),
            {
                type: 'context',
                elements: [
                    {
                        type: 'mrkdwn',
                        text: '⚠️ This approval was automatically approved by an administrator',
                    },
                ],
            },
        ],
    };
}

/**
 * Render Slack message from template
 * Handles both text templates and JSON block templates
 */
export function renderSlackTemplate(
    template: string,
    data: NotificationData
): string | object {
    try {
        // Try to parse as JSON (for block templates)
        const parsed = JSON.parse(template);

        // Recursively replace variables in the parsed object
        const rendered = JSON.stringify(parsed);
        let result = rendered;

        Object.keys(data).forEach((key) => {
            const placeholder = `{{${key}}}`;
            const value = data[key] || '';
            result = result.replace(new RegExp(placeholder, 'g'), String(value));
        });

        // Remove any remaining placeholders
        result = result.replace(/\{\{[^}]+\}\}/g, '');

        return JSON.parse(result);
    } catch {
        // Not JSON, treat as plain text template
        let rendered = template;

        Object.keys(data).forEach((key) => {
            const placeholder = `{{${key}}}`;
            const value = data[key] || '';
            rendered = rendered.replace(new RegExp(placeholder, 'g'), String(value));
        });

        // Remove any remaining placeholders
        rendered = rendered.replace(/\{\{[^}]+\}\}/g, '');

        return rendered;
    }
}

/**
 * Test Slack webhook configuration
 */
export async function sendTestSlackMessage(webhookUrl: string): Promise<SlackResult> {
    const message = {
        blocks: [
            {
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: '✅ Slack Integration Test',
                    emoji: true,
                },
            },
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: 'Your ProjectOye Slack integration is configured correctly! You will receive governance notifications in this channel.',
                },
            },
            {
                type: 'divider',
            },
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: '*Notification Types:*\n• Approval assignments\n• Approval approvals and rejections\n• Delegation notifications\n• Admin overrides',
                },
            },
            {
                type: 'context',
                elements: [
                    {
                        type: 'mrkdwn',
                        text: 'Sent from ProjectOye Governance System',
                    },
                ],
            },
        ],
    };

    return sendSlackMessage(webhookUrl, message);
}
