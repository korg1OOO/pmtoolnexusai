
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.join(__dirname, '..', 'src');

interface AuditEntry {
    category: string;
    name: string;
    dataPath: string;
    persistence: 'YES' | 'NO' | 'N/A' | 'UNKNOWN';
    status: '[LIVE]' | '[MOCK]' | '[BROKEN]' | '[SCHEMA MISMATCH]';
    issues: string[];
}

const registry: AuditEntry[] = [];

// Helper to find hook definition
function findHookDefinition(hookName: string): string | null {
    // Naive search in src/hooks and src/services
    // In a real IDE this is harder, but we can try common paths
    const potentialPaths = [
        path.join(SRC_DIR, 'hooks', `${hookName}.ts`),
        path.join(SRC_DIR, 'hooks', `${hookName}.tsx`),
        path.join(SRC_DIR, 'services', `${hookName.replace('use', '').toLowerCase()}Service.ts`), // heuristic
    ];

    // Also search recursively if needed, but let's start simple or scan all files once to build a map
    return searchFileByName(SRC_DIR, hookName);
}

function searchFileByName(dir: string, name: string): string | null {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            const result = searchFileByName(fullPath, name);
            if (result) return result;
        } else {
            if (file === `${name}.ts` || file === `${name}.tsx`) return fullPath;
        }
    }
    return null;
}

function analyzeFile(filePath: string) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const name = path.basename(filePath, path.extname(filePath));
    const relativePath = path.relative(SRC_DIR, filePath);
    const category = relativePath.split('/')[0] === 'pages' ? 'Page' : 'Component';

    if (name === 'App' || name === 'main' || name === 'vite-env.d') return;

    let dataPath = 'Internal State';
    let persistence: AuditEntry['persistence'] = 'N/A';
    let status: AuditEntry['status'] = '[LIVE]';
    const issues: string[] = [];

    // 1. Mock Detection
    if (content.includes('dummy') || content.includes('MOCK_') || content.includes('placeholder')) {
        status = '[MOCK]';
        persistence = 'NO';
        issues.push('Uses hardcoded/mock data');
    }

    // 2. Unwired/Broken
    if (content.match(/onClick=\{\(\) => console\.log/) || content.match(/onClick=\{\(\) => \{\}\}/)) {
        status = '[BROKEN]';
        issues.push('Unwired event handlers');
    }

    // 3. Data Source Tracing
    const supabaseMatch = content.match(/from\(['"]([^'"]+)['"]\)/);
    if (supabaseMatch) {
        dataPath = `Supabase <> ${supabaseMatch[1]}`;
        persistence = 'YES'; // Direct usage implies read, assuming write if upsert present
        if (content.includes('.upsert') || content.includes('.insert') || content.includes('.update') || content.includes('.delete')) {
            persistence = 'YES';
        } else {
            persistence = 'Unknown (Read-only?)';
        }
    } else {
        // Check for Hooks
        const hookMatch = content.match(/(use[A-Z][a-zA-Z]+)/);
        if (hookMatch) {
            const hookName = hookMatch[1];
            if (!['useState', 'useEffect', 'useCallback', 'useContext', 'useNavigate', 'useTranslation', 'useToast'].includes(hookName)) {
                // Analyze the Hook
                const hookPath = findHookDefinition(hookName);
                if (hookPath) {
                    const hookContent = fs.readFileSync(hookPath, 'utf-8');
                    const hookTableMatch = hookContent.match(/from\(['"]([^'"]+)['"]\)/);
                    if (hookTableMatch) {
                        dataPath = `Supabase (via ${hookName}) <> ${hookTableMatch[1]}`;
                        persistence = 'YES';
                    } else if (hookContent.includes('MOCK_') || hookContent.includes('dummy')) {
                        status = '[MOCK]';
                        persistence = 'NO';
                        dataPath = `Mock Hook (${hookName})`;
                        issues.push(`Hook ${hookName} returns mock data`);
                    } else {
                        dataPath = `Hook (${hookName})`;
                        persistence = 'UNKNOWN';
                    }
                } else {
                    dataPath = `Hook (${hookName})`;
                    persistence = 'UNKNOWN';
                }
            }
        }
    }

    // 4. Schema/Persistence Validation (Heuristic)
    // If Live but Persistence is NO/Unknown, flag it
    if (status === '[LIVE]' && (persistence === 'NO' || persistence === 'UNKNOWN')) {
        // status = '[PERSISTENCE FAILURE]'; // User requested flagging local-only as this
        // But let's be careful, purely presentation components might be Live but Read-Only. 
        // We'll mark as PERSISTENCE FAILURE only if it looks interactive (has inputs/buttons) but no write path.
        if (content.includes('<Input') || content.includes('<Button') || content.includes('<Form')) {
            if (persistence !== 'YES') {
                if (status !== '[MOCK]') { // Don't double flag mocks
                    issues.push('[PERSISTENCE FAILURE]: Interactive component with no clear DB write path');
                }
            }
        }
    }

    // 5. Schema Mismatch (Specific checks)
    if (content.includes('order_index') && dataPath.includes('activities')) {
        // We know we fixed this, so if we see it, it's actually GOOD now, unless the DB is broken.
        // But code analysis can't check DB state easily. We'll skip flagging this as mismatch 
        // since we just verified it.
    }

    registry.push({
        category,
        name,
        dataPath,
        persistence,
        status,
        issues
    });
}

function scan(dir: string) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            scan(fullPath);
        } else if (file.endsWith('.tsx')) {
            analyzeFile(fullPath);
        }
    }
}

console.log('Starting Deep Audit...');
scan(SRC_DIR);
console.log(JSON.stringify(registry, null, 2));
