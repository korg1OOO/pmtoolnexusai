import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { meetingId } = await req.json();

    if (!meetingId) {
      return new Response(
        JSON.stringify({ error: "meetingId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch meeting with notes and transcript
    const { data: meeting, error: meetingError } = await supabase
      .from("meetings")
      .select(`
        *,
        meeting_notes (*),
        meeting_participants (*),
        meeting_agenda_items (*)
      `)
      .eq("id", meetingId)
      .single();

    if (meetingError || !meeting) {
      return new Response(
        JSON.stringify({ error: "Meeting not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build context for AI
    const context = buildMeetingContext(meeting);

    // Call AI Gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI Gateway not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an expert project management AI assistant that analyzes meeting content to extract key intelligence. 
            
Your task is to analyze meeting notes, transcripts, and agenda items to extract:
1. Decisions made (with type: irreversible, reversible, temporary)
2. Action items (with owner, due date, priority)
3. Risks identified (with probability, impact, mitigation suggestions)
4. Scope changes (additions, removals, modifications)
5. Conflicts or disagreements
6. Key topics discussed (with sentiment analysis)
7. Overall summary
8. Next steps

Be precise and extract only what is explicitly stated or can be strongly inferred from the content.
Assign confidence scores (0-1) to each extraction based on clarity in the source material.`,
          },
          {
            role: "user",
            content: context,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_meeting_intelligence",
              description: "Extract structured intelligence from meeting content",
              parameters: {
                type: "object",
                properties: {
                  summary: {
                    type: "string",
                    description: "A comprehensive 2-3 sentence summary of the meeting",
                  },
                  decisions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        description: { type: "string" },
                        decision_type: { type: "string", enum: ["irreversible", "reversible", "temporary"] },
                        made_by: { type: "string" },
                        impact: { type: "string", enum: ["high", "medium", "low"] },
                        timestamp_in_meeting: { type: "string" },
                        confidence: { type: "number" },
                      },
                      required: ["description", "decision_type", "confidence"],
                    },
                  },
                  action_items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        owner_name: { type: "string" },
                        due_date: { type: "string" },
                        priority: { type: "string", enum: ["critical", "high", "medium", "low"] },
                        source: { type: "string", enum: ["explicit", "inferred"] },
                        confidence: { type: "number" },
                      },
                      required: ["title", "owner_name", "confidence"],
                    },
                  },
                  risks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        probability: { type: "string", enum: ["critical", "high", "medium", "low"] },
                        impact: { type: "string", enum: ["critical", "high", "medium", "low"] },
                        category: { type: "string" },
                        suggested_mitigation: { type: "string" },
                        source: { type: "string", enum: ["explicit", "inferred"] },
                        confidence: { type: "number" },
                      },
                      required: ["title", "confidence"],
                    },
                  },
                  scope_changes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        description: { type: "string" },
                        change_type: { type: "string", enum: ["addition", "removal", "modification"] },
                        impact_area: { type: "string", enum: ["schedule", "budget", "resources", "quality"] },
                        magnitude: { type: "string", enum: ["major", "minor"] },
                        requires_approval: { type: "boolean" },
                        confidence: { type: "number" },
                      },
                      required: ["description", "change_type", "confidence"],
                    },
                  },
                  conflicts: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        description: { type: "string" },
                        parties: { type: "array", items: { type: "string" } },
                        severity: { type: "string", enum: ["high", "medium", "low"] },
                        conflict_type: { type: "string", enum: ["resource", "priority", "scope", "timeline", "technical", "stakeholder"] },
                        suggested_resolution: { type: "string" },
                        confidence: { type: "number" },
                      },
                      required: ["description", "confidence"],
                    },
                  },
                  key_topics: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        topic: { type: "string" },
                        duration_estimate: { type: "number" },
                        participants: { type: "array", items: { type: "string" } },
                        sentiment: { type: "string", enum: ["positive", "neutral", "negative", "mixed"] },
                      },
                      required: ["topic", "sentiment"],
                    },
                  },
                  sentiment: {
                    type: "object",
                    properties: {
                      overall: { type: "string", enum: ["positive", "neutral", "negative", "mixed"] },
                      engagement: { type: "number" },
                      concerns: { type: "array", items: { type: "string" } },
                      positives: { type: "array", items: { type: "string" } },
                    },
                    required: ["overall", "engagement"],
                  },
                  next_steps: {
                    type: "array",
                    items: { type: "string" },
                  },
                  overall_confidence: {
                    type: "number",
                    description: "Overall confidence in the extraction (0-1)",
                  },
                },
                required: ["summary", "overall_confidence"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_meeting_intelligence" } },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", errorText);
      return new Response(
        JSON.stringify({ error: "AI processing failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResult = await aiResponse.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      return new Response(
        JSON.stringify({ error: "No extraction result from AI" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const extracted = JSON.parse(toolCall.function.arguments);

    // Save extracted data to database
    await saveExtractedData(supabase, meetingId, extracted);

    // Update meeting with AI summary and metadata
    await supabase
      .from("meetings")
      .update({
        ai_summary: extracted.summary,
        ai_confidence: extracted.overall_confidence,
        ai_processed_at: new Date().toISOString(),
        ai_sentiment: extracted.sentiment,
        ai_key_topics: extracted.key_topics || [],
        ai_next_steps: extracted.next_steps || [],
        capture_confidence: extracted.overall_confidence > 0.8 ? "high" : extracted.overall_confidence > 0.5 ? "medium" : "low",
      })
      .eq("id", meetingId);

    return new Response(
      JSON.stringify({ success: true, extracted }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing meeting:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildMeetingContext(meeting: any): string {
  const parts: string[] = [];

  parts.push(`# Meeting: ${meeting.title}`);
  parts.push(`Date: ${meeting.date}`);
  parts.push(`Time: ${meeting.start_time} - ${meeting.end_time || "ongoing"}`);
  parts.push(`Type: ${meeting.purpose_type}`);
  
  if (meeting.purpose_description) {
    parts.push(`\n## Purpose\n${meeting.purpose_description}`);
  }

  if (meeting.expected_outcomes?.length > 0) {
    parts.push(`\n## Expected Outcomes\n${meeting.expected_outcomes.map((o: string) => `- ${o}`).join("\n")}`);
  }

  if (meeting.meeting_participants?.length > 0) {
    parts.push(`\n## Participants`);
    meeting.meeting_participants.forEach((p: any) => {
      parts.push(`- ${p.name} (${p.role})`);
    });
  }

  if (meeting.meeting_agenda_items?.length > 0) {
    parts.push(`\n## Agenda`);
    meeting.meeting_agenda_items.forEach((a: any, i: number) => {
      parts.push(`${i + 1}. ${a.title}${a.description ? `: ${a.description}` : ""}`);
    });
  }

  if (meeting.transcript_text) {
    parts.push(`\n## Transcript\n${meeting.transcript_text}`);
  }

  if (meeting.meeting_notes?.length > 0) {
    parts.push(`\n## Meeting Notes`);
    meeting.meeting_notes.forEach((n: any) => {
      const timestamp = n.timestamp_in_meeting ? `[${n.timestamp_in_meeting}] ` : "";
      const type = n.note_type !== "note" ? `[${n.note_type.toUpperCase()}] ` : "";
      parts.push(`${timestamp}${type}${n.content}`);
    });
  }

  return parts.join("\n");
}

async function saveExtractedData(supabase: any, meetingId: string, extracted: any) {
  // Save decisions
  if (extracted.decisions?.length > 0) {
    const decisions = extracted.decisions.map((d: any) => ({
      meeting_id: meetingId,
      description: d.description,
      decision_type: d.decision_type,
      made_by: d.made_by,
      impact: d.impact || "medium",
      timestamp_in_meeting: d.timestamp_in_meeting,
      source: "inferred",
      ai_confidence: d.confidence,
    }));
    await supabase.from("meeting_decisions").insert(decisions);
  }

  // Save action items
  if (extracted.action_items?.length > 0) {
    const actions = extracted.action_items.map((a: any) => ({
      meeting_id: meetingId,
      title: a.title,
      description: a.description,
      owner_name: a.owner_name,
      due_date: a.due_date,
      priority: a.priority || "medium",
      source: a.source || "inferred",
      ai_confidence: a.confidence,
    }));
    await supabase.from("meeting_action_items").insert(actions);
  }

  // Save risks
  if (extracted.risks?.length > 0) {
    const risks = extracted.risks.map((r: any) => ({
      meeting_id: meetingId,
      title: r.title,
      description: r.description,
      probability: r.probability || "medium",
      impact: r.impact || "medium",
      category: r.category,
      suggested_mitigation: r.suggested_mitigation,
      source: r.source || "inferred",
      ai_confidence: r.confidence,
    }));
    await supabase.from("meeting_risks").insert(risks);
  }

  // Save scope changes
  if (extracted.scope_changes?.length > 0) {
    const scopeChanges = extracted.scope_changes.map((s: any) => ({
      meeting_id: meetingId,
      description: s.description,
      change_type: s.change_type,
      impact_area: s.impact_area,
      magnitude: s.magnitude,
      requires_approval: s.requires_approval ?? true,
      ai_confidence: s.confidence,
    }));
    await supabase.from("meeting_scope_changes").insert(scopeChanges);
  }

  // Save conflicts
  if (extracted.conflicts?.length > 0) {
    const conflicts = extracted.conflicts.map((c: any) => ({
      meeting_id: meetingId,
      description: c.description,
      parties: c.parties || [],
      severity: c.severity || "medium",
      conflict_type: c.conflict_type,
      suggested_resolution: c.suggested_resolution,
      ai_confidence: c.confidence,
    }));
    await supabase.from("meeting_conflicts").insert(conflicts);
  }
}
