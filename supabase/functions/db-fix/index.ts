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

        // 1. Drop the new rigid policies
        await sql`DROP POLICY IF EXISTS "Users can view issues of their projects" ON public.issues;`;
        await sql`DROP POLICY IF EXISTS "Users can insert issues into their projects" ON public.issues;`;
        await sql`DROP POLICY IF EXISTS "Users can update issues of their projects" ON public.issues;`;
        await sql`DROP POLICY IF EXISTS "Users can delete issues of their projects" ON public.issues;`;

        // 2. Drop any lingering old policies just in case
        await sql`DROP POLICY IF EXISTS "Authenticated users can create issues" ON public.issues;`;
        await sql`DROP POLICY IF EXISTS "Authenticated users can delete issues" ON public.issues;`;
        await sql`DROP POLICY IF EXISTS "Authenticated users can update issues" ON public.issues;`;
        await sql`DROP POLICY IF EXISTS "Users can view issues" ON public.issues;`;
        await sql`DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.issues;`;

        // 3. Create a single, permissive policy for MVP functionality
        await sql`
            CREATE POLICY "Enable all for authenticated users"
            ON public.issues FOR ALL TO authenticated
            USING (auth.uid() IS NOT NULL)
            WITH CHECK (auth.uid() IS NOT NULL);
        `;

        await sql.end();
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
});
