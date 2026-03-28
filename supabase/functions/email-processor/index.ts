// Supabase Edge Function: email-processor
// Processes queued emails and sends them via email service

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Email service configuration (choose one)
const EMAIL_PROVIDER = Deno.env.get('EMAIL_PROVIDER') || 'resend'; // resend, sendgrid, postmark
const EMAIL_API_KEY = Deno.env.get('EMAIL_API_KEY');
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@kiroxys.com';

serve(async (req) => {
    try {
        // Fetch pending emails
        const { data: emails, error: fetchError } = await supabase
            .from('email_queue')
            .select('*')
            .eq('status', 'pending')
            .lte('scheduled_for', new Date().toISOString())
            .lt('attempts', 'max_attempts')
            .limit(10); // Process 10 at a time

        if (fetchError) throw fetchError;

        if (!emails || emails.length === 0) {
            return new Response(JSON.stringify({ processed: 0 }), { status: 200 });
        }

        let successCount = 0;
        let failureCount = 0;

        for (const email of emails) {
            try {
                // Get template
                const { data: template } = await supabase
                    .from('email_templates')
                    .select('*')
                    .eq('id', email.template)
                    .single();

                if (!template) {
                    throw new Error(`Template ${email.template} not found`);
                }

                // Render subject with variables
                const subject = renderTemplate(email.subject, email.data);

                // Send email based on provider
                await sendEmail(
                    email.recipients,
                    subject,
                    email.data,
                    template
                );

                // Mark as sent
                await supabase
                    .from('email_queue')
                    .update({
                        status: 'sent',
                        sent_at: new Date().toISOString(),
                    })
                    .eq('id', email.id);

                successCount++;
            } catch (error: any) {
                // Mark as failed or increment attempt
                const newAttempts = email.attempts + 1;
                const status = newAttempts >= email.max_attempts ? 'failed' : 'pending';

                await supabase
                    .from('email_queue')
                    .update({
                        status,
                        attempts: newAttempts,
                        error_message: error.message,
                    })
                    .eq('id', email.id);

                failureCount++;
                console.error(`Failed to send email ${email.id}:`, error);
            }
        }

        return new Response(
            JSON.stringify({
                processed: emails.length,
                success: successCount,
                failed: failureCount,
            }),
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Email processor error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});

/**
 * Render template with variables
 */
function renderTemplate(template: string, data: Record<string, any>): string {
    let result = template;
    for (const [key, value] of Object.entries(data)) {
        result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }
    return result;
}

/**
 * Send email via configured provider
 */
async function sendEmail(
    recipients: { email: string; name: string }[],
    subject: string,
    data: Record<string, any>,
    template: any
) {
    switch (EMAIL_PROVIDER) {
        case 'resend':
            await sendViaResend(recipients, subject, data, template);
            break;
        case 'sendgrid':
            await sendViaSendGrid(recipients, subject, data, template);
            break;
        case 'postmark':
            await sendViaPostmark(recipients, subject, data, template);
            break;
        default:
            throw new Error(`Unknown email provider: ${EMAIL_PROVIDER}`);
    }
}

/**
 * Send via Resend
 */
async function sendViaResend(
    recipients: { email: string; name: string }[],
    subject: string,
    data: Record<string, any>,
    template: any
) {
    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${EMAIL_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: FROM_EMAIL,
            to: recipients.map(r => r.email),
            subject,
            html: renderTemplate(template.html_template || '', data),
            text: renderTemplate(template.text_template || '', data),
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Resend error: ${JSON.stringify(error)}`);
    }
}

/**
 * Send via SendGrid
 */
async function sendViaSendGrid(
    recipients: { email: string; name: string }[],
    subject: string,
    data: Record<string, any>,
    template: any
) {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${EMAIL_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            personalizations: [
                {
                    to: recipients.map(r => ({ email: r.email, name: r.name })),
                },
            ],
            from: { email: FROM_EMAIL },
            subject,
            content: [
                { type: 'text/plain', value: renderTemplate(template.text_template || '', data) },
                { type: 'text/html', value: renderTemplate(template.html_template || '', data) },
            ],
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`SendGrid error: ${JSON.stringify(error)}`);
    }
}

/**
 * Send via Postmark
 */
async function sendViaPostmark(
    recipients: { email: string; name: string }[],
    subject: string,
    data: Record<string, any>,
    template: any
) {
    const response = await fetch('https://api.postmarkapp.com/email', {
        method: 'POST',
        headers: {
            'X-Postmark-Server-Token': EMAIL_API_KEY!,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            From: FROM_EMAIL,
            To: recipients.map(r => r.email).join(','),
            Subject: subject,
            HtmlBody: renderTemplate(template.html_template || '', data),
            TextBody: renderTemplate(template.text_template || '', data),
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Postmark error: ${JSON.stringify(error)}`);
    }
}
