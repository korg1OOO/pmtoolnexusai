/**
 * Advanced Delegation Service
 * Handles approval delegations with templates, bulk operations, and sub-delegation
 */

import { supabase as _supabase } from '@/integrations/supabase/client';
import type {
    DelegationTemplate,
    DelegationHistoryItem,
    DelegationHistoryFilters,
} from '@/types/analytics';

const supabase = _supabase as any;

/**
 * Create a single delegation
 */
export async function createDelegation(
    delegatorId: string,
    delegateId: string,
    approvalId: string | null,
    delegationType: 'temporary' | 'permanent',
    reason: string,
    expiresAt?: string,
    canSubdelegate: boolean = false,
    parentDelegationId?: string
): Promise<void> {
    const { error } = await supabase.from('delegations').insert({
        delegator_id: delegatorId,
        delegate_id: delegateId,
        approval_id: approvalId,
        delegation_type: delegationType,
        reason,
        expires_at: expiresAt,
        can_subdelegate: canSubdelegate,
        parent_delegation_id: parentDelegationId,
    });

    if (error) {
        console.error('Error creating delegation:', error);
        throw new Error('Failed to create delegation');
    }
}

/**
 * Bulk delegate multiple approvals
 */
export async function bulkDelegateApprovals(
    delegatorId: string,
    approvalIds: string[],
    delegateId: string,
    delegationType: 'temporary' | 'permanent',
    reason: string,
    expiresAt?: string,
    canSubdelegate: boolean = false
): Promise<void> {
    // Limit bulk operations
    if (approvalIds.length > 50) {
        throw new Error('Cannot delegate more than 50 approvals at once');
    }

    const delegations = approvalIds.map((approvalId) => ({
        delegator_id: delegatorId,
        delegate_id: delegateId,
        approval_id: approvalId,
        delegation_type: delegationType,
        reason,
        expires_at: expiresAt,
        can_subdelegate: canSubdelegate,
    }));

    const { error } = await supabase.from('delegations').insert(delegations);

    if (error) {
        console.error('Error bulk delegating approvals:', error);
        throw new Error('Failed to bulk delegate approvals');
    }
}

/**
 * Save a delegation template
 */
export async function saveDelegationTemplate(
    template: Omit<DelegationTemplate, 'id' | 'createdAt' | 'updatedAt'>
): Promise<DelegationTemplate> {
    const { data, error } = await supabase
        .from('delegation_templates')
        .insert({
            user_id: template.userId,
            name: template.name,
            delegate_id: template.delegateId,
            delegation_type: template.delegationType,
            reason: template.reason,
            duration_days: template.durationDays,
            can_subdelegate: template.canSubdelegate,
        })
        .select()
        .single();

    if (error) {
        console.error('Error saving delegation template:', error);
        throw new Error('Failed to save delegation template');
    }

    return {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        delegateId: data.delegate_id,
        delegationType: data.delegation_type,
        reason: data.reason,
        durationDays: data.duration_days,
        canSubdelegate: data.can_subdelegate,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
    };
}

/**
 * Get delegation templates for a user
 */
export async function getDelegationTemplates(userId: string): Promise<DelegationTemplate[]> {
    const { data, error } = await supabase
        .from('delegation_templates')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching delegation templates:', error);
        throw new Error('Failed to fetch delegation templates');
    }

    return data.map((template: any) => ({
        id: template.id,
        userId: template.user_id,
        name: template.name,
        delegateId: template.delegate_id,
        delegationType: template.delegation_type,
        reason: template.reason,
        durationDays: template.duration_days,
        canSubdelegate: template.can_subdelegate,
        createdAt: template.created_at,
        updatedAt: template.updated_at,
    }));
}

/**
 * Apply a delegation template to approvals
 */
export async function applyDelegationTemplate(
    templateId: string,
    delegatorId: string,
    approvalIds: string[]
): Promise<void> {
    // Get template
    const { data: template, error: templateError } = await supabase
        .from('delegation_templates')
        .select('*')
        .eq('id', templateId)
        .eq('user_id', delegatorId)
        .single();

    if (templateError || !template) {
        throw new Error('Template not found');
    }

    // Calculate expiry if duration is set
    let expiresAt: string | undefined;
    if (template.duration_days) {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + template.duration_days);
        expiresAt = expiry.toISOString();
    }

    // Bulk delegate using template
    await bulkDelegateApprovals(
        delegatorId,
        approvalIds,
        template.delegate_id,
        template.delegation_type,
        template.reason || 'Applied from template',
        expiresAt,
        template.can_subdelegate
    );
}

/**
 * Delete a delegation template
 */
export async function deleteDelegationTemplate(templateId: string, userId: string): Promise<void> {
    const { error } = await supabase
        .from('delegation_templates')
        .delete()
        .eq('id', templateId)
        .eq('user_id', userId);

    if (error) {
        console.error('Error deleting delegation template:', error);
        throw new Error('Failed to delete delegation template');
    }
}

/**
 * Get delegation history
 */
