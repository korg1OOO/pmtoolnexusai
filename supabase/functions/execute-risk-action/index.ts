/**
 * execute-risk-action/index.ts
 *
 * Executes approved risk-related AI actions.
 * Supports: create_risk, update_risk_status, escalate_risk
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

        if (tool_name === "create_risk") {
            const riskScore = (params.probability as number) * (params.impact as number);
            const { data, error } = await supabase.from("risks").insert({
                project_id: params.project_id,
                title: params.title,
                description: params.description ?? null,
                probability: params.probability,
                impact: params.impact,
                risk_score: riskScore,
                category: params.category ?? "general",
                status: "open",
                owner_id: params.owner_id ?? userId,
                mitigation_plan: params.mitigation_plan ?? null,
                created_by: userId,
            }).select("id, title, risk_score").single();
            if (error) throw error;
            result = { created: data };

        } else if (tool_name === "update_risk_status") {
            const { data, error } = await supabase.from("risks").update({
                status: params.status,
                resolution_note: params.resolution_note ?? null,
                updated_at: new Date().toISOString(),
            }).eq("id", params.risk_id).select("id, status").single();
            if (error) throw error;
            result = { updated: data };

        } else if (tool_name === "escalate_risk") {
            // Update risk status + create notification
            await supabase.from("risks").update({ status: "escalated", updated_at: new Date().toISOString() }).eq("id", params.risk_id);
            const { data, error } = await supabase.from("notifications").insert({
                user_id: params.escalate_to_user_id,
                title: "Risk Escalated",
                message: params.message,
                type: "risk_escalation",
                risk_id: params.risk_id,
                created_by: userId,
            }).select("id").single();
            if (error) throw error;
            result = { escalated: true, notification_id: data?.id };

        } else {
            return new Response(JSON.stringify({ error: `Unsupported tool: ${tool_name}` }), {
                status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        await updatePendingActionStatus(supabase, pendingActionId, "executed");
        await supabase.from("audit_logs").insert({
            user_id: userId, action: `ai_agent_executed_${tool_name}`,
            resource_type: "risk", resource_id: pendingActionId,
            details: { tool_name, result },
        }).then(() => { }).catch(() => { });

        return new Response(JSON.stringify({ success: true, tool_name, result }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (err: any) {
        console.error("[execute-risk-action]", err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
