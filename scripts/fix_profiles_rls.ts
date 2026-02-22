import pg from 'pg';

const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres.rlnaylyjxjjaqzwpuhar:9kfAknS8q9tCJzo2@aws-1-ap-south-1.pooler.supabase.com:5432/postgres',
});

async function main() {
  try {
    await client.connect();
    
    // Drop bad policies
    const policiesToDrop = [
      'Admins can view all profiles',
      'Admins can update all profiles',
      'Public profiles are viewable by everyone.',
      'Users can insert their own profile.',
      'Users can update own profile.'
    ];

    for (const p of policiesToDrop) {
        await client.query(`DROP POLICY IF EXISTS "${p}" ON profiles;`);
    }

    // Replace with simple robust policies that avoid cyclic dependencies
    await client.query(`
      CREATE POLICY "Authenticated users can select profiles"
      ON profiles FOR SELECT TO authenticated USING (true);
      
      CREATE POLICY "Users can insert their own profile"
      ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
      
      CREATE POLICY "Users can update own profile"
      ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

      CREATE POLICY "Public profiles are viewable by everyone"
      ON profiles FOR SELECT TO public USING (true);
    `);

    console.log("Successfully replaced RLS policies for profiles!");
    await client.query(`NOTIFY pgrst, 'reload schema'`);

  } catch (err: any) {
    console.error('Error executing query:', err.message);
  } finally {
    await client.end();
  }
}

main();
