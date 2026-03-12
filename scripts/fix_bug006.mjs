import 'dotenv/config';

const sql = `CREATE OR REPLACE FUNCTION public.assign_project_creator_role(
  p_user_id UUID,
  p_project_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $BODY$
BEGIN
  INSERT INTO user_roles (user_id, project_id, role, role_name)
  VALUES (p_user_id, p_project_id, 'admin', 'admin')
  ON CONFLICT (user_id, project_id)
  DO UPDATE SET role = 'admin', role_name = 'admin';
END;
$BODY$;`;

const token = process.env.SUPABASE_ACCESS_TOKEN;
console.log('Applying migration...');

const res = await fetch('https://api.supabase.com/v1/projects/rlnaylyjxjjaqzwpuhar/database/query', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
});

console.log('Status:', res.status);
const text = await res.text();
console.log('Result:', text);

// Now test
if (res.status === 201) {
    const { createClient } = await import('@supabase/supabase-js');
    const c = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    const { data: { users } } = await c.auth.admin.listUsers();
    const u = users.find(x => x.email?.includes('user1_'));
    console.log('Test user:', u.id.substring(0, 8));

    const { data: p, error: e1 } = await c.from('projects').insert({
        name: 'V5 Admin Test', code: 'V5T', methodology: 'waterfall',
        status: 'active', start_date: '2026-03-04', owner_id: u.id,
    }).select().single();

    if (e1) { console.log('Project err:', e1.message); process.exit(1); }
    console.log('Project created:', p.id.substring(0, 8));

    const { error: e2 } = await c.rpc('assign_project_creator_role', {
        p_user_id: u.id, p_project_id: p.id,
    });
    console.log('Role assign:', e2 ? 'FAIL:' + e2.message : 'SUCCESS');

    const { data: role } = await c.rpc('get_user_role', {
        p_user_id: u.id, p_project_id: p.id,
    });
    console.log('Role check:', role);
}
