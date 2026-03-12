/**
 * Manual Learning Service
 * Manages manually entered learnings from experts and historical data
 */

import { supabase as _supabase } from '@/integrations/supabase/client';
const supabase = _supabase as any;

export interface ManualLearning {
    id: string;
    tenant_id: string;
    workspace_id?: string;
    portfolio_id?: string;
    project_id?: string;
    title: string;
    description?: string;
    learning_type: string;
    applies_to_scope: string;
    learning_data: LearningData;
    source_project_id?: string;
    source_description?: string;
    imported_from?: string;
    tags?: string[];
    category?: string;
    status: string;
    converted_to_pattern_id?: string;
    created_at: string;
    updated_at: string;
    created_by_user_id: string;
    is_active: boolean;
}

export interface LearningData {
    pattern_type: string;
    condition: Record<string, any>;
    prediction_adjustment: {
        type: string;
        value?: any;
        reason?: string;
    };
    confidence: number;
    metadata?: Record<string, any>;
}

export interface CreateManualLearningParams {
    tenant_id: string;
    workspace_id?: string;
    portfolio_id?: string;
    project_id?: string;
    title: string;
    description?: string;
    learning_type: string;
    applies_to_scope: string;
    learning_data: LearningData;
    source_project_id?: string;
    source_description?: string;
    imported_from?: string;
    tags?: string[];
    category?: string;
    created_by_user_id: string;
}

export interface LearningFilters {
    tenant_id?: string;
    workspace_id?: string;
    portfolio_id?: string;
    learning_type?: string;
    applies_to_scope?: string;
    tags?: string[];
    status?: string;
}

export interface ImportResult {
    imported: number;
    skipped: number;
    errors: string[];
}

/**
 * Get manual learnings with filters
 */
export async function getManualLearnings(filters: LearningFilters): Promise<ManualLearning[]> {
    let query = supabase
        .from('ml_manual_learnings')
        .select('*')
        .eq('is_active', true);

    if (filters.tenant_id) query = query.eq('tenant_id', filters.tenant_id);
    if (filters.workspace_id) query = query.eq('workspace_id', filters.workspace_id);
    if (filters.portfolio_id) query = query.eq('portfolio_id', filters.portfolio_id);
    if (filters.learning_type) query = query.eq('learning_type', filters.learning_type);
    if (filters.applies_to_scope) query = query.eq('applies_to_scope', filters.applies_to_scope);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data as ManualLearning[];
}

/**
 * Get manual learning by ID
 */
export async function getManualLearning(learningId: string): Promise<ManualLearning | null> {
    const { data, error } = await supabase
        .from('ml_manual_learnings')
        .select('*')
        .eq('id', learningId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
    }
    return data as ManualLearning;
}

/**
 * Create manual learning
 */
export async function createManualLearning(
    params: CreateManualLearningParams
): Promise<ManualLearning> {
    const { data, error } = await supabase
        .from('ml_manual_learnings')
        .insert({
            tenant_id: params.tenant_id,
            workspace_id: params.workspace_id,
            portfolio_id: params.portfolio_id,
            project_id: params.project_id,
            title: params.title,
            description: params.description,
            learning_type: params.learning_type,
            applies_to_scope: params.applies_to_scope,
            learning_data: params.learning_data,
            source_project_id: params.source_project_id,
            source_description: params.source_description,
            tags: params.tags,
            category: params.category,
            created_by_user_id: params.created_by_user_id,
            status: 'active',
        })
        .select()
        .single();

    if (error) throw error;
    return data as ManualLearning;
}

/**
 * Update manual learning
 */
export async function updateManualLearning(
    learningId: string,
    updates: Partial<ManualLearning>
): Promise<ManualLearning> {
    const { data, error } = await supabase
        .from('ml_manual_learnings')
        .update(updates)
        .eq('id', learningId)
        .select()
        .single();

    if (error) throw error;
    return data as ManualLearning;
}

/**
 * Delete manual learning
 */
