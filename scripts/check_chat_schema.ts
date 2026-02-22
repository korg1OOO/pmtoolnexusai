import pg from 'pg';

const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres.rlnaylyjxjjaqzwpuhar:9kfAknS8q9tCJzo2@aws-1-ap-south-1.pooler.supabase.com:5432/postgres',
});

async function main() {
  try {
    await client.connect();
    
    console.log(`\n--- Columns for chat_channels ---`);
    const colRes = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'chat_channels';
    `);
    console.table(colRes.rows);

    console.log(`\n--- Columns for meetings ---`);
    const metricsRes = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'meetings';
    `);
    console.table(metricsRes.rows);

  } catch (err) {
    console.error('Error executing query', err);
  } finally {
    await client.end();
  }
}

main();
