
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Get user from Auth header
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('Missing Authorization header')
        }

        const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
        if (userError || !user) {
            throw new Error('Invalid user token')
        }

        // 2. Parse request body
        const { action, payload } = await req.json()

        if (!action) {
            throw new Error('Missing action parameter')
        }

        // 3. Get User Tier
        const { data: profile } = await supabase
            .from('profiles')
            .select('subscription_tier')
            .eq('id', user.id)
            .single()

        const tier = profile?.subscription_tier || 'free'

        // 4. Get Plan Limits
        const { data: config } = await supabase
            .from('plan_configs')
            .select('*')
            .eq('tier', tier)
            .single()

        if (!config) {
            console.error(`Plan config not found for tier ${tier}`)
            throw new Error('Plan configuration missing')
        }

        // 5. Check based on action
        if (action === 'create_project') {
            const limit = config.max_projects
            // -1 means unlimited
            if (limit === -1) {
                return new Response(JSON.stringify({ allowed: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }

            const { count } = await supabase
                .from('projects')
                .select('*', { count: 'exact', head: true })
                .eq('owner_id', user.id)

            const currentCount = count || 0

            if (currentCount >= limit) {
                return new Response(
                    JSON.stringify({
                        allowed: false,
                        error: `You have reached the project limit for your ${tier} plan (${limit}). Please upgrade to create more projects.`
                    }),
                    { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }
        }
        else if (action === 'invite_member') {
            const limit = config.max_members
            if (limit === -1) {
                return new Response(JSON.stringify({ allowed: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }

            // Payload should contain workspace_id
            const workspaceId = payload?.workspace_id
            if (!workspaceId) throw new Error('Missing workspace_id in payload')

            const { count } = await supabase
                .from('workspace_members')
                .select('*', { count: 'exact', head: true })
                .eq('workspace_id', workspaceId)

            const currentCount = count || 0

            // If inviting 1 member, check if current + 1 > limit
            if (currentCount >= limit) {
                return new Response(
                    JSON.stringify({
                        allowed: false,
                        error: `You have reached the team member limit for your ${tier} plan (${limit}). Please upgrade to invite more members.`
                    }),
                    { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }
        }
        // Add more actions as needed

        return new Response(JSON.stringify({ allowed: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
})
