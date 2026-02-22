import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
    const formData = {
        name: 'React UI Test Project 3',
        code: 'RUI003',
        description: 'Testing the form payload again',
        methodology: 'agile',
        status: 'active',
        health: 'green',
        start_date: '2026-01-01',
        end_date: null,
        budget: 1000000,
        spent: 0,
        progress: 0,
        owner_id: null,
    };
    
    console.log("Simulating UI insert...");
    const { data, error } = await supabase.from('projects').insert(formData).select();
    if (error) {
        console.error("UI Insert Failed:", error);
    } else {
        console.log("UI Insert Succeeded!", data);
    }
}
run();
