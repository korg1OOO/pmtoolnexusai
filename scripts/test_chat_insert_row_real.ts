import pg from 'pg';

const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres.rlnaylyjxjjaqzwpuhar:9kfAknS8q9tCJzo2@aws-1-ap-south-1.pooler.supabase.com:5432/postgres',
});

async function main() {
  try {
    await client.connect();
    
    // 1. Get a valid user
    const userRes = await client.query('SELECT id FROM auth.users LIMIT 1');
    const userId = userRes.rows[0].id;

    // 2. Get a valid project
    const projRes = await client.query('SELECT id FROM projects LIMIT 1');
    const projectId = projRes.rows[0].id;

    console.log(`\n--- Testing INSERT into chat_channels with valid FKs ---`);
    console.log(`User: ${userId}, Project: ${projectId}`);
    
    const res = await client.query(`
      INSERT INTO chat_channels (project_id, name, type, created_by)
      VALUES ($1, 'test-valid-channel', 'public', $2)
      RETURNING *;
    `, [projectId, userId]);

    console.log("Insert successful:", res.rows[0]);

    // Clean up
    await client.query(`DELETE FROM chat_channels WHERE id = $1`, [res.rows[0].id]);

  } catch (err: any) {
    console.error('Error executing query:', err.message);
  } finally {
    await client.end();
  }
}

main();
