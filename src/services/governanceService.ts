/**
 * Governance Service
 * Manages policies, approvals, and compliance data
 */

import { supabase as _supabase } from '@/integrations/supabase/client';
import type {
    GovernancePanelData,
    PolicyDocument,
    ApprovalWorkflow,
    ComplianceChecklist,
    Approver,
    ChecklistItem,
} from '@/types/analytics';

const supabase = _supabase as any;

/**
 * Fetch all governance data for an entity
 */
export async function getGovernanceData(
    entityId: string,
    entityType: 'project' | 'portfolio' | 'program' | 'workspace'
): Promise<GovernancePanelData> {
    try {
        // Fetch all data in parallel
        const [policies, approvals, compliance] = await Promise.all([
            getPolicies(entityId, entityType),
            getApprovals(entityId, entityType),
            getCompliance(entityId, entityType),
        ]);

        return {
            entityId,
            entityType,
            policies,
            approvals,
            compliance,
        };
    } catch (error) {
        console.error('Failed to fetch governance data:', error);
        throw new Error('Failed to load governance data. Please try again.');
    }
}

/**
 * Fetch policies for an entity
 */
export async function getPolicies(
    entityId: string,
    entityType: string
): Promise<PolicyDocument[]> {
    try {
        const { data, error } = await supabase
            .from('policy_documents')
            .select('*')
            .eq('entity_id', entityId)
            .eq('entity_type', entityType)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform database data to match TypeScript types
        return (data || []).map((policy: any) => ({
            id: policy.id,
            title: policy.title,
            category: policy.category,
            version: policy.version,
            lastReviewed: new Date(policy.last_reviewed),
            nextReview: new Date(policy.next_review),
            applicableTo: policy.applicable_to || [],
            documentUrl: policy.document_url,
            mandatory: policy.mandatory,
            status: policy.status,
            owner: policy.owner,
        }));
    } catch (error) {
        console.error('Failed to fetch policies:', error);
        // Return empty array instead of throwing to allow partial data loading
        return [];
    }
}

/**
 * Fetch approvals for an entity
 */
export async function getApprovals(
    entityId: string,
    entityType: string
): Promise<ApprovalWorkflow[]> {
    try {
        // Fetch approvals with their approval chains
        const { data: approvalData, error: approvalError } = await supabase
            .from('approval_workflows')
            .select(`
                *,
                approvers (
                    id,
                    user_id,
                    name,
                    role,
                    order_num,
                    status,
                    action_date,
                    comments
                )
            `)
            .eq('entity_id', entityId)
            .eq('entity_type', entityType)
            .order('created_at', { ascending: false });

        if (approvalError) throw approvalError;

        // Transform database data to match TypeScript types
        return (approvalData || []).map((approval: any) => ({
            id: approval.id,
            type: approval.type,
            title: approval.title,
            status: approval.status,
            currentApprover: approval.current_approver,
            approvalChain: (approval.approvers || [])
                .sort((a: any, b: any) => a.order_num - b.order_num)
                .map((approver: any) => ({
                    userId: approver.user_id,
                    name: approver.name,
                    role: approver.role,
                    order: approver.order_num,
                    status: approver.status,
                    actionDate: approver.action_date ? new Date(approver.action_date) : undefined,
                    comments: approver.comments,
                })),
            submittedDate: new Date(approval.submitted_date),
            submittedBy: approval.submitted_by,
            completedDate: approval.completed_date ? new Date(approval.completed_date) : undefined,
            comments: approval.comments,
            attachments: approval.attachments || [],
        }));
    } catch (error) {
        console.error('Failed to fetch approvals:', error);
        return [];
    }
}

/**
 * Fetch compliance data for an entity
 */
export async function getCompliance(
    entityId: string,
    entityType: string
): Promise<ComplianceChecklist[]> {
    try {
        // Fetch compliance checklists with their items
        const { data: complianceData, error: complianceError } = await supabase
            .from('compliance_checklists')
            .select(`
                *,
                checklist_items (
                    id,
                    requirement,
                    description,
                    status,
                    evidence,
                    verified_by,
                    verified_date,
                    notes,
                    priority
                )
            `)
            .eq('entity_id', entityId)
            .eq('entity_type', entityType)
            .order('created_at', { ascending: false });

        if (complianceError) throw complianceError;

        // Transform database data to match TypeScript types
        return (complianceData || []).map((compliance: any) => ({
            id: compliance.id,
            framework: compliance.framework,
            entityId: compliance.entity_id,
            entityType: compliance.entity_type,
            items: (compliance.checklist_items || []).map((item: any) => ({
                id: item.id,
                requirement: item.requirement,
                description: item.description,
                status: item.status,
                evidence: item.evidence || [],
                verifiedBy: item.verified_by,
                verifiedDate: item.verified_date ? new Date(item.verified_date) : undefined,
                notes: item.notes,
                priority: item.priority,
            })),
            completionPercent: compliance.completion_percent,
            lastAudit: new Date(compliance.last_audit),
            nextAudit: new Date(compliance.next_audit),
            auditor: compliance.auditor,
            status: compliance.status,
        }));
    } catch (error) {
        console.error('Failed to fetch compliance data:', error);
        return [];
    }
}

