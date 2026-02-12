/**
 * Email Notification Service
 * Sends transactional emails via Resend
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'notifications@projectoye.com';

const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'content-type',
            },
        });
    }

    try {
        const { type, data } = await req.json();

        let emailSent = false;

        switch (type) {
            case 'subscription_created':
                emailSent = await sendSubscriptionCreatedEmail(data);
                break;
            case 'payment_failed':
                emailSent = await sendPaymentFailedEmail(data);
                break;
            case 'license_activated':
                emailSent = await sendLicenseActivatedEmail(data);
                break;
            default:
                throw new Error(`Unknown email type: ${type}`);
        }

        return new Response(JSON.stringify({ success: emailSent }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        console.error('Email error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
});

async function sendSubscriptionCreatedEmail(data: {
    email: string;
    name: string;
    tier: string;
    amount: number;
}) {
    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .tier-badge { display: inline-block; background: #10b981; color: white; padding: 6px 12px; border-radius: 4px; font-weight: bold; text-transform: uppercase; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to ProjectOye ${data.tier.toUpperCase()}!</h1>
          </div>
          <div class="content">
            <p>Hi ${data.name},</p>
            <p>Thank you for subscribing to <span class="tier-badge">${data.tier}</span> plan!</p>
            <p><strong>Subscription Details:</strong></p>
            <ul>
              <li>Plan: ${data.tier.charAt(0).toUpperCase() + data.tier.slice(1)}</li>
              <li>Amount: $${data.amount}/month</li>
              <li>Status: Active</li>
            </ul>
            <p>You now have access to all premium features!</p>
            <a href="https://projectoye.com/dashboard" class="button">Go to Dashboard</a>
            <p>If you have any questions, feel free to reach out to our support team.</p>
          </div>
          <div class="footer">
            <p>ProjectOye | Building the future of AI content</p>
          </div>
        </div>
      </body>
    </html>
  `;

    return await sendEmail({
        to: data.email,
        subject: `Welcome to ProjectOye ${data.tier.toUpperCase()}! 🎉`,
        html,
    });
}

async function sendPaymentFailedEmail(data: {
    email: string;
    name: string;
    amount: number;
    nextRetry: string;
}) {
    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ef4444; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Payment Failed</h1>
          </div>
          <div class="content">
            <p>Hi ${data.name},</p>
            <p>We were unable to process your recent payment of <strong>$${data.amount}</strong>.</p>
            <div class="warning">
              <p><strong>What this means:</strong></p>
              <ul>
                <li>Your subscription is still active for now</li>
                <li>We'll retry the payment on ${new Date(data.nextRetry).toLocaleDateString()}</li>
                <li>If payment continues to fail, your subscription may be cancelled</li>
              </ul>
            </div>
            <p><strong>What you can do:</strong></p>
            <ol>
              <li>Update your payment method in billing settings</li>
              <li>Ensure your card has sufficient funds</li>
              <li>Contact your bank if the issue persists</li>
            </ol>
            <a href="https://projectoye.com/billing" class="button">Update Payment Method</a>
            <p>If you believe this is an error, please contact our support team immediately.</p>
          </div>
          <div class="footer">
            <p>ProjectOye | Building the future of AI content</p>
          </div>
        </div>
      </body>
    </html>
  `;

    return await sendEmail({
        to: data.email,
        subject: '⚠️ Payment Failed - Action Required',
        html,
    });
}

async function sendLicenseActivatedEmail(data: {
    email: string;
    name: string;
    licenseKey: string;
    licenseType: string;
    deviceName: string;
}) {
    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .license-box { background: #1f2937; color: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0; font-family: monospace; text-align: center; font-size: 18px; letter-spacing: 2px; }
          .info-box { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ License Key Activated!</h1>
          </div>
          <div class="content">
            <p>Hi ${data.name},</p>
            <p>Your license key has been successfully activated on <strong>${data.deviceName}</strong>.</p>
            <div class="license-box">
              ${data.licenseKey}
            </div>
            <div class="info-box">
              <p><strong>License Details:</strong></p>
              <ul>
                <li>Type: ${data.licenseType.charAt(0).toUpperCase() + data.licenseType.slice(1)}</li>
                <li>Device: ${data.deviceName}</li>
                <li>Activated: ${new Date().toLocaleString()}</li>
              </ul>
            </div>
            <p><strong>Important:</strong> If you did not activate this license, please contact support immediately.</p>
            <p>Thank you for using ProjectOye!</p>
          </div>
          <div class="footer">
            <p>ProjectOye | Building the future of AI content</p>
          </div>
        </div>
      </body>
    </html>
  `;

    return await sendEmail({
        to: data.email,
        subject: '✅ License Key Activated Successfully',
        html,
    });
}

async function sendEmail(params: {
    to: string;
    subject: string;
    html: string;
}) {
    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: FROM_EMAIL,
            to: params.to,
            subject: params.subject,
            html: params.html,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Resend API error: ${error}`);
    }

    return true;
}
