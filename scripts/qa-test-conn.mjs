import dotenv from 'dotenv';
dotenv.config();
console.log('KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log('KEY prefix:', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 10));

import { createClient } from '@supabase/supabase-js';
const s = createClient('https://rlnaylyjxjjaqzwpuhar.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data, error } = await s.from('profiles').select('id').limit(3);
if (error) console.error('Error:', error.message);
else console.log('OK, got', data.length, 'profiles');
