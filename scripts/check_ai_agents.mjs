
import { createClient } from '@supabase/supabase-js';
import { config as dotenvConfig } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// Load .env
dotenvConfig({ path: join(rootDir, '.env'), override: true });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    console.log('Checking ai_agents table...');
    const { data, error } = await supabase.from('ai_agents').select('count', { count: 'exact', head: true });

    if (error) {
        console.error('Error:', error);
    } else {
        console.log(`Found ${data} agents (count check).`);
        const { data: agents } = await supabase.from('ai_agents').select('*').limit(5);
        console.table(agents);
    }
}

check();
