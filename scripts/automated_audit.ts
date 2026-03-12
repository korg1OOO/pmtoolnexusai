
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.join(__dirname, '..', 'src');
const OUTPUT_FILE = path.join(__dirname, '..', 'AUDIT_RESULTS.md');

interface AuditMatch {
    file: string;
    line: number;
    content: string;
    type: string;
}

const patterns = [
    { regex: /(TODO:|FIXME:)/, type: 'TODO/FIXME' },
    { regex: /(Assuming|We should|We can)/i, type: 'Assumption/Suggestion' },
    { regex: /(mock|dummy|fake)/i, type: 'Mock Data/Variable' },
    { regex: /\.catch\(\s*\(\s*\)\s*=>\s*\{\s*\}\s*\)/, type: 'Empty Catch Block' },
    { regex: /(@ts-ignore|@ts-expect-error)/, type: 'TS Ignore' },
    // Heuristic for hardcoded data arrays: const ... = [{...}]
    // This is tricky to get perfect with regex, improving heuristic
    { regex: /const\s+\w+\s*=\s*\[\s*\{/, type: 'Hardcoded Data Array' }
];

let totalFilesScanned = 0;
let totalIssuesFound = 0;
const issuesByFile: Record<string, number> = {};
const allMatches: AuditMatch[] = [];

function scanFile(filePath: string) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(SRC_DIR, filePath);
    const lines = content.split('\n');

    let fileHasIssues = false;

    lines.forEach((line, index) => {
        for (const pattern of patterns) {
            if (pattern.regex.test(line)) {
                // Exclude imports for "mock" checks to reduce noise
                if (pattern.type === 'Mock Data/Variable' && line.includes('import ')) return;

                // Exclude test files from "Mock" checks? Maybe, but user said "entire /src"

                allMatches.push({
                    file: relativePath,
                    line: index + 1,
                    content: line.trim(),
                    type: pattern.type
                });

                if (!issuesByFile[relativePath]) issuesByFile[relativePath] = 0;
                issuesByFile[relativePath]++;
                totalIssuesFound++;
                fileHasIssues = true;
            }
        }
    });

    if (fileHasIssues) {
        //
    }
}

function scanDirectory(dir: string) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            scanDirectory(fullPath);
        } else {
            // Scan likely source files
            if (file.match(/\.(ts|tsx|js|jsx)$/)) {
                totalFilesScanned++;
                scanFile(fullPath);
            }
        }
    }
}

console.log('Starting Automated Audit...');
scanDirectory(SRC_DIR);

// sort matches by file then line
allMatches.sort((a, b) => {
    if (a.file === b.file) return a.line - b.line;
    return a.file.localeCompare(b.file);
});

// Top 5 files
const sortedFiles = Object.entries(issuesByFile)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

let output = `# Automated Audit Results

**Date:** ${new Date().toISOString()}
**Files Scanned:** ${totalFilesScanned}
**Total Issues Found:** ${totalIssuesFound}

## Top 5 Files with Most Issues
${sortedFiles.map(([file, count]) => `- **${file}**: ${count} issues`).join('\n')}

## Detailed Findings

| File | Line | Type | Code Snippet |
| :--- | :--- | :--- | :--- |
`;

allMatches.forEach(m => {
    // Escape pipe characters in content to avoid breaking markdown table
    const safeContent = m.content.replace(/\|/g, '\\|').substring(0, 100);
    output += `| ${m.file} | ${m.line} | ${m.type} | \`${safeContent}\` |\n`;
});

output += `\n\n## Next Steps
- Review the "Hardcoded Data Array" matches to identify components still using static data.
- Address "TODO/FIXME" items, prioritizing those in core logic files.
- Replace "Mock Data" with real API calls or removing if unused.
- Remove "@ts-ignore" by fixing the underlying type errors.
`;

fs.writeFileSync(OUTPUT_FILE, output);
console.log(`Audit complete. Results written to ${OUTPUT_FILE}`);
console.log(`Scanned ${totalFilesScanned} files, found ${totalIssuesFound} issues.`);
