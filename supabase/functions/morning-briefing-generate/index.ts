import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, enabledSections, projectData } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    // Build comprehensive prompt for AI analysis
    const systemPrompt = `You are an expert Project Management AI assistant generating a morning briefing report. 
Analyze the provided project data and generate actionable insights for each section requested.

IMPORTANT: Return a valid JSON object with the following structure for each section requested:
{
  "sections": {
    "[section-id]": {
      "summary": "Brief 1-2 sentence summary",
      "insights": ["insight 1", "insight 2", "insight 3"],
      "recommendations": ["recommendation 1", "recommendation 2"],
      "metrics": { "key": "value" },
      "confidence": 0.85
    }
  },
  "projectContext": {
    "projectName": "string",
    "healthStatus": "green|amber|red",
    "daysRemaining": number
  },
  "generatedAt": "ISO timestamp"
}

For AI-powered sections, provide specific actionable insights:
- ai-insights: Schedule predictions, bottleneck warnings, pattern recognition
- profit-loss: Calculate expected profit/loss based on burn rate, forecasts with scenarios
- schedule-slippage: Tasks deviating from baseline, critical path analysis
- budget-analysis: CV/SV analysis, burn rate, EAC/ETC calculations
- risk-assessment: Risk scoring, mitigation suggestions, escalation recommendations
- communication-intelligence: Sentiment analysis, communication patterns

Be specific, quantitative where possible, and actionable.`;

    const userPrompt = `Generate morning briefing insights for the following project data:

PROJECT DATA:
${JSON.stringify(projectData, null, 2)}

SECTIONS TO GENERATE:
${enabledSections.join(", ")}

Please analyze the data and provide insights for each enabled section.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse JSON from response (handle markdown code blocks if present)
    let briefingData;
    try {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/```\n?([\s\S]*?)\n?```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      briefingData = JSON.parse(jsonString.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Return a fallback structure
      briefingData = {
        sections: {},
        projectContext: {
          projectName: projectData?.name || "Unknown Project",
          healthStatus: "amber",
          daysRemaining: 0,
        },
        generatedAt: new Date().toISOString(),
        error: "Failed to parse AI insights. Please try again.",
      };
    }

    return new Response(JSON.stringify(briefingData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Morning briefing generation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
