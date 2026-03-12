
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.join(__dirname, '..', 'src');
const OUTPUT_FILE = path.join(__dirname, '..', 'AUDIT_RESULTS.md');

interface FormAuditEntry {
    file: string;
    location: string;
    hasOnSubmit: boolean;
    handlerName: string;
    isImplemented: boolean;
    hasApiCall: boolean;
    hasErrorHandling: boolean;
    hasLoadingState: boolean;
    status: '✅ WORKING' | '⚠️ INCOMPLETE' | '❌ BROKEN';
}

const results: FormAuditEntry[] = [];

function scanFile(filePath: string) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(SRC_DIR, filePath);

    // Regex to find form tags
    const formRegex = /<form[^>]*>/g;
    const rhfFormRegex = /<Form[^>]*>/g; // shadcn/ui Form

    let match;
    let formCount = 0;

    // Combine both searches
    const allMatches = [...content.matchAll(formRegex), ...content.matchAll(rhfFormRegex)];

    if (allMatches.length === 0) return;

    for (const match of allMatches) {
        formCount++;
        const entry: FormAuditEntry = {
            file: relativePath,
            location: `Line ${getLineNumber(content, match.index!)}`,
            hasOnSubmit: false,
            handlerName: '',
            isImplemented: false,
            hasApiCall: false,
            hasErrorHandling: false,
            hasLoadingState: false,
            status: '❌ BROKEN'
        };

        // Check for onSubmit prop in the tag
        const tagContent = match[0];
        const onSubmitMatch = tagContent.match(/onSubmit=\{([^}]+)\}/);

        if (onSubmitMatch) {
            entry.hasOnSubmit = true;
            let handler = onSubmitMatch[1].trim();

            // Handle HOC wrappers like handleSubmit(onSubmit)
            if (handler.includes('handleSubmit')) {
                const innerMatch = handler.match(/handleSubmit\(([^)]+)\)/);
                if (innerMatch) handler = innerMatch[1];
            }

            entry.handlerName = handler;

            // Find handler definition
            const handlerRegex = new RegExp(`(const|function)\\s+${handler}\\s*=?\\s*(\\(|async)`);
            const handlerMatch = content.match(handlerRegex);

            if (handlerMatch) {
                // Extract function body approximation (naive)
                const bodyStartIndex = handlerMatch.index!;
                const bodySnippet = content.substring(bodyStartIndex, bodyStartIndex + 2000); // 2000 chars should cover most handlers

                // Check implementation
                if (!bodySnippet.includes('{}') && bodySnippet.length > 50) {
                    entry.isImplemented = true;
                }

                // Check API Call
                if (bodySnippet.match(/(\.mutate|\.mutateAsync|supabase\.|fetch\(|axios\.|execute\()/)) {
                    entry.hasApiCall = true;
                }

                // Check Error Handling
                if (bodySnippet.includes('catch') || bodySnippet.match(/try\s*\{/)) {
                    entry.hasErrorHandling = true;
                } else if (bodySnippet.match(/\.(onError|onSettled)/)) {
                    // React Query onError
                    entry.hasErrorHandling = true;
                }

                // Check Loading State
                if (bodySnippet.includes('setIsLoading') || bodySnippet.includes('setSubmitting')) {
                    entry.hasLoadingState = true;
                } else if (content.includes('isPending') || content.includes('isLoading') || content.includes('isSubmitting')) {
                    // If the component has these variables, it likely uses them in the UI, even if not explicitly set in handler (e.g. RQ hooks)
                    entry.hasLoadingState = true;
                }
            }
        }

        // Determine Status
        if (entry.hasOnSubmit && entry.isImplemented && entry.hasApiCall) {
            if (entry.hasErrorHandling) {
                entry.status = '✅ WORKING';
            } else {
                entry.status = '⚠️ INCOMPLETE'; // Working but unsafe
            }
        } else if (entry.hasOnSubmit && !entry.isImplemented) {
            entry.status = '⚠️ INCOMPLETE';
        } else {
            entry.status = '❌ BROKEN';
        }

        results.push(entry);
    }
}

function getLineNumber(content: string, index: number): number {
    return content.substring(0, index).split('\n').length;
}

function scanDirectory(dir: string) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            scanDirectory(fullPath);
        } else if (file.endsWith('.tsx')) {
            scanFile(fullPath);
        }
    }
}

console.log('Starting Form Audit...');
scanDirectory(SRC_DIR);

let output = `\n\n## Form Audit Results

| Form Location | Submit Handler | API Call | Error Handling | Loading State | Status |
|---------------|----------------|----------|----------------|---------------|--------|
`;

results.forEach(r => {
    const apiIcon = r.hasApiCall ? '✅' : '❌';
    const errorIcon = r.hasErrorHandling ? '✅' : '❌';
    const loadingIcon = r.hasLoadingState ? '✅' : '❌';

    // Truncate filename if too long
    const fileName = r.file.length > 40 ? '...' + r.file.slice(-37) : r.file;

    output += `| \`${fileName}\` (${r.location}) | \`${r.handlerName || 'None'}\` | ${apiIcon} | ${errorIcon} | ${loadingIcon} | ${r.status} |\n`;
});

// Append to existing file
fs.appendFileSync(OUTPUT_FILE, output);
console.log(`Form audit complete. Appended ${results.length} forms to ${OUTPUT_FILE}`);
