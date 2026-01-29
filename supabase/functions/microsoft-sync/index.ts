import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SyncRequest {
  accountId: string;
  maxResults?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { accountId, maxResults = 50 }: SyncRequest = await req.json();

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

    if (account.provider_type !== "microsoft") {
      throw new Error("Account is not a Microsoft account");
    }

    // Check if token needs refresh
    let accessToken = account.oauth_access_token;
    const tokenExpires = new Date(account.oauth_token_expires_at);

    if (tokenExpires < new Date()) {
      const refreshResponse = await supabase.functions.invoke("microsoft-oauth", {
        body: {
          action: "refresh_token",
          accountId,
          clientId: account.oauth_client_id,
          clientSecret: account.oauth_client_secret,
          refreshToken: account.oauth_refresh_token,
        },
      });

      if (refreshResponse.error) {
        throw new Error("Failed to refresh token");
      }

      accessToken = refreshResponse.data.access_token;
    }

    // Update sync status
    await supabase
      .from("email_accounts")
      .update({ sync_status: "syncing" })
      .eq("id", accountId);

    // Create folders if they don't exist
    const folderMap: Record<string, string> = {};
    
    // Fetch mail folders from Graph API
    const foldersResponse = await fetch(
      "https://graph.microsoft.com/v1.0/me/mailFolders",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const foldersData = await foldersResponse.json();
    
    const folderTypeMap: Record<string, string> = {
      inbox: "inbox",
      sentitems: "sent",
      drafts: "drafts",
      deleteditems: "trash",
      junkemail: "spam",
      archive: "archive",
    };

    for (const folder of foldersData.value || []) {
      const folderType = folderTypeMap[folder.displayName.toLowerCase().replace(/\s/g, "")] || "custom";
      
      const { data: existingFolder } = await supabase
        .from("email_folders")
        .select("id")
        .eq("account_id", accountId)
        .eq("remote_name", folder.id)
        .single();

      if (!existingFolder) {
        const { data: newFolder } = await supabase
          .from("email_folders")
          .insert({
            account_id: accountId,
            name: folder.displayName,
            remote_name: folder.id,
            folder_type: folderType,
            unread_count: folder.unreadItemCount,
            total_count: folder.totalItemCount,
          })
          .select("id")
          .single();
        folderMap[folder.id] = newFolder?.id;
      } else {
        folderMap[folder.id] = existingFolder.id;
        // Update counts
        await supabase
          .from("email_folders")
          .update({
            unread_count: folder.unreadItemCount,
            total_count: folder.totalItemCount,
          })
          .eq("id", existingFolder.id);
      }
    }

    // Fetch messages from inbox
    const inboxFolderId = Object.keys(folderMap).find(
      (id) => foldersData.value?.find((f: any) => f.id === id)?.displayName.toLowerCase() === "inbox"
    );

    if (!inboxFolderId) {
      throw new Error("Could not find inbox folder");
    }

    const messagesResponse = await fetch(
      `https://graph.microsoft.com/v1.0/me/mailFolders/${inboxFolderId}/messages?$top=${maxResults}&$orderby=receivedDateTime desc`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const messagesData = await messagesResponse.json();

    if (!messagesResponse.ok) {
      throw new Error(messagesData.error?.message || "Failed to fetch messages");
    }

    let syncedCount = 0;

    for (const msg of messagesData.value || []) {
      try {
        // Check if already exists
        const { data: existing } = await supabase
          .from("emails")
          .select("id")
          .eq("message_id", msg.id)
          .eq("account_id", accountId)
          .single();

        if (existing) continue;

        // Parse addresses
        const toAddresses = (msg.toRecipients || []).map((r: any) => ({
          email: r.emailAddress.address,
          name: r.emailAddress.name,
        }));

        const ccAddresses = (msg.ccRecipients || []).map((r: any) => ({
          email: r.emailAddress.address,
          name: r.emailAddress.name,
        }));

        // Insert email
        await supabase.from("emails").insert({
          account_id: accountId,
          folder_id: folderMap[inboxFolderId],
          message_id: msg.id,
          thread_id: msg.conversationId,
          in_reply_to: msg.conversationIndex,
          subject: msg.subject,
          from_address: msg.from?.emailAddress?.address || "",
          from_name: msg.from?.emailAddress?.name,
          to_addresses: toAddresses,
          cc_addresses: ccAddresses,
          bcc_addresses: [],
          body_text: msg.body?.contentType === "text" ? msg.body.content : null,
          body_html: msg.body?.contentType === "html" ? msg.body.content : null,
          snippet: msg.bodyPreview,
          has_attachments: msg.hasAttachments,
          is_read: msg.isRead,
          is_starred: msg.flag?.flagStatus === "flagged",
          is_flagged: msg.importance === "high",
          received_at: msg.receivedDateTime,
          sent_at: msg.sentDateTime,
        });

        syncedCount++;
      } catch (err) {
        console.error(`Error syncing message ${msg.id}:`, err);
      }
    }

    // Update sync status
    await supabase
      .from("email_accounts")
      .update({
        sync_status: "success",
        last_sync_at: new Date().toISOString(),
        sync_error: null,
      })
      .eq("id", accountId);

    return new Response(
      JSON.stringify({
        success: true,
        synced: syncedCount,
        total: (messagesData.value || []).length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Microsoft sync error:", error);

    const { accountId } = await req.json().catch(() => ({}));
    if (accountId) {
      await supabase
        .from("email_accounts")
        .update({ sync_status: "error", sync_error: error.message })
        .eq("id", accountId);
    }

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
