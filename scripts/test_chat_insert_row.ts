import pg from 'pg';

const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres.rlnaylyjxjjaqzwpuhar:9kfAknS8q9tCJzo2@aws-1-ap-south-1.pooler.supabase.com:5432/postgres',
});

async function main() {
  try {
    await client.connect();
    
    console.log(`\n--- Testing INSERT into chat_channels ---`);
    
    // Attempting a direct insert similar to what the frontend does
    // I will use a dummy UUID for project_id just to see the exact error
    const res = await client.query(`
      INSERT INTO chat_channels (project_id, title, type, created_by)
      VALUES ('00000000-0000-0000-0000-000000000000', 'test-channel', 'public', '00000000-0000-0000-0000-000000000000')
      RETURNING *;
    `);

    console.log("Insert successful:", res.rows[0]);

  } catch (err: any) {
    console.error('Error executing query:', err.message);
  } finally {
    await client.end();
  }
}

main();
