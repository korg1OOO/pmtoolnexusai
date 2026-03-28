import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const client = new Client({ connectionString: process.env.DATABASE_URL });
async function run() {
  await client.connect();
  const user = await client.query(`SELECT id FROM auth.users WHERE email = 'admin@kiroxys.com' LIMIT 1`);
  const proj = await client.query(`SELECT id FROM projects LIMIT 1`);
  if (user.rows[0] && proj.rows[0]) {
    const roleReq = await client.query(`SELECT get_user_role($1, $2) as role`, [user.rows[0].id, proj.rows[0].id]);
    console.log('Admin Role for project 1:', roleReq.rows[0]);
  }
  await client.end();
}
run();
