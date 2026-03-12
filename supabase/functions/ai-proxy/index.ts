/**
 * ai-proxy Edge Function
 * 
 * Proxies client-side AI requests through the Lovable AI gateway,
 * keeping LOVABLE_API_KEY server-side and out of the browser bundle.
 * 
 * Request body:
 *   { model, prompt, maxTokens?, temperature? }
 * 
 * Response:
 *   { content, usage: { prompt_tokens, completion_tokens, total_tokens } }
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

    try {
        const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
        if (!LOVABLE_API_KEY) {
            return new Response(
                JSON.stringify({ error: "AI service not configured — LOVABLE_API_KEY missing" }),
                { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const { model, prompt, maxTokens, temperature } = await req.json();

        if (!prompt) {
            return new Response(
                JSON.stringify({ error: "prompt is required" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Map model names to gateway identifiers
        const resolveModel = (m?: string): string => {
            if (!m) return "google/gemini-3-flash-preview";
            if (m.startsWith("gpt-")) return m; // OpenAI models pass through as-is
            if (m.startsWith("claude-")) return `anthropic/${m}`;
            if (m.startsWith("gemini-")) return `google/${m}`;
            return m;
        };

        const modelId = resolveModel(model);

        const aiResponse = await fetch(
            "https://ai.gateway.lovable.dev/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${LOVABLE_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: modelId,
                    messages: [{ role: "user", content: prompt }],
                    max_tokens: maxTokens ?? 1024,
                    temperature: temperature ?? 0.7,
                }),
            }
        );

        if (!aiResponse.ok) {
            const errText = await aiResponse.text();
            console.error("AI gateway error:", aiResponse.status, errText);

            if (aiResponse.status === 429) {
                return new Response(
                    JSON.stringify({ error: "AI service is busy — please retry in a moment" }),
                    { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }
            if (aiResponse.status === 402) {
                return new Response(
                    JSON.stringify({ error: "AI credits exhausted" }),
                    { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            return new Response(
                JSON.stringify({ error: `AI gateway error: ${aiResponse.status}` }),
                { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const data = await aiResponse.json();
        const choice = data.choices?.[0];
        const usage = data.usage ?? {};

        return new Response(
            JSON.stringify({
                content: choice?.message?.content ?? "",
                usage: {
                    prompt_tokens: usage.prompt_tokens ?? 0,
                    completion_tokens: usage.completion_tokens ?? 0,
                    total_tokens: usage.total_tokens ?? 0,
                },
            }),
            {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    } catch (err: any) {
        console.error("ai-proxy error:", err);
        return new Response(
            JSON.stringify({ error: err.message ?? "Internal error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
