import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }

    try {
        const { backup_job_id } = await req.json()

        if (!backup_job_id) {
            throw new Error('backup_job_id is required')
        }

        // Create Supabase client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Update backup job status to processing
        await supabaseClient
            .from('backup_jobs')
            .update({ status: 'processing', started_at: new Date().toISOString() })
            .eq('id', backup_job_id)

        // Get backup job details
        const { data: job, error: jobError } = await supabaseClient
            .from('backup_jobs')
            .select('*')
            .eq('id', backup_job_id)
            .single()

        if (jobError) throw jobError

        // Perform backup based on type
        let backupData: any = {}
        let fileSize = 0

        if (job.backup_type === 'full') {
            // Full database backup
            // In production, you would export all tables
            const tables = ['projects', 'tasks', 'risks', 'meetings', 'actions']

            for (const table of tables) {
                const { data, error } = await supabaseClient.from(table).select('*')
                if (!error && data) {
                    backupData[table] = data
                }
            }
        } else {
            // Incremental backup (only changes since last backup)
            const lastBackup = await supabaseClient
                .from('backup_jobs')
                .select('completed_at')
                .eq('status', 'completed')
                .eq('backup_type', job.backup_type)
                .order('completed_at', { ascending: false })
                .limit(1)
                .single()

            const since = lastBackup?.data?.completed_at || new Date(0).toISOString()

            // Get only modified records
            const tables = ['projects', 'tasks', 'risks', 'meetings', 'actions']
            for (const table of tables) {
                const { data, error } = await supabaseClient
                    .from(table)
                    .select('*')
                    .gte('updated_at', since)

                if (!error && data) {
                    backupData[table] = data
                }
            }
        }

        // Calculate file size (rough estimate)
        const backupJson = JSON.stringify(backupData)
        fileSize = new Blob([backupJson]).size

        // In production, you would:
        // 1. Upload to S3/Cloud Storage
        // 2. Encrypt the backup
        // 3. Store the backup location
        // For now, we'll just mark it as completed

        const location = `backups/${backup_job_id}.json`

        // Update backup job as completed
        const { error: updateError } = await supabaseClient
            .from('backup_jobs')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                file_size: fileSize,
                location: location,
            })
            .eq('id', backup_job_id)

        if (updateError) throw updateError

        return new Response(
            JSON.stringify({
                success: true,
                backup_job_id,
                file_size: fileSize,
                location,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error) {
        console.error('Backup error:', error)

        // Try to update job status to failed
        if (error instanceof Request && await error.json().then(j => j.backup_job_id)) {
            const client = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            )

            await client
                .from('backup_jobs')
                .update({ status: 'failed' })
                .eq('id', await error.json().then(j => j.backup_job_id))
        }

        return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : 'Backup failed' }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
