const fs = require('fs');
const { Client } = require('pg');

async function runMigration() {
    const client = new Client({
        connectionString: 'postgresql://postgres:ZjcJszLxFbP4YiE3@db.rlnaylyjxjjaqzwpuhar.supabase.co:5432/postgres',
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✓ Connected to database');

        // Read migration file
        const sql = fs.readFileSync('supabase/migrations/20260214_phase3_documents_knowledge.sql', 'utf8');

        console.log('\n📦 Running Phase 3 migration...\n');

        await client.query(sql);

        console.log('✓ Migration completed successfully\n');

        // Verify tables
        console.log('🔍 Verifying tables...\n');

        const tables = [
            'document_version_history',
            'knowledge_articles',
            'document_templates',
            'document_collaborators',
            'document_comments'
        ];

        for (const table of tables) {
            const { rows } = await client.query(`
                SELECT COUNT(*) as count 
                FROM information_schema.tables 
                WHERE table_name = $1
            `, [table]);

            if (rows[0].count > 0) {
                console.log(`✓ Table '${table}' created`);
            } else {
                console.log(`✗ Table '${table}' NOT found`);
            }
        }

        // Verify documents table columns
        console.log('\n🔍 Verifying documents table columns...\n');

        const columns = [
            'tenant_id',
            'workspace_id',
            'portfolio_id',
            'program_id',
            'sharing_scope',
            'document_type',
            'tags',
            'category',
            'is_template',
            'version_number'
        ];

        const { rows: docColumns } = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'documents'
            AND column_name = ANY($1)
        `, [columns]);

        const foundColumns = docColumns.map(r => r.column_name);

        columns.forEach(col => {
            if (foundColumns.includes(col)) {
                console.log(`✓ Column 'documents.${col}' added`);
            } else {
                console.log(`✗ Column 'documents.${col}' NOT found`);
            }
        });

        // Verify functions
        console.log('\n🔍 Verifying functions...\n');

        const functions = [
            'populate_document_hierarchy',
            'update_knowledge_article_timestamp',
            'increment_template_usage',
            'update_document_comment_timestamp'
        ];

        for (const func of functions) {
            const { rows } = await client.query(`
                SELECT COUNT(*) as count 
                FROM pg_proc 
                WHERE proname = $1
            `, [func]);

            if (rows[0].count > 0) {
                console.log(`✓ Function '${func}()' created`);
            } else {
                console.log(`✗ Function '${func}()' NOT found`);
            }
        }

        console.log('\n✅ Phase 3 migration verification complete!\n');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigration();
