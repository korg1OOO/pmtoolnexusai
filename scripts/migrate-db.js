#!/usr/bin/env node

/**
 * Database Migration Script for Supabase
 * This script applies all migrations from supabase/migrations/ to your remote Supabase instance
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, options = {}) {
  try {
    return execSync(command, {
      cwd: rootDir,
      stdio: 'inherit',
      ...options
    });
  } catch (error) {
    log(`❌ Error executing command: ${command}`, 'red');
    throw error;
  }
}

async function main() {
  log('🚀 Starting database migration process...', 'green');

  // Check if .env file exists
  const envPath = join(rootDir, '.env');
  if (!existsSync(envPath)) {
    log('❌ Error: .env file not found', 'red');
    log('Please create a .env file with your Supabase credentials');
    process.exit(1);
  }

  // Load environment variables
  const envContent = readFileSync(envPath, 'utf-8');
  const envVars = {};
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.+)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      envVars[key] = value;
    }
  });

  // Extract project ref from VITE_SUPABASE_URL
  const supabaseUrl = envVars.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    log('❌ Error: VITE_SUPABASE_URL not found in .env', 'red');
    process.exit(1);
  }

  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  if (!projectRef) {
    log('❌ Error: Could not extract project reference from VITE_SUPABASE_URL', 'red');
    process.exit(1);
  }

  log(`📋 Project Reference: ${projectRef}`, 'green');

  // Link to Supabase project
  log('🔗 Linking to Supabase project...', 'yellow');
  try {
    execCommand(`npx supabase link --project-ref ${projectRef}`);
  } catch (error) {
    log('⚠️  Project may already be linked or link failed', 'yellow');
  }

  // Push migrations
  log('📤 Pushing migrations to remote database...', 'yellow');
  execCommand('npx supabase db push --include-all');

  // Success
  log('✅ Migration completed successfully!', 'green');
  log('');
  log('To verify, check your Supabase dashboard:');
  log(`https://supabase.com/dashboard/project/${projectRef}/editor`);
}

main().catch(error => {
  log(`❌ Migration failed: ${error.message}`, 'red');
  process.exit(1);
});
