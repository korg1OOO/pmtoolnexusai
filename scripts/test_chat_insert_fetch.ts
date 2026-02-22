import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rlnaylyjxjjaqzwpuhar.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'dummy'; // We need a real token ideally to test RLS, but let's try just getting the schema error first if possible.
// Actually, let's just query the database directly to verify if there's any trigger or RLS policy that specifically blocks this shape.
import pg from 'pg';

const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres.rlnaylyjxjjaqzwpuhar:9kfAknS8q9tCJzo2@aws-1-ap-south-1.pooler.supabase.com:5432/postgres',
});

async function main() {
  try {
    await client.connect();
    
    // We already know a direct insert works. The issue might be that the UI doesn't provide `created_by` in time,
    // or RLS `chat_channels_insert` requires `auth.uid() IS NOT NULL`. Wait! The policy is `auth.uid() = created_by`.
    // If the UI sends `created_by` as undefined, it fails the policy or the schema NOT NULL.
    // Let's check `chat_channels` columns again. `created_by` is nullable, but the policy `Create channels` requires `auth.uid() = created_by`. 
    // If `(await supabase.auth.getUser()).data.user?.id` is undefined during the mutation (maybe because it's not awaited properly?), it fails. 
    // Wait, `.from("chat_channels").insert({ project_id: projectId, name, type, created_by: (await supabase.auth.getUser()).data.user?.id })` 
    // If auth is perfectly set up, it should work.

    // Let's check the RLS policies closely again.
    const res = await client.query(`
      SELECT policyname, permissive, roles, cmd, qual, with_check 
      FROM pg_policies 
      WHERE tablename = 'chat_channels';
    `);
    
    console.log("Policies:");
    console.table(res.rows);

  } catch (err: any) {
    console.error('Error executing query:', err.message);
  } finally {
    await client.end();
  }
}

main();
