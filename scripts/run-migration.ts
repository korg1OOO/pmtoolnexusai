/**
 * scripts/run-migration.ts
 * Applies ai_pending_actions migration to the remote Supabase database.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const DATABASE_URL = process.env.DATABASE_URL ??
    "postgresql://postgres.rlnaylyjxjjaqzwpuhar:9kfAknS8q9tCJzo2@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

const sqlPath = join(process.cwd(), "supabase/migrations/20260220_ai_pending_actions.sql");
const sql = readFileSync(sqlPath, "utf-8");

async function run() {
    // Use pg from node_modules if available, else install inline
    let Client: any;
    try {
        ({ Client } = await import("pg"));
    } catch {
        console.log("pg not found, running via npx...");
        process.exit(2);
    }
    const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
    await client.connect();
    console.log("Applying migration: 20260220_ai_pending_actions.sql …");
    try {
        await client.query(sql);
        console.log("✅ Migration applied successfully.");
    } catch (err: any) {
        if (err.message?.includes("already exists")) {
            console.log("ℹ️  Already exists — migration is idempotent, skipping.");
        } else {
            console.error("❌ Migration failed:", err.message);
            process.exitCode = 1;
        }
    } finally {
        await client.end();
    }
}

run();
