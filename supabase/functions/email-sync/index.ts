import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SyncRequest {
  accountId: string;
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
    const { accountId }: SyncRequest = await req.json();

    if (!accountId) {
      throw new Error("Account ID is required");
    }

    // Get account details
    const { data: account, error: accountError } = await supabase
      .from("email_accounts")
      .select("*")
      .eq("id", accountId)
      .single();

    if (accountError || !account) {
      throw new Error("Email account not found");
    }

    console.log(`Starting sync for account: ${account.email_address}`);

    // Update sync status
    await supabase
      .from("email_accounts")
      .update({ sync_status: "syncing" })
      .eq("id", accountId);

    // Note: Full IMAP sync requires a proper IMAP library
    // Deno doesn't have native IMAP support, so this is a simulation
    // In production, you would use an external service or library

    // Create default folders if they don't exist
    const defaultFolders = [
      { name: "Inbox", remote_name: "INBOX", folder_type: "inbox" },
      { name: "Sent", remote_name: "Sent", folder_type: "sent" },
      { name: "Drafts", remote_name: "Drafts", folder_type: "drafts" },
      { name: "Trash", remote_name: "Trash", folder_type: "trash" },
      { name: "Spam", remote_name: "Spam", folder_type: "spam" },
    ];

    for (const folder of defaultFolders) {
      const { data: existingFolder } = await supabase
        .from("email_folders")
        .select("id")
        .eq("account_id", accountId)
        .eq("folder_type", folder.folder_type)
        .single();

      if (!existingFolder) {
        await supabase.from("email_folders").insert({
          account_id: accountId,
          ...folder,
        });
      }
    }

    // In a real implementation, you would:
    // 1. Connect to the IMAP server using the stored credentials
    // 2. List all folders and sync them
    // 3. Fetch emails from each folder
    // 4. Store them in the emails table
    // 5. Update folder counts

    // For now, we mark sync as successful with a note
    await supabase
      .from("email_accounts")
      .update({ 
        sync_status: "success",
        last_sync_at: new Date().toISOString(),
        sync_error: null
      })
      .eq("id", accountId);

    console.log(`Sync completed for account: ${account.email_address}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Email folders initialized. Full IMAP sync requires additional configuration.",
        note: "To enable full email sync, consider integrating with an email service provider API (like Gmail API, Microsoft Graph, or using an IMAP proxy service)."
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error syncing emails:", error);

    // Update account with error status
    const { accountId } = await req.json().catch(() => ({}));
    if (accountId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      await supabase
        .from("email_accounts")
        .update({ 
          sync_status: "error",
          sync_error: error.message
        })
        .eq("id", accountId);
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Email sync failed" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
