import type { NotificationData } from '@/types/analytics';

// ============================================================================
// EMAIL SERVICE
// Handles sending emails via Resend API
// ============================================================================

/**
 * Email send result
 */
export interface EmailResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

/**
 * Send email via Resend API
 * 
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param body - Email body (HTML or plain text)
 * @param metadata - Optional metadata for tracking
 * @returns Result with success status and message ID
 */
export async function sendEmail(
    to: string,
    subject: string,
    body: string,
    metadata?: any
): Promise<EmailResult> {
    try {
        // Get Resend API key from environment
        const apiKey = import.meta.env.VITE_RESEND_API_KEY;

        if (!apiKey) {
            console.error('VITE_RESEND_API_KEY not configured');
            return {
                success: false,
                error: 'Email service not configured',
            };
        }

        // Call Resend API
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'Kiroxys <notifications@kiroxys.com>',
                to: [to],
                subject,
                html: formatEmailBody(body),
                tags: metadata ? [
                    { name: 'event_type', value: metadata.eventType || 'unknown' },
                    { name: 'event_id', value: metadata.eventId || 'unknown' },
                ] : undefined,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Resend API error:', data);
            return {
                success: false,
                error: data.message || 'Failed to send email',
            };
        }

        return {
            success: true,
            messageId: data.id,
        };
    } catch (error) {
        console.error('Error sending email:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Send bulk emails
 * 
 * @param recipients - Array of recipient email addresses
 * @param subject - Email subject
 * @param body - Email body
 * @returns Results for each email
 */
export async function sendBulkEmail(
    recipients: Array<{ email: string; subject: string; body: string }>,
    metadata?: any
): Promise<EmailResult[]> {
    const results: EmailResult[] = [];

    // Send emails sequentially to avoid rate limits
    for (const recipient of recipients) {
        const result = await sendEmail(
            recipient.email,
            recipient.subject,
            recipient.body,
            metadata
        );
        results.push(result);

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
}

/**
 * Format email body with HTML wrapper
 * Adds basic styling and structure
 */
function formatEmailBody(body: string): string {
    // Check if body is already HTML
    if (body.trim().startsWith('<')) {
        return body;
    }

    // Convert plain text to HTML with basic formatting
    const htmlBody = body
        .split('\n\n')
        .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
        .join('\n');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 8px 8px 0 0;
            text-align: center;
        }
        .content {
            background: #ffffff;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-top: none;
        }
        .footer {
            background: #f9fafb;
            padding: 20px;
            border: 1px solid #e5e7eb;
            border-top: none;
            border-radius: 0 0 8px 8px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
        }
        .button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin: 10px 0;
        }
        p {
            margin: 0 0 16px 0;
        }
        .divider {
            border-top: 1px solid #e5e7eb;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 style="margin: 0; font-size: 24px;">Kiroxys</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Governance Notification</p>
    </div>
    <div class="content">
        ${htmlBody}
    </div>
    <div class="footer">
        <p style="margin: 0 0 10px 0;">This is an automated notification from Kiroxys Governance System.</p>
        <p style="margin: 0;">© ${new Date().getFullYear()} Kiroxys. All rights reserved.</p>
    </div>
</body>
</html>
    `.trim();
}

/**
 * Create action button HTML
 */
export function createActionButton(label: string, url: string): string {
    return `<a href="${url}" class="button" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0;">${label}</a>`;
}

/**
 * Render email template with enhanced formatting
 */
export function renderEmailTemplate(
    template: string,
    data: NotificationData
): string {
    let rendered = template;

    // Replace variables
    Object.keys(data).forEach((key) => {
        const placeholder = `{{${key}}}`;
        const value = data[key] || '';
        rendered = rendered.replace(new RegExp(placeholder, 'g'), String(value));
    });

    // Add action buttons if URL is present
    if (data.approvalUrl) {
        const buttonHtml = createActionButton('View Approval', data.approvalUrl);
        rendered = rendered.replace('{{action_button}}', buttonHtml);
    }

    // Remove any remaining placeholders
    rendered = rendered.replace(/\{\{[^}]+\}\}/g, '');

    return rendered;
}

/**
 * Test email configuration
 * Sends a test email to verify setup
 */
export async function sendTestEmail(to: string): Promise<EmailResult> {
    return sendEmail(
        to,
        'Kiroxys - Email Configuration Test',
        `
<h2>Email Configuration Successful!</h2>

<p>This is a test email to confirm that your Kiroxys email notifications are configured correctly.</p>

<p>You will receive governance notifications at this email address for:</p>
<ul>
    <li>Approval assignments</li>
    <li>Approval approvals and rejections</li>
    <li>Delegation notifications</li>
    <li>Admin overrides</li>
</ul>

<p>You can manage your notification preferences in your account settings.</p>

<div class="divider"></div>

<p><strong>Next Steps:</strong></p>
<ol>
    <li>Configure your notification preferences</li>
    <li>Set up Slack integration (optional)</li>
    <li>Enable push notifications (optional)</li>
</ol>
        `,
        { eventType: 'test', eventId: 'test' }
    );
}
