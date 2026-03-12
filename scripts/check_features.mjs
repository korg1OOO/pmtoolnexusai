
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
    console.log('Checking features table...');
    const { data, error } = await supabase.from('features').select('key, name, category');
    if (error) {
        console.error('Error:', error);
    } else {
        console.log(`Found ${data.length} features.`);
        console.table(data);
    }
}

check();
