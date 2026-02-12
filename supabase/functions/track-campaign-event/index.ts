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

        const { recipientId, eventType, metadata } = await req.json();

        if (!recipientId || !eventType) {
            throw new Error('recipientId and eventType are required');
        }

        // Valid event types
        const validEvents = ['opened', 'clicked', 'converted', 'unsubscribed', 'bounced', 'spam_reported'];
        if (!validEvents.includes(eventType)) {
            throw new Error(`Invalid event type. Must be one of: ${validEvents.join(', ')}`);
        }

        // Get recipient
        const { data: recipient, error: recipientError } = await supabaseClient
            .from('campaign_recipients')
            .select('*, campaign_id')
            .eq('id', recipientId)
            .single();

        if (recipientError) throw recipientError;
        if (!recipient) throw new Error('Recipient not found');

        // Update recipient record based on event type
        const updateData: Record<string, any> = {};

        switch (eventType) {
            case 'opened':
                if (!recipient.opened_at) {
                    updateData.opened_at = new Date().toISOString();
                }
                break;
            case 'clicked':
                updateData.clicked_at = new Date().toISOString();
                break;
            case 'converted':
                updateData.converted_at = new Date().toISOString();
                break;
            case 'unsubscribed':
                updateData.unsubscribed_at = new Date().toISOString();
                break;
            case 'bounced':
                updateData.status = 'bounced';
                break;
        }

        // Update recipient
        await supabaseClient
            .from('campaign_recipients')
            .update(updateData)
            .eq('id', recipientId);

        // Log to campaign analytics
        await supabaseClient
            .from('campaign_analytics')
            .insert({
                campaign_id: recipient.campaign_id,
                metric_type: eventType,
                metric_value: 1,
                metadata: {
                    recipient_id: recipientId,
                    ...metadata
                }
            });

        // If this is a unique event (first time), increment aggregate
        if (eventType === 'opened' && !recipient.opened_at) {
            // Could update aggregate stats table here
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: `${eventType} event tracked successfully`,
                recipient_id: recipientId,
                campaign_id: recipient.campaign_id
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
