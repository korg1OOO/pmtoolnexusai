import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const projectId = 'afc82abc-0044-46bb-8664-9be11ff10629'; // TPA

  const res1 = await supabase.from('actions').select('id, title, status, project_id').eq('project_id', projectId);
  console.log('actions:', res1.error);

  const res2 = await supabase.from('meetings').select('id, title, status').eq('project_id', projectId);
  console.log('meetings:', res2.error);

  const res3 = await supabase.from('risks').select('id, title, status').eq('project_id', projectId);
  console.log('risks:', res3.error);
}

check();
