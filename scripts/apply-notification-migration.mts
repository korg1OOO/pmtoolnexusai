/**
 * Apply notification migration only
 */

import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const { Client } = pg;

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const databaseUrl = process.env.DATABASE_URL;

async function applyNotificationMigration() {
    console.log('🔔 Applying Notification System Migration\n');

    const client = new Client({ connectionString: databaseUrl });

    try {
        await client.connect();
        console.log('✅ Connected to database\n');

        const migrationFile = join(
            __dirname,
            '../supabase/migrations/20260212230000_notification_system.sql'
        );

        const sql = readFileSync(migrationFile, 'utf-8');

        await client.query(sql);

        console.log('✅ Notification migration applied successfully!\n');
        console.log('📊 Tables Created:');
        console.log('   ✓ notifications');
        console.log('   ✓ email_queue');
        console.log('   ✓ notification_preferences');
        console.log('   ✓ email_templates (with 10 default templates)\n');

    } catch (error: any) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

applyNotificationMigration().catch(console.error);
