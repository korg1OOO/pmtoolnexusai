// Check DB prerequisites for Part 4 admin testing
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const s = createClient(
    'https://rlnaylyjxjjaqzwpuhar.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const UID = '3a6889fe-2932-4004-9bfb-65a4b34a93ea'; // admin user

(async () => {
    const { data: w } = await s.from('workspaces').select('id, name').limit(3);
    console.log('WORKSPACES:', JSON.stringify(w, null, 2));

    const { data: p } = await s.from('portfolios').select('id, name').limit(3);
    console.log('PORTFOLIOS:', JSON.stringify(p, null, 2));

    const { data: pg } = await s.from('programs').select('id, name').limit(3);
    console.log('PROGRAMS:', JSON.stringify(pg, null, 2));

    const { data: tm } = await s.from('tenant_members').select('user_id, role, tenant_id').eq('user_id', UID);
    console.log('TENANT_MEMBERSHIP:', JSON.stringify(tm, null, 2));

    const { data: sub } = await s.from('subscriptions').select('tier').eq('user_id', UID).single();
    console.log('TIER:', sub?.tier);

    const { data: prof } = await s.from('profiles').select('role').eq('id', UID).single();
    console.log('PROFILE_ROLE:', prof?.role);

    // Check workspace_members
    const { data: wm } = await s.from('workspace_members').select('workspace_id, role').eq('user_id', UID);
    console.log('WORKSPACE_MEMBERS:', JSON.stringify(wm, null, 2));

    // Check program_members
    const { data: pm } = await s.from('program_members').select('program_id, role').eq('user_id', UID);
    console.log('PROGRAM_MEMBERS:', JSON.stringify(pm, null, 2));
})();
