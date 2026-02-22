import pg from 'pg';

const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres.rlnaylyjxjjaqzwpuhar:9kfAknS8q9tCJzo2@aws-1-ap-south-1.pooler.supabase.com:5432/postgres',
});

async function main() {
  try {
    await client.connect();

    console.log("--- Checking profiles RLS policies ---");
    const policiesRes = await client.query(`
      SELECT policyname, permissive, roles, cmd, qual, WITH_CHECK 
      FROM pg_policies 
      WHERE tablename = 'profiles';
    `);
    console.log(JSON.stringify(policiesRes.rows, null, 2));

    console.log("\n--- Checking project_charters columns ---");
    const colsRes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'project_charters';
    `);
    console.log(JSON.stringify(colsRes.rows, null, 2));

  } catch (err: any) {
    console.error('Error executing query:', err.message);
  } finally {
    await client.end();
  }
}

main();
