import pg from 'pg';

const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres.rlnaylyjxjjaqzwpuhar:9kfAknS8q9tCJzo2@aws-1-ap-south-1.pooler.supabase.com:5432/postgres',
});

async function main() {
  try {
    await client.connect();
    
    console.log("Tenants:");
    const resT = await client.query(`SELECT id, name FROM tenants`);
    console.table(resT.rows);

    console.log("Workspaces:");
    const resW = await client.query(`SELECT id, name FROM workspaces`);
    console.table(resW.rows);

    console.log("Programs:");
    const res = await client.query(`SELECT id, name FROM programs`);
    console.table(res.rows);

    console.log("Projects:");
    const res2 = await client.query(`SELECT id, name, tenant_id FROM projects`);
    console.table(res2.rows);
    
  } catch (err: any) {
    console.error('Error executing query:', err.message);
  } finally {
    await client.end();
  }
}

main();
