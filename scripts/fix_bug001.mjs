import 'dotenv/config';

// BUG-001 Fix: Update methodology CHECK constraint to accept all frontend values
const sql = `ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_methodology_check;
ALTER TABLE public.projects ADD CONSTRAINT projects_methodology_check 
  CHECK (methodology IN ('waterfall', 'agile', 'agile-scrum', 'agile-kanban', 'hybrid', 'safe', 'custom'));`;

const token = process.env.SUPABASE_ACCESS_TOKEN;
console.log('Fixing BUG-001: Updating methodology constraint...');

const res = await fetch('https://api.supabase.com/v1/projects/rlnaylyjxjjaqzwpuhar/database/query', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
});

console.log('Status:', res.status);
const text = await res.text();
console.log('Result:', text);
