import pg from 'pg';

const { Client } = pg;

const client = new Client({
    connectionString: 'postgresql://postgres.rlnaylyjxjjaqzwpuhar:9kfAknS8q9tCJzo2@aws-1-ap-south-1.pooler.supabase.com:5432/postgres',
});

async function main() {
    try {
        await client.connect();

        // Suite 4.11 Actions
        await client.query('GRANT ALL ON public.actions TO authenticated;');

        // Suite 4.12 Change Requests 
        await client.query('GRANT ALL ON public.change_requests TO authenticated;');

        // Suite 4.13 Collaboration
        await client.query('GRANT ALL ON public.meetings TO authenticated;');
        await client.query('GRANT ALL ON public.meeting_attendees TO authenticated;');
        await client.query('GRANT ALL ON public.meeting_agenda_items TO authenticated;');
        await client.query('GRANT ALL ON public.meeting_minutes TO authenticated;');

        await client.query('GRANT ALL ON public.channels TO authenticated;');
        await client.query('GRANT ALL ON public.channel_members TO authenticated;');
        await client.query('GRANT ALL ON public.messages TO authenticated;');

        await client.query('GRANT ALL ON public.communications TO authenticated;');

        // Flush cache
        await client.query("NOTIFY pgrst, 'reload schema';");

        console.log('Granted ALL to authenticated for Actions, CRs, and Collaboration tables.');
    } catch (err) {
        console.error('Error executing query', err);
    } finally {
        await client.end();
    }
}

main();
