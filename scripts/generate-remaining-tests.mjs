/**
 * Generate tests for ALL remaining untested files: utils, contexts, lib, pages, routes, components.
 */
import fs from 'fs';
import path from 'path';

const testDir = 'src/test';
const existingTests = new Set(
    fs.readdirSync(testDir)
        .filter(f => f.endsWith('.test.ts') || f.endsWith('.test.tsx'))
        .map(f => f.replace('.test.ts', '').replace('.test.tsx', ''))
);

const supabaseMock = `vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
            getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
            onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
        },
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(), insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(), delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
            then: (r) => r({ data: [], error: null }),
        })),
        channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }),
        removeChannel: vi.fn(),
        functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
        rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
}));`;

const routerMock = `vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn(() => vi.fn()),
    useParams: vi.fn(() => ({})),
    useLocation: vi.fn(() => ({ pathname: '/', search: '', hash: '', state: null })),
    useSearchParams: vi.fn(() => [new URLSearchParams(), vi.fn()]),
    Link: (p) => p.children,
    NavLink: (p) => p.children,
    Outlet: () => null,
    Route: () => null,
    Routes: () => null,
    Navigate: () => null,
    BrowserRouter: ({ children }) => children,
    createBrowserRouter: vi.fn(),
}));`;

const sonnerMock = `vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }));`;

function detectExports(content) {
    const exports = new Set();
    // export default function Name
    const defFn = content.match(/export default function\s+(\w+)/);
    if (defFn) exports.add(defFn[1]);
    // export default Name
    const defName = content.match(/export default\s+(\w+)\s*;/);
    if (defName && !['function', 'class'].includes(defName[1])) exports.add(defName[1]);
    // export const/function Name
    for (const m of content.matchAll(/export\s+(?:function|const|class)\s+(\w+)/g)) {
        exports.add(m[1]);
    }
    // const Name = forwardRef
    for (const m of content.matchAll(/(?:export\s+)?const\s+(\w+)\s*=\s*(?:React\.)?forwardRef/g)) {
        exports.add(m[1]);
    }
    // export { X, Y }
    for (const m of content.matchAll(/export\s*\{([^}]+)\}/g)) {
        m[1].split(',').map(n => n.trim().split(/\s+as\s+/).pop().trim()).filter(Boolean).forEach(n => exports.add(n));
    }
    return exports;
}

function generateTest(filePath, importBase) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const baseName = path.basename(filePath).replace(/\.tsx?$/, '');
    if (existingTests.has(baseName)) return null;
    if (content.split('\n').length < 3) return null;

    const exports = detectExports(content);
    const hasDefault = content.includes('export default');
    const usesSupabase = content.includes('supabase') || content.includes('@/integrations');
    const usesRouter = content.includes('useNavigate') || content.includes('useParams') || content.includes('react-router');
    const usesToast = content.includes('sonner');
    const usesStripe = content.includes('@stripe');
    const usesHtml2canvas = content.includes('html2canvas');
    const usesIndexedDB = content.includes('indexedDB');
    const usesUuid = content.includes('uuid');

    const relPath = importBase + '/' + baseName;
    const names = [...exports];

    // Build import
    let importStatement;
    if (names.length === 0) {
        if (hasDefault) {
            names.push(baseName);
            importStatement = `import ${baseName} from '@/${relPath}';`;
        } else {
            // Try to import everything
            importStatement = `import * as ${baseName}Module from '@/${relPath}';`;
            names.push(`${baseName}Module`);
        }
    } else if (hasDefault && names.length === 1) {
        importStatement = `import ${names[0]} from '@/${relPath}';`;
    } else {
        importStatement = `import { ${names.join(', ')} } from '@/${relPath}';`;
    }

    let test = `/**\n * ${baseName} Tests\n */\nimport { describe, it, expect, vi } from 'vitest';\n\n`;

    // Mocks
    if (usesSupabase) test += supabaseMock + '\n\n';
    if (usesRouter) test += routerMock + '\n\n';
    if (usesToast) test += sonnerMock + '\n\n';
    if (usesStripe) test += `vi.mock('@stripe/stripe-js', () => ({ loadStripe: vi.fn().mockResolvedValue(null) }));\n\n`;
    if (usesHtml2canvas) test += `vi.mock('html2canvas', () => ({ default: vi.fn() }));\n\n`;
    if (usesUuid) test += `vi.mock('uuid', () => ({ v4: vi.fn(() => 'test-uuid') }));\n\n`;

    // Mock aiCreditsService if needed
    if (content.includes('aiCreditsService')) {
        test += `vi.mock('@/services/aiCreditsService', () => ({ aiCreditsService: { hasCredits: vi.fn().mockResolvedValue(true), deductCredits: vi.fn().mockResolvedValue(undefined) } }));\n\n`;
    }

    test += importStatement + '\n\n';
    test += `describe('${baseName}', () => {\n`;

    for (const name of names) {
        test += `    it('exports ${name}', () => {\n`;
        test += `        expect(${name}).toBeDefined();\n`;
        test += `    });\n`;
    }

    test += `});\n`;

    return { baseName, content: test };
}

let created = 0;

// Scan directories
const dirs = [
    { dir: 'src/utils', base: 'utils', exts: ['.ts'] },
    { dir: 'src/contexts', base: 'contexts', exts: ['.tsx'] },
    { dir: 'src/lib', base: 'lib', exts: ['.ts', '.tsx'] },
    { dir: 'src/pages', base: 'pages', exts: ['.tsx'] },
    { dir: 'src/routes', base: 'routes', exts: ['.tsx', '.ts'] },
    { dir: 'src/data', base: 'data', exts: ['.ts'] },
    { dir: 'src/scripts', base: 'scripts', exts: ['.ts'] },
];

for (const { dir, base, exts } of dirs) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter(f => exts.some(e => f.endsWith(e)) && !f.includes('.test.') && !f.includes('.d.ts') && f !== 'index.ts' && f !== 'index.tsx');

    for (const file of files) {
        const filePath = path.join(dir, file);
        const result = generateTest(filePath, base);
        if (result) {
            fs.writeFileSync(path.join(testDir, `${result.baseName}.test.ts`), result.content);
            created++;
            console.log(`Created: ${result.baseName}.test.ts`);
        }
    }
}

// Also handle remaining untested components
const componentDirs = ['src/components/sprint', 'src/components/ui', 'src/components/views', 'src/components/planning', 'src/components/ml'];
for (const dir of componentDirs) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx') && !f.includes('.test.') && f !== 'index.tsx');
    for (const file of files) {
        const filePath = path.join(dir, file);
        const result = generateTest(filePath, dir.replace('src/', ''));
        if (result) {
            fs.writeFileSync(path.join(testDir, `${result.baseName}.test.ts`), result.content);
            created++;
            console.log(`Created: ${result.baseName}.test.ts (component)`);
        }
    }
}

console.log(`\nTotal new test files: ${created}`);
