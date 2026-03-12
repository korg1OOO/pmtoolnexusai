import pg from 'pg';
const { Client } = pg;
const client = new Client({
  connectionString: 'postgresql://postgres.rlnaylyjxjjaqzwpuhar:9kfAknS8q9tCJzo2@aws-1-ap-south-1.pooler.supabase.com:5432/postgres',
});
async function main() {
  await client.connect();
  const res = await client.query('SELECT id, name FROM tenants LIMIT 1');
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}
main();
