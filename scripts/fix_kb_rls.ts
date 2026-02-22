import pg from 'pg';

const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres.rlnaylyjxjjaqzwpuhar:9kfAknS8q9tCJzo2@aws-1-ap-south-1.pooler.supabase.com:5432/postgres',
});

async function main() {
  try {
    await client.connect();
    
    console.log("Checking policies for knowledge_articles...");
    const res = await client.query(`
      SELECT policyname, permissive, roles, cmd, qual, WITH_CHECK 
      FROM pg_policies 
      WHERE tablename = 'knowledge_articles';
    `);
    
    console.log(res.rows);

    console.log("Dropping existing restrictive INSERT policies and replacing them...");
    
    // Drop existing policies
    for (const row of res.rows) {
      await client.query(`DROP POLICY IF EXISTS "${row.policyname}" ON knowledge_articles;`);
    }

    // Create simple robust policies for knowledge_articles
    await client.query(`
      CREATE POLICY "Authenticated users can select knowledge_articles"
      ON knowledge_articles FOR SELECT TO authenticated USING (true);
      
      CREATE POLICY "Authenticated users can insert knowledge_articles"
      ON knowledge_articles FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
      
      CREATE POLICY "Authenticated users can update knowledge_articles"
      ON knowledge_articles FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
      
      CREATE POLICY "Authenticated users can delete knowledge_articles"
      ON knowledge_articles FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
    `);

    console.log("Successfully replaced RLS policies for knowledge_articles.");

    // Reload schema cache just in case
    await client.query(`NOTIFY pgrst, 'reload schema'`);

  } catch (err: any) {
    console.error('Error executing query:', err.message);
  } finally {
    await client.end();
  }
}

main();
