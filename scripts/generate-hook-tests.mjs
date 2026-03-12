/**
 * Generates basic hook test files for all hooks that don't already have tests.
 * Each test verifies the hook exports and can be rendered without crashing.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const hooksDir = path.join(__dirname, '..', 'src', 'hooks');
const testDir = path.join(__dirname, '..', 'src', 'test');

// Get all hook files
const hookFiles = fs.readdirSync(hooksDir)
    .filter(f => f.endsWith('.ts') || f.endsWith('.tsx'))
    .filter(f => f.startsWith('use'));

// Get existing test files
const existingTests = new Set(fs.readdirSync(testDir).map(f => f.replace('.test.ts', '').replace('.test.tsx', '')));

let created = 0;

for (const hookFile of hookFiles) {
    const baseName = hookFile.replace(/\.(ts|tsx)$/, '');

    // Skip if test already exists
    if (existingTests.has(baseName)) {
        continue;
    }

    // Read the hook file to find exports
    const content = fs.readFileSync(path.join(hooksDir, hookFile), 'utf-8');

    // Find exported functions/consts
    const exportedFunctions = [];
    const exportedConsts = [];
    const lines = content.split('\n');

    for (const line of lines) {
        const funcMatch = line.match(/^export (?:async )?function (\w+)/);
        if (funcMatch) exportedFunctions.push(funcMatch[1]);

        const constMatch = line.match(/^export const (\w+)/);
        if (constMatch) exportedConsts.push(constMatch[1]);
    }

    // Find the default hook (the one matching the filename)
    const mainHook = exportedFunctions.find(f => f === baseName) ||
        exportedFunctions.find(f => f.toLowerCase() === baseName.toLowerCase()) ||
        exportedFunctions[0];

    // Determine if it uses useQuery (needs wrapper)
    const usesQuery = content.includes('useQuery') || content.includes('useMutation') || content.includes('useInfiniteQuery');
    const usesAuth = content.includes('supabase');

    // Generate test content
    let testContent = `/**
 * ${baseName} Hook Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
${usesQuery ? "import { createWrapper } from './testUtils';\n" : ''}
`;

    // Add mocks
    if (usesAuth) {
        testContent += `vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
            getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
            onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
        },
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(), insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(), delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(), neq: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(), lte: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(), range: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            then: (r) => r({ data: [], error: null, count: 0 }),
        })),
        channel: vi.fn().mockReturnValue({
            on: vi.fn().mockReturnThis(),
            subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
        }),
        removeChannel: vi.fn(),
        functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
        rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
}));

`;
    }

    // Mock sonner (many hooks use toast)
    if (content.includes("from 'sonner'") || content.includes("from \"sonner\"")) {
        testContent += `vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn(), loading: vi.fn() }) }));\n\n`;
    }

    // Mock common hook dependencies
    const hookImports = [];
    for (const line of lines) {
        const importMatch = line.match(/from ['"]@\/hooks\/([\w-]+)['"]/);
        if (importMatch && importMatch[1] !== baseName) {
            hookImports.push(importMatch[1]);
        }
    }

    for (const dep of new Set(hookImports)) {
        // Generate a simple mock for each dependency hook
        const depContent = (() => {
            try {
                return fs.readFileSync(path.join(hooksDir, dep + '.ts'), 'utf-8');
            } catch {
                try {
                    return fs.readFileSync(path.join(hooksDir, dep + '.tsx'), 'utf-8');
                } catch {
                    return '';
                }
            }
        })();

        const depExports = [];
        for (const dline of depContent.split('\n')) {
            const m = dline.match(/^export (?:async )?function (\w+)/);
            if (m) depExports.push(m[1]);
            const cm = dline.match(/^export const (\w+)/);
            if (cm) depExports.push(cm[1]);
            const tm = dline.match(/^export type (\w+)/);
            if (tm) depExports.push(tm[1]);
        }

        if (depExports.length > 0) {
            const mockObj = depExports.map(e => {
                if (e.startsWith('use')) {
                    return `    ${e}: vi.fn().mockReturnValue({ data: null, isLoading: false, error: null })`;
                }
                return `    ${e}: vi.fn()`;
            }).join(',\n');
            testContent += `vi.mock('@/hooks/${dep}', () => ({\n${mockObj},\n}));\n\n`;
        }
    }

    // Import from the hook
    const allExports = [...exportedFunctions, ...exportedConsts];
    if (allExports.length > 0) {
        testContent += `import { ${allExports.join(', ')} } from '@/hooks/${baseName}';\n\n`;
    }

    // Write the describe block
    testContent += `describe('${baseName}', () => {\n`;

    // Shape test
    if (allExports.length > 0) {
        testContent += `    describe('exports', () => {\n`;
        testContent += `        it('exports all expected items', () => {\n`;
        for (const exp of allExports) {
            testContent += `            expect(${exp}).toBeDefined();\n`;
        }
        testContent += `        });\n`;
        testContent += `    });\n\n`;
    }

    // Hook render test (only for the main hook)
    if (mainHook) {
        const wrapperOpt = usesQuery ? ', { wrapper: createWrapper() }' : '';
        testContent += `    describe('${mainHook}', () => {\n`;
        testContent += `        it('can be rendered without crashing', () => {\n`;
        testContent += `            const { result } = renderHook(() => ${mainHook}()${wrapperOpt});\n`;
        testContent += `            expect(result.current).toBeDefined();\n`;
        testContent += `        });\n`;
        testContent += `    });\n`;
    }

    testContent += `});\n`;

    // Write the test file
    const testPath = path.join(testDir, `${baseName}.test.ts`);
    fs.writeFileSync(testPath, testContent);
    created++;
}

console.log(`Generated ${created} hook test files`);
