/**
 * Filter Preset Service
 * Manages saving, loading, and deleting filter presets in user preferences
 */

import { supabase as _supabase } from '@/integrations/supabase/client';
import type { FilterPreset, FilterConfig } from '@/types/analytics';

const supabase = _supabase as any;
const PRESET_KEY_PREFIX = 'analytics_filter_preset_';

export const filterPresetService = {
    async saveFilterPreset(
        userId: string,
        projectId: string,
        name: string,
        filters: FilterConfig,
        description?: string
    ): Promise<FilterPreset> {
        const presetId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const preset: FilterPreset = {
            id: presetId,
            name,
            description,
            filters,
            createdBy: userId,
            createdDate: new Date(),
            updatedDate: new Date(),
            shared: false,
            isDefault: false,
        };

        const { error } = await supabase
            .from('user_preferences')
            .insert({
                user_id: userId,
                project_id: projectId,
                preference_key: `${PRESET_KEY_PREFIX}${presetId}`,
                preference_value: preset as any
            });

        if (error) throw error;
        return preset;
    },

    async getFilterPresets(userId: string, projectId: string): Promise<FilterPreset[]> {
        const { data, error } = await supabase
            .from('user_preferences')
            .select('preference_value')
            .eq('user_id', userId)
            .eq('project_id', projectId)
            .like('preference_key', `${PRESET_KEY_PREFIX}%`);

        if (error) throw error;
        return (data || [])
            .map((row: any) => row.preference_value as FilterPreset)
            .sort((a: FilterPreset, b: FilterPreset) => {
                if (a.isDefault && !b.isDefault) return -1;
                if (!a.isDefault && b.isDefault) return 1;
                return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
            });
    },

    async updateFilterPreset(
        userId: string,
        projectId: string,
        presetId: string,
        updates: Partial<FilterPreset>
    ): Promise<void> {
        const { data, error: fetchError } = await supabase
            .from('user_preferences')
            .select('preference_value')
            .eq('user_id', userId)
            .eq('project_id', projectId)
            .eq('preference_key', `${PRESET_KEY_PREFIX}${presetId}`)
            .single();

        if (fetchError) throw fetchError;
        const existingPreset = data.preference_value as FilterPreset;
        const updatedPreset = { ...existingPreset, ...updates, updatedDate: new Date() };

        const { error } = await supabase
            .from('user_preferences')
            .update({ preference_value: updatedPreset as any })
            .eq('user_id', userId)
            .eq('project_id', projectId)
            .eq('preference_key', `${PRESET_KEY_PREFIX}${presetId}`);

        if (error) throw error;
    },

    async deleteFilterPreset(userId: string, projectId: string, presetId: string): Promise<void> {
        const { error } = await supabase
            .from('user_preferences')
            .delete()
            .eq('user_id', userId)
            .eq('project_id', projectId)
            .eq('preference_key', `${PRESET_KEY_PREFIX}${presetId}`);
        if (error) throw error;
    },

    async setDefaultPreset(userId: string, projectId: string, presetId: string): Promise<void> {
        const presets = await this.getFilterPresets(userId, projectId);
        for (const preset of presets) {
            await this.updateFilterPreset(userId, projectId, preset.id, { isDefault: preset.id === presetId });
        }
    }
};
