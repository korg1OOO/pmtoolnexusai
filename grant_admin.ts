import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function run() {
    await client.connect();
    try {
        const { rows: users } = await client.query(`SELECT id FROM auth.users WHERE email = 'admin@kiroxys.com' LIMIT 1`);
        if (users.length === 0) {
            console.error('User not found');
            return;
        }
        const adminId = users[0].id;

        // 1. Ensure Super Admin role exists
        let roleId;
        const { rows: existingRoles } = await client.query(`SELECT id FROM admin_roles WHERE name = 'Super Admin'`);
        if (existingRoles.length > 0) {
            roleId = existingRoles[0].id;
        } else {
            const { rows: newRoles } = await client.query(`
        INSERT INTO admin_roles (name, description, permissions, is_system_role)
        VALUES ('Super Admin', 'Full access to all system features', '["*"]'::jsonb, true)
        RETURNING id
      `);
            roleId = newRoles[0].id;
        }

        // 2. Assign user to admin_users
        await client.query(`
      INSERT INTO admin_users (user_id, role_id, granted_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (user_id) DO UPDATE SET role_id = EXCLUDED.role_id, revoked_at = NULL
    `, [adminId, roleId]);

        // 3. Update profiles
        await client.query(`
      UPDATE profiles SET role = 'admin' WHERE id = $1
    `, [adminId]);

        // 4. Update project roles
        await client.query(`
      UPDATE user_roles SET role = 'admin' WHERE user_id = $1
    `, [adminId]);

        console.log('Successfully granted all Super Admin permissions to admin@kiroxys.com');
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

run();
