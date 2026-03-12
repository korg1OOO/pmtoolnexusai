
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../');
const SRC_DIR = path.join(PROJECT_ROOT, 'src');

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []) {
    const files = fs.readdirSync(dirPath);

    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                arrayOfFiles.push(path.join(dirPath, "/", file));
            }
        }
    });

    return arrayOfFiles;
}

const allFiles = getAllFiles(SRC_DIR);
const componentsDir = path.join(SRC_DIR, 'components');
const pagesDir = path.join(SRC_DIR, 'pages');

const componentFiles = allFiles.filter(f => f.startsWith(componentsDir) && f.endsWith('.tsx'));
const pageFiles = allFiles.filter(f => f.startsWith(pagesDir) && f.endsWith('.tsx'));

const componentUsage: Record<string, { path: string, usages: number, category: string }> = {};

// Initialize map
componentFiles.forEach(file => {
    const name = path.basename(file, '.tsx');
    const relPath = path.relative(SRC_DIR, file);
    const category = path.dirname(relPath).split(path.sep)[1] || 'root'; // src/components/CATEGORY/file.tsx
    componentUsage[name] = { path: relPath, usages: 0, category };
});

const pageUsage: Record<string, { path: string, wired: boolean }> = {};
pageFiles.forEach(file => {
    const name = path.basename(file, '.tsx');
    pageUsage[name] = { path: path.relative(SRC_DIR, file), wired: false };
});

// Scan all files for usages
allFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');

    // Check component usage
    Object.keys(componentUsage).forEach(compName => {
        // Simple regex to check for usage: <ComponentName or import ... ComponentName
        // Exclude self-references (definition file)
        if (file.includes(componentUsage[compName].path)) return;

        // Check for import
        if (content.includes(compName)) {
            componentUsage[compName].usages++;
        }
    });

    // Check page usage (in App.tsx mostly)
    if (file.endsWith('App.tsx')) {
        Object.keys(pageUsage).forEach(pageName => {
            if (content.includes(pageName)) {
                pageUsage[pageName].wired = true;
            }
        });
    }
});

const output = {
    totalComponents: Object.keys(componentUsage).length,
    totalPages: Object.keys(pageUsage).length,
    pages: pageUsage,
    components: componentUsage
};

fs.writeFileSync(path.join(PROJECT_ROOT, 'audit_report.json'), JSON.stringify(output, null, 2));
console.log("Audit report written to audit_report.json");
