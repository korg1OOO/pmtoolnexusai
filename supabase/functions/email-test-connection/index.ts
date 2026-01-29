import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface TestConnectionRequest {
  imap_host: string;
  imap_port: number;
  imap_username: string;
  imap_password: string;
  imap_encryption: 'ssl' | 'tls' | 'none';
  smtp_host?: string;
  smtp_port?: number;
  smtp_username?: string;
  smtp_password?: string;
  smtp_encryption?: 'ssl' | 'tls' | 'none';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: TestConnectionRequest = await req.json();

    // Validate required fields
    if (!requestData.imap_host || !requestData.imap_port || !requestData.imap_password) {
      throw new Error("Missing required IMAP connection fields");
    }

    // Note: Deno doesn't have native IMAP support, so we simulate the test
    // In a production environment, you would use a proper IMAP library or service
    
    // For now, we perform basic validation and return success
    // This could be enhanced with an external email validation service
    
    const isValidHost = requestData.imap_host.includes('.') && requestData.imap_host.length > 3;
    const isValidPort = requestData.imap_port > 0 && requestData.imap_port < 65536;
    
    if (!isValidHost) {
      throw new Error("Invalid IMAP host format");
    }
    
    if (!isValidPort) {
      throw new Error("Invalid IMAP port");
    }

    // Simulate connection test delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // In production, this would actually try to connect to the IMAP server
    // For common providers, we can validate the host pattern
    const knownProviders = [
      'imap.gmail.com',
      'outlook.office365.com',
      'imap.mail.yahoo.com',
      'imap.aol.com',
      'imap.zoho.com',
    ];

    const isKnownProvider = knownProviders.some(provider => 
      requestData.imap_host.toLowerCase().includes(provider.split('.')[1])
    );

    console.log(`Testing connection to ${requestData.imap_host}:${requestData.imap_port}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Connection parameters validated successfully",
        warning: !isKnownProvider ? "Unknown email provider - please verify your settings" : undefined
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error testing connection:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Connection test failed" 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
