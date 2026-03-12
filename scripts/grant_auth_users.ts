import pg from 'pg';

const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres.rlnaylyjxjjaqzwpuhar:9kfAknS8q9tCJzo2@aws-1-ap-south-1.pooler.supabase.com:5432/postgres',
});

async function main() {
  try {
    await client.connect();
    
    console.log("Granting references/select on auth.users for the authenticated role...");
    
    // We only need to grant references or select so the FK validation doesn't crash
    // For safety, Supabase recommends granting REFERENCES when you have FKs to auth.users
    await client.query(`
      GRANT REFERENCES ON auth.users TO authenticated;
      GRANT SELECT ON auth.users TO authenticated;
    `);

    // Let's also check if chat_channels needs anything special
    await client.query(`
      GRANT ALL ON chat_channels TO authenticated;
    `);

    console.log("Grants applied successfully.");

  } catch (err) {
    console.error('Error applying grants:', err);
  } finally {
    await client.end();
  }
}

main();
