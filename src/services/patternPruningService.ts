/**
 * Pattern Pruning Service
 * Cleans up low-performing and unused patterns
 */

import { supabase } from '@/integrations/supabase/client';

interface PruningStats {
    deactivated: number;
    deleted: number;
    archived: number;
}

/**
 * Deactivate low-performing patterns
 */
export async function deactivateLowPerformers(): Promise<number> {
    try {
        const config = await getPruningConfig();
        if (!config.pruning_enabled) {
            console.log('Pruning disabled');
            return 0;
        }

        // Find patterns with low success rate and enough applications
        const { data: patterns } = await supabase
            .from('ml_learning_patterns')
            .select('*')
            .eq('is_active', true)
            .lt('success_rate', config.min_success_rate_threshold)
            .gte('application_count', 10);

        if (!patterns || patterns.length === 0) return 0;

        // Deactivate them
        const ids = patterns.map(p => p.id);
        const { error } = await supabase
            .from('ml_learning_patterns')
            .update({ is_active: false })
            .in('id', ids);

        if (error) {
            console.error('Error deactivating patterns:', error);
            return 0;
        }

        // Track pruning
        for (const pattern of patterns) {
            await trackPatternPruning(pattern.pattern_type.split('_')[0]);
        }

        console.log(`✅ Deactivated ${ids.length} low-performing patterns`);
        return ids.length;
    } catch (error) {
        console.error('Error in deactivateLowPerformers:', error);
        return 0;
    }
}

/**
 * Delete very poor patterns (extremely low success rate)
 */
export async function deleteFailedPatterns(): Promise<number> {
    try {
        const config = await getPruningConfig();
        if (!config.pruning_enabled) return 0;

        // Find patterns with very low success rate and many applications
        const { data: patterns } = await supabase
            .from('ml_learning_patterns')
            .select('*')
            .lt('success_rate', 0.2)
            .gte('application_count', 20);

        if (!patterns || patterns.length === 0) return 0;

        // Delete them
        const ids = patterns.map(p => p.id);
        const { error } = await supabase
            .from('ml_learning_patterns')
            .delete()
            .in('id', ids);

        if (error) {
            console.error('Error deleting patterns:', error);
            return 0;
        }

        console.log(`✅ Deleted ${ids.length} failed patterns`);
        return ids.length;
    } catch (error) {
        console.error('Error in deleteFailedPatterns:', error);
        return 0;
    }
}

/**
 * Archive unused patterns (no applications in 30 days)
 */
export async function archiveUnusedPatterns(): Promise<number> {
    try {
        // This would require a last_used_at timestamp
        // For now, we'll deactivate patterns with 0 applications that are old
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: patterns } = await supabase
            .from('ml_learning_patterns')
            .select('*')
            .eq('is_active', true)
            .eq('application_count', 0)
            .lt('created_at', thirtyDaysAgo.toISOString());

        if (!patterns || patterns.length === 0) return 0;

        // Deactivate (archive) them
        const ids = patterns.map(p => p.id);
        const { error } = await supabase
            .from('ml_learning_patterns')
            .update({ is_active: false })
            .in('id', ids);

        if (error) {
            console.error('Error archiving patterns:', error);
            return 0;
        }

        console.log(`✅ Archived ${ids.length} unused patterns`);
        return ids.length;
    } catch (error) {
        console.error('Error in archiveUnusedPatterns:', error);
        return 0;
    }
}

/**
 * Run full pruning process
 */
export async function runFullPruning(): Promise<PruningStats> {
    console.log('🧹 Starting pattern pruning...');

    const stats: PruningStats = {
        deactivated: 0,
        deleted: 0,
        archived: 0,
    };

    stats.deactivated = await deactivateLowPerformers();
    stats.deleted = await deleteFailedPatterns();
    stats.archived = await archiveUnusedPatterns();

    const total = stats.deactivated + stats.deleted + stats.archived;
    console.log(`✅ Pruning complete: ${total} patterns cleaned up`);

    return stats;
}

/**
 * Get pruning configuration
 */
async function getPruningConfig() {
    const { data } = await supabase
        .from('ml_auto_learning_config')
        .select('*')
        .single();

    return data || {
        pruning_enabled: true,
        min_success_rate_threshold: 0.4,
    };
}

/**
 * Track pattern pruning for velocity metrics
 */
async function trackPatternPruning(predictionType: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    const { data: existing } = await supabase
        .from('ml_learning_velocity')
        .select('*')
        .eq('date', today)
        .eq('prediction_type', predictionType)
        .single();

    if (existing) {
        await supabase
            .from('ml_learning_velocity')
            .update({
                patterns_pruned: existing.patterns_pruned + 1,
            })
            .eq('id', existing.id);
    } else {
        await supabase
            .from('ml_learning_velocity')
            .insert({
                date: today,
                prediction_type: predictionType,
                patterns_created: 0,
                patterns_optimized: 0,
                patterns_pruned: 1,
            });
    }
}
