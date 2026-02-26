/**
 * Quick role switcher for manual testing.
 * Usage: node scripts/switch-role.mjs <role>
 * Roles: admin, pm, lead, developer, analyst, viewer
 * After switching, hard-reload the app in browser.
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const role = process.argv[2];
const VALID = ['admin', 'pm', 'lead', 'developer', 'analyst', 'viewer'];
if (!VALID.includes(role)) {
  console.log(`Usage: node scripts/switch-role.mjs <role>`);
  console.log(`Roles: ${VALID.join(', ')}`);
  process.exit(1);
}

const s = createClient('https://rlnaylyjxjjaqzwpuhar.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY);
const USER_ID = '3a6889fe-2932-4004-9bfb-65a4b34a93ea';
const PROJECT_ID = '4de45f87-6dbb-407a-b35e-e6cbf6f4a4fe';

const { error } = await s.from('user_roles').update({ role }).eq('user_id', USER_ID).eq('project_id', PROJECT_ID);
if (error) { console.error('Error:', error.message); process.exit(1); }

const { data } = await s.rpc('get_user_role', { p_user_id: USER_ID, p_project_id: PROJECT_ID });
console.log(`✅ Role switched to: ${data}`);
console.log('Now hard-reload the app in your browser (Ctrl+Shift+R)');
