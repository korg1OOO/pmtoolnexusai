import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import postgres from "https://deno.land/x/postgresjs@v3.3.5/mod.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const dbUrl = Deno.env.get("SUPABASE_DB_URL");
    if (!dbUrl) throw new Error("Missing SUPABASE_DB_URL");

    const sql = postgres(dbUrl);

    // 1. Add columns to tasks
    await sql`ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS title text;`;
    await sql`ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);`;
    await sql`ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS description text;`;
    await sql`ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS due_date date;`;
    // Try creating standard columns as text, but if they are already ENUMs, this will just ignore
    await sql`ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS priority text;`;
    await sql`ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS sprint_id uuid;`;

    // 1.1 Fix the tasks "wbs" NOT NULL constraint
    // If it's a new task from the AI, it might not have a WBS. 
    // We'll give it a generic default, or set the column to allow nulls
    await sql`ALTER TABLE public.tasks ALTER COLUMN wbs DROP NOT NULL;`;

    // 2. Add columns to meetings
    // date violates not null constraint - let's set a default timestamp
    await sql`ALTER TABLE public.meetings ALTER COLUMN date SET DEFAULT CURRENT_DATE;`;

    // Let's populate any null dates to fix the constraint if any exists
    await sql`UPDATE public.meetings SET date = CURRENT_DATE WHERE date IS NULL;`;

    await sql`ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS organizer_id uuid REFERENCES auth.users(id);`;

    await sql`ALTER TABLE public.meetings ALTER COLUMN start_time TYPE timestamptz USING CASE 
            WHEN start_time::text ~ '^[0-9]{2}:[0-9]{2}' THEN (current_date || ' ' || start_time::text)::timestamptz 
            ELSE start_time::text::timestamptz 
        END;`;

    await sql`ALTER TABLE public.meetings ALTER COLUMN end_time TYPE timestamptz USING CASE 
            WHEN end_time::text ~ '^[0-9]{2}:[0-9]{2}' THEN (current_date || ' ' || end_time::text)::timestamptz 
            ELSE NULL
        END;`;

    // 5. Fix sprint tool in `execute-task-action`
    await sql`ALTER TABLE public.sprints ADD COLUMN IF NOT EXISTS name text;`;
    await sql`ALTER TABLE public.sprints ADD COLUMN IF NOT EXISTS goal text;`;
    await sql`ALTER TABLE public.sprints ADD COLUMN IF NOT EXISTS start_date date;`;
    await sql`ALTER TABLE public.sprints ADD COLUMN IF NOT EXISTS end_date date;`;

    await sql.end();
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
