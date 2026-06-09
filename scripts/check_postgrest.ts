import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

async function check() {
    const projectId = 'afc82abc-0044-46bb-8664-9be11ff10629';

    const tables = ['actions', 'meetings', 'risks'];
    for (const t of tables) {
        const url = `${supabaseUrl}/rest/v1/${t}?project_id=eq.${projectId}&select=id,title,status`;
        const res = await fetch(url, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            }
        });
        const txt = await res.text();
        console.log(`Table ${t} response (${res.status}):`, txt);
    }
}

check();
