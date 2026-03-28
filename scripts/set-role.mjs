import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const s = createClient('https://rlnaylyjxjjaqzwpuhar.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
});

const role = process.argv[2]; // e.g. 'admin', 'pm', 'lead', 'developer', 'analyst', 'viewer'

async function main() {
    // 1. Find the test user
    const { data: users } = await s.auth.admin.listUsers({ perPage: 5 });
    const testUser = users?.users?.find(u => u.email === 'admin@projectoye.com');
    if (!testUser) { console.log('ERROR: admin@projectoye.com not found'); process.exit(1); }
    console.log('User ID:', testUser.id);

    // 2. Find the active project
    const { data: projects } = await s.from('projects').select('id, name').limit(5);
    console.log('Projects:', projects?.map(p => `${p.name} (${p.id})`));
    if (!projects?.length) { console.log('ERROR: No projects'); process.exit(1); }
    const projectId = projects[0].id;

    // 3. Get current role
    const { data: currentRole } = await s.from('user_roles')
        .select('role')
        .eq('user_id', testUser.id)
        .eq('project_id', projectId)
        .single();
    console.log('Current role:', currentRole?.role || 'none');

    if (!role) {
        console.log('\nUsage: node scripts/set-role.mjs <role>');
        console.log('  Roles: admin, pm, lead, developer, analyst, viewer');
        return;
    }

    // 4. Upsert role — update the 'role' column (the actual role used by the app)
    const { error } = await s.from('user_roles')
        .update({ role })
        .eq('user_id', testUser.id)
        .eq('project_id', projectId);
    if (error) {
        console.log('ERROR setting role:', error.message);
        process.exit(1);
    }
    console.log('Role set to:', role);
}


main();
