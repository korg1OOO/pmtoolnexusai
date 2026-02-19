/**
 * speech-to-text Edge Function
 *
 * Receives a raw audio file (multipart/form-data, field name "audio")
 * and transcribes it using OpenAI Whisper API.
 *
 * Environment variables required:
 *   OPENAI_API_KEY — your OpenAI key (set via `supabase secrets set OPENAI_API_KEY=...`)
 *
 * Request: POST with multipart/form-data body
 *   - audio: Blob  (audio/webm, audio/mp4, audio/ogg, audio/wav, etc.)
 *   - language?: string  (optional ISO-639-1 language code, e.g. "en")
 *
 * Response (200):
 *   { transcript: string }
 *
 * Response (error):
 *   { error: string }
 */

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    if (req.method !== "POST") {
        return new Response(
            JSON.stringify({ error: "Method not allowed — use POST" }),
            { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    try {
        const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
        if (!OPENAI_API_KEY) {
            return new Response(
                JSON.stringify({ error: "Speech-to-text not configured — OPENAI_API_KEY missing" }),
                { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Parse incoming multipart form data
        let formData: FormData;
        try {
            formData = await req.formData();
        } catch {
            return new Response(
                JSON.stringify({ error: "Invalid request — expected multipart/form-data with 'audio' field" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const audioBlob = formData.get("audio");
        if (!audioBlob || !(audioBlob instanceof File || audioBlob instanceof Blob)) {
            return new Response(
                JSON.stringify({ error: "Missing 'audio' field in form data" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const language = formData.get("language")?.toString() ?? "en";

        // Build multipart/form-data for Whisper API
        const whisperForm = new FormData();
        // Whisper requires a filename with extension so it can detect the codec
        const audioFile = new File([audioBlob], "audio.webm", { type: "audio/webm" });
        whisperForm.append("file", audioFile);
        whisperForm.append("model", "whisper-1");
        whisperForm.append("language", language);
        whisperForm.append("response_format", "json");

        const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${OPENAI_API_KEY}`,
                // Note: do NOT set Content-Type here — browser/Deno sets it with the boundary
            },
            body: whisperForm,
        });

        if (!whisperRes.ok) {
            const errBody = await whisperRes.text();
            console.error("Whisper API error:", whisperRes.status, errBody);

            if (whisperRes.status === 429) {
                return new Response(
                    JSON.stringify({ error: "Speech-to-text service is busy — please try again" }),
                    { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }
            if (whisperRes.status === 413) {
                return new Response(
                    JSON.stringify({ error: "Audio file too large — maximum is 25 MB" }),
                    { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            return new Response(
                JSON.stringify({ error: `Transcription failed (${whisperRes.status})` }),
                { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const result = await whisperRes.json();
        const transcript: string = result.text ?? "";

        return new Response(
            JSON.stringify({ transcript }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (err: any) {
        console.error("speech-to-text error:", err);
        return new Response(
            JSON.stringify({ error: err.message ?? "Internal server error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