export async function getDelegationHistory(
    userId: string,
    filters?: DelegationHistoryFilters
): Promise<DelegationHistoryItem[]> {
    let query = supabase
        .from('delegation_history')
        .select('*')
        .or(`delegator_id.eq.${userId},delegate_id.eq.${userId}`);

    if (filters?.status) {
        query = query.eq('status', filters.status);
    }

    if (filters?.delegationType) {
        query = query.eq('delegation_type', filters.delegationType);
    }

    if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
    }

    if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
    }

    query = query.order('created_at', { ascending: false }).limit(100);

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching delegation history:', error);
        throw new Error('Failed to fetch delegation history');
    }

    return data.map((item: any) => ({
        id: item.id,
        approvalId: item.approval_id,
        approvalTitle: item.approval_title,
        delegatorId: item.delegator_id,
        delegatorName: item.delegator_name,
        delegatorEmail: item.delegator_email,
        delegateId: item.delegate_id,
        delegateName: item.delegate_name,
        delegateEmail: item.delegate_email,
        delegationType: item.delegation_type,
        reason: item.reason,
        status: item.status,
        createdAt: item.created_at,
        revokedAt: item.revoked_at,
        expiresAt: item.expires_at,
        parentDelegationId: item.parent_delegation_id,
        delegationDepth: item.delegation_depth,
        canSubdelegate: item.can_subdelegate,
    }));
}

/**
 * Check if a user can sub-delegate
 */
export async function canSubDelegate(delegationId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
        .from('delegations')
        .select('can_subdelegate, delegate_id, status')
        .eq('id', delegationId)
        .single();

    if (error || !data) {
        return false;
    }

    return data.can_subdelegate && data.delegate_id === userId && data.status === 'active';
}

/**
 * Create a sub-delegation
 */
export async function createSubDelegation(
    parentDelegationId: string,
    currentUserId: string,
    newDelegateId: string,
    reason: string
): Promise<void> {
    // Verify can sub-delegate
    const canDelegate = await canSubDelegate(parentDelegationId, currentUserId);
    if (!canDelegate) {
        throw new Error('You do not have permission to sub-delegate this approval');
    }

    // Get parent delegation details
    const { data: parentDelegation, error: parentError } = await supabase
        .from('delegations')
        .select('*')
        .eq('id', parentDelegationId)
        .single();

    if (parentError || !parentDelegation) {
        throw new Error('Parent delegation not found');
    }

    // Create sub-delegation
    await createDelegation(
        currentUserId,
        newDelegateId,
        parentDelegation.approval_id,
        'temporary', // Sub-delegations are always temporary
        reason,
        parentDelegation.expires_at, // Inherit parent expiry
        false, // Sub-delegations cannot be further delegated by default
        parentDelegationId
    );
}

/**
 * Check and expire delegations
 */
export async function checkExpiredDelegations(): Promise<void> {
    const { error } = await supabase.rpc('check_expired_delegations');

    if (error) {
        console.error('Error checking expired delegations:', error);
        throw new Error('Failed to check expired delegations');
    }
}

/**
 * Extend a delegation's expiry date
 */
export async function extendDelegation(
    delegationId: string,
    delegatorId: string,
    newExpiryDate: string
): Promise<void> {
    // Validate new expiry is in the future
    if (new Date(newExpiryDate) <= new Date()) {
        throw new Error('Expiry date must be in the future');
    }

    const { error } = await supabase
        .from('delegations')
        .update({ expires_at: newExpiryDate })
        .eq('id', delegationId)
        .eq('delegator_id', delegatorId)
        .eq('status', 'active');

    if (error) {
        console.error('Error extending delegation:', error);
        throw new Error('Failed to extend delegation');
    }
}

/**
 * Revoke a delegation
 */
export async function revokeDelegation(
    delegationId: string,
    delegatorId: string,
    reason?: string
): Promise<void> {
    const { error } = await supabase
        .from('delegations')
        .update({
            status: 'revoked',
            revoked_at: new Date().toISOString(),
            revoked_reason: reason,
        })
        .eq('id', delegationId)
        .eq('delegator_id', delegatorId);

    if (error) {
        console.error('Error revoking delegation:', error);
        throw new Error('Failed to revoke delegation');
    }
}

/**
 * Get active delegations for a user
 */
export async function getActiveDelegations(userId: string): Promise<DelegationHistoryItem[]> {
    return getDelegationHistory(userId, { status: 'active' });
}

/**
 * Search users for delegation
 */
export async function searchUsersForDelegation(
    query: string,
    excludeUserId?: string
): Promise<Array<{ id: string; name: string; email: string }>> {
    let queryBuilder = supabase
        .from('profiles')
        .select('id, full_name, email')
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10);

    if (excludeUserId) {
        queryBuilder = queryBuilder.neq('id', excludeUserId);
    }

    const { data, error } = await queryBuilder;

    if (error) {
        console.error('Error searching users:', error);
        return [];
    }

    return data.map((user: any) => ({
        id: user.id,
        name: user.full_name || user.email,
        email: user.email,
    }));
}
