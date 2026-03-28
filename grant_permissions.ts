import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function grantPermissions() {
    await client.connect();
    const email = 'admin@kiroxys.com';

    console.log(`Looking up user ${email}...`);
    const { rows: users } = await client.query('SELECT id FROM auth.users WHERE email = $1', [email]);
    if (users.length === 0) {
        console.error("User not found!");
        await client.end();
        return;
    }

    const userId = users[0].id;
    console.log(`Found user: ${userId}. Checking roles...`);

    // Grant global tenant access
    await client.query(`
    INSERT INTO users (id, email, full_name, role)
    VALUES ($1, $2, 'System Admin', 'admin')
    ON CONFLICT (id) DO NOTHING;
  `, [userId, email]);

    // Give tenant user role
    const { rows: tenants } = await client.query(`SELECT id FROM tenants LIMIT 1`);
    if (tenants.length > 0) {
        const tenantId = tenants[0].id;
        console.log(`Giving tenant admin access for tenant ${tenantId}`);
        try {
            await client.query(`
        INSERT INTO tenant_users (tenant_id, user_id, role)
        VALUES ($1, $2, 'admin')
        ON CONFLICT (tenant_id, user_id) DO UPDATE SET role = 'admin';
      `, [tenantId, userId]);
        } catch (e) { console.error("Could not insert tenant_users", e.message); }
    }

    // Find all projects & grant admin role
    const { rows: projects } = await client.query(`SELECT id FROM projects`);
    console.log(`Found ${projects.length} projects. Giving admin roles...`);

    for (const p of projects) {
        try {
            await client.query(`
        INSERT INTO user_roles (project_id, user_id, role, role_name)
        VALUES ($1, $2, 'admin', 'Project Admin')
        ON CONFLICT (project_id, user_id) DO UPDATE SET role = 'admin';
      `, [p.id, userId]);
        } catch (e) { console.error("Could not insert user_roles", e.message); }
    }

    console.log("Permissions granted!");
    await client.end();
}

grantPermissions();
