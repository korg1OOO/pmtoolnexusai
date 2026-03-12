import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');

let SUPABASE_URL = '';
let SUPABASE_KEY = '';

envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        const key = match[1].trim();
        const value = match[2].replace(/^["']|["']$/g, '').trim();
        if (key === 'VITE_SUPABASE_URL') SUPABASE_URL = value;
        if (key === 'VITE_SUPABASE_PUBLISHABLE_KEY') SUPABASE_KEY = value;
    }
});

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Error: Could not load Supabase credentials from .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
    console.log('🚀 ProjectOye Database Seeder\n');
    console.log('═══════════════════════════════\n');

    // Check if tables exist
    console.log('🔍 Checking database connection...\n');
    const { data: existingProjects, error: checkError } = await supabase
        .from('projects')
        .select('id')
        .limit(1);

    if (checkError) {
        if (checkError.code === '42P01') {
            console.error('❌ Error: Database tables do not exist!');
            console.error('\n📋 Please apply migrations first:');
            console.error('   1. Go to: https://supabase.com/dashboard/project/wmnfuwmjauslyqqucmov/sql/new');
            console.error('   2. Copy and paste the contents of: supabase/migrations/COMBINED_MIGRATION.sql');
            console.error('   3. Click "Run"\n');
            process.exit(1);
        }
        console.error('❌ Database error:', checkError);
        process.exit(1);
    }

    console.log('✅ Database connection successful!\n');

    // Check if we already have projects
    if (existingProjects && existingProjects.length > 0) {
        console.log('ℹ️  Database already has projects. Skipping seed.\n');
        console.log('✅ Your app should work at: http://localhost:8080\n');
        return;
    }

    console.log('📝 Creating sample project...\n');

    // Create a sample project
    const today = new Date();
    const endDate = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);

    const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
            name: 'Digital Transformation Project',
            code: 'DTP-2026',
            description: 'Enterprise-wide digital transformation initiative',
            methodology: 'hybrid',
            status: 'active',
            health: 'green',
            start_date: today.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
            budget: 500000,
            spent: 125000,
            progress: 25
        })
        .select()
        .single();

    if (projectError) {
        console.error('❌ Error creating project:', projectError);
        process.exit(1);
    }

    console.log(`✅ Created project: ${project.name} (${project.code})\n`);

    // Create sample tasks
    console.log('📋 Creating sample tasks...\n');

    const getDate = (daysFromNow: number) => {
        const date = new Date(today.getTime() + daysFromNow * 24 * 60 * 60 * 1000);
        return date.toISOString().split('T')[0];
    };

    const tasks = [
        {
            project_id: project.id,
            wbs: '1',
            name: 'Project Initiation',
            type: 'summary',
            status: 'completed',
            priority: 'high',
            start_date: getDate(0),
            end_date: getDate(14),
            duration: 14,
            progress: 100,
            level: 0,
            sort_order: 0
        },
        {
            project_id: project.id,
            wbs: '1.1',
            name: 'Project Charter Approved',
            type: 'milestone',
            status: 'completed',
            priority: 'critical',
            start_date: getDate(14),
            end_date: getDate(14),
            duration: 0,
            progress: 100,
            level: 1,
            sort_order: 1
        },
        {
            project_id: project.id,
            wbs: '2',
            name: 'Requirements & Planning',
            type: 'summary',
            status: 'in-progress',
            priority: 'high',
            start_date: getDate(14),
            end_date: getDate(35),
            duration: 21,
            progress: 60,
            level: 0,
            sort_order: 2
        },
        {
            project_id: project.id,
            wbs: '2.1',
            name: 'Stakeholder Analysis',
            type: 'task',
            status: 'completed',
            priority: 'high',
            start_date: getDate(14),
            end_date: getDate(21),
            duration: 7,
            progress: 100,
            level: 1,
            sort_order: 3
        },
        {
            project_id: project.id,
            wbs: '2.2',
            name: 'Requirements Gathering',
            type: 'task',
            status: 'in-progress',
            priority: 'high',
            start_date: getDate(21),
            end_date: getDate(35),
            duration: 14,
            progress: 40,
            level: 1,
            sort_order: 4
        },
        {
            project_id: project.id,
            wbs: '3',
            name: 'Design & Development',
            type: 'summary',
            status: 'not-started',
            priority: 'medium',
            start_date: getDate(35),
            end_date: getDate(70),
            duration: 35,
            progress: 0,
            level: 0,
            sort_order: 5
        },
        {
            project_id: project.id,
            wbs: '3.1',
            name: 'System Architecture Design',
            type: 'task',
            status: 'not-started',
            priority: 'high',
            start_date: getDate(35),
            end_date: getDate(49),
            duration: 14,
            progress: 0,
            level: 1,
            sort_order: 6
        },
        {
            project_id: project.id,
            wbs: '4',
            name: 'Go-Live',
            type: 'milestone',
            status: 'not-started',
            priority: 'critical',
            start_date: getDate(90),
            end_date: getDate(90),
            duration: 0,
            progress: 0,
            level: 0,
            sort_order: 7
        }
    ];

    const { data: createdTasks, error: tasksError } = await supabase
        .from('tasks')
        .insert(tasks)
        .select();

    if (tasksError) {
        console.error('❌ Error creating tasks:', tasksError);
    } else {
        console.log(`✅ Created ${createdTasks.length} sample tasks\n`);
    }

    console.log('═══════════════════════════════\n');
    console.log('🎉 Database setup complete!\n');
    console.log('👉 Open your app: http://localhost:8080\n');
}

main().catch((error) => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
});
