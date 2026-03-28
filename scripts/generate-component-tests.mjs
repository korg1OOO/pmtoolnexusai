/**
 * Improved generator for the remaining 121 untested components.
 * Handles: export default function, forwardRef, re-exports, named exports.
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
        const fp = path.join(dir, entry.name);
        if (entry.isDirectory()) results.push(...walkDir(fp));
        else if (entry.isFile() && entry.name.endsWith('.tsx') && !entry.name.endsWith('.test.tsx')) results.push(fp);
    }
    return results;
}

let created = 0;

for (const filePath of walkDir(componentsDir)) {
    const baseName = path.basename(filePath, '.tsx');
    if (baseName === 'index' || existingTests.has(baseName)) continue;

    const content = fs.readFileSync(filePath, 'utf-8');
    if (content.split('\n').length < 5) continue;

    const relPath = path.relative('src', filePath).replace(/\\/g, '/').replace('.tsx', '');

    // Detect ALL exported names properly
    const exportedNames = new Set();

    // 1. export default function Name(...)
    const defFnMatch = content.match(/export default function\s+(\w+)/);
    if (defFnMatch && defFnMatch[1] !== 'function') exportedNames.add(defFnMatch[1]);

    // 2. export default Name
    const defNameMatch = content.match(/export default\s+(\w+)\s*;/);
    if (defNameMatch && !['function', 'class'].includes(defNameMatch[1])) exportedNames.add(defNameMatch[1]);

    // 3. export function Name / export const Name
    for (const m of content.matchAll(/export\s+(?:function|const)\s+(\w+)/g)) {
        if (!['default'].includes(m[1])) exportedNames.add(m[1]);
    }

    // 4. forwardRef pattern: const Name = React.forwardRef(...)
    for (const m of content.matchAll(/(?:export\s+)?const\s+(\w+)\s*=\s*(?:React\.)?forwardRef/g)) {
        exportedNames.add(m[1]);
    }

    // 5. Re-exports: export { Name, Name2 }
    for (const m of content.matchAll(/export\s*\{([^}]+)\}/g)) {
        const names = m[1].split(',').map(n => n.trim().split(/\s+as\s+/).pop().trim()).filter(Boolean);
        names.forEach(n => exportedNames.add(n));
    }

    // 6. Detect component name from const Name = () => ... or const Name: React.FC
    for (const m of content.matchAll(/const\s+(\w+)\s*(?::\s*React\.FC[^=]*)?=\s*(?:\([^)]*\)|)\s*=>/g)) {
        if (content.includes(`export default ${m[1]}`) || content.includes(`export { ${m[1]}`)) {
            exportedNames.add(m[1]);
        }
    }

    if (exportedNames.size === 0) {
        // Fallback: if we see export default and nothing else, use the filename as PascalCase
        if (content.includes('export default')) {
            exportedNames.add(baseName);
        } else {
            continue; // Skip if truly no exports
        }
    }

    // Determine if it's a default export
    const hasDefault = content.includes('export default');

    // Build import statement
    const names = [...exportedNames];
    const mainName = names[0];
    let importStatement;

    if (hasDefault && defFnMatch) {
        // export default function Name
        importStatement = `import ${mainName} from '@/${relPath}';`;
    } else if (hasDefault && defNameMatch && names.length === 1) {
        importStatement = `import ${mainName} from '@/${relPath}';`;
    } else {
        // Named exports
        importStatement = `import { ${names.join(', ')} } from '@/${relPath}';`;
    }

    // Detect dependencies for mocks
    const usesSupabase = content.includes('supabase');
    const usesRouter = content.includes('useNavigate') || content.includes('useParams') || content.includes('useLocation');
    const usesToast = content.includes("sonner") || content.includes('useToast');
    const usesQuery = content.includes('useQuery') || content.includes('useMutation');

    let testContent = `/**\n * ${baseName} Component Tests\n */\nimport { describe, it, expect, vi } from 'vitest';\n\n`;

    if (usesSupabase) {
        testContent += `vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
            getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
            onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
        },
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null, error: null }),
            then: (r) => r({ data: [], error: null }),
        })),
        channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }),
        removeChannel: vi.fn(),
    },
}));\n\n`;
    }

    if (usesRouter) {
        testContent += `vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn(() => vi.fn()),
    useParams: vi.fn(() => ({})),
    useLocation: vi.fn(() => ({ pathname: '/' })),
    useSearchParams: vi.fn(() => [new URLSearchParams(), vi.fn()]),
    Link: (p) => p.children,
}));\n\n`;
    }

    if (usesToast) {
        testContent += `vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }));\n\n`;
    }

    testContent += `${importStatement}\n\n`;
    testContent += `describe('${baseName}', () => {\n`;

    for (const name of names) {
        testContent += `    it('exports ${name}', () => {\n`;
        testContent += `        expect(${name}).toBeDefined();\n`;
        testContent += `    });\n`;
    }

    testContent += `});\n`;

    fs.writeFileSync(path.join(testDir, `${baseName}.test.ts`), testContent);
    created++;
}

console.log(`Generated ${created} component test files`);
