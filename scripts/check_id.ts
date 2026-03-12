import pg from 'pg';

const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres.rlnaylyjxjjaqzwpuhar:9kfAknS8q9tCJzo2@aws-1-ap-south-1.pooler.supabase.com:5432/postgres',
});

async function main() {
  try {
    await client.connect();
    
    const id = '04eed42d-90c3-4d05-9738-faf5b49508ff';
    console.log(`Checking what table owns ID: ${id}`);
    
    const checks = ['projects', 'programs', 'workspaces', 'tenants'];
    for (const table of checks) {
        const res = await client.query(`SELECT id, tenant_id FROM ${table} WHERE id = $1`, [id]);
        if (res.rows.length > 0) {
            console.log(`FOUND in table: ${table}`);
            console.log(res.rows[0]);
        }
    }
    
    // Check if it's actually just passing tenant_id directly?
    console.log("Checking if it's a tenant_id itself:");
    const resT = await client.query(`SELECT id FROM tenants WHERE id = $1`, [id]);
    if (resT.rows.length > 0) console.log("It is a TENANT ID!");
    
  } catch (err: any) {
    console.error('Error executing query:', err.message);
  } finally {
    await client.end();
  }
}

main();
