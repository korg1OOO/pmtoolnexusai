import pg from 'pg';

const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres.rlnaylyjxjjaqzwpuhar:9kfAknS8q9tCJzo2@aws-1-ap-south-1.pooler.supabase.com:5432/postgres',
});

async function main() {
  try {
    await client.connect();
    
    console.log("Adding 'attachments' column to chat_messages...");

    await client.query(`
      ALTER TABLE chat_messages
      ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb;
    `);

    // Reload schema cache for PostgREST just in case
    await client.query(`NOTIFY pgrst, 'reload schema'`);

    console.log("Successfully added 'attachments' column and reloaded schema.");

  } catch (err: any) {
    console.error('Error executing query:', err.message);
  } finally {
    await client.end();
  }
}

main();
