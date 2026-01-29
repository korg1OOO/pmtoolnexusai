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

    if (account.provider_type !== "gmail") {
      throw new Error("Account is not a Gmail account");
    }

    // Check if token needs refresh
    let accessToken = account.oauth_access_token;
    const tokenExpires = new Date(account.oauth_token_expires_at);
    
    if (tokenExpires < new Date()) {
      // Refresh the token
      const refreshResponse = await supabase.functions.invoke("gmail-oauth", {
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
    const defaultFolders = [
      { name: "Inbox", remote_name: "INBOX", folder_type: "inbox" },
      { name: "Sent", remote_name: "SENT", folder_type: "sent" },
      { name: "Drafts", remote_name: "DRAFT", folder_type: "drafts" },
      { name: "Trash", remote_name: "TRASH", folder_type: "trash" },
      { name: "Spam", remote_name: "SPAM", folder_type: "spam" },
    ];

    for (const folder of defaultFolders) {
      const { data: existingFolder } = await supabase
        .from("email_folders")
        .select("id")
        .eq("account_id", accountId)
        .eq("folder_type", folder.folder_type)
        .single();

      if (!existingFolder) {
        const { data: newFolder } = await supabase
          .from("email_folders")
          .insert({ account_id: accountId, ...folder })
          .select("id")
          .single();
        folderMap[folder.remote_name] = newFolder?.id;
      } else {
        folderMap[folder.remote_name] = existingFolder.id;
      }
    }

    // Fetch messages from Gmail API
    const listResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const listData = await listResponse.json();

    if (!listResponse.ok) {
      throw new Error(listData.error?.message || "Failed to fetch messages");
    }

    const messages = listData.messages || [];
    let syncedCount = 0;

    for (const msgRef of messages.slice(0, 25)) {
      // Limit to 25 for performance
      try {
        // Check if already exists
        const { data: existing } = await supabase
          .from("emails")
          .select("id")
          .eq("message_id", msgRef.id)
          .eq("account_id", accountId)
          .single();

        if (existing) continue;

        // Fetch full message
        const msgResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgRef.id}?format=full`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        const msgData = await msgResponse.json();
        if (!msgResponse.ok) continue;

        // Parse headers
        const headers = msgData.payload?.headers || [];
        const getHeader = (name: string) =>
          headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value;

        const fromHeader = getHeader("From") || "";
        const fromMatch = fromHeader.match(/(?:"?([^"]*)"?\s)?<?([^>]*)>?/);
        const fromName = fromMatch?.[1] || null;
        const fromAddress = fromMatch?.[2] || fromHeader;

        // Parse To addresses
        const toHeader = getHeader("To") || "";
        const toAddresses = toHeader.split(",").map((addr: string) => {
          const match = addr.trim().match(/(?:"?([^"]*)"?\s)?<?([^>]*)>?/);
          return { name: match?.[1], email: match?.[2] || addr.trim() };
        });

        // Determine folder
        const labelIds = msgData.labelIds || [];
        let folderId = folderMap["INBOX"];
        if (labelIds.includes("SENT")) folderId = folderMap["SENT"];
        else if (labelIds.includes("DRAFT")) folderId = folderMap["DRAFT"];
        else if (labelIds.includes("TRASH")) folderId = folderMap["TRASH"];
        else if (labelIds.includes("SPAM")) folderId = folderMap["SPAM"];

        // Extract body
        let bodyText = "";
        let bodyHtml = "";

        const extractBody = (part: any) => {
          if (part.mimeType === "text/plain" && part.body?.data) {
            bodyText = atob(part.body.data.replace(/-/g, "+").replace(/_/g, "/"));
          } else if (part.mimeType === "text/html" && part.body?.data) {
            bodyHtml = atob(part.body.data.replace(/-/g, "+").replace(/_/g, "/"));
          } else if (part.parts) {
            part.parts.forEach(extractBody);
          }
        };

        if (msgData.payload) {
          extractBody(msgData.payload);
        }

        // Insert email
        await supabase.from("emails").insert({
          account_id: accountId,
          folder_id: folderId,
          message_id: msgRef.id,
          thread_id: msgData.threadId,
          subject: getHeader("Subject"),
          from_address: fromAddress,
          from_name: fromName,
          to_addresses: toAddresses,
          cc_addresses: [],
          bcc_addresses: [],
          body_text: bodyText,
          body_html: bodyHtml,
          snippet: msgData.snippet,
          is_read: !labelIds.includes("UNREAD"),
          is_starred: labelIds.includes("STARRED"),
          received_at: new Date(parseInt(msgData.internalDate)).toISOString(),
        });

        syncedCount++;
      } catch (err) {
        console.error(`Error syncing message ${msgRef.id}:`, err);
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
        total: messages.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Gmail sync error:", error);

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
