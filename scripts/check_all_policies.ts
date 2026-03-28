import pg from 'pg';

const { Client } = pg;

const client = new Client({
    connectionString: 'postgresql://postgres.rlnaylyjxjjaqzwpuhar:9kfAknS8q9tCJzo2@aws-1-ap-south-1.pooler.supabase.com:5432/postgres',
});

async function main() {
    try {
        await client.connect();

        const tables = ['actions', 'meetings', 'chat_channels'];

        for (const table of tables) {
            console.log(`\n--- Policies for ${table} ---`);
            const res = await client.query(`
        SELECT policyname, permissive, roles, cmd, qual, with_check 
        FROM pg_policies 
        WHERE tablename = $1;
      `, [table]);

            if (res.rows.length === 0) {
                console.log("No policies found.");
            } else {
                res.rows.forEach(row => {
                    console.log(`Policy: ${row.policyname}`);
                    console.log(`  Cmd: ${row.cmd}, Roles: ${row.roles}`);
                    console.log(`  Qual (USING): ${row.qual}`);
                    console.log(`  With Check: ${row.with_check}`);
                });
            }

            console.log(`\n--- Constraints for ${table} ---`);
            const consRes = await client.query(`
        SELECT conname, pg_get_constraintdef(c.oid) as def
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE t.relname = $1 AND c.contype = 'c';
      `, [table]);

            if (consRes.rows.length === 0) {
                console.log("No CHECK constraints found.");
            } else {
                consRes.rows.forEach(row => {
                    console.log(`Constraint: ${row.conname}`);
                    console.log(`  Def: ${row.def}`);
                });
            }
        }

    } catch (err) {
        console.error('Error executing query', err);
    } finally {
        await client.end();
    }
}

main();
