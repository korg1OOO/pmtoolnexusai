import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { campaignId } = await req.json();

        if (!campaignId) {
            throw new Error('campaignId is required');
        }

        // Get campaign details
        const { data: campaign, error: campaignError } = await supabaseClient
            .from('marketing_campaigns')
            .select('*')
            .eq('id', campaignId)
            .single();

        if (campaignError) throw campaignError;
        if (!campaign) throw new Error('Campaign not found');

        // Update status to running
        await supabaseClient
            .from('marketing_campaigns')
            .update({
                status: 'running',
                started_at: new Date().toISOString()
            })
            .eq('id', campaignId);

        // Get target audience (simplified - would normally filter)
        const { data: users } = await supabaseClient
            .from('profiles')
            .select('id, email')
            .limit(1000); // Safety limit

        if (!users || users.length === 0) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: 'No recipients found',
                    campaign_id: campaignId
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Get A/B test variants
        const { data: variants } = await supabaseClient
            .from('ab_test_variants')
            .select('*')
            .eq('campaign_id', campaignId);

        // Create campaign recipients
        const recipients = users.map(user => {
            // Assign variant based on traffic percentage
            let assignedVariant = null;
            if (variants && variants.length > 0) {
                const rand = Math.random() * 100;
                let cumulative = 0;
                for (const variant of variants) {
                    cumulative += variant.traffic_percentage || 0;
                    if (rand <= cumulative) {
                        assignedVariant = variant.id;
                        break;
                    }
                }
            }

            return {
                campaign_id: campaignId,
                user_id: user.id,
                email: user.email,
                variant_id: assignedVariant,
                status: 'pending'
            };
        });

        // Insert recipients
        const { error: recipientsError } = await supabaseClient
            .from('campaign_recipients')
            .insert(recipients);

        if (recipientsError) throw recipientsError;

        // Log analytics event
        await supabaseClient
            .from('campaign_analytics')
            .insert({
                campaign_id: campaignId,
                metric_type: 'sent',
                metric_value: recipients.length,
                metadata: { execution_timestamp: new Date().toISOString() }
            });

        // TODO: In production, this would queue actual email/SMS sending jobs
        // For now, we mark recipients as sent immediately
        await supabaseClient
            .from('campaign_recipients')
            .update({
                status: 'sent',
                sent_at: new Date().toISOString()
            })
            .eq('campaign_id', campaignId)
            .eq('status', 'pending');

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Campaign executed successfully',
                campaign_id: campaignId,
                recipients_count: recipients.length
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
});
