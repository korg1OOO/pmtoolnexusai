const fs = require('fs');
const path = require('path');

const filePath = process.argv[2];
if (!filePath) {
    console.error('Usage: node fix_migration_idempotency.js <path_to_sql_file>');
    process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix Triggers: CREATE TRIGGER -> CREATE OR REPLACE TRIGGER
content = content.replace(/CREATE TRIGGER/g, 'CREATE OR REPLACE TRIGGER');

// 2. Fix Policies: DROP POLICY IF EXISTS ... before CREATE POLICY
// Pattern: CREATE POLICY "Name" ON table ...
// We need to capture the policy name and table name.
// Regex: CREATE POLICY "([^"]+)" ON ([^\s]+)
// Note: Policy names might not be quoted? Usually they are in Supabase migrations.
// Table names might be public.table or just table.

content = content.replace(/CREATE POLICY "([^"]+)" ON ([^\s]+)/g, (match, policyName, tableName) => {
    return `DROP POLICY IF EXISTS "${policyName}" ON ${tableName};\n${match}`;
});

// Also handle unquoted policy names if any (less common in generated migrations but possible)
// Regex: CREATE POLICY ([^"\s]+) ON ([^\s]+)
// Warning: This might overlap if not careful. The previous regex handles quoted ones.

fs.writeFileSync(filePath, content, 'utf8');
console.log(`Fixed idempotency in ${filePath}`);
