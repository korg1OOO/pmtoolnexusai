import pg from 'pg';

const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres.rlnaylyjxjjaqzwpuhar:9kfAknS8q9tCJzo2@aws-1-ap-south-1.pooler.supabase.com:5432/postgres',
});

async function main() {
  try {
    await client.connect();
    
    console.log(`\n--- Constraints for actions ---`);
    const consRes = await client.query(`
      SELECT conname, pg_get_constraintdef(c.oid) as def
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      WHERE t.relname = 'actions' AND c.contype = 'c';
    `);

    if (consRes.rows.length === 0) {
      console.log("No CHECK constraints found.");
    } else {
      consRes.rows.forEach(row => {
        console.log(`Constraint: ${row.conname}`);
        console.log(`  Def: ${row.def}`);
      });
    }

    console.log(`\n--- Columns for actions ---`);
    const colRes = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'actions';
    `);
    console.table(colRes.rows);

  } catch (err) {
    console.error('Error executing query', err);
  } finally {
    await client.end();
  }
}

main();
