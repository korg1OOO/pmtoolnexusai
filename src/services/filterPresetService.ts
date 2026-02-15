/**
 * Filter Preset Service
 * Manages saving, loading, and deleting filter presets in user preferences
 */

import { supabase } from '@/lib/supabase';
import type { FilterPreset, FilterState } from '@/types/analytics';

const PRESET_KEY_PREFIX = 'analytics_filter_preset_';

export const filterPresetService = {
    /**
     * Save a new filter preset
     */
    async saveFilterPreset(
        userId: string,
        projectId: string,
        name: string,
        filters: FilterState,
        description?: string
    ): Promise<FilterPreset> {
        const presetId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const preset: FilterPreset = {
            id: presetId,
            name,
            description,
            filters,
            isDefault: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            userId
        };

        const { error } = await supabase
            .from('user_preferences')
            .insert({
                user_id: userId,
                project_id: projectId,
                preference_key: `${PRESET_KEY_PREFIX}${presetId}`,
                preference_value: preset
            });

        if (error) throw error;
        return preset;
    },

    /**
     * Get all filter presets for a user and project
     */
    async getFilterPresets(userId: string, projectId: string): Promise<FilterPreset[]> {
        const { data, error } = await supabase
            .from('user_preferences')
            .select('preference_value')
            .eq('user_id', userId)
            .eq('project_id', projectId)
            .like('preference_key', `${PRESET_KEY_PREFIX}%`);

        if (error) throw error;

        return (data || [])
            .map(row => row.preference_value as FilterPreset)
            .sort((a, b) => {
                // Default preset first, then by creation date
                if (a.isDefault && !b.isDefault) return -1;
                if (!a.isDefault && b.isDefault) return 1;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
    },

    /**
     * Update an existing filter preset
     */
    async updateFilterPreset(
        userId: string,
        projectId: string,
        presetId: string,
        updates: Partial<Omit<FilterPreset, 'id' | 'userId' | 'createdAt'>>
    ): Promise<void> {
        // First get the existing preset
        const { data, error: fetchError } = await supabase
            .from('user_preferences')
            .select('preference_value')
            .eq('user_id', userId)
            .eq('project_id', projectId)
            .eq('preference_key', `${PRESET_KEY_PREFIX}${presetId}`)
            .single();

        if (fetchError) throw fetchError;

        const existingPreset = data.preference_value as FilterPreset;
        const updatedPreset: FilterPreset = {
            ...existingPreset,
            ...updates,
            updatedAt: new Date()
        };

        const { error } = await supabase
            .from('user_preferences')
            .update({ preference_value: updatedPreset })
            .eq('user_id', userId)
            .eq('project_id', projectId)
            .eq('preference_key', `${PRESET_KEY_PREFIX}${presetId}`);

        if (error) throw error;
    },

    /**
     * Delete a filter preset
     */
    async deleteFilterPreset(
        userId: string,
        projectId: string,
        presetId: string
    ): Promise<void> {
        const { error } = await supabase
            .from('user_preferences')
            .delete()
            .eq('user_id', userId)
            .eq('project_id', projectId)
            .eq('preference_key', `${PRESET_KEY_PREFIX}${presetId}`);

        if (error) throw error;
    },

    /**
     * Set a preset as the default (and unset others)
     */
    async setDefaultPreset(
        userId: string,
        projectId: string,
        presetId: string
    ): Promise<void> {
        // Get all presets
        const presets = await this.getFilterPresets(userId, projectId);

        // Update all presets
        for (const preset of presets) {
            await this.updateFilterPreset(userId, projectId, preset.id, {
                isDefault: preset.id === presetId
            });
        }
    }
};
