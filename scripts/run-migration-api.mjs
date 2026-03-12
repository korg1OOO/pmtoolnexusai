/**
 * run-migration.mjs
 * Runs a specific migration file against the Supabase project
 * using the Management API (no psql required).
 *
 * Usage:
 *   node scripts/run-migration-api.mjs supabase/migrations/20260219_plan_configs_and_pricing_cache.sql
 */

import { readFileSync } from 'fs';
import { config } from 'dotenv';
import { resolve } from 'path';

config(); // load .env

const PROJECT_REF = process.env.VITE_SUPABASE_PROJECT_ID;
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!PROJECT_REF || !ACCESS_TOKEN) {
    console.error('❌ VITE_SUPABASE_PROJECT_ID and SUPABASE_ACCESS_TOKEN must be set in .env');
    process.exit(1);
}

const [, , migrationFile] = process.argv;
if (!migrationFile) {
    console.error('Usage: node scripts/run-migration-api.mjs <path-to-migration.sql>');
    process.exit(1);
}

const sql = readFileSync(resolve(migrationFile), 'utf-8');

console.log(`🚀 Running migration: ${migrationFile}`);
console.log(`📡 Project: ${PROJECT_REF} (https://${PROJECT_REF}.supabase.co)\n`);

const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
        },
        body: JSON.stringify({ query: sql }),
    }
);

const body = await res.json().catch(() => ({}));

if (!res.ok) {
    console.error(`❌ Migration failed (HTTP ${res.status}):`);
    console.error(JSON.stringify(body, null, 2));
    process.exit(1);
}

console.log('✅ Migration applied successfully!');
if (body && Object.keys(body).length) {
    console.log(JSON.stringify(body, null, 2));
}
