import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import postgres from "https://deno.land/x/postgresjs@v3.3.5/mod.js";

const tryDb = async () => {
    const dbUrl = process.env.VITE_SUPABASE_URL || "https://rlnaylyjxjjaqzwpuhar.supabase.co";
    const dbString = process.env.SUPABASE_DB_URL;
    if (!dbString) {
        console.error("Missing SUPABASE_DB_URL");
        process.exit(1);
    }
    const sql = postgres(dbString);
    const result = await sql`
        SELECT t.typname, e.enumlabel
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname IN ('issue_severity', 'issue_priority', 'issue_status', 'issue_type')
        ORDER BY t.typname, e.enumsortorder;
    `;
    console.log(result);
    await sql.end();
}
tryDb().catch(console.error);
