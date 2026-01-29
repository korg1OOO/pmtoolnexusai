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
    const { meetingId, templateId } = await req.json();

    if (!meetingId) {
      return new Response(
        JSON.stringify({ error: "meetingId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch meeting with all related data
    const { data: meeting, error: meetingError } = await supabase
      .from("meetings")
      .select(`
        *,
        meeting_participants (*),
        meeting_agenda_items (*),
        meeting_decisions (*),
        meeting_action_items (*),
        meeting_risks (*),
        meeting_notes (*)
      `)
      .eq("id", meetingId)
      .single();

    if (meetingError || !meeting) {
      return new Response(
        JSON.stringify({ error: "Meeting not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch template if specified
    let template = null;
    if (templateId) {
      const { data: templateData } = await supabase
        .from("mom_templates")
        .select("*")
        .eq("id", templateId)
        .single();
      template = templateData;
    }

    // Build MoM content
    const momContent = generateMoMContent(meeting, template);

    // Call AI to polish and format the MoM
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    let finalContent = momContent;
    
    if (LOVABLE_API_KEY) {
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
              content: `You are an expert at writing professional Minutes of Meeting (MoM) documents. 
Your task is to polish and format the provided meeting content into a clear, professional document.

Guidelines:
- Use clear, professional language
- Maintain consistent formatting
- Ensure all action items have clear owners and due dates
- Highlight key decisions prominently
- Keep the document concise but complete
- Use bullet points for clarity
- Include section headers

Output the polished MoM in Markdown format.`,
            },
            {
              role: "user",
              content: `Please polish and format these meeting minutes:\n\n${momContent}`,
            },
          ],
        }),
      });

      if (aiResponse.ok) {
        const aiResult = await aiResponse.json();
        finalContent = aiResult.choices?.[0]?.message?.content || momContent;
      }
    }

    // Update meeting with MoM content
    await supabase
      .from("meetings")
      .update({
        mom_generated: true,
        mom_content: finalContent,
        mom_template_id: templateId || null,
      })
      .eq("id", meetingId);

    return new Response(
      JSON.stringify({ success: true, content: finalContent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating MoM:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateMoMContent(meeting: any, template: any): string {
  const sections: string[] = [];
  
  const dateStr = new Date(meeting.date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Header
  sections.push(`# Minutes of Meeting\n`);
  sections.push(`## ${meeting.title}\n`);
  sections.push(`**Date:** ${dateStr}`);
  sections.push(`**Time:** ${meeting.start_time}${meeting.end_time ? ` - ${meeting.end_time}` : ""}`);
  sections.push(`**Type:** ${meeting.purpose_type?.replace("-", " ").toUpperCase()}`);
  if (meeting.location) sections.push(`**Location:** ${meeting.location}`);
  if (meeting.meeting_link) sections.push(`**Meeting Link:** ${meeting.meeting_link}`);
  sections.push("");

  // Purpose
  if (meeting.purpose_description) {
    sections.push(`## Meeting Purpose\n`);
    sections.push(meeting.purpose_description);
    sections.push("");
  }

  // Attendees
  if (meeting.meeting_participants?.length > 0) {
    sections.push(`## Attendees\n`);
    const attendees = meeting.meeting_participants;
    
    const decisionMakers = attendees.filter((p: any) => p.role === "decision-maker");
    const others = attendees.filter((p: any) => p.role !== "decision-maker");

    if (decisionMakers.length > 0) {
      sections.push("**Decision Makers:**");
      decisionMakers.forEach((p: any) => {
        const status = p.attended ? "✓ Attended" : p.attendance_status;
        sections.push(`- ${p.name} (${p.role}) - ${status}`);
      });
    }

    if (others.length > 0) {
      sections.push("\n**Participants:**");
      others.forEach((p: any) => {
        const status = p.attended ? "✓ Attended" : p.attendance_status;
        sections.push(`- ${p.name} (${p.role}) - ${status}`);
      });
    }
    sections.push("");
  }

  // Agenda
  if (meeting.meeting_agenda_items?.length > 0) {
    sections.push(`## Agenda\n`);
    meeting.meeting_agenda_items
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .forEach((item: any, i: number) => {
        const duration = item.duration_minutes ? ` (${item.duration_minutes} min)` : "";
        const presenter = item.presenter_name ? ` - Presenter: ${item.presenter_name}` : "";
        sections.push(`${i + 1}. ${item.title}${duration}${presenter}`);
        if (item.description) sections.push(`   ${item.description}`);
      });
    sections.push("");
  }

  // AI Summary
  if (meeting.ai_summary) {
    sections.push(`## Executive Summary\n`);
    sections.push(meeting.ai_summary);
    sections.push("");
  }

  // Decisions
  if (meeting.meeting_decisions?.length > 0) {
    sections.push(`## Decisions Made\n`);
    meeting.meeting_decisions.forEach((d: any, i: number) => {
      const impactBadge = d.impact === "high" ? "🔴" : d.impact === "medium" ? "🟡" : "🟢";
      const typeBadge = d.decision_type === "irreversible" ? "⚠️ IRREVERSIBLE" : d.decision_type === "temporary" ? "⏳ TEMPORARY" : "";
      sections.push(`### Decision ${i + 1} ${impactBadge} ${typeBadge}`);
      sections.push(d.description);
      if (d.made_by) sections.push(`**Made by:** ${d.made_by}`);
      if (d.timestamp_in_meeting) sections.push(`**Time:** ${d.timestamp_in_meeting}`);
      sections.push("");
    });
  }

  // Action Items
  if (meeting.meeting_action_items?.length > 0) {
    sections.push(`## Action Items\n`);
    sections.push("| # | Action | Owner | Due Date | Priority | Status |");
    sections.push("|---|--------|-------|----------|----------|--------|");
    meeting.meeting_action_items.forEach((a: any, i: number) => {
      const dueDate = a.due_date ? new Date(a.due_date).toLocaleDateString() : "TBD";
      const priority = a.priority?.toUpperCase() || "MEDIUM";
      const status = a.status?.replace("-", " ").toUpperCase() || "PENDING";
      sections.push(`| ${i + 1} | ${a.title} | ${a.owner_name} | ${dueDate} | ${priority} | ${status} |`);
    });
    sections.push("");
  }

  // Risks Identified
  if (meeting.meeting_risks?.length > 0) {
    sections.push(`## Risks Identified\n`);
    meeting.meeting_risks.forEach((r: any, i: number) => {
      sections.push(`### Risk ${i + 1}: ${r.title}`);
      if (r.description) sections.push(r.description);
      sections.push(`- **Probability:** ${r.probability?.toUpperCase()}`);
      sections.push(`- **Impact:** ${r.impact?.toUpperCase()}`);
      if (r.category) sections.push(`- **Category:** ${r.category}`);
      if (r.suggested_mitigation) sections.push(`- **Suggested Mitigation:** ${r.suggested_mitigation}`);
      sections.push("");
    });
  }

  // Next Steps
  if (meeting.ai_next_steps?.length > 0) {
    sections.push(`## Next Steps\n`);
    meeting.ai_next_steps.forEach((step: string) => {
      sections.push(`- ${step}`);
    });
    sections.push("");
  }

  // Footer
  sections.push("---");
  sections.push(`*Minutes generated on ${new Date().toLocaleDateString("en-US", { 
    year: "numeric", 
    month: "long", 
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })}*`);

  if (meeting.ai_confidence) {
    sections.push(`*AI Confidence: ${Math.round(meeting.ai_confidence * 100)}%*`);
  }

  return sections.join("\n");
}
