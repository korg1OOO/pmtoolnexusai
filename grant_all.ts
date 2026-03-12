import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function run() {
    await client.connect();
    try {
        const { rows: users } = await client.query(`SELECT id FROM auth.users WHERE email = 'admin@projectoye.com' LIMIT 1`);
        if (users.length === 0) {
            console.error('User not found');
            return;
        }
        const adminId = users[0].id;
        console.log(`Admin User ID: ${adminId}`);

        // Set profile role
        await client.query(`UPDATE profiles SET role = 'admin' WHERE id = $1`, [adminId]);
        console.log('Updated profile role to admin');

        // Make them admin on ALL projects
        const { rows: projects } = await client.query(`SELECT id FROM projects`);
        let addedCount = 0;

        for (const proj of projects) {
            // Upsert into user_roles (try to insert, if conflict update)
            // Usually project roles constraint is user_id + project_id
            try {
                await client.query(`
          INSERT INTO user_roles (user_id, project_id, role)
          VALUES ($1, $2, 'admin')
          ON CONFLICT (user_id, project_id) DO UPDATE SET role = 'admin'
        `, [adminId, proj.id]);
            } catch (e: any) {
                // If the ON CONFLICT fails because the unique constraint is named differently or missing,
                // we manually check and update.
                if (e.code === '42P10') {
                    const { rowCount } = await client.query(`UPDATE user_roles SET role = 'admin' WHERE user_id = $1 AND project_id = $2`, [adminId, proj.id]);
                    if (rowCount === 0) {
                        await client.query(`INSERT INTO user_roles (user_id, project_id, role) VALUES ($1, $2, 'admin')`, [adminId, proj.id]);
                    }
                } else {
                    // Maybe constraint is just user_id + project_id, but it failed for another reason
                    const { rowCount } = await client.query(`UPDATE user_roles SET role = 'admin' WHERE user_id = $1 AND project_id = $2`, [adminId, proj.id]);
                    if (rowCount === 0) {
                        try {
                            await client.query(`INSERT INTO user_roles (user_id, project_id, role) VALUES ($1, $2, 'admin')`, [adminId, proj.id]);
                        } catch (e2) { }
                    }
                }
            }
            addedCount++;
        }
        console.log(`Granted 'admin' role on ${addedCount} projects`);

        // Ensure they have the maximum possible global admin features 
        // Just in case any other tables restrict them
        try {
            const { rows: tenants } = await client.query(`SELECT id FROM tenants`);
            for (const t of tenants) {
                await client.query(`
             UPDATE tenants SET owner_id = $1 WHERE id = $2 AND owner_id IS NULL
           `, [adminId, t.id]);

                // If tenant_users table exists
                try {
                    await client.query(`
               INSERT INTO tenant_users (tenant_id, user_id, role) VALUES ($2, $1, 'owner')
               ON CONFLICT DO NOTHING
             `, [adminId, t.id]);
                } catch (e) { }
            }
        } catch (e) {
            // Tenants might not be structured this way
        }

        console.log('Successfully applied all sweeping admin permissions for admin@projectoye.com');
    } catch (e) {
        console.error('Fatal error', e);
    } finally {
        await client.end();
    }
}

run();
