import pg from 'pg';

const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres.rlnaylyjxjjaqzwpuhar:9kfAknS8q9tCJzo2@aws-1-ap-south-1.pooler.supabase.com:5432/postgres',
});

async function main() {
  try {
    await client.connect();
    
    // Meetings
    const meetingTables = [
      'meetings', 'meeting_participants', 'meeting_agenda_items', 
      'meeting_decisions', 'meeting_action_items', 'meeting_risks',
      'meeting_scope_changes', 'meeting_conflicts', 'meeting_notes',
      'meeting_attendees', 'meeting_templates', 'meeting_analytics', 'meeting_trends'
    ];
    for (const table of meetingTables) {
       await client.query(`GRANT ALL ON public.${table} TO authenticated;`).catch(e => console.log(`Skip ${table}`));
    }

    // Chat / Communications
    const chatTables = [
      'chat_channels', 'chat_channel_members', 'chat_messages', 
      'project_messages', 'ai_messages', 'notification_channels'
    ];
    for (const table of chatTables) {
       await client.query(`GRANT ALL ON public.${table} TO authenticated;`).catch(e => console.log(`Skip ${table}`));
    }
    
    // Flush cache just in case
    await client.query("NOTIFY pgrst, 'reload schema';");
    console.log('Granted ALL on Collaboration tables');

  } catch (err) {
    console.error('Error executing query', err);
  } finally {
    await client.end();
  }
}

main();
