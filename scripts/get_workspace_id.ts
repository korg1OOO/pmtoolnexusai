import * as dotenv from 'dotenv';
import postgres from 'postgres';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('❌ Missing DATABASE_URL in .env file\n');
    process.exit(1);
}

async function getWorkspaceId() {
    const sql = postgres(databaseUrl);

    try {
        const workspaces = await sql`
            SELECT id, name 
            FROM workspaces 
            ORDER BY created_at DESC 
            LIMIT 5
        `;

        if (workspaces.length === 0) {
            console.log('❌ No workspaces found in database');
            console.log('💡 Create a workspace first, then run the seed script\n');
            await sql.end();
            process.exit(1);
        }

        console.log('📌 Available workspaces:\n');
        workspaces.forEach((ws, index) => {
            console.log(`   ${index + 1}. ${ws.name}`);
            console.log(`      ID: ${ws.id}\n`);
        });

        console.log('💡 To seed governance data for a workspace, run:');
        console.log(`   npx tsx scripts/run_governance_seed.ts ${workspaces[0].id}\n`);

        await sql.end();
    } catch (error: any) {
        console.error('❌ Failed to query workspaces:', error.message);
        await sql.end();
        process.exit(1);
    }
}

getWorkspaceId();
