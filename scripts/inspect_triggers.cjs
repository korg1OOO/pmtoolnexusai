const postgres = require('postgres');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error('DATABASE_URL not set');
    process.exit(1);
}

const sql = postgres(connectionString);

async function inspect() {
    console.log('--- Triggers on auth.users ---');
    const authTriggers = await sql`
        SELECT trigger_name, event_manipulation, action_statement, action_orientation
        FROM information_schema.triggers
        WHERE event_object_schema = 'auth' AND event_object_table = 'users'
    `;
    console.table(authTriggers);

    console.log('--- Triggers on public.users ---');
    const publicTriggers = await sql`
        SELECT trigger_name, event_manipulation, action_statement, action_orientation
        FROM information_schema.triggers
        WHERE event_object_schema = 'public' AND event_object_table = 'users'
    `;
    console.table(publicTriggers);

    process.exit(0);
}

inspect().catch(err => {
    console.error(err);
    process.exit(1);
});