export async function deleteManualLearning(learningId: string): Promise<void> {
    const { error } = await supabase
        .from('ml_manual_learnings')
        .update({ is_active: false })
        .eq('id', learningId);

    if (error) throw error;
}

/**
 * Convert manual learning to ML pattern
 */
export async function convertToPattern(learningId: string): Promise<any> {
    const learning = await getManualLearning(learningId);
    if (!learning) throw new Error('Learning not found');
    if (learning.converted_to_pattern_id) {
        throw new Error('Learning already converted to pattern');
    }

    const { data: pattern, error } = await supabase
        .from('ml_learning_patterns')
        .insert({
            tenant_id: learning.tenant_id,
            workspace_id: learning.workspace_id,
            portfolio_id: learning.portfolio_id,
            project_id: learning.project_id,
            pattern_type: learning.learning_data.pattern_type,
            prediction_type: learning.learning_data.pattern_type,
            context: learning.learning_data.condition,
            adjustment: learning.learning_data.prediction_adjustment,
            success_rate: learning.learning_data.confidence,
            sharing_scope: learning.applies_to_scope,
            source_type: 'manual',
            created_by_user_id: learning.created_by_user_id,
            is_active: true,
        })
        .select()
        .single();

    if (error) throw error;

    // Update learning with pattern ID
    await updateManualLearning(learningId, {
        converted_to_pattern_id: pattern.id,
    });

    return pattern;
}

/**
 * Import learnings from a project
 */
export async function importFromProject(
    sourceProjectId: string,
    targetScope: string,
    tenantId: string,
    userId: string
): Promise<ImportResult> {
    // Get patterns from source project
    const { data: patterns } = await supabase
        .from('ml_learning_patterns')
        .select('*')
        .eq('project_id', sourceProjectId)
        .eq('is_active', true);

    if (!patterns || patterns.length === 0) {
        return { imported: 0, skipped: 0, errors: ['No patterns found in source project'] };
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const pattern of patterns) {
        try {
            await createManualLearning({
                tenant_id: tenantId,
                title: `Imported from Project: ${pattern.pattern_type}`,
                description: `Pattern imported from project ${sourceProjectId}`,
                learning_type: 'historical_data',
                applies_to_scope: targetScope,
                learning_data: {
                    pattern_type: pattern.pattern_type,
                    condition: pattern.context || {},
                    prediction_adjustment: pattern.adjustment || {},
                    confidence: pattern.success_rate,
                },
                source_project_id: sourceProjectId,
                imported_from: 'project',
                created_by_user_id: userId,
            });
            imported++;
        } catch (error) {
            skipped++;
            errors.push(`Failed to import pattern ${pattern.id}: ${(error as Error).message}`);
        }
    }

    return { imported, skipped, errors };
}

/**
 * Bulk import from JSON data
 */
export async function bulkImportFromJSON(
    data: CreateManualLearningParams[],
    tenantId: string
): Promise<ImportResult> {
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const item of data) {
        try {
            await createManualLearning({
                ...item,
                tenant_id: tenantId,
                imported_from: 'json',
            });
            imported++;
        } catch (error) {
            skipped++;
            errors.push(`Failed to import: ${(error as Error).message}`);
        }
    }

    return { imported, skipped, errors };
}

/**
 * Read import file (CSV or JSON)
 */
export async function readImportFile(file: File): Promise<CreateManualLearningParams[]> {
    const text = await file.text();

    if (file.name.endsWith('.json')) {
        return JSON.parse(text);
    }

    if (file.name.endsWith('.csv')) {
        // Simple CSV parsing (you may want to use a library like papaparse)
        const lines = text.split('\n');
        const headers = lines[0].split(',');
        const data: CreateManualLearningParams[] = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length !== headers.length) continue;

            const item: any = {};
            headers.forEach((header, index) => {
                item[header.trim()] = values[index].trim();
            });

            // Parse learning_data if it's a JSON string
            if (item.learning_data && typeof item.learning_data === 'string') {
                item.learning_data = JSON.parse(item.learning_data);
            }

            data.push(item);
        }

        return data;
    }

    throw new Error('Unsupported file format. Use JSON or CSV.');
}
