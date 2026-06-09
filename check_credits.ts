import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing URL or KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) {
    console.error('User Error:', userError);
    return;
  }

  const { data: credits, error: creditError } = await supabase.from('ai_credits').select('*');
  if (creditError) {
    console.error('Credit Error:', creditError);
    return;
  }

  console.log(`Found ${users.users.length} users and ${credits?.length || 0} credit records.`);

  for (const user of users.users) {
    const record = credits?.find(c => c.user_id === user.id);
    console.log(`User ${user.email} (${user.id}): ${record ? `Has Credits (${record.available_credits})` : 'MISSING CREDITS'}`);

    if (!record) {
      console.log(`Fixing by adding 5000 credits to ${user.email}...`);
      await supabase.from('ai_credits').insert({
        user_id: user.id,
        total_credits: 5000,
      });

      const { error } = await supabase.rpc('add_ai_credits', { p_user_id: user.id, p_credits: 5000 });
      if (error) console.error('Add credits error:', error);
    }
  }
}

check();
