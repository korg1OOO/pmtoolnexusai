import 'dotenv/config';

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

const email = `test_signup_${Date.now()}@example.com`;
const password = 'TestPassword123!';
console.log('Testing signup with:', email);

const res = await fetch(`${url}/auth/v1/signup`, {
    method: 'POST',
    headers: {
        'apikey': anonKey,
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        email,
        password,
        data: { full_name: 'QA Test User' },
    }),
});

console.log('Status:', res.status);
const body = await res.json();

if (res.status >= 400) {
    console.log('ERROR:', JSON.stringify(body, null, 2));
} else {
    console.log('SUCCESS');
    console.log('User ID:', body.id?.substring(0, 8) || body.user?.id?.substring(0, 8));

    // Check profile via service role
    const sKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const userId = body.id || body.user?.id;
    if (userId) {
        const profRes = await fetch(`${url}/rest/v1/profiles?id=eq.${userId}&select=*`, {
            headers: { 'apikey': sKey, 'Authorization': `Bearer ${sKey}` },
        });
        const profiles = await profRes.json();
        console.log('Profile:', profRes.status, JSON.stringify(profiles).substring(0, 200));
    }
}
