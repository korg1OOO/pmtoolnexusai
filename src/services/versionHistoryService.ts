import { supabase } from '@/lib/supabase';

export interface SpreadsheetVersion {
    id: string;
    sheet_id: string;
    snapshot_data: any[][];
    cell_formats?: any;
    conditional_formats?: any;
    validation_rules?: any;
    charts?: any;
    user_id?: string;
    user_name?: string;
    label?: string;
    change_summary?: string;
    created_at: string;
}

export interface CreateVersionInput {
    sheet_id: string;
    snapshot_data: any[][];
    cell_formats?: any;
    conditional_formats?: any;
    validation_rules?: any;
    charts?: any;
    label?: string;
    change_summary?: string;
}

/**
 * Service for managing spreadsheet version history
 */
export class VersionHistoryService {
    /**
     * Get all versions for a sheet
     */
    static async getVersions(sheetId: string): Promise<SpreadsheetVersion[]> {
        const { data, error } = await supabase
            .from('spreadsheet_versions')
            .select('*')
            .eq('sheet_id', sheetId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Error fetching versions:', error);
            return [];
        }

        return data;
    }

    /**
     * Create a new version snapshot
     */
    static async createVersion(
        input: CreateVersionInput,
        userName?: string
    ): Promise<SpreadsheetVersion | null> {
        const { data: user } = await supabase.auth.getUser();

        const { data, error } = await supabase
            .from('spreadsheet_versions')
            .insert([
                {
                    ...input,
                    user_id: user.user?.id,
                    user_name: userName || user.user?.email,
                },
            ])
            .select()
            .single();

        if (error) {
            console.error('Errorating version:', error);
            return null;
        }

        return data;
    }

    /**
     * Get a specific version
     */
    static async getVersion(versionId: string): Promise<SpreadsheetVersion | null> {
        const { data, error } = await supabase
            .from('spreadsheet_versions')
            .select('*')
            .eq('id', versionId)
            .single();

        if (error) {
            console.error('Error fetching version:', error);
            return null;
        }

        return data;
    }

    /**
     * Delete a version
     */
    static async deleteVersion(versionId: string): Promise<boolean> {
        const { error } = await supabase
            .from('spreadsheet_versions')
            .delete()
            .eq('id', versionId);

        if (error) {
            console.error('Error deleting version:', error);
            return false;
        }

        return true;
    }

    /**
     * Auto-save: create version if significant changes detected
     */
    static async autoSaveVersion(
        sheetId: string,
        currentData: any[][],
        cellFormats?: any,
        conditionalFormats?: any,
        validationRules?: any,
        charts?: any
    ): Promise<void> {
        // Get the last version
        const versions = await this.getVersions(sheetId);
        const lastVersion = versions[0];

        // Only create version if there are changes
        if (lastVersion) {
            const hasChanges =
                JSON.stringify(lastVersion.snapshot_data) !== JSON.stringify(currentData);

            if (!hasChanges) {
                return; // No changes, skip versioning
            }
        }

        // Create auto-save version
        await this.createVersion({
            sheet_id: sheetId,
            snapshot_data: currentData,
            cell_formats: cellFormats,
            conditional_formats: conditionalFormats,
            validation_rules: validationRules,
            charts,
            label: 'Auto-save',
            change_summary: 'Automatic snapshot',
        });
    }

    /**
     * Restore a version (returns the snapshot data)
     */
    static async restoreVersion(versionId: string): Promise<SpreadsheetVersion | null> {
        return await this.getVersion(versionId);
    }
}
