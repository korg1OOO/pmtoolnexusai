import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
async function run() {
  const { data, error } = await supabase.from('ai_usage_logs').select('*');
  console.log('Logs count:', data?.length, 'Error:', error);
}
run();
