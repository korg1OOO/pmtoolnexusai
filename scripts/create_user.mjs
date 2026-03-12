/**
 * Seed User Script
 * Creates a user in Supabase Auth to resolve "User not found" errors.
 * Usage: node scripts/create_user.mjs <email> <password>
 */
import { createClient } from '@supabase/supabase-js';
import { config as dotenvConfig } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// Load .env
dotenvConfig({ path: join(rootDir, '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌  Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

const args = process.argv.slice(2);
const email = args[0] || 'admin@projectoye.com';
const password = args[1] || 'password123';

console.log(`🔌  Connecting to ${SUPABASE_URL}...`);
console.log(`👤  Creating user: ${email}`);

async function createUser() {
    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            full_name: 'Admin User',
        },
    });

    if (error) {
        console.error(`❌  Error creating user: ${error.message}`);
        // If user already exists, try to return success info
        if (error.message.includes('already registered')) {
            console.log('ℹ️   User already exists. You can log in with this email.');
        }
        process.exit(1);
    }

    console.log(`✅  User created successfully! ID: ${data.user.id}`);
    console.log(`🔑  Credentials: ${email} / ${password}`);
}

createUser();
