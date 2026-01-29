import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface OAuthRequest {
  action: "get_auth_url" | "exchange_code" | "refresh_token";
  accountId?: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  tenantId?: string;
  code?: string;
  refreshToken?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const request: OAuthRequest = await req.json();
    const tenantId = request.tenantId || "common";

    if (request.action === "get_auth_url") {
      const scopes = [
        "https://graph.microsoft.com/Mail.Read",
        "https://graph.microsoft.com/Mail.Send",
        "https://graph.microsoft.com/Mail.ReadWrite",
        "https://graph.microsoft.com/User.Read",
        "offline_access",
      ];

      const authUrl = new URL(
        `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`
      );
      authUrl.searchParams.set("client_id", request.clientId);
      authUrl.searchParams.set("redirect_uri", request.redirectUri);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", scopes.join(" "));
      authUrl.searchParams.set("response_mode", "query");

      return new Response(
        JSON.stringify({ url: authUrl.toString() }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (request.action === "exchange_code") {
      if (!request.code) {
        throw new Error("Authorization code is required");
      }

      const tokenResponse = await fetch(
        `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: request.clientId,
            client_secret: request.clientSecret,
            code: request.code,
            grant_type: "authorization_code",
            redirect_uri: request.redirectUri,
            scope: "https://graph.microsoft.com/.default offline_access",
          }),
        }
      );

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok) {
        throw new Error(tokenData.error_description || "Token exchange failed");
      }

      // Get user email from Graph API
      const userInfoResponse = await fetch(
        "https://graph.microsoft.com/v1.0/me",
        {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        }
      );

      const userInfo = await userInfoResponse.json();

      return new Response(
        JSON.stringify({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_in: tokenData.expires_in,
          email: userInfo.mail || userInfo.userPrincipalName,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (request.action === "refresh_token") {
      if (!request.refreshToken) {
        throw new Error("Refresh token is required");
      }

      const tokenResponse = await fetch(
        `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: request.clientId,
            client_secret: request.clientSecret,
            refresh_token: request.refreshToken,
            grant_type: "refresh_token",
            scope: "https://graph.microsoft.com/.default offline_access",
          }),
        }
      );

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok) {
        throw new Error(tokenData.error_description || "Token refresh failed");
      }

      // Update the account with new token
      if (request.accountId) {
        const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
        await supabase
          .from("email_accounts")
          .update({
            oauth_access_token: tokenData.access_token,
            oauth_refresh_token: tokenData.refresh_token || request.refreshToken,
            oauth_token_expires_at: expiresAt.toISOString(),
          })
          .eq("id", request.accountId);
      }

      return new Response(
        JSON.stringify({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_in: tokenData.expires_in,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    throw new Error("Invalid action");
  } catch (error: any) {
    console.error("Microsoft OAuth error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "OAuth failed" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