/**
 * Approve an approval workflow
 */
export async function approveWorkflow(
    approvalId: string,
    userId: string,
    comments?: string
): Promise<void> {
    try {
        // Update the approver's status
        const { error: approverError } = await supabase
            .from('approvers')
            .update({
                status: 'approved',
                action_date: new Date().toISOString(),
                comments: comments || null,
            })
            .eq('approval_id', approvalId)
            .eq('user_id', userId);

        if (approverError) throw approverError;

        // Check if all approvers have approved
        const { data: approvers, error: fetchError } = await supabase
            .from('approvers')
            .select('status')
            .eq('approval_id', approvalId);

        if (fetchError) throw fetchError;

        const allApproved = approvers.every((a: any) => a.status === 'approved');

        // If all approved, update the workflow status
        if (allApproved) {
            const { error: workflowError } = await supabase
                .from('approval_workflows')
                .update({
                    status: 'approved',
                    completed_date: new Date().toISOString(),
                })
                .eq('id', approvalId);

            if (workflowError) throw workflowError;
        }
    } catch (error) {
        console.error('Failed to approve workflow:', error);
        throw new Error('Failed to approve. Please try again.');
    }
}

/**
 * Reject an approval workflow
 */
export async function rejectWorkflow(
    approvalId: string,
    userId: string,
    comments?: string
): Promise<void> {
    try {
        // Update the approver's status
        const { error: approverError } = await supabase
            .from('approvers')
            .update({
                status: 'rejected',
                action_date: new Date().toISOString(),
                comments: comments || null,
            })
            .eq('approval_id', approvalId)
            .eq('user_id', userId);

        if (approverError) throw approverError;

        // Update the workflow status to rejected
        const { error: workflowError } = await supabase
            .from('approval_workflows')
            .update({
                status: 'rejected',
                completed_date: new Date().toISOString(),
            })
            .eq('id', approvalId);

        if (workflowError) throw workflowError;
    } catch (error) {
        console.error('Failed to reject workflow:', error);
        throw new Error('Failed to reject. Please try again.');
    }
}

/**
 * Update compliance item status
 */
