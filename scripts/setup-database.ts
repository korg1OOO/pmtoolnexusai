import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase credentials from .env
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://wmnfuwmjauslyqqucmov.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_PUBLISHABLE_KEY not found');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);


async function checkIfMigrationsApplied() {
    console.log('🔍 Checking if migrations are already applied...\n');

    // Check if projects table exists
    const { data, error } = await supabase
        .from('projects')
        .select('id')
        .limit(1);

    if (error && error.code === '42P01') {
        // Table doesn't exist
        return false;
    }

    return true;
}

async function createSampleProject() {
    console.log('📝 Creating sample project...\n');

    try {
        // Create a sample project
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .insert({
                name: 'Sample Project',
                code: 'SAMPLE-001',
                description: 'A sample project to get you started with ProjectOye',
                methodology: 'hybrid',
                status: 'active',
                health: 'green',
                start_date: new Date().toISOString().split('T')[0],
                end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                budget: 100000,
                spent: 25000,
                progress: 25
            })
            .select()
            .single();

        if (projectError) {
            console.error('❌ Error creating project:', projectError);
            return null;
        }

        console.log('✅ Sample project created:', project.name);

        // Create some sample tasks
        const tasks = [
            {
                project_id: project.id,
                wbs: '1',
                name: 'Project Initiation',
                type: 'summary',
                status: 'completed',
                priority: 'high',
                start_date: project.start_date,
                end_date: new Date(new Date(project.start_date).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                duration: 7,
                progress: 100,
                level: 0,
                sort_order: 0
            },
            {
                project_id: project.id,
                wbs: '2',
                name: 'Planning Phase',
                type: 'summary',
                status: 'in-progress',
                priority: 'high',
                start_date: new Date(new Date(project.start_date).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                end_date: new Date(new Date(project.start_date).getTime() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                duration: 14,
                progress: 50,
                level: 0,
                sort_order: 1
            },
            {
                project_id: project.id,
                wbs: '3',
                name: 'Execution Phase',
                type: 'summary',
                status: 'not-started',
                priority: 'medium',
                start_date: new Date(new Date(project.start_date).getTime() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                end_date: new Date(new Date(project.start_date).getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                duration: 39,
                progress: 0,
                level: 0,
                sort_order: 2
            }
        ];

        const { data: createdTasks, error: tasksError } = await supabase
            .from('tasks')
            .insert(tasks)
            .select();

        if (tasksError) {
            console.error('❌ Error creating tasks:', tasksError);
        } else {
            console.log(`✅ Created ${createdTasks.length} sample tasks`);
        }

        return project;
    } catch (error) {
        console.error('❌ Error in createSampleProject:', error);
        return null;
    }
}

async function main() {
    console.log('🚀 ProjectOye Database Setup\n');
    console.log('═══════════════════════════════\n');

    const migrationsApplied = await checkIfMigrationsApplied();

    if (!migrationsApplied) {
        console.log('⚠️  Database tables do not exist!\n');
        console.log('📋 You have two options:\n');
        console.log('   1. Use Supabase Dashboard to run migrations:');
        console.log(`      → Go to: ${SUPABASE_URL.replace('https://', 'https://supabase.com/dashboard/project/')}/editor`);
        console.log('      → Open SQL Editor');
        console.log('      → Run each migration file from supabase/migrations/ in order\n');
        console.log('   2. Use Supabase CLI (requires authentication):');
        console.log('      → Run: /tmp/supabase login');
        console.log('      → Then: /tmp/supabase link --project-ref wmnfuwmjauslyqqucmov');
        console.log('      → Finally: /tmp/supabase db push\n');
        console.log('❌ Cannot proceed without migrations. Please apply migrations first.\n');
        process.exit(1);
    }

    console.log('✅ Database tables exist!\n');

    // Check if we have any projects
    const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, name, code')
        .limit(1);

    if (projectsError) {
        console.error('❌ Error checking projects:', projectsError);
        process.exit(1);
    }

    if (!projects || projects.length === 0) {
        console.log('⚠️  No projects found. Creating a sample project...\n');
        const project = await createSampleProject();

        if (project) {
            console.log('\n✅ Database setup complete!');
            console.log(`\n🎉 Your app should now work at: http://localhost:8080`);
        } else {
            console.log('\n❌ Failed to create sample project');
            process.exit(1);
        }
    } else {
        console.log(`✅ Found existing project: ${projects[0].name} (${projects[0].code})`);
        console.log('\n✅ Database is already set up!');
        console.log(`\n🎉 Your app should work at: http://localhost:8080`);
    }
}

main().catch(console.error);
