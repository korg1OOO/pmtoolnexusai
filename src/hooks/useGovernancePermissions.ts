import { useMemo, useState, useEffect } from 'react';
import type { ApprovalWorkflow } from '@/types/analytics';
import { isUserAdmin } from '@/services/governanceService';
import { useAuth } from '@/hooks/useAuth';

/**
 * Hook for managing governance-related permissions
 * Determines if a user can approve/reject workflows based on approval chain
 */
export function useGovernancePermissions(
    entityId: string,
    entityType: 'project' | 'portfolio' | 'program' | 'workspace'
) {
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminCheckLoading, setAdminCheckLoading] = useState(true);
    const { user } = useAuth();

    // Function to check and update admin status
    const checkAdminStatus = async (userId: string | undefined) => {
        if (!userId) {
            setIsAdmin(false);
            setAdminCheckLoading(false);
            return;
        }

        setAdminCheckLoading(true);
        const adminStatus = await isUserAdmin(userId);
        setIsAdmin(adminStatus);
        setAdminCheckLoading(false);
    };

    // Automatically check admin status whenever the current user changes
    useEffect(() => {
        checkAdminStatus(user?.id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    /**
     * Check if user can approve a specific workflow
     * 
     * Rules:
     * 1. Admins can approve any workflow (override)
     * 2. User must be authenticated (userId exists)
     * 3. User must be in the approval chain
     * 4. User must be the current pending approver
     * 5. Workflow status must be 'pending'
     */
    const canApproveWorkflow = useMemo(() => {
        return (approval: ApprovalWorkflow, userId: string | undefined): boolean => {
            // Rule 1: User must be authenticated
            if (!userId) {
                return false;
            }

            // Admin override - can approve any pending workflow
            if (isAdmin && approval.status === 'pending') {
                return true;
            }

            // Rule 2: Workflow must be pending
            if (approval.status !== 'pending') {
                return false;
            }

            // Rule 3 & 4: User must be in approval chain and be current approver
            const userApprover = approval.approvalChain?.find(
                (approver) => approver.userId === userId
            );

            if (!userApprover) {
                return false; // User not in approval chain
            }

            // User must be pending (not already approved/rejected)
            if (userApprover.status !== 'pending') {
                return false;
            }

            // Check if user is the current approver (all previous approvers have approved)
            const userOrder = userApprover.order;
            const allPreviousApproved = approval.approvalChain
                .filter((a) => a.order < userOrder)
                .every((a) => a.status === 'approved');

            return allPreviousApproved;
        };
    }, [isAdmin]);

    /**
     * Check if user can reject a specific workflow
     * 
     * Same rules as approve, but user can reject at any point in the chain
     * if they are a pending approver. Admins can also reject any workflow.
     */
    const canRejectWorkflow = useMemo(() => {
        return (approval: ApprovalWorkflow, userId: string | undefined): boolean => {
            // Rule 1: User must be authenticated
            if (!userId) {
                return false;
            }

            // Admin override - can reject any pending workflow
            if (isAdmin && approval.status === 'pending') {
                return true;
            }

            // Rule 2: Workflow must be pending
            if (approval.status !== 'pending') {
                return false;
            }

            // Rule 3 & 4: User must be in approval chain and be pending
            const userApprover = approval.approvalChain?.find(
                (approver) => approver.userId === userId
            );

            if (!userApprover) {
                return false; // User not in approval chain
            }

            // User can reject if they are pending (regardless of order)
            return userApprover.status === 'pending';
        };
    }, [isAdmin]);

    /**
     * Get the user's approval status in a workflow
     * Returns: 'not-in-chain' | 'pending' | 'approved' | 'rejected' | 'not-current' | 'admin'
     */
    const getUserApprovalStatus = useMemo(() => {
        return (approval: ApprovalWorkflow, userId: string | undefined): string => {
            if (!userId) {
                return 'not-in-chain';
            }

            // Admin can always approve
            if (isAdmin) {
                return 'admin';
            }

            const userApprover = approval.approvalChain?.find(
                (approver) => approver.userId === userId
            );

            if (!userApprover) {
                return 'not-in-chain';
            }

            if (userApprover.status !== 'pending') {
                return userApprover.status;
            }

            // Check if user is the current approver
            const userOrder = userApprover.order;
            const allPreviousApproved = approval.approvalChain
                .filter((a) => a.order < userOrder)
                .every((a) => a.status === 'approved');

            return allPreviousApproved ? 'pending' : 'not-current';
        };
    }, [isAdmin]);

    /**
     * Get a user-friendly message explaining why user cannot approve
     */
    const getPermissionMessage = useMemo(() => {
        return (approval: ApprovalWorkflow, userId: string | undefined): string => {
            const status = getUserApprovalStatus(approval, userId);

            switch (status) {
                case 'admin':
                    return 'You can approve this workflow as an administrator';
                case 'not-in-chain':
                    return 'You are not in the approval chain for this workflow';
                case 'approved':
                    return 'You have already approved this workflow';
                case 'rejected':
                    return 'You have already rejected this workflow';
                case 'not-current':
                    return 'Waiting for previous approvers to complete their review';
                case 'pending':
                    return 'You can approve or reject this workflow';
                default:
                    return 'Unknown status';
            }
        };
    }, [getUserApprovalStatus]);

    return {
        canApproveWorkflow,
        canRejectWorkflow,
        getUserApprovalStatus,
        getPermissionMessage,
        isAdmin,
        adminCheckLoading,
        checkAdminStatus,
    };
}
