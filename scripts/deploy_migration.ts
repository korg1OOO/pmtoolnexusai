
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sql = postgres(process.env.DATABASE_URL!);

async function deploy() {
    const migrationFile = path.join(__dirname, '../supabase/migrations/20240206152000_create_project_templates.sql');
    const migrationSql = fs.readFileSync(migrationFile, 'utf8');

    console.log('Deploying migration...');
    try {
        await sql.unsafe(migrationSql);
        console.log('Migration deployed successfully!');
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

deploy();
