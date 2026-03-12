
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.join(__dirname, '..', 'src');

interface ComponentAudit {
    filePath: string;
    componentName: string;
    category: string;
    dataSource: string;
    verificationStatus: 'Live' | 'Mock' | 'Broken' | 'Unknown';
    missingFields: string[];
    hasLoadingState: boolean;
    hasErrorState: boolean;
    unwiredElements: string[];
}

const auditResults: ComponentAudit[] = [];

function scanDirectory(dir: string) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            scanDirectory(fullPath);
        } else if ((file.endsWith('.tsx') || file.endsWith('.ts')) && !file.includes('.test.') && !file.includes('.spec.')) {
            analyzeFile(fullPath);
        }
    }
}

function analyzeFile(filePath: string) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(SRC_DIR, filePath);
    const category = relativePath.split('/')[0]; // pages, components, etc.
    const componentName = path.basename(filePath, path.extname(filePath));

    // skip some non-component files
    if (componentName === 'vite-env.d' || componentName === 'main' || componentName === 'App') return;

    let dataSource = 'None';
    let verificationStatus: 'Live' | 'Mock' | 'Broken' | 'Unknown' = 'Unknown';
    let hasLoadingState = false;
    let hasErrorState = false;
    const unwiredElements: string[] = [];
    const missingFields: string[] = [];

    // 1. Data Source Detection
    if (content.includes('supabase.from')) {
        dataSource = 'Direct Supabase';
        verificationStatus = 'Live';
    } else if (content.match(/useQuery\(/)) {
        dataSource = 'React Query';
        verificationStatus = 'Live';
    } else if (content.includes('fetch(') || content.includes('axios.')) {
        dataSource = 'Fetch/Axios';
        verificationStatus = 'Live';
    }

    // Check for custom hooks which usually imply data source
    const hookMatches = content.match(/use[A-Z][a-zA-Z]+/g);
    if (hookMatches) {
        const dataHooks = hookMatches.filter(h =>
            !['useState', 'useEffect', 'useCallback', 'useMemo', 'useRef', 'useContext', 'useNavigate', 'useLocation', 'useParams', 'useToast'].includes(h)
        );
        if (dataHooks.length > 0) {
            if (dataSource === 'None') dataSource = `Hook (${dataHooks[0]})`;
            verificationStatus = 'Live'; // Assumption, usually hooks fetch data
        }
    }

    // 2. Mock Detection
    if (content.includes('MOCK_') || content.includes('dummy') || content.includes('placeholder')) {
        verificationStatus = 'Mock';
    }
    // Hardcoded arrays often look like: const data = [...] or const items = [...]
    if (content.match(/const [a-zA-Z0-9]+ = \[\s*\{/)) {
        // weak check for hardcoded data
        if (verificationStatus !== 'Live') verificationStatus = 'Mock';
    }

    // 3. Unwired Check
    // Look for generic buttons with empty or logging handlers
    if (content.match(/onClick=\{\(\) => console\.log/)) {
        unwiredElements.push('Button logs to console');
        verificationStatus = 'Broken';
    }
    if (content.match(/onClick=\{\(\) => \{\}\}/)) {
        unwiredElements.push('Empty onClick handler');
        verificationStatus = 'Broken';
    }
    // TODO markers
    if (content.includes('TODO')) {
        unwiredElements.push('Contains TODO comments');
    }

    // 4. Loading/Error States
    if (content.includes('isLoading') || content.includes('loading') || content.includes('<Loader') || content.includes('<Skeleton')) {
        hasLoadingState = true;
    }
    if (content.includes('isError') || content.includes('error') || content.includes('alert-destructive')) {
        hasErrorState = true;
    }

    auditResults.push({
        filePath: relativePath,
        componentName,
        category,
        dataSource,
        verificationStatus,
        missingFields,
        hasLoadingState,
        hasErrorState,
        unwiredElements
    });
}

console.log('Starting Codebase Audit...');
scanDirectory(SRC_DIR);
console.log(JSON.stringify(auditResults, null, 2));
