import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, FileText, CheckSquare, GitBranch, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    PolicyDocuments,
    ApprovalWorkflows,
    ComplianceChecklists,
    DocumentPreview,
    DelegationDialog,
    DelegationList,
} from './governance';
import { AdminOverrideDialog } from './governance/AdminOverrideDialog';
import {
    getGovernanceData,
    approveWorkflow,
    rejectWorkflow,
    adminOverrideApproval,
    createDelegation,
    getUserDelegations,
    revokeDelegation,
} from '@/services/governanceService';
import type { DelegationRequest } from '@/types/analytics';
import { useAuth } from '@/hooks/useAuth';
import { useGovernancePermissions } from '@/hooks/useGovernancePermissions';
import { useToast } from '@/hooks/use-toast';
import type { PolicyDocument, ChecklistItem } from '@/types/analytics';

interface GovernancePanelProps {
    entityId: string;
    entityType: 'project' | 'portfolio' | 'program' | 'workspace';
    isOpen: boolean;
    onClose: () => void;
}

export function GovernancePanel({
    entityId,
    entityType,
    isOpen,
    onClose,
}: GovernancePanelProps) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { canApproveWorkflow, canRejectWorkflow, getPermissionMessage, isAdmin, checkAdminStatus } = useGovernancePermissions(
        entityId,
        entityType
    );
    const [previewDocument, setPreviewDocument] = useState<{
        url: string;
        type: 'pdf' | 'image' | 'text' | 'excel' | 'word' | 'unknown';
        title: string;
    } | null>(null);
    const [overrideDialog, setOverrideDialog] = useState<{
        isOpen: boolean;
        approvalId: string;
        approvalTitle: string;
    }>({ isOpen: false, approvalId: '', approvalTitle: '' });

    const [delegationDialog, setDelegationDialog] = useState<{
        isOpen: boolean;
        approvalId: string | null;
        approvalTitle: string;
    }>({
        isOpen: false,
        approvalId: null,
        approvalTitle: '',
    });

    // Check admin status when user changes
    React.useEffect(() => {
        if (user?.id) {
            checkAdminStatus(user.id);
        }
    }, [user?.id, checkAdminStatus]);

    // Fetch governance data with React Query
    const {
        data,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ['governance-data', entityId, entityType],
        queryFn: () => getGovernanceData(entityId, entityType),
        enabled: isOpen && !!entityId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 2,
    });

    // Approve workflow mutation
    const approveMutation = useMutation({
        mutationFn: ({ approvalId, userId, comments }: { approvalId: string; userId: string; comments?: string }) =>
            approveWorkflow(approvalId, userId, comments),
        onSuccess: () => {
            // Invalidate and refetch governance data
            queryClient.invalidateQueries({ queryKey: ['governance-data', entityId, entityType] });
        },
        onError: (error) => {
            console.error('Failed to approve:', error);
            alert('Failed to approve. Please try again.');
        },
    });

    // Reject workflow mutation
    const rejectMutation = useMutation({
        mutationFn: ({ approvalId, userId, comments }: { approvalId: string; userId: string; comments?: string }) =>
            rejectWorkflow(approvalId, userId, comments),
        onSuccess: () => {
            // Invalidate and refetch governance data
            queryClient.invalidateQueries({ queryKey: ['governance-data', entityId, entityType] });
        },
        onError: (error) => {
            console.error('Failed to reject:', error);
            alert('Failed to reject. Please try again.');
        },
    });

    // Admin override mutation
    const overrideMutation = useMutation({
        mutationFn: ({ approvalId, userId, reason }: { approvalId: string; userId: string; reason: string }) =>
            adminOverrideApproval(approvalId, userId, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['governance-data', entityId, entityType] });
            setOverrideDialog({ isOpen: false, approvalId: '', approvalTitle: '' });
            toast({
                title: 'Success',
                description: 'Workflow approved via admin override',
            });
        },
        onError: (error) => {
            console.error('Failed to override approval:', error);
            toast({
                title: 'Error',
                description: 'Failed to override approval. Please try again.',
                variant: 'destructive',
            });
        },
    });

    // Fetch user delegations
    const { data: delegations, isLoading: delegationsLoading } = useQuery({
        queryKey: ['delegations', entityId, entityType, user?.id],
        queryFn: () => getUserDelegations(user!.id, entityId, entityType),
        enabled: isOpen && !!user?.id,
        staleTime: 5 * 60 * 1000,
    });

    // Create delegation mutation
    const createDelegationMutation = useMutation({
        mutationFn: (request: DelegationRequest) =>
            createDelegation(
                user!.id,
                request.delegateId,
                entityId,
                entityType,
                request.delegationType,
                request.approvalId,
                request.reason
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['delegations'] });
            queryClient.invalidateQueries({ queryKey: ['governance-data'] });
            setDelegationDialog({ isOpen: false, approvalId: null, approvalTitle: '' });
            toast({
                title: 'Success',
                description: 'Delegation created successfully',
            });
        },
        onError: (error) => {
            console.error('Failed to create delegation:', error);
            toast({
                title: 'Error',
                description: 'Failed to create delegation. Please try again.',
                variant: 'destructive',
            });
        },
    });

    // Revoke delegation mutation
    const revokeDelegationMutation = useMutation({
        mutationFn: ({ delegationId, reason }: { delegationId: string; reason: string }) =>
            revokeDelegation(delegationId, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['delegations'] });
            queryClient.invalidateQueries({ queryKey: ['governance-data'] });
            toast({
                title: 'Success',
                description: 'Delegation revoked successfully',
            });
        },
        onError: (error) => {
            console.error('Failed to revoke delegation:', error);
            toast({
                title: 'Error',
                description: 'Failed to revoke delegation. Please try again.',
                variant: 'destructive',
            });
        },
    });

    const handleViewDocument = (policy: PolicyDocument) => {
        // Determine document type from URL extension
        const extension = policy.documentUrl.split('.').pop()?.toLowerCase() || '';
        let docType: 'pdf' | 'image' | 'text' | 'excel' | 'word' | 'unknown' = 'unknown';

        if (extension === 'pdf') docType = 'pdf';
        else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) docType = 'image';
        else if (['txt', 'md'].includes(extension)) docType = 'text';
        else if (['xlsx', 'xls'].includes(extension)) docType = 'excel';
        else if (['docx', 'doc'].includes(extension)) docType = 'word';

        setPreviewDocument({
            url: policy.documentUrl,
            type: docType,
            title: policy.title,
        });
    };

    const handleViewEvidence = (item: ChecklistItem) => {
        if (item.evidence && item.evidence.length > 0) {
            // For now, just preview the first evidence file
            const evidenceUrl = item.evidence[0];
            const extension = evidenceUrl.split('.').pop()?.toLowerCase() || '';
            let docType: 'pdf' | 'image' | 'text' | 'excel' | 'word' | 'unknown' = 'unknown';

            if (extension === 'pdf') docType = 'pdf';
            else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) docType = 'image';
            else if (['txt', 'md'].includes(extension)) docType = 'text';
            else if (['xlsx', 'xls'].includes(extension)) docType = 'excel';
            else if (['docx', 'doc'].includes(extension)) docType = 'word';

            setPreviewDocument({
                url: evidenceUrl,
                type: docType,
                title: `Evidence: ${item.requirement}`,
            });
        }
    };

    const handleClosePreview = () => {
        setPreviewDocument(null);
    };

    const handleApprove = (approvalId: string) => {
        if (!user?.id) {
            toast({
                title: 'Authentication Required',
                description: 'You must be logged in to approve workflows',
                variant: 'destructive',
            });
            return;
        }

        const approval = data?.approvals.find(a => a.id === approvalId);
        if (!approval) return;

        if (!canApproveWorkflow(approval, user.id)) {
            toast({
                title: 'Permission Denied',
                description: getPermissionMessage(approval, user.id),
                variant: 'destructive',
            });
            return;
        }

        approveMutation.mutate({ approvalId, userId: user.id });
    };

    const handleReject = (approvalId: string) => {
        if (!user?.id) {
            toast({
                title: 'Authentication Required',
                description: 'You must be logged in to reject workflows',
                variant: 'destructive',
            });
            return;
        }

        const approval = data?.approvals.find(a => a.id === approvalId);
        if (!approval) return;

        if (!canRejectWorkflow(approval, user.id)) {
            toast({
                title: 'Permission Denied',
                description: getPermissionMessage(approval, user.id),
                variant: 'destructive',
            });
            return;
        }

        rejectMutation.mutate({ approvalId, userId: user.id });
    };

    const handleAdminOverride = (approvalId: string) => {
        const approval = data?.approvals.find(a => a.id === approvalId);
        if (!approval) return;

        setOverrideDialog({
            isOpen: true,
            approvalId,
            approvalTitle: approval.title,
        });
    };

    const handleConfirmOverride = (reason: string) => {
        if (!user?.id) return;
        overrideMutation.mutate({
            approvalId: overrideDialog.approvalId,
            userId: user.id,
            reason,
        });
    };

    const handleDelegate = (approvalId: string) => {
        const approval = data?.approvals.find(a => a.id === approvalId);
        setDelegationDialog({
            isOpen: true,
            approvalId,
            approvalTitle: approval?.title || 'Approval Workflow',
        });
    };

    const handleConfirmDelegation = (request: DelegationRequest) => {
        createDelegationMutation.mutate(request);
    };

    const handleRevokeDelegation = (delegationId: string, reason: string) => {
        revokeDelegationMutation.mutate({ delegationId, reason });
    };

    const handleRetry = () => {
        refetch();
    };

    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40"
                    onClick={onClose}
                />
            )}

            {/* Slide-in Panel */}
            <div
                className={cn(
                    'fixed right-0 top-0 h-full w-full md:w-[600px] bg-background border-l shadow-lg z-50 transition-transform duration-300',
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                )}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b">
                        <div>
                            <h2 className="text-2xl font-bold">Governance</h2>
                            <p className="text-sm text-muted-foreground capitalize">
                                {entityType}: {entityId}
                            </p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Content */}
                    <ScrollArea className="flex-1">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-96">
                                <div className="text-center">
                                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                                    <div className="text-muted-foreground">Loading governance data...</div>
                                </div>
                            </div>
                        ) : error ? (
                            <div className="p-6">
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription className="ml-2">
                                        Failed to load governance data. Please try again.
                                    </AlertDescription>
                                </Alert>
                                <Button
                                    onClick={handleRetry}
                                    className="mt-4 w-full"
                                    variant="outline"
                                >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Retry
                                </Button>
                            </div>
                        ) : !data ? (
                            <div className="flex items-center justify-center h-96">
                                <div className="text-muted-foreground">No governance data available</div>
                            </div>
                        ) : (
                            <Tabs defaultValue="policies" className="p-6">
                                <TabsList className="grid w-full grid-cols-4">
                                    <TabsTrigger value="policies">
                                        <FileText className="h-4 w-4 mr-2" />
                                        Policies ({data.policies.length})
                                    </TabsTrigger>
                                    <TabsTrigger value="approvals">
                                        <GitBranch className="h-4 w-4 mr-2" />
                                        Approvals ({data.approvals.length})
                                    </TabsTrigger>
                                    <TabsTrigger value="compliance">
                                        <CheckSquare className="h-4 w-4 mr-2" />
                                        Compliance ({data.compliance.length})
                                    </TabsTrigger>
                                    <TabsTrigger value="delegations">
                                        <GitBranch className="h-4 w-4 mr-2" />
                                        Delegations
                                        {delegations && delegations.length > 0 && (
                                            <span className="ml-2 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                                                {delegations.length}
                                            </span>
                                        )}
                                    </TabsTrigger>
                                </TabsList>

                                {/* Policies Tab */}
                                <TabsContent value="policies" className="mt-4">
                                    <PolicyDocuments
                                        policies={data.policies}
                                        onViewDocument={handleViewDocument}
                                        loading={false}
                                    />
                                </TabsContent>

                                {/* Approvals Tab */}
                                <TabsContent value="approvals" className="mt-4">
                                    <ApprovalWorkflows
                                        approvals={data.approvals}
                                        onApprove={handleApprove}
                                        onReject={handleReject}
                                        currentUserId={user?.id || undefined}
                                        loading={false}
                                        canApprove={(approval) => canApproveWorkflow(approval, user?.id)}
                                        canReject={(approval) => canRejectWorkflow(approval, user?.id)}
                                    />
                                </TabsContent>

                                {/* Compliance Tab */}
                                <TabsContent value="compliance" className="mt-4">
                                    <ComplianceChecklists
                                        compliance={data.compliance}
                                        onViewEvidence={handleViewEvidence}
                                        loading={false}
                                    />
                                </TabsContent>

                                {/* Delegations Tab */}
                                <TabsContent value="delegations" className="mt-4">
                                    <DelegationList
                                        delegations={delegations || []}
                                        onRevoke={handleRevokeDelegation}
                                        loading={delegationsLoading}
                                    />
                                </TabsContent>
                            </Tabs>
                        )}
                    </ScrollArea>
                </div>
            </div>

            {/* Document Preview Modal */}
            {previewDocument && (
                <DocumentPreview
                    documentUrl={previewDocument.url}
                    documentType={previewDocument.type}
                    title={previewDocument.title}
                    isOpen={!!previewDocument}
                    onClose={handleClosePreview}
                />
            )}

            {/* Admin Override Dialog */}
            <AdminOverrideDialog
                approvalId={overrideDialog.approvalId}
                approvalTitle={overrideDialog.approvalTitle}
                isOpen={overrideDialog.isOpen}
                onClose={() => setOverrideDialog({ isOpen: false, approvalId: '', approvalTitle: '' })}
                onConfirm={handleConfirmOverride}
            />

            {/* Delegation Dialog */}
            <DelegationDialog
                approvalId={delegationDialog.approvalId}
                approvalTitle={delegationDialog.approvalTitle}
                entityId={entityId}
                entityType={entityType}
                isOpen={delegationDialog.isOpen}
                onClose={() => setDelegationDialog({ isOpen: false, approvalId: null, approvalTitle: '' })}
                onConfirm={handleConfirmDelegation}
                availableUsers={[]} // TODO: Fetch from API or pass as prop
            />
        </>
    );
}
