#!/usr/bin/env tsx

/**
 * Complete Database Setup Script
 * 
 * This script:
 * 1. Creates the missing handle_updated_at() function
 * 2. Pushes all remaining migrations via Supabase CLI
 * 3. Can be run on new server setups
 * 
 * Usage: npm run setup-db
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_CLI = '/tmp/supabase';

function log(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
    const icons = {
        info: 'ℹ️ ',
        success: '✅',
        error: '❌',
        warning: '⚠️ '
    };
    console.log(`${icons[type]} ${message}`);
}

function executeCommand(command: string, description: string): boolean {
    try {
        log(description, 'info');
        execSync(command, {
            stdio: 'inherit',
            cwd: path.join(__dirname, '..'),
            encoding: 'utf-8'
        });
        log(`${description} - Complete`, 'success');
        return true;
    } catch (error: any) {
        log(`${description} - Failed: ${error.message}`, 'error');
        return false;
    }
}

async function main() {
    console.log('\n🚀 Kiroxys Database Setup\n');
    console.log('═══════════════════════════════════════\n');

    // Check if Supabase CLI exists
    if (!existsSync(SUPABASE_CLI)) {
        log('Supabase CLI not found at /tmp/supabase', 'error');
        log('Please download it first or install globally', 'info');
        process.exit(1);
    }

    // Step 1: Check if we're linked to a project
    log('Checking Supabase project link...', 'info');
    try {
        execSync(`${SUPABASE_CLI} projects list`, { stdio: 'ignore' });
        log('Supabase CLI authenticated', 'success');
    } catch {
        log('Not logged in to Supabase CLI', 'warning');
        log('Running login process...', 'info');

        if (!executeCommand(`${SUPABASE_CLI} login`, 'Supabase login')) {
            log('Login failed. Please run: /tmp/supabase login', 'error');
            process.exit(1);
        }
    }

    // Step 2: Push all migrations
    log('\nPushing all database migrations...', 'info');
    console.log('This will:');
    console.log('  - Create missing handle_updated_at() function');
    console.log('  - Apply all pending migrations');
    console.log('  - Set up complete database schema\n');

    const success = executeCommand(
        `${SUPABASE_CLI} db push --include-all`,
        'Applying migrations'
    );

    if (!success) {
        log('\nMigration failed. This might be because:', 'warning');
        log('  1. Project not linked - Run: /tmp/supabase link --project-ref YOUR_PROJECT_ID', 'info');
        log('  2. Network issue - Check your connection', 'info');
        log('  3. Permission issue - Verify your Supabase credentials', 'info');
        process.exit(1);
    }

    // Step 3: Success!
    console.log('\n═══════════════════════════════════════\n');
    log('Database setup complete! 🎉', 'success');
    console.log('\nNext steps:');
    console.log('  1. Open your app: http://localhost:8080');
    console.log('  2. Create your first project');
    console.log('  3. Start managing your projects!\n');
}

main().catch((error) => {
    log(`Unexpected error: ${error.message}`, 'error');
    process.exit(1);
});
