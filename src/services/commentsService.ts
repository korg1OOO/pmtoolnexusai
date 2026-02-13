import { supabase } from '@/lib/supabase';

export interface SpreadsheetComment {
    id: string;
    sheet_id: string;
    cell_ref: string;
    user_id: string;
    user_name: string;
    user_email?: string;
    content: string;
    mentions?: string[];
    parent_id?: string;
    resolved: boolean;
    resolved_by?: string;
    resolved_at?: string;
    created_at: string;
    updated_at: string;
    replies?: SpreadsheetComment[]; // For nested display
}

export interface CreateCommentInput {
    sheet_id: string;
    cell_ref: string;
    content: string;
    mentions?: string[];
    parent_id?: string;
}

/**
 * Service for managing spreadsheet comments
 */
export class CommentsService {
    /**
     * Get all comments for a sheet
     */
    static async getComments(sheetId: string): Promise<SpreadsheetComment[]> {
        const { data, error } = await supabase
            .from('spreadsheet_comments')
            .select('*')
            .eq('sheet_id', sheetId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching comments:', error);
            return [];
        }

        // Build threaded structure
        return this.buildCommentTree(data);
    }

    /**
     * Get comments for a specific cell
     */
    static async getCellComments(
        sheetId: string,
        cellRef: string
    ): Promise<SpreadsheetComment[]> {
        const { data, error } = await supabase
            .from('spreadsheet_comments')
            .select('*')
            .eq('sheet_id', sheetId)
            .eq('cell_ref', cellRef)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching cell comments:', error);
            return [];
        }

        return this.buildCommentTree(data);
    }

    /**
     * Create a new comment
     */
    static async createComment(
        input: CreateCommentInput,
        userName: string,
        userEmail?: string
    ): Promise<SpreadsheetComment | null> {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) return null;

        const { data, error } = await supabase
            .from('spreadsheet_comments')
            .insert([
                {
                    ...input,
                    user_id: user.user.id,
                    user_name: userName,
                    user_email: userEmail,
                    resolved: false,
                },
            ])
            .select()
            .single();

        if (error) {
            console.error('Error creating comment:', error);
            return null;
        }

        return data;
    }

    /**
     * Update a comment
     */
    static async updateComment(
        commentId: string,
        content: string
    ): Promise<boolean> {
        const { error } = await supabase
            .from('spreadsheet_comments')
            .update({
                content,
                updated_at: new Date().toISOString(),
            })
            .eq('id', commentId);

        if (error) {
            console.error('Error updating comment:', error);
            return false;
        }

        return true;
    }

    /**
     * Delete a comment
     */
    static async deleteComment(commentId: string): Promise<boolean> {
        const { error } = await supabase
            .from('spreadsheet_comments')
            .delete()
            .eq('id', commentId);

        if (error) {
            console.error('Error deleting comment:', error);
            return false;
        }

        return true;
    }

    /**
     * Resolve/unresolve a comment thread
     */
    static async resolveComment(
        commentId: string,
        resolved: boolean
    ): Promise<boolean> {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) return false;

        const { error } = await supabase
            .from('spreadsheet_comments')
            .update({
                resolved,
                resolved_by: resolved ? user.user.id : null,
                resolved_at: resolved ? new Date().toISOString() : null,
            })
            .eq('id', commentId);

        if (error) {
            console.error('Error resolving comment:', error);
            return false;
        }

        return true;
    }

    /**
     * Subscribe to comment changes for real-time updates
     */
    static subscribeToComments(
        sheetId: string,
        onChange: (comments: SpreadsheetComment[]) => void
    ) {
        const channel = supabase
            .channel(`comments:${sheetId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'spreadsheet_comments',
                    filter: `sheet_id=eq.${sheetId}`,
                },
                async () => {
                    const comments = await this.getComments(sheetId);
                    onChange(comments);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }

    /**
     * Build threaded comment tree from flat list
     */
    private static buildCommentTree(
        comments: SpreadsheetComment[]
    ): SpreadsheetComment[] {
        const commentMap = new Map<string, SpreadsheetComment>();
        const rootComments: SpreadsheetComment[] = [];

        // First pass: create map
        comments.forEach((comment) => {
            commentMap.set(comment.id, { ...comment, replies: [] });
        });

        // Second pass: build tree
        comments.forEach((comment) => {
            const node = commentMap.get(comment.id)!;

            if (comment.parent_id) {
                const parent = commentMap.get(comment.parent_id);
                if (parent) {
                    parent.replies = parent.replies || [];
                    parent.replies.push(node);
                }
            } else {
                rootComments.push(node);
            }
        });

        return rootComments;
    }

    /**
     * Get unresolved comment count for a sheet
     */
    static async getUnresolvedCount(sheetId: string): Promise<number> {
        const { count, error } = await supabase
            .from('spreadsheet_comments')
            .select('*', { count: 'exact', head: true })
            .eq('sheet_id', sheetId)
            .eq('resolved', false)
            .is('parent_id', null); // Only count top-level comments

        if (error) {
            console.error('Error getting unresolved count:', error);
            return 0;
        }

        return count || 0;
    }
}