export async function updateComplianceItem(
    itemId: string,
    status: 'compliant' | 'non-compliant' | 'in-progress' | 'not-applicable',
    verifiedBy?: string,
    notes?: string
): Promise<void> {
    try {
        const { error } = await supabase
            .from('checklist_items')
            .update({
                status,
                verified_by: verifiedBy || null,
                verified_date: status === 'compliant' ? new Date().toISOString() : null,
                notes: notes || null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', itemId);

        if (error) throw error;

        // Recalculate completion percentage for the parent checklist
        // This would ideally be done via a database trigger, but we can do it here
        const { data: item } = await supabase
            .from('checklist_items')
            .select('checklist_id')
            .eq('id', itemId)
            .single();

        if (item) {
            await recalculateCompletionPercent(item.checklist_id);
        }
    } catch (error) {
        console.error('Failed to update compliance item:', error);
        throw new Error('Failed to update compliance item. Please try again.');
    }
}

/**
 * Recalculate completion percentage for a checklist
 */
async function recalculateCompletionPercent(checklistId: string): Promise<void> {
    try {
        const { data: items } = await supabase
            .from('checklist_items')
            .select('status')
            .eq('checklist_id', checklistId);

        if (!items || items.length === 0) return;

        const compliantCount = items.filter(
            (item: any) => item.status === 'compliant'
        ).length;
        const completionPercent = Math.round((compliantCount / items.length) * 100);

        await supabase
            .from('compliance_checklists')
            .update({ completion_percent: completionPercent })
            .eq('id', checklistId);
    } catch (error) {
        console.error('Failed to recalculate completion percent:', error);
    }
}

/**
 * Admin override approval - allows admins to approve any workflow
 */
export async function adminOverrideApproval(
    approvalId: string,
    userId: string,
    reason: string
): Promise<void> {
    try {
        // 1. Verify user is admin
        const { data: userRoles, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', userId);

        if (roleError) throw roleError;

        const isAdmin = userRoles?.some((r: any) => r.role === 'admin');
        if (!isAdmin) {
            throw new Error('Only admins can override approvals');
        }

        // 2. Update workflow status to approved
        const { error: workflowError } = await supabase
            .from('approval_workflows')
            .update({
                status: 'approved',
                completed_date: new Date().toISOString(),
            })
            .eq('id', approvalId);

        if (workflowError) throw workflowError;

        // 3. Mark all pending approvers as bypassed
        const { error: approversError } = await supabase
            .from('approvers')
            .update({
                status: 'bypassed',
                action_date: new Date().toISOString(),
                comments: `Admin override: ${reason}`,
            })
            .eq('approval_id', approvalId)
            .eq('status', 'pending');

        if (approversError) throw approversError;

        // 4. Log the admin override
        const { error: logError } = await supabase
            .from('approvers')
            .insert({
                approval_id: approvalId,
                user_id: userId,
                name: 'Admin Override',
                role: 'admin',
                order_num: 999, // High number to indicate override
                status: 'approved',
                action_date: new Date().toISOString(),
                comments: reason,
                is_override: true,
                override_reason: reason,
            });

        if (logError) throw logError;

    } catch (error) {
        console.error('Failed to override approval:', error);
        throw new Error('Failed to override approval. Please try again.');
    }
}

/**
 * Check if user is admin
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
    try {
        const { data: userRoles, error } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', userId);

        if (error) throw error;

        return userRoles?.some((r: any) => r.role === 'admin') || false;
    } catch (error) {
        console.error('Failed to check admin status:', error);
        return false;
    }
}

/**
 * Create a delegation
 */
export async function createDelegation(
    delegatorId: string,
    delegateId: string,
    entityId: string,
    entityType: 'project' | 'portfolio' | 'program' | 'workspace',
    delegationType: 'temporary' | 'permanent',
    approvalId: string | null,
    reason: string
): Promise<void> {
    try {
        const { error } = await supabase
            .from('delegations')
            .insert({
                delegator_id: delegatorId,
                delegate_id: delegateId,
                entity_id: entityId,
                entity_type: entityType,
                delegation_type: delegationType,
                approval_id: approvalId,
                reason,
                status: 'active',
            });

        if (error) throw error;

        // If temporary delegation, update the specific approver
        if (approvalId && delegationType === 'temporary') {
            const { error: approverError } = await supabase
                .from('approvers')
                .update({
                    delegated_to: delegateId,
                    is_delegated: true,
                })
                .eq('approval_id', approvalId)
                .eq('user_id', delegatorId);

            if (approverError) throw approverError;
        }
    } catch (error) {
        console.error('Failed to create delegation:', error);
        throw new Error('Failed to create delegation. Please try again.');
    }
}

/**
 * Get active delegations for a user
 */
export async function getUserDelegations(
    userId: string,
    entityId: string,
    entityType: string
): Promise<any[]> {
    try {
        const { data, error } = await supabase
            .from('delegations')
            .select('*')
            .eq('delegator_id', userId)
            .eq('entity_id', entityId)
            .eq('entity_type', entityType)
            .eq('status', 'active')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map((d: any) => ({
            id: d.id,
            delegatorId: d.delegator_id,
            delegateId: d.delegate_id,
            approvalId: d.approval_id,
            entityId: d.entity_id,
            entityType: d.entity_type,
            delegationType: d.delegation_type,
            reason: d.reason,
            status: d.status,
            createdAt: new Date(d.created_at),
            revokedAt: d.revoked_at ? new Date(d.revoked_at) : undefined,
            revokedReason: d.revoked_reason,
        }));
    } catch (error) {
        console.error('Failed to fetch delegations:', error);
        return [];
    }
}

/**
 * Revoke a delegation
 */
export async function revokeDelegation(
    delegationId: string,
    reason: string
): Promise<void> {
    try {
        // Update delegation status
        const { error } = await supabase
            .from('delegations')
            .update({
                status: 'revoked',
                revoked_at: new Date().toISOString(),
                revoked_reason: reason,
            })
            .eq('id', delegationId);

        if (error) throw error;

        // Update approvers to remove delegation
        const { error: approverError } = await supabase
            .from('approvers')
            .update({
                delegated_to: null,
                is_delegated: false,
            })
            .eq('delegation_id', delegationId);

        if (approverError) throw approverError;
    } catch (error) {
        console.error('Failed to revoke delegation:', error);
        throw new Error('Failed to revoke delegation. Please try again.');
    }
}

/**
 * Get active delegation for a specific approval
 */
export async function getActiveDelegation(
    userId: string,
    approvalId: string
): Promise<any | null> {
    try {
        const { data, error } = await supabase
            .from('delegations')
            .select('*')
            .eq('delegator_id', userId)
            .eq('approval_id', approvalId)
            .eq('status', 'active')
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
        if (!data) return null;

        return {
            id: data.id,
            delegatorId: data.delegator_id,
            delegateId: data.delegate_id,
            approvalId: data.approval_id,
            entityId: data.entity_id,
            entityType: data.entity_type,
            delegationType: data.delegation_type,
            reason: data.reason,
            status: data.status,
            createdAt: new Date(data.created_at),
        };
    } catch (error) {
        console.error('Failed to get active delegation:', error);
        return null;
    }
}

/**
 * Get delegated approvals for a user (approvals delegated TO them)
 */
export async function getDelegatedApprovals(
    delegateId: string,
    entityId: string,
    entityType: string
): Promise<any[]> {
    try {
        const { data, error } = await supabase
            .from('delegations')
            .select(`
                *,
                approval_workflows!inner(*)
            `)
            .eq('delegate_id', delegateId)
            .eq('entity_id', entityId)
            .eq('entity_type', entityType)
            .eq('status', 'active')
            .eq('approval_workflows.status', 'pending');

        if (error) throw error;

        return data || [];
    } catch (error) {
        console.error('Failed to get delegated approvals:', error);
        return [];
    }
}
