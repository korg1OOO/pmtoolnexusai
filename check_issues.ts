import { createClient } from "@supabase/supabase-js";

async function main() {
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseKey) {
        console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Try to fetch an issue to see if the table exists
    const { data: issues, error } = await supabase.from('issues').select('*').limit(1);
    console.log("Issues Table Data/Error:", { issues, error });
}

main().catch(console.error);
