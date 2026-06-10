import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SendEmailRequest {
  accountId: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  replyToMessageId?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const requestData: SendEmailRequest = await req.json();

    // Validate required fields
    if (!requestData.accountId || !requestData.to || requestData.to.length === 0) {
      throw new Error("Account ID and recipients are required");
    }

    // Get account details
    const { data: account, error: accountError } = await supabase
      .from("email_accounts")
      .select("*")
      .eq("id", requestData.accountId)
      .single();

    if (accountError || !account) {
      throw new Error("Email account not found");
    }

    if (!account.smtp_host) {
      throw new Error("SMTP settings not configured for this account");
    }

    console.log(`Sending email from ${account.email_address} to ${requestData.to.join(", ")}`);

    // Note: Deno doesn't have native SMTP support
    // In production, you would use an SMTP library or email service
    
    // For demonstration, we'll create a record of the sent email
    const messageId = `<${crypto.randomUUID()}@${account.smtp_host}>`;
    
    // Get the sent folder
    const { data: sentFolder } = await supabase
      .from("email_folders")
      .select("id")
      .eq("account_id", requestData.accountId)
      .eq("folder_type", "sent")
      .single();

    if (sentFolder) {
      // Store the sent email
      await supabase.from("emails").insert({
        account_id: requestData.accountId,
        folder_id: sentFolder.id,
        message_id: messageId,
        thread_id: requestData.replyToMessageId || messageId,
        in_reply_to: requestData.replyToMessageId || null,
        subject: requestData.subject,
        from_address: account.email_address,
        from_name: account.display_name,
        to_addresses: requestData.to.map(email => ({ email })),
        cc_addresses: (requestData.cc || []).map(email => ({ email })),
        bcc_addresses: (requestData.bcc || []).map(email => ({ email })),
        body_text: requestData.body,
        body_html: `<p>${requestData.body.replace(/\n/g, '<br>')}</p>`,
        snippet: requestData.body.slice(0, 100),
        is_read: true,
        sent_at: new Date().toISOString(),
        received_at: new Date().toISOString(),
      });
    }

    // In a real implementation, you would:
    // 1. Connect to the SMTP server
    // 2. Authenticate with the stored credentials
    // 3. Send the email using SMTP protocol
    // 4. Handle delivery status and errors

    console.log(`Email logged for account: ${account.email_address}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        messageId,
        message: "Email recorded successfully. Note: Actual SMTP sending requires additional SMTP library integration.",
        note: "To enable actual email sending, integrate with an SMTP service or email API (like SendGrid, SES, or direct SMTP)."
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Failed to send email" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
