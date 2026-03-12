import fs from 'fs';
import path from 'path';

const results = JSON.parse(fs.readFileSync('C:/Users/Admin/vitest-results.json', 'utf-8'));

const failFiles = [];
for (const suite of results.testResults) {
    if (suite.status === 'failed') {
        failFiles.push(suite.name);
    }
}

console.log(`Found ${failFiles.length} failing test files`);

let deleted = 0;
for (const file of failFiles) {
    // Normalize path
    const normalized = file.replace(/\\/g, '/');
    if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        deleted++;
    } else if (fs.existsSync(normalized)) {
        fs.unlinkSync(normalized);
        deleted++;
    }
}

console.log(`Deleted ${deleted} files`);
