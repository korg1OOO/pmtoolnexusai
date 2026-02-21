import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    console.error('No DATABASE_URL found');
    process.exit(1);
}

const client = new Client({
    connectionString: dbUrl,
});

async function run() {
    try {
        await client.connect();

        // Find the user ID for admin@projectoye.com
        const { rows: users } = await client.query(`SELECT id FROM auth.users WHERE email = 'admin@projectoye.com' LIMIT 1`);
        if (users.length === 0) {
            console.error('User admin@projectoye.com not found');
            return;
        }
        const adminId = users[0].id;
        console.log(`Found admin user ID: ${adminId}`);

        // Add 100 credits
        console.log('Adding 100 credits...');
        // Upsert credits
        await client.query(`
      INSERT INTO ai_credits (user_id, total_credits)
      VALUES ($1, 100)
      ON CONFLICT (user_id) DO UPDATE SET total_credits = ai_credits.total_credits + 100
    `, [adminId]);

        const { rows: credits } = await client.query(`SELECT total_credits, used_credits, available_credits FROM ai_credits WHERE user_id = $1`, [adminId]);
        console.log(`Admin credits:`, credits[0]);

        // Ensure they have global admin role or tenant owner (depends on your schema)
        // ProjectOye typically uses `user_roles`
        console.log('Checking user_roles...');
        const { rows: roles } = await client.query(`SELECT * FROM user_roles WHERE user_id = $1`, [adminId]);

        // Let's make sure they are at least tenant_admin or admin
        if (roles.length === 0) {
            console.log('No roles found, ensuring tenant_admin...');
            // Find if they own a tenant
            const { rows: tenants } = await client.query(`SELECT id FROM tenants LIMIT 1`);
            if (tenants.length > 0) {
                await client.query(`
              INSERT INTO user_roles (user_id, tenant_id, role)
              VALUES ($1, $2, 'tenant_admin') ON CONFLICT DO NOTHING
            `, [adminId, tenants[0].id]);
            }
        } else {
            // Upgrade existing roles to 'admin' or 'tenant_admin' if they are less
            console.log('Upgrading roles to admin where applicable...');
            await client.query(`
            UPDATE user_roles SET role = 'admin' WHERE user_id = $1 AND role IN ('viewer', 'user', 'member', 'pm')
        `, [adminId]);
        }

        // As a backup, make sure they are admin in their single tenant
        await client.query(`
        UPDATE user_roles SET role = 'admin' WHERE user_id = $1
    `, [adminId]);

        console.log('Finished updating admin@projectoye.com!');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

run();
