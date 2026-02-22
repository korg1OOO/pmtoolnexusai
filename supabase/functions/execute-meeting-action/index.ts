/**
 * execute-meeting-action/index.ts
 *
 * Executes approved meeting-related AI actions.
 * Supports: create_tasks_from_action_items, send_mom_email
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getPendingAction, updatePendingActionStatus } from "../_shared/confirmationGate.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    try {
        const { pendingActionId } = await req.json();
        if (!pendingActionId) {
            return new Response(JSON.stringify({ error: "pendingActionId is required" }), {
                status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const authHeader = req.headers.get("Authorization");
        let userId: string | null = null;
        if (authHeader) {
            const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
            userId = user?.id ?? null;
        }

        const pending = await getPendingAction(supabase, pendingActionId);
        if (!pending || pending.status !== "approved") {
            return new Response(JSON.stringify({ error: "Pending action not found or not approved" }), {
                status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const { tool_name, params } = pending;
        let result: unknown;

        if (tool_name === "create_tasks_from_action_items") {
            // Fetch meeting to get project_id
            const { data: meeting } = await supabase.from("meetings").select("project_id").eq("id", params.meeting_id).single();
            const projectId = meeting?.project_id;

            const items = params.action_items as any[];
            const rows = items.map((item: any) => ({
                title: item.title,
                description: `Action item from meeting ${params.meeting_id}`,
                project_id: projectId,
                status: "todo",
                priority: "medium",
                due_date: item.due_date ?? null,
                created_by: userId,
                source: "ai_meeting",
                source_id: params.meeting_id,
            }));

            const { data, error } = await supabase.from("tasks").insert(rows).select("id, title");
            if (error) throw error;

            // Update meeting with task references
            await supabase.from("meetings").update({ action_items_created: true, updated_at: new Date().toISOString() }).eq("id", params.meeting_id);

            result = { tasks_created: data, count: data?.length ?? 0 };

        } else if (tool_name === "create_meeting") {
            const { data, error } = await supabase.from("meetings").insert({
                title: params.title,
                project_id: params.project_id,
                start_time: params.start_time,
                end_time: params.end_time ?? null,
                organizer_id: userId,
            }).select("id, title").single();
            if (error) throw error;

            // Optionally insert attendees if attendee_ids provided
            const attendeeIds = params.attendee_ids as string[] | undefined;
            if (attendeeIds && attendeeIds.length > 0 && data.id) {
                const attendees = attendeeIds.map(id => ({
                    meeting_id: data.id,
                    user_id: id,
                    status: "accepted"
                }));
                await supabase.from("meeting_attendees").insert(attendees);
            }

            result = { meeting_created: data };

        } else if (tool_name === "send_mom_email") {
            // Delegate to existing send-email edge function
            const res = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${supabaseKey}`,
                    apikey: supabaseKey,
                },
                body: JSON.stringify({
                    type: "mom",
                    meeting_id: params.meeting_id,
                    recipient_ids: params.recipient_ids,
                    sent_by: userId,
                }),
            });
            const emailResult = res.ok ? await res.json() : { error: await res.text() };
            result = emailResult;

        } else {
            return new Response(JSON.stringify({ error: `Unsupported tool: ${tool_name}` }), {
                status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        await updatePendingActionStatus(supabase, pendingActionId, "executed");

        return new Response(JSON.stringify({ success: true, tool_name, result }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (err: any) {
        console.error("[execute-meeting-action]", err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
