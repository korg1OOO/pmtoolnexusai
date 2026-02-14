/**
 * Pattern Versioning Service
 * Manages pattern version history and rollback
 */

import { supabase as _supabase } from '@/integrations/supabase/client';
const supabase = _supabase as any;

export interface PatternVersion {
    id: string;
    pattern_id: string;
    version_number: number;
    version_tag: string | null;
    pattern_snapshot: any;
    change_description: string | null;
    created_by: string | null;
    created_at: string;
}

export interface ChangelogEntry {
    id: string;
    pattern_id: string;
    version_from: number | null;
    version_to: number | null;
    change_type: string;
    changes: any;
    created_by: string | null;
    created_at: string;
}

export interface VersionDiff {
    version_a: number;
    version_b: number;
    changes: {
        field: string;
        old_value: any;
        new_value: any;
    }[];
}

/**
 * Create version snapshot
 */
export async function createVersion(
    patternId: string,
    description: string,
    tag?: string
): Promise<PatternVersion> {
    // Get current pattern state
    const { data: pattern, error: patternError } = await supabase
        .from('ml_learning_patterns')
        .select('*')
        .eq('id', patternId)
        .single();

    if (patternError) throw patternError;

    // Get next version number
    const { data: versionNum } = await supabase
        .rpc('get_next_version_number', { p_pattern_id: patternId });

    const versionNumber = versionNum || 1;

    // Create snapshot
    const { data, error } = await supabase
        .from('ml_pattern_versions')
        .insert({
            pattern_id: patternId,
            version_number: versionNumber,
            version_tag: tag,
            pattern_snapshot: {
                pattern_type: pattern.pattern_type,
                context: pattern.context,
                adjustment: pattern.adjustment,
                success_rate: pattern.success_rate,
                application_count: pattern.application_count,
                is_active: pattern.is_active,
            },
            change_description: description,
        })
        .select()
        .single();

    if (error) throw error;
    return data as PatternVersion;
}

/**
 * Get version history
 */
export async function getVersionHistory(patternId: string): Promise<PatternVersion[]> {
    const { data, error } = await supabase
        .from('ml_pattern_versions')
        .select('*')
        .eq('pattern_id', patternId)
        .order('version_number', { ascending: false });

    if (error) throw error;
    return data as PatternVersion[];
}

/**
 * Get specific version
 */
export async function getVersion(
    patternId: string,
    versionNumber: number
): Promise<PatternVersion | null> {
    const { data, error } = await supabase
        .from('ml_pattern_versions')
        .select('*')
        .eq('pattern_id', patternId)
        .eq('version_number', versionNumber)
        .single();

    if (error) return null;
    return data as PatternVersion;
}

/**
 * Rollback to version
 */
export async function rollbackToVersion(
    patternId: string,
    versionNumber: number
): Promise<void> {
    // Get version snapshot
    const version = await getVersion(patternId, versionNumber);
    if (!version) throw new Error('Version not found');

    // Get current version number
    const history = await getVersionHistory(patternId);
    const currentVersion = history[0]?.version_number || 0;

    // Update pattern with snapshot data
    const { error } = await supabase
        .from('ml_learning_patterns')
        .update({
            pattern_type: version.pattern_snapshot.pattern_type,
            context: version.pattern_snapshot.context,
            adjustment: version.pattern_snapshot.adjustment,
            success_rate: version.pattern_snapshot.success_rate,
            application_count: version.pattern_snapshot.application_count,
            is_active: version.pattern_snapshot.is_active,
        })
        .eq('id', patternId);

    if (error) throw error;

    // Log rollback in changelog
    await logChange(patternId, {
        version_from: currentVersion,
        version_to: versionNumber,
        change_type: 'rollback',
        changes: {
            rolled_back_to: versionNumber,
            description: `Rolled back from v${currentVersion} to v${versionNumber}`,
        },
    });

    // Create new version for the rollback
    await createVersion(
        patternId,
        `Rolled back to version ${versionNumber}`,
        null
    );
}

/**
 * Compare two versions
 */
export async function compareVersions(
    patternId: string,
    versionA: number,
    versionB: number
): Promise<VersionDiff> {
    const vA = await getVersion(patternId, versionA);
    const vB = await getVersion(patternId, versionB);

    if (!vA || !vB) throw new Error('Version not found');

    const changes: VersionDiff['changes'] = [];

    // Compare each field
    const fields = ['pattern_type', 'context', 'adjustment', 'success_rate', 'application_count', 'is_active'];

    for (const field of fields) {
        const oldValue = vA.pattern_snapshot[field];
        const newValue = vB.pattern_snapshot[field];

        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            changes.push({
                field,
                old_value: oldValue,
                new_value: newValue,
            });
        }
    }

    return {
        version_a: versionA,
        version_b: versionB,
        changes,
    };
}

/**
 * Get changelog
 */
export async function getChangelog(patternId: string): Promise<ChangelogEntry[]> {
    const { data, error } = await supabase
        .from('ml_pattern_changelog')
        .select('*')
        .eq('pattern_id', patternId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as ChangelogEntry[];
}

/**
 * Log change to changelog
 */
export async function logChange(
    patternId: string,
    change: {
        version_from?: number;
        version_to?: number;
        change_type: string;
        changes: any;
        created_by?: string;
    }
): Promise<void> {
    const { error } = await supabase
        .from('ml_pattern_changelog')
        .insert({
            pattern_id: patternId,
            version_from: change.version_from,
            version_to: change.version_to,
            change_type: change.change_type,
            changes: change.changes,
            created_by: change.created_by,
        });

    if (error) throw error;
}
