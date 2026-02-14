import { supabase as _supabase } from '@/integrations/supabase/client';
const supabase = _supabase as any;

export type SharePermission = 'view' | 'edit' | 'admin';

export interface SpreadsheetShare {
    id: string;
    spreadsheet_id: string;
    shared_with_user_id?: string;
    shared_with_email?: string;
    permission: SharePermission;
    created_by: string;
    expires_at?: string;
    created_at: string;
    updated_at: string;

    // Populated from joins
    user_name?: string;
    user_email?: string;
}

export interface CreateShareInput {
    spreadsheet_id: string;
    shared_with_user_id?: string;
    shared_with_email?: string;
    permission: SharePermission;
    expires_at?: string;
}

/**
 * Service for managing spreadsheet sharing and permissions
 */
export class SharingService {
    /**
     * Get all shares for a spreadsheet
     */
    static async getShares(spreadsheetId: string): Promise<SpreadsheetShare[]> {
        const { data, error } = await supabase
            .from('spreadsheet_shares')
            .select('*')
            .eq('spreadsheet_id', spreadsheetId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching shares:', error);
            return [];
        }

        return data;
    }

    /**
     * Create a new share
     */
    static async createShare(input: CreateShareInput): Promise<SpreadsheetShare | null> {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) return null;

        const { data, error } = await supabase
            .from('spreadsheet_shares')
            .insert([
                {
                    ...input,
                    created_by: user.user.id,
                },
            ])
            .select()
            .single();

        if (error) {
            console.error('Error creating share:', error);
            return null;
        }

        return data;
    }

    /**
     * Update share permission
     */
    static async updateSharePermission(
        shareId: string,
        permission: SharePermission
    ): Promise<boolean> {
        const { error } = await supabase
            .from('spreadsheet_shares')
            .update({
                permission,
                updated_at: new Date().toISOString(),
            })
            .eq('id', shareId);

        if (error) {
            console.error('Error updating share:', error);
            return false;
        }

        return true;
    }

    /**
     * Delete a share
     */
    static async deleteShare(shareId: string): Promise<boolean> {
        const { error } = await supabase
            .from('spreadsheet_shares')
            .delete()
            .eq('id', shareId);

        if (error) {
            console.error('Error deleting share:', error);
            return false;
        }

        return true;
    }

    /**
     * Check if current user has specific permission for a spreadsheet
     */
    static async hasPermission(
        spreadsheetId: string,
        requiredPermission: SharePermission
    ): Promise<boolean> {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) return false;

        // Check if user is owner
        const { data: spreadsheet } = await supabase
            .from('notebook_spreadsheets')
            .select('user_id')
            .eq('id', spreadsheetId)
            .single();

        if (spreadsheet?.user_id === user.user.id) {
            return true; // Owner has all permissions
        }

        // Check shares
        const { data: share } = await supabase
            .from('spreadsheet_shares')
            .select('permission')
            .eq('spreadsheet_id', spreadsheetId)
            .eq('shared_with_user_id', user.user.id)
            .maybeSingle();

        if (!share) return false;

        const permissionLevel = { view: 1, edit: 2, admin: 3 };
        return permissionLevel[share.permission] >= permissionLevel[requiredPermission];
    }

    /**
     * Get user's permission level for a spreadsheet
     */
    static async getPermission(
        spreadsheetId: string
    ): Promise<SharePermission | null> {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) return null;

        // Check if user is owner
        const { data: spreadsheet } = await supabase
            .from('notebook_spreadsheets')
            .select('user_id')
            .eq('id', spreadsheetId)
            .single();

        if (spreadsheet?.user_id === user.user.id) {
            return 'admin';
        }

        // Check shares
        const { data: share } = await supabase
            .from('spreadsheet_shares')
            .select('permission')
            .eq('spreadsheet_id', spreadsheetId)
            .eq('shared_with_user_id', user.user.id)
            .maybeSingle();

        return share?.permission || null;
    }
}
