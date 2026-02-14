/**
 * Pattern Export/Import Service
 * Handles pattern sharing via JSON export/import
 */

import { supabase } from '@/integrations/supabase/client';

export interface PatternExport {
    pattern_type: string;
    context: any;
    adjustment: any;
    success_rate: number;
    application_count: number;
    is_active: boolean;
    metadata: {
        exported_at: string;
        created_at: string;
    };
}

export interface ExportBundle {
    version: string;
    exported_at: string;
    patterns: PatternExport[];
}

export interface ImportOptions {
    overwrite_existing: boolean;
    skip_duplicates: boolean;
    activate_imported: boolean;
}

export interface ImportResult {
    imported: number;
    skipped: number;
    errors: string[];
}

/**
 * Export single pattern
 */
export async function exportPattern(patternId: string): Promise<PatternExport> {
    const { data, error } = await supabase
        .from('ml_learning_patterns')
        .select('*')
        .eq('id', patternId)
        .single();

    if (error) throw error;

    return {
        pattern_type: data.pattern_type,
        context: data.context,
        adjustment: data.adjustment,
        success_rate: data.success_rate,
        application_count: data.application_count,
        is_active: data.is_active,
        metadata: {
            exported_at: new Date().toISOString(),
            created_at: data.created_at,
        },
    };
}

/**
 * Export all patterns
 */
export async function exportAllPatterns(): Promise<ExportBundle> {
    const { data, error } = await supabase
        .from('ml_learning_patterns')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;

    const patterns: PatternExport[] = (data || []).map(p => ({
        pattern_type: p.pattern_type,
        context: p.context,
        adjustment: p.adjustment,
        success_rate: p.success_rate,
        application_count: p.application_count,
        is_active: p.is_active,
        metadata: {
            exported_at: new Date().toISOString(),
            created_at: p.created_at,
        },
    }));

    return {
        version: '1.0',
        exported_at: new Date().toISOString(),
        patterns,
    };
}

/**
 * Export patterns by type
 */
export async function exportPatternsByType(type: string): Promise<ExportBundle> {
    const { data, error } = await supabase
        .from('ml_learning_patterns')
        .select('*')
        .like('pattern_type', `${type}%`)
        .order('created_at', { ascending: false });

    if (error) throw error;

    const patterns: PatternExport[] = (data || []).map(p => ({
        pattern_type: p.pattern_type,
        context: p.context,
        adjustment: p.adjustment,
        success_rate: p.success_rate,
        application_count: p.application_count,
        is_active: p.is_active,
        metadata: {
            exported_at: new Date().toISOString(),
            created_at: p.created_at,
        },
    }));

    return {
        version: '1.0',
        exported_at: new Date().toISOString(),
        patterns,
    };
}

/**
 * Download export bundle as JSON file
 */
export function downloadExportBundle(bundle: ExportBundle, filename?: string): void {
    const json = JSON.stringify(bundle, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `ml-patterns-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Validate pattern before import
 */
export function validatePattern(pattern: PatternExport): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!pattern.pattern_type) {
        errors.push('Missing pattern_type');
    }

    if (!pattern.adjustment) {
        errors.push('Missing adjustment');
    }

    if (typeof pattern.success_rate !== 'number' || pattern.success_rate < 0 || pattern.success_rate > 1) {
        errors.push('Invalid success_rate (must be 0-1)');
    }

    if (typeof pattern.application_count !== 'number' || pattern.application_count < 0) {
        errors.push('Invalid application_count');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Import patterns from bundle
 */
export async function importPatterns(
    bundle: ExportBundle,
    options: ImportOptions
): Promise<ImportResult> {
    const result: ImportResult = {
        imported: 0,
        skipped: 0,
        errors: [],
    };

    for (const pattern of bundle.patterns) {
        try {
            // Validate
            const validation = validatePattern(pattern);
            if (!validation.valid) {
                result.errors.push(`Pattern ${pattern.pattern_type}: ${validation.errors.join(', ')}`);
                result.skipped++;
                continue;
            }

            // Check for existing pattern
            const { data: existing } = await supabase
                .from('ml_learning_patterns')
                .select('id')
                .eq('pattern_type', pattern.pattern_type)
                .eq('context', pattern.context)
                .single();

            if (existing) {
                if (options.skip_duplicates) {
                    result.skipped++;
                    continue;
                }

                if (options.overwrite_existing) {
                    // Update existing
                    await supabase
                        .from('ml_learning_patterns')
                        .update({
                            adjustment: pattern.adjustment,
                            success_rate: pattern.success_rate,
                            application_count: pattern.application_count,
                            is_active: options.activate_imported ? true : pattern.is_active,
                        })
                        .eq('id', existing.id);

                    result.imported++;
                } else {
                    result.errors.push(`Pattern ${pattern.pattern_type} already exists`);
                    result.skipped++;
                }
            } else {
                // Insert new
                await supabase
                    .from('ml_learning_patterns')
                    .insert({
                        pattern_type: pattern.pattern_type,
                        context: pattern.context,
                        adjustment: pattern.adjustment,
                        success_rate: pattern.success_rate,
                        application_count: pattern.application_count,
                        is_active: options.activate_imported ? true : pattern.is_active,
                    });

                result.imported++;
            }
        } catch (error) {
            result.errors.push(`Pattern ${pattern.pattern_type}: ${(error as Error).message}`);
            result.skipped++;
        }
    }

    return result;
}

/**
 * Read import bundle from file
 */
export async function readImportFile(file: File): Promise<ExportBundle> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target?.result as string);
                resolve(json as ExportBundle);
            } catch (error) {
                reject(new Error('Invalid JSON file'));
            }
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}
