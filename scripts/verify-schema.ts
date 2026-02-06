
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');

let SUPABASE_URL = '';
let SUPABASE_KEY = '';

envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        const key = match[1].trim();
        const value = match[2].replace(/^["']|["']$/g, '').trim();
        if (key === 'VITE_SUPABASE_URL') SUPABASE_URL = value;
        if (key === 'VITE_SUPABASE_PUBLISHABLE_KEY') SUPABASE_KEY = value;
    }
});

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verify() {
    console.log('Verifying schema...');

    // Attempt 1: Check information_schema (might be restricted)
    // Attempt 2: Just try to select the column

    // We'll try to insert a dummy record and select it back, or just select 1 limit 1

    console.log('Checking timeline_activities columns...');

    // Since we can't easily query information_schema via standard client without rpc possibly,
    // let's try a direct select.

    const { data, error } = await (supabase as any)
        .from('timeline_activities')
        .select('id, order_index')
        .limit(1);

    if (error) {
        console.error('❌ Error selecting order_index:', error);
    } else {
        console.log('✅ select order_index SUCCESS');
        console.log('Data:', data);
    }

    const { data: swimlanes, error: swimError } = await (supabase as any)
        .from('timeline_swimlanes')
        .select('id, order_index')
        .limit(1);

    if (swimError) {
        console.error('❌ Error selecting timeline_swimlanes.order_index:', swimError);
    } else {
        console.log('✅ select timeline_swimlanes.order_index SUCCESS');
    }
}

verify().catch(console.error);
