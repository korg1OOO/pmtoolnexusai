import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const client = new Client({ connectionString: process.env.DATABASE_URL });
async function run() {
    await client.connect();

    const { rows: users } = await client.query(`SELECT id FROM auth.users WHERE email = 'admin@projectoye.com' LIMIT 1`);
    if (!users[0]) return;
    const adminId = users[0].id;

    const { rows: projects } = await client.query(`SELECT id, name FROM projects`);
    for (const proj of projects) {
        try {
            await client.query(`
              INSERT INTO user_roles (user_id, project_id, role, role_name)
              VALUES ($1, $2, 'admin', 'Project Admin')
              ON CONFLICT (user_id, project_id) DO UPDATE SET role = 'admin', role_name = 'Project Admin'
          `, [adminId, proj.id]);
            console.log('Success inserting role for project:', proj.name);
        } catch (e) {
            console.error('Failed to insert role for project:', proj.name);
            console.error(e);
        }
    }

    await client.end();
}
run();
