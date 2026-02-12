import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Encrypt API Key Edge Function
 * 
 * Encrypts sensitive API keys server-side using AES-256-GCM
 * before storing in database.
 * 
 * Security: Encryption key stored in Supabase secrets, never exposed to client
 */
serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { plaintext } = await req.json();

        if (!plaintext || typeof plaintext !== 'string') {
            return new Response(
                JSON.stringify({ error: 'Invalid plaintext provided' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Get encryption key from environment (set via Supabase secrets)
        const encryptionKeyHex = Deno.env.get('API_KEY_ENCRYPTION_KEY');

        if (!encryptionKeyHex) {
            console.error('API_KEY_ENCRYPTION_KEY not set in environment');
            return new Response(
                JSON.stringify({ error: 'Encryption key not configured' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Convert hex key to Uint8Array
        const encryptionKey = new Uint8Array(
            encryptionKeyHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
        );

        // Generate random IV (Initialization Vector)
        const iv = crypto.getRandomValues(new Uint8Array(12));

        // Import key for AES-GCM
        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            encryptionKey,
            { name: 'AES-GCM' },
            false,
            ['encrypt']
        );

        // Encrypt the plaintext
        const encoder = new TextEncoder();
        const plaintextBytes = encoder.encode(plaintext);

        const encryptedBytes = await crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: iv,
            },
            cryptoKey,
            plaintextBytes
        );

        // Combine IV + encrypted data for storage
        const combined = new Uint8Array(iv.length + encryptedBytes.byteLength);
        combined.set(iv, 0);
        combined.set(new Uint8Array(encryptedBytes), iv.length);

        // Convert to base64 for storage
        const base64Encrypted = btoa(String.fromCharCode(...combined));

        return new Response(
            JSON.stringify({
                encrypted: base64Encrypted,
                algorithm: 'AES-256-GCM',
            }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );

    } catch (error) {
        console.error('Encryption error:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Encryption failed' }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    }
});
