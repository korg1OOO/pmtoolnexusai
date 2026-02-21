import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const client = new Client({ connectionString: process.env.DATABASE_URL });
async function run() {
  await client.connect();
  const { rows } = await client.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'admin_users' OR table_name = 'admin_roles'
  `);
  console.log(rows);
  await client.end();
}
run();
