import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const client = new Client({ connectionString: process.env.DATABASE_URL });
async function run() {
  await client.connect();
  const { rows } = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name LIKE '%milestone%';
  `);
  console.log('Milestone tables:', rows);

  await client.end();
}
run();
