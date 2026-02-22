import pg from 'pg';

const { Client } = pg;

const client = new Client({
    connectionString: 'postgresql://postgres.rlnaylyjxjjaqzwpuhar:9kfAknS8q9tCJzo2@aws-1-ap-south-1.pooler.supabase.com:5432/postgres',
});

async function main() {
    try {
        await client.connect();
        const tables = ['actions', 'meetings', 'risks'];
        for (const t of tables) {
            const res = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = '${t}';
      `);
            console.log(`Table ${t}:`, res.rows.map(r => r.column_name).join(', '));
        }
    } catch (err: any) {
        console.error('Error executing query:', err.message);
    } finally {
        await client.end();
    }
}
main();
