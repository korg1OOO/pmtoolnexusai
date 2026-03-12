
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.join(__dirname, '..', 'src');
const SCHEMA_FILE = path.join(SRC_DIR, 'integrations', 'supabase', 'types.ts');
const OUTPUT_FILE = path.join(__dirname, '..', 'AUDIT_RESULTS.md');

// Simple parser for Supabase TS types
// This is non-trivial to parse perfectly without a TS compiler API,
// so we'll use regex/heuristics to extract table definitions.
// Structure is typically:
// export type Database = { public: { Tables: { [TableName]: { Row: { [Col]: Type }, ... } } } }

interface TableDefinition {
    name: string;
    columns: Set<string>;
}

interface UsageScan {
    file: string;
    table: string;
    usageType: 'insert' | 'update' | 'select' | 'interface';
    fields: string[];
}

const tableDefinitions = new Map<string, TableDefinition>();
const usages: UsageScan[] = [];

function parseSchema() {
    const content = fs.readFileSync(SCHEMA_FILE, 'utf-8');

    // Find "Tables" section first
    // This is a naive heuristic parser for the large types file

    // 1. Find all table names keys in 'Tables'
    // Regex: look for "TableName: {" followed by inner structure
    // This is hard with regex. Let's look for "Row: {" blocks and traceback the parent key

    const lines = content.split('\n');
    let currentTable = '';
    let inRowBlock = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Identify Table Start (heuristic based on indentation and common patterns in supabase-gen)
        // "tablename: {"
        if (line.match(/^\w+: \{$/) && !inRowBlock) {
            // This might be a table name, but also "public" or "Tables" or "Views"
        }

        // Better strategy: Find "Row: {" and scan columns until "}"
        if (line === 'Row: {') {
            inRowBlock = true;
            // Backtrack to find table name
            // The structure is usually:
            //       tablename: {
            //         Row: {
            let j = i - 1;
            while (j >= 0) {
                const prevLine = lines[j].trim();
                if (prevLine.endsWith(': {') && prevLine !== 'Row: {') {
                    currentTable = prevLine.replace(': {', '');
                    if (!tableDefinitions.has(currentTable)) {
                        tableDefinitions.set(currentTable, { name: currentTable, columns: new Set() });
                    }
                    break;
                }
                j--;
            }
        } else if (inRowBlock) {
            if (line === '}') {
                inRowBlock = false;
                currentTable = '';
            } else {
                // Parse column definition: "column_name: type" or "column_name?: type"
                const match = line.match(/^"?(\w+)"?\??:/);
                if (match && currentTable) {
                    tableDefinitions.get(currentTable)?.columns.add(match[1]);
                }
            }
        }
    }
}

function scanFile(filePath: string) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(SRC_DIR, filePath);

    // 1. Find usages: .from('table')
    const fromMatches = [...content.matchAll(/\.from\(['"]([^'"]+)['"]\)/g)];

    for (const match of fromMatches) {
        const table = match[1];
        // Look for subsequent .insert(), .update(), .select() in loose proximity or chained
        // This is very hard to exact match without AST.
        // We will look for object literals strictly inside the file for now, 
        // or specific Interface definitions related to the table.

        // Let's try to match Interfaces that extend X or defined near usages.
    }

    // Alternative: Heuristic scan for mismatched field names.
    // 1. Collect all words that look like database calls
    // 2. If valid usage, check fields.

    // Let's focus on common mismatches user mentioned:
    // "code" vs "type", "id" missing, etc.

    // Scan for .insert({...}) or .update({...}) blocks
    // Then extract the keys from the object literal.

    const modificationRegex = /\.(insert|update|upsert)\(\s*(\[[^\]]+\]|\{[^}]+\})/g;
    // This matches single-line or small multiline objects.
    // For larger ones we might fail.

    let match;
    while ((match = modificationRegex.exec(content)) !== null) {
        const operation = match[1];
        const payload = match[2];

        // Try to determine which table this operation belongs to.
        // Search backwards from match.index for ".from('table')"
        const before = content.substring(Math.max(0, match.index - 500), match.index);
        const tableMatch = before.match(/\.from\(['"]([^'"]+)['"]\)/);

        if (tableMatch) {
            const table = tableMatch[1];
            // Extract keys from payload
            const keys = [...payload.matchAll(/(\w+):/g)].map(m => m[1]);

            if (keys.length > 0) {
                // Validate against schema
                const def = tableDefinitions.get(table);
                if (def) {
                    const badFields = keys.filter(k => !def.columns.has(k) && k !== 'select' && k !== 'returning');
                    if (badFields.length > 0) {
                        badFields.forEach(field => {
                            usages.push({
                                file: relativePath,
                                table,
                                usageType: operation as any,
                                fields: [field]
                            });
                        });
                    }
                }
            }
        }
    }
}

function scanDirectory(dir: string) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            scanDirectory(fullPath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            scanFile(fullPath);
        }
    }
}

console.log('Starting Schema Audit...');
parseSchema();
console.log(`Loaded definitions for ${tableDefinitions.size} tables.`);
scanDirectory(SRC_DIR);

let output = `\n\n## Database Schema Alignment Audit

**Tables Analyzed:** ${tableDefinitions.size}
**Mismatches Found:** ${usages.length}

| File | Table | Operation | Mismatched Fields | Issue Type |
| :--- | :--- | :--- | :--- | :--- |
`;

if (usages.length === 0) {
    output += `\n*No explicit schema mismatches detected in .insert/.update calls.*`;
} else {
    usages.forEach(u => {
        output += `| ${u.file} | ${u.table} | ${u.usageType} | \`${u.fields.join(', ')}\` | Field not in DB Schema |\n`;
    });
}

// Check for common known mismatches defined by user rule
// "PlanDriver: code vs type" is hypothetical but we can check if 'plan_drivers' table exists
if (tableDefinitions.has('plan_drivers')) {
    //
}

fs.appendFileSync(OUTPUT_FILE, output);
console.log(`Schema audit complete. Appended results to ${OUTPUT_FILE}`);
