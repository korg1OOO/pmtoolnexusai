import pg from 'pg';

const { Client } = pg;

const client = new Client({
    connectionString: 'postgresql://postgres.rlnaylyjxjjaqzwpuhar:9kfAknS8q9tCJzo2@aws-1-ap-south-1.pooler.supabase.com:5432/postgres',
});

async function main() {
    try {
        await client.connect();
        const enums = ['action_status', 'risk_status', 'meeting_status'];
        for (const e of enums) {
            const res = await client.query(`
        SELECT unnest(enum_range(NULL::${e}));
      `);
            console.log(`Enum ${e}:`, res.rows.map(r => r.unnest).join(', '));
        }
    } catch (err: any) {
        console.error('Error executing query:', err.message);
    } finally {
        await client.end();
    }
}
main();
