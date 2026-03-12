/**
 * k6 Load Test — Critical User Journeys
 * 
 * Run: k6 run k6/load-test.js
 * 
 * Tests API endpoints under load to verify performance targets.
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || '';

export const options = {
    stages: [
        { duration: '30s', target: 10 },   // Ramp up to 10 users
        { duration: '1m', target: 20 },    // Hold at 20 users
        { duration: '30s', target: 50 },   // Spike to 50 users
        { duration: '1m', target: 50 },    // Hold spike
        { duration: '30s', target: 0 },    // Ramp down
    ],
    thresholds: {
        'http_req_duration': ['p(95)<2000'],     // 95% requests under 2s
        'http_req_failed': ['rate<0.05'],         // Error rate under 5%
        'http_req_duration{name:auth}': ['p(95)<1000'],
        'http_req_duration{name:projects}': ['p(95)<1500'],
    },
};

export default function () {
    // 1. Auth endpoint
    const authRes = http.post(
        `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
        JSON.stringify({
            email: 'loadtest@example.com',
            password: 'LoadTestPass123!',
        }),
        {
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
            },
            tags: { name: 'auth' },
        }
    );
    check(authRes, { 'auth status 200': (r) => r.status === 200 });

    // 2. Projects list (public test)
    const projectsRes = http.get(`${BASE_URL}/api/projects`, {
        tags: { name: 'projects' },
    });
    check(projectsRes, { 'projects accessible': (r) => r.status < 500 });

    // 3. Static assets
    const staticRes = http.get(`${BASE_URL}/`);
    check(staticRes, { 'homepage loads': (r) => r.status === 200 });

    sleep(1);
}
