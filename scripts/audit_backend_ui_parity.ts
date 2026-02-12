/**
 * Backend-UI Parity Deep Audit Script
 * 
 * Methodology:
 * 1. File enumeration - scan all migrations, hooks, components, edge functions
 * 2. Endpoint analysis - extract all database tables and API capabilities
 * 3. UI component matching - map UI components to backend resources
 * 4. Gap identification - find modules with backend-rich/UI-poor or vice versa
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { glob } from 'glob';

interface DatabaseTable {
    name: string;
    migrationFile: string;
    columns: string[];
}

interface Hook {
    name: string;
    file: string;
    exports: string[];
    operations: string[];
}

interface UIComponent {
    name: string;
    file: string;
    hooks: string[];
    services: string[];
}

interface EdgeFunction {
    name: string;
    path: string;
}

interface ModuleParity {
    moduleName: string;
    backendCapabilities: {
        tables: string[];
        edgeFunctions: string[];
        totalEndpoints: number;
    };
    uiCapabilities: {
        components: string[];
        hooks: string[];
        exposedFeatures: string[];
    };
    gap: {
        severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
        backendNotExposedInUI: string[];
        uiWithoutBackend: string[];
        missingFeatures: string[];
    };
}

class BackendUIAuditor {
    private projectRoot: string;
    private tables: Map<string, DatabaseTable> = new Map();
    private hooks: Map<string, Hook> = new Map();
    private components: Map<string, UIComponent> = new Map();
    private edgeFunctions: Map<string, EdgeFunction> = new Map();

    constructor(projectRoot: string) {
        this.projectRoot = projectRoot;
    }

    async run(): Promise<ModuleParity[]> {
        console.log('🔍 Starting Backend-UI Parity Deep Audit...\n');

        // Phase 1: Enumerate backend resources
        await this.enumerateDatabaseTables();
        await this.enumerateEdgeFunctions();

        // Phase 2: Enumerate frontend resources
        await this.enumerateHooks();
        await this.enumerateUIComponents();

        // Phase 3: Perform module-by-module parity analysis
        const parityResults = await this.analyzeModuleParity();

        // Phase 4: Generate report
        this.generateReport(parityResults);

        return parityResults;
    }

    private async enumerateDatabaseTables(): Promise<void> {
        console.log('📊 Enumerating database tables from migrations...');
        const migrationFiles = await glob('supabase/migrations/*.sql', {
            cwd: this.projectRoot,
        });

        for (const file of migrationFiles) {
            const content = await readFile(join(this.projectRoot, file), 'utf-8');
            const tableMatches = content.matchAll(/CREATE TABLE (?:IF NOT EXISTS )?(?:public\.)?([a-z_]+)/gi);

            for (const match of tableMatches) {
                const tableName = match[1];
                if (!this.tables.has(tableName)) {
                    this.tables.set(tableName, {
                        name: tableName,
                        migrationFile: file,
                        columns: this.extractColumns(content, tableName),
                    });
                }
            }
        }

        console.log(`✅ Found ${this.tables.size} database tables\n`);
    }

    private extractColumns(content: string, tableName: string): string[] {
        const columns: string[] = [];
        const tableRegex = new RegExp(
            `CREATE TABLE[^(]*${tableName}[^(]*\\(([^;]+)\\)`,
            'is'
        );
        const match = content.match(tableRegex);

        if (match) {
            const columnDefs = match[1];
            const columnMatches = columnDefs.matchAll(/^\s*([a-z_]+)\s+/gim);
            for (const colMatch of columnMatches) {
                columns.push(colMatch[1]);
            }
        }

        return columns;
    }

    private async enumerateEdgeFunctions(): Promise<void> {
        console.log('⚡ Enumerating Supabase Edge Functions...');
        const functionDirs = await readdir(join(this.projectRoot, 'supabase/functions'), {
            withFileTypes: true,
        });

        for (const dir of functionDirs) {
            if (dir.isDirectory()) {
                this.edgeFunctions.set(dir.name, {
                    name: dir.name,
                    path: `supabase/functions/${dir.name}`,
                });
            }
        }

        console.log(`✅ Found ${this.edgeFunctions.size} edge functions\n`);
    }

    private async enumerateHooks(): Promise<void> {
        console.log('🪝 Enumerating React hooks...');
        const hookFiles = await glob('src/hooks/use*.ts', {
            cwd: this.projectRoot,
        });

        for (const file of hookFiles) {
            const content = await readFile(join(this.projectRoot, file), 'utf-8');
            const hookName = file.split('/').pop()?.replace('.ts', '') || '';

            const exports = this.extractExports(content);
            const operations = this.extractOperations(content);

            this.hooks.set(hookName, {
                name: hookName,
                file,
                exports,
                operations,
            });
        }

        console.log(`✅ Found ${this.hooks.size} hooks\n`);
    }

    private extractExports(content: string): string[] {
        const exports: string[] = [];
        const exportMatches = content.matchAll(/export (?:const|function) ([a-zA-Z_$][a-zA-Z0-9_$]*)/g);

        for (const match of exportMatches) {
            exports.push(match[1]);
        }

        return exports;
    }

    private extractOperations(content: string): string[] {
        const operations: string[] = [];

        // Look for CRUD operations
        if (content.includes('.select(')) operations.push('READ');
        if (content.includes('.insert(')) operations.push('CREATE');
        if (content.includes('.update(')) operations.push('UPDATE');
        if (content.includes('.delete(')) operations.push('DELETE');
        if (content.includes('useMutation')) operations.push('MUTATION');
        if (content.includes('useQuery')) operations.push('QUERY');

        return [...new Set(operations)];
    }

    private async enumerateUIComponents(): Promise<void> {
        console.log('🎨 Enumerating UI components...');
        const componentFiles = await glob('src/components/**/*.tsx', {
            cwd: this.projectRoot,
        });

        for (const file of componentFiles) {
            const content = await readFile(join(this.projectRoot, file), 'utf-8');
            const componentName = file.split('/').pop()?.replace('.tsx', '') || '';

            const hooks = this.extractUsedHooks(content);
            const services = this.extractUsedServices(content);

            this.components.set(componentName, {
                name: componentName,
                file,
                hooks,
                services,
            });
        }

        console.log(`✅ Found ${this.components.size} UI components\n`);
    }

    private extractUsedHooks(content: string): string[] {
        const hooks: string[] = [];
        const hookMatches = content.matchAll(/use([A-Z][a-zA-Z0-9]*)/g);

        for (const match of hookMatches) {
            hooks.push(`use${match[1]}`);
        }

        return [...new Set(hooks)];
    }

    private extractUsedServices(content: string): string[] {
        const services: string[] = [];
        const serviceMatches = content.matchAll(/from ['"].*\/services\/([a-zA-Z0-9]+)/g);

        for (const match of serviceMatches) {
            services.push(match[1]);
        }

        return [...new Set(services)];
    }

    private async analyzeModuleParity(): Promise<ModuleParity[]> {
        console.log('🔬 Analyzing module-by-module parity...\n');

        const modules = this.identifyModules();
        const results: ModuleParity[] = [];

        for (const moduleName of modules) {
            const parity = await this.analyzeModule(moduleName);
            results.push(parity);
        }

        return results.sort((a, b) => {
            const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, NONE: 4 };
            return severityOrder[a.gap.severity] - severityOrder[b.gap.severity];
        });
    }

    private identifyModules(): Set<string> {
        const modules = new Set<string>();

        // Extract module names from table names
        for (const table of this.tables.values()) {
            const moduleName = this.inferModuleName(table.name);
            modules.add(moduleName);
        }

        // Extract module names from hooks
        for (const hook of this.hooks.values()) {
            const moduleName = this.inferModuleName(hook.name);
            modules.add(moduleName);
        }

        // Extract module names from edge functions
        for (const func of this.edgeFunctions.values()) {
            const moduleName = this.inferModuleName(func.name);
            modules.add(moduleName);
        }

        // Remove common/generic modules
        modules.delete('common');
        modules.delete('utils');
        modules.delete('types');

        return modules;
    }

    private inferModuleName(name: string): string {
        // Remove common prefixes
        name = name.replace(/^use/, '');

        // Common module patterns
        const modulePatterns: Record<string, RegExp> = {
            'Admin': /(admin|management)/i,
            'Email': /(email|mail)/i,
            'Marketing': /(marketing|campaign)/i,
            'Support': /(support|ticket)/i,
            'Backup': /(backup|restore)/i,
            'Affiliate': /(affiliate|referral)/i,
            'Meeting': /(meeting|mom|agenda)/i,
            'Document': /(document|file|folder)/i,
            'Project': /(project|task|gantt)/i,
            'Risk': /(risk|issue)/i,
            'Financial': /(financial|cost|budget)/i,
            'Resource': /(resource|leveling)/i,
            'ML': /(ml_|machine|predict|forecast|retrain)/i,
            'AI': /(ai|openai|chat|assistant)/i,
            'Health': /(health|monitoring|metric)/i,
            'Presentation': /(presentation|slide)/i,
            'Spreadsheet': /(spreadsheet|sheet|cell)/i,
            'Notebook': /(notebook|note)/i,
            'Agile': /(sprint|epic|backlog|scrum)/i,
            'Portfolio': /(portfolio|program)/i,
            'Baseline': /(baseline|snapshot)/i,
            'Report': /(report|status|dashboard)/i,
            'Auth': /(auth|user|profile|permission)/i,
        };

        for (const [module, pattern] of Object.entries(modulePatterns)) {
            if (pattern.test(name)) {
                return module;
            }
        }

        return 'Other';
    }

    private async analyzeModule(moduleName: string): Promise<ModuleParity> {
        const backendTables = Array.from(this.tables.values())
            .filter(t => this.inferModuleName(t.name) === moduleName)
            .map(t => t.name);

        const backendFunctions = Array.from(this.edgeFunctions.values())
            .filter(f => this.inferModuleName(f.name) === moduleName)
            .map(f => f.name);

        const uiHooks = Array.from(this.hooks.values())
            .filter(h => this.inferModuleName(h.name) === moduleName)
            .map(h => h.name);

        const uiComponents = Array.from(this.components.values())
            .filter(c => {
                // Component uses hooks from this module
                return c.hooks.some(h => this.inferModuleName(h) === moduleName);
            })
            .map(c => c.name);

        // Calculate gap
        const backendCapabilityCount = backendTables.length + backendFunctions.length;
        const uiCapabilityCount = uiHooks.length + uiComponents.length;

        let severity: ModuleParity['gap']['severity'] = 'NONE';
        const gap = Math.abs(backendCapabilityCount - uiCapabilityCount);
        const ratio = backendCapabilityCount > 0
            ? uiCapabilityCount / backendCapabilityCount
            : uiCapabilityCount > 0 ? 0 : 1;

        if (backendCapabilityCount >= 3 && uiCapabilityCount === 0) {
            severity = 'CRITICAL';
        } else if (ratio < 0.3 && backendCapabilityCount >= 2) {
            severity = 'HIGH';
        } else if (ratio < 0.5 && gap >= 2) {
            severity = 'MEDIUM';
        } else if (gap >= 1) {
            severity = 'LOW';
        }

        // Identify specific gaps
        const backendNotExposedInUI: string[] = [];
        const uiWithoutBackend: string[] = [];
        const missingFeatures: string[] = [];

        // Check if tables have corresponding hooks
        for (const table of backendTables) {
            const hasHook = uiHooks.some(h =>
                h.toLowerCase().includes(table.toLowerCase()) ||
                table.toLowerCase().includes(h.toLowerCase().replace('use', ''))
            );
            if (!hasHook) {
                backendNotExposedInUI.push(`Table: ${table}`);
            }
        }

        // Check if edge functions are used
        for (const func of backendFunctions) {
            const isUsed = Array.from(this.components.values()).some(c => {
                const content = `${c.file} ${c.name}`;
                return content.toLowerCase().includes(func.toLowerCase());
            });
            if (!isUsed) {
                backendNotExposedInUI.push(`Edge Function: ${func}`);
            }
        }

        return {
            moduleName,
            backendCapabilities: {
                tables: backendTables,
                edgeFunctions: backendFunctions,
                totalEndpoints: backendCapabilityCount,
            },
            uiCapabilities: {
                components: uiComponents,
                hooks: uiHooks,
                exposedFeatures: [...uiHooks, ...uiComponents],
            },
            gap: {
                severity,
                backendNotExposedInUI,
                uiWithoutBackend,
                missingFeatures,
            },
        };
    }

    private generateReport(results: ModuleParity[]): void {
        console.log('\n' + '='.repeat(80));
        console.log('📋 BACKEND-UI PARITY AUDIT REPORT');
        console.log('='.repeat(80) + '\n');

        const critical = results.filter(r => r.gap.severity === 'CRITICAL');
        const high = results.filter(r => r.gap.severity === 'HIGH');
        const medium = results.filter(r => r.gap.severity === 'MEDIUM');
        const low = results.filter(r => r.gap.severity === 'LOW');

        console.log(`📊 Summary:`);
        console.log(`   🔴 CRITICAL gaps: ${critical.length}`);
        console.log(`   🟠 HIGH gaps: ${high.length}`);
        console.log(`   🟡 MEDIUM gaps: ${medium.length}`);
        console.log(`   🟢 LOW gaps: ${low.length}`);
        console.log(`   ✅ No gaps: ${results.filter(r => r.gap.severity === 'NONE').length}\n`);

        console.log('─'.repeat(80) + '\n');

        for (const result of results) {
            if (result.gap.severity === 'NONE') continue;

            const icon = {
                CRITICAL: '🔴',
                HIGH: '🟠',
                MEDIUM: '🟡',
                LOW: '🟢',
                NONE: '✅',
            }[result.gap.severity];

            console.log(`${icon} ${result.moduleName.toUpperCase()} - ${result.gap.severity} Gap`);
            console.log('─'.repeat(80));

            console.log(`\n  Backend Capabilities:`);
            console.log(`    Tables (${result.backendCapabilities.tables.length}): ${result.backendCapabilities.tables.join(', ') || 'None'}`);
            console.log(`    Edge Functions (${result.backendCapabilities.edgeFunctions.length}): ${result.backendCapabilities.edgeFunctions.join(', ') || 'None'}`);

            console.log(`\n  UI Capabilities:`);
            console.log(`    Hooks (${result.uiCapabilities.hooks.length}): ${result.uiCapabilities.hooks.join(', ') || 'None'}`);
            console.log(`    Components (${result.uiCapabilities.components.length}): ${result.uiCapabilities.components.join(', ') || 'None'}`);

            if (result.gap.backendNotExposedInUI.length > 0) {
                console.log(`\n  ⚠️  Backend NOT Exposed in UI:`);
                result.gap.backendNotExposedInUI.forEach(item => {
                    console.log(`    - ${item}`);
                });
            }

            if (result.gap.uiWithoutBackend.length > 0) {
                console.log(`\n  ⚠️  UI WITHOUT Backend:`);
                result.gap.uiWithoutBackend.forEach(item => {
                    console.log(`    - ${item}`);
                });
            }

            console.log('\n' + '─'.repeat(80) + '\n');
        }

        // Write JSON report
        const reportPath = join(this.projectRoot, 'backend_ui_parity_audit.json');
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalModules: results.length,
                critical: critical.length,
                high: high.length,
                medium: medium.length,
                low: low.length,
                noGaps: results.filter(r => r.gap.severity === 'NONE').length,
            },
            modules: results,
        };

        writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n✅ Detailed JSON report saved to: ${reportPath}\n`);
    }
}

// Run the audit
const auditor = new BackendUIAuditor(process.cwd());
auditor.run().catch(console.error);
