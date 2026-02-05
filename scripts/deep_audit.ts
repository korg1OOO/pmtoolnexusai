
import * as fs from 'fs';
import * as path from 'path';

import { fileURLToPath } from 'url';

// Categories requested by user
const CATEGORIES = {
    'buttons': ['Button', 'btn'],
    'cards': ['Card', 'Box', 'Container'],
    'reports': ['Report', 'Summary', 'Briefing'],
    'analytics': ['Analytics', 'Metrics', 'Stats'],
    'charts': ['Chart', 'Graph', 'Recharts'],
    'pages': ['Page', 'View', 'Screen'],
    'widgets': ['Widget', 'Panel'],
    'tabs': ['Tab', 'Tabs'],
    'forms': ['Form', 'Input', 'Select', 'Checkbox'],
    'modals': ['Dialog', 'Modal', 'Sheet']
};

interface ComponentInfo {
    name: string;
    path: string;
    category: string;
    wired: boolean;
    usageCount: number;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(PROJECT_ROOT, 'src');

function getAllFiles(dir: string, extension: string = '.tsx'): string[] {
    let results: string[] = [];
    if (!fs.existsSync(dir)) return results;

    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getAllFiles(filePath, extension));
        } else {
            if (file.endsWith(extension)) {
                results.push(filePath);
            }
        }
    });
    return results;
}

function countUsages(componentName: string, allFiles: string[]): number {
    let count = 0;
    // Simple regex to find <ComponentName or import ... ComponentName
    const regex = new RegExp(`\\b${componentName}\\b`, 'g');

    allFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        // Subtract definition itself? No, easier to just count references and subtract 1 if needed 
        // But for "imported", looking for `from '.../${componentName}'` or usage `<ComponentName` is better.
        // Let's rely on simple string matching for now as a heuristic.
        const matches = content.match(regex);
        if (matches) {
            count += matches.length;
        }
    });
    // Subtract 1 for the definition file itself usually containing the name
    return Math.max(0, count - 1);
}

function categorize(name: string, filePath: string): string {
    const lowerName = name.toLowerCase();
    const lowerPath = filePath.toLowerCase();

    // Check directory based
    if (lowerPath.includes('/pages/')) return 'pages';
    if (lowerPath.includes('/views/')) return 'pages';
    if (lowerPath.includes('/ui/')) return 'core-ui';

    // Check keyword based
    for (const [cat, keywords] of Object.entries(CATEGORIES)) {
        for (const kw of keywords) {
            if (lowerName.includes(kw.toLowerCase())) return cat;
        }
    }

    return 'other';
}

function main() {
    console.log('Starting Deep Audit...');
    const allTsxFiles = getAllFiles(SRC_DIR, '.tsx');
    const allContent = allTsxFiles.map(f => fs.readFileSync(f, 'utf-8')).join('\n');

    const inventory: ComponentInfo[] = [];

    allTsxFiles.forEach(filepath => {
        const filename = path.basename(filepath, '.tsx');
        // Skip index files generally unless they contain components
        if (filename === 'index') return;

        const category = categorize(filename, filepath);

        // Accurate usage count: how many times does "Name" appear in all OTHER files?
        // We scan all files.
        let usages = 0;
        allTsxFiles.forEach(f => {
            if (f === filepath) return; // Don't count self
            const content = fs.readFileSync(f, 'utf-8');
            if (content.includes(filename)) {
                usages++;
            }
        });

        const wired = usages > 0;

        inventory.push({
            name: filename,
            path: path.relative(PROJECT_ROOT, filepath),
            category,
            wired,
            usageCount: usages
        });
    });

    // Write report
    const reportPath = path.join(PROJECT_ROOT, 'deep_audit_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(inventory, null, 2));
    console.log(`Audit complete. Found ${inventory.length} components. Saved to deep_audit_report.json`);
}

main();
