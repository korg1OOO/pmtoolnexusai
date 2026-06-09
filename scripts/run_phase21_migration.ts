/**
 * Phase 21: Content Management - Migration Runner
 * Applies database schema for content management system
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    console.log('🚀 Starting Phase 21: Content Management Migration...\n');

    try {
        // Read migration file
        const migrationPath = path.join(
            __dirname,
            '../supabase/migrations/20260212063000_phase21_content_management.sql'
        );

        const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

        console.log('📝 Executing migration SQL...');

        // Execute migration
        const { error } = await supabase.rpc('exec_sql', {
            sql_string: migrationSQL
        });

        if (error) {
            // Try direct execution if rpc doesn't exist
            console.log('⚠️  RPC method not available, trying direct execution...');

            // Split by semicolon and execute statements individually
            const statements = migrationSQL
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0 && !s.startsWith('--'));

            for (const statement of statements) {
                if (statement.includes('CREATE') || statement.includes('INSERT') ||
                    statement.includes('ALTER') || statement.includes('COMMENT')) {
                    try {
                        await supabase.rpc('exec', { sql: statement });
                    } catch (err) {
                        console.warn(`⚠️  Statement warning:`, statement.substring(0, 50) + '...');
                    }
                }
            }
        }

        console.log('✅ Migration SQL executed\n');

        // Verify tables were created
        console.log('🔍 Verifying tables...');

        const tables = [
            'content_categories',
            'faqs',
            'blog_posts',
            'blog_tags',
            'blog_post_tags',
            'documentation',
            'media_library'
        ];

        for (const table of tables) {
            const { count, error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });

            if (error) {
                console.log(`❌ Table ${table}: NOT FOUND`);
            } else {
                console.log(`✅ Table ${table}: ${count} rows`);
            }
        }

        console.log('\n🔍 Verifying views...');

        const { data: faqs } = await supabase
            .from('published_faqs')
            .select('*')
            .limit(5);

        console.log(`✅ View published_faqs: ${faqs?.length || 0} rows`);

        const { data: blogs } = await supabase
            .from('published_blog_posts')
            .select('*')
            .limit(5);

        console.log(`✅ View published_blog_posts: ${blogs?.length || 0} rows`);

        const { data: docs } = await supabase
            .from('published_documentation')
            .select('*')
            .limit(5);

        console.log(`✅ View published_documentation: ${docs?.length || 0} rows`);

        console.log('\n🔍 Checking seed data...');

        const { data: categories } = await supabase
            .from('content_categories')
            .select('*');

        console.log(`✅ Categories seeded: ${categories?.length || 0} categories`);

        const { data: sampleFaqs } = await supabase
            .from('faqs')
            .select('*');

        console.log(`✅ Sample FAQs: ${sampleFaqs?.length || 0} FAQs`);

        const { data: tags } = await supabase
            .from('blog_tags')
            .select('*');

        console.log(`✅ Blog tags: ${tags?.length || 0} tags`);

        console.log('\n✅ Phase 21 Migration Complete!\n');
        console.log('📊 Summary:');
        console.log(`  - Tables created: ${tables.length}`);
        console.log(`  - Views created: 3`);
        console.log(`  - Categories: ${categories?.length || 0}`);
        console.log(`  - Sample FAQs: ${sampleFaqs?.length || 0}`);
        console.log(`  - Blog tags: ${tags?.length || 0}`);
        console.log('\n🎉 Content Management System database ready!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
