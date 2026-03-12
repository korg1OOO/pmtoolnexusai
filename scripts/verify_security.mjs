import 'dotenv/config';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

console.log('=== SECURITY VERIFICATION ===\n');

// TEST 1: Unauthenticated access to protected tables
console.log('--- TEST 1: Unauthenticated API Access ---');
const tables = ['projects', 'risks', 'issues', 'milestones', 'profiles', 'users', 'notebooks', 'meetings', 'decisions', 'actions', 'backlog_items', 'change_requests', 'deliverables'];

for (const table of tables) {
    try {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?limit=1`, {
            headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' }
            // NOTE: No Authorization bearer token — testing unauthenticated access
        });
        const body = await r.text();
        const rowCount = body.startsWith('[') ? JSON.parse(body).length : 0;
        console.log(`  ${table}: ${r.status} — ${rowCount > 0 ? '⚠️ EXPOSED ' + rowCount + ' rows' : '✅ Protected (0 rows or error)'}`);
    } catch (e) {
        console.log(`  ${table}: ✅ Error (${e.message})`);
    }
}

// TEST 2: Auth token validation — try with invalid token
console.log('\n--- TEST 2: Invalid Auth Token ---');
const r2 = await fetch(`${SUPABASE_URL}/rest/v1/projects?limit=1`, {
    headers: {
        'apikey': ANON_KEY,
        'Authorization': 'Bearer invalid_token_12345',
        'Content-Type': 'application/json'
    }
});
console.log(`  Invalid token response: ${r2.status} — ${r2.status === 401 ? '✅ Rejected' : '⚠️ Accepted'}`);

// TEST 3: CORS Headers check
console.log('\n--- TEST 3: CORS Headers ---');
const r3 = await fetch(`${SUPABASE_URL}/rest/v1/projects`, {
    method: 'OPTIONS',
    headers: {
        'apikey': ANON_KEY,
        'Origin': 'http://evil-site.com',
        'Access-Control-Request-Method': 'GET'
    }
});
const cors = r3.headers.get('access-control-allow-origin');
console.log(`  Access-Control-Allow-Origin: ${cors || 'not set'}`);
console.log(`  ${cors === '*' ? '⚠️ Wildcard CORS (default Supabase)' : cors ? '✅ Restricted CORS' : '⚠️ No CORS header'}`);

// TEST 4: SQL Injection attempt via RPC
console.log('\n--- TEST 4: SQL Injection via query params ---');
const r4 = await fetch(`${SUPABASE_URL}/rest/v1/projects?name=eq.'; DROP TABLE projects; --`, {
    headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' }
});
console.log(`  SQL injection attempt: ${r4.status} — ${r4.status < 500 ? '✅ No server error' : '⚠️ Server error'}`);

// TEST 5: RLS policy verification
console.log('\n--- TEST 5: RLS on critical tables ---');
const token = process.env.SUPABASE_ACCESS_TOKEN;
const rls = await fetch('https://api.supabase.com/v1/projects/rlnaylyjxjjaqzwpuhar/database/query', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public' AND tablename IN ('projects','risks','issues','profiles','users','notebooks','user_roles') ORDER BY tablename;` }),
});
const rlsData = await rls.json();
console.log('  RLS Status:');
for (const row of rlsData) {
    console.log(`    ${row.tablename}: ${row.rowsecurity ? '✅ RLS ON' : '❌ RLS OFF'}`);
}

console.log('\n=== SECURITY VERIFICATION COMPLETE ===');
