require('dotenv').config();

const sql = [
    'CREATE OR REPLACE FUNCTION public.assign_project_creator_role(',
    '  p_user_id UUID,',
    '  p_project_id UUID',
    ')',
    'RETURNS void',
    'LANGUAGE plpgsql',
    'SECURITY DEFINER',
    'SET search_path = public',
    'AS $$',
    'BEGIN',
    '  INSERT INTO user_roles (user_id, project_id, role, role_name)',
    "  VALUES (p_user_id, p_project_id, 'admin', 'admin')",
    '  ON CONFLICT (user_id, project_id)',
    "  DO UPDATE SET role = 'admin', role_name = 'admin';",
    'END;',
    '$$;',
].join('\n');

const token = process.env.SUPABASE_ACCESS_TOKEN;

fetch('https://api.supabase.com/v1/projects/rlnaylyjxjjaqzwpuhar/database/query', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
}).then(r => {
    console.log('Status:', r.status);
    return r.text();
}).then(t => {
    console.log('Result:', t);

    // Now test it
    const { createClient } = require('@supabase/supabase-js');
    const c = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    c.auth.admin.listUsers().then(({ data: { users } }) => {
        const u = users.find(x => x.email && x.email.includes('user1_'));
        console.log('User:', u.id.substring(0, 8));

        // Create project
        c.from('projects').insert({
            name: 'V4 Role Test',
            code: 'V4T',
            methodology: 'waterfall',
            status: 'active',
            start_date: '2026-03-04',
            owner_id: u.id,
        }).select().single().then(({ data: p, error: e1 }) => {
            if (e1) { console.log('Proj err:', e1.message); return; }
            console.log('Project:', p.id.substring(0, 8));

            // Assign role
            c.rpc('assign_project_creator_role', {
                p_user_id: u.id,
                p_project_id: p.id,
            }).then(({ error: e2 }) => {
                console.log('Role assign:', e2 ? 'FAIL:' + e2.message : 'SUCCESS');

                // Verify
                c.rpc('get_user_role', {
                    p_user_id: u.id,
                    p_project_id: p.id,
                }).then(({ data: role }) => {
                    console.log('Role check:', role);
                });
            });
        });
    });
}).catch(e => console.log('Error:', e.message));
