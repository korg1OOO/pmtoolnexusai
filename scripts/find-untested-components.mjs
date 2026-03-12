/**
 * Find all components that don't have test files yet.
 * Also detect common export patterns to help fix the generator.
 */
import fs from 'fs';
import path from 'path';

const componentsDir = 'src/components';
const testDir = 'src/test';

const existingTests = new Set(
    fs.readdirSync(testDir)
        .filter(f => f.endsWith('.test.ts') || f.endsWith('.test.tsx'))
        .map(f => f.replace('.test.ts', '').replace('.test.tsx', ''))
);

function walkDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const results = [];
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...walkDir(fullPath));
        } else if (entry.isFile() && entry.name.endsWith('.tsx') && !entry.name.endsWith('.test.tsx')) {
            results.push(fullPath);
        }
    }
    return results;
}

const allComponents = walkDir(componentsDir);
const untested = [];

for (const filePath of allComponents) {
    const baseName = path.basename(filePath, '.tsx');
    if (baseName === 'index') continue;
    if (existingTests.has(baseName)) continue;

    const content = fs.readFileSync(filePath, 'utf-8');
    if (content.split('\n').length < 5) continue;

    // Detect export pattern
    const hasDefaultExport = /export default/.test(content);
    const defaultExportName = content.match(/export default (\w+)/)?.[1];
    const namedExports = [...content.matchAll(/export (?:function|const) (\w+)/g)].map(m => m[1]);
    const forwardRef = content.includes('forwardRef');
    const reExport = content.includes('export {') || content.includes('export *');

    untested.push({
        file: filePath.replace(/\\/g, '/'),
        baseName,
        hasDefaultExport,
        defaultExportName: defaultExportName || null,
        namedExports,
        forwardRef,
        reExport,
    });
}

console.log(`\nUntested components: ${untested.length}\n`);

// Group by pattern
const patterns = {
    defaultNamed: untested.filter(u => u.defaultExportName),
    defaultAnon: untested.filter(u => u.hasDefaultExport && !u.defaultExportName),
    namedOnly: untested.filter(u => !u.hasDefaultExport && u.namedExports.length > 0),
    forwardRef: untested.filter(u => u.forwardRef),
    reExport: untested.filter(u => u.reExport),
    none: untested.filter(u => !u.hasDefaultExport && u.namedExports.length === 0 && !u.reExport),
};

console.log('Export patterns:');
console.log(`  Default (named):     ${patterns.defaultNamed.length}`);
console.log(`  Default (anonymous): ${patterns.defaultAnon.length}`);
console.log(`  Named exports only:  ${patterns.namedOnly.length}`);
console.log(`  forwardRef:          ${patterns.forwardRef.length}`);
console.log(`  Re-exports:          ${patterns.reExport.length}`);
console.log(`  No exports detected: ${patterns.none.length}`);

// Print first 10 of each pattern
for (const [key, items] of Object.entries(patterns)) {
    if (items.length > 0) {
        console.log(`\n--- ${key} (${items.length}) ---`);
        for (const item of items.slice(0, 5)) {
            console.log(`  ${item.file} => default=${item.defaultExportName}, named=[${item.namedExports.join(',')}]`);
        }
        if (items.length > 5) console.log(`  ... and ${items.length - 5} more`);
    }
}
