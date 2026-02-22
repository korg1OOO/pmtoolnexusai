import pg from 'pg';

const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres.rlnaylyjxjjaqzwpuhar:9kfAknS8q9tCJzo2@aws-1-ap-south-1.pooler.supabase.com:5432/postgres',
});

async function main() {
  try {
    await client.connect();
    
    // Suite 4.11 Actions
    await client.query('GRANT ALL ON public.actions TO authenticated;');
    
    // Suite 4.12 Change Requests 
    await client.query('GRANT ALL ON public.change_requests TO authenticated;');
    
    // Flush cache just in case
    await client.query("NOTIFY pgrst, 'reload schema';");
    console.log('Granted ALL on actions and change_requests');

  } catch (err) {
    console.error('Error executing query', err);
  } finally {
    await client.end();
  }
}

main();
