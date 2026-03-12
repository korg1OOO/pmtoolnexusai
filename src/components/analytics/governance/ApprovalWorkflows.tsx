import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Search, GitBranch, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ApprovalWorkflow } from '@/types/analytics';

interface ApprovalWorkflowsProps {
    approvals: ApprovalWorkflow[];
    currentUserId?: string;
    onApprove?: (approvalId: string) => void;
    onReject?: (approvalId: string) => void;
    onAdminOverride?: (approvalId: string) => void;
    loading?: boolean;
    canApprove?: (approval: ApprovalWorkflow) => boolean;
    canReject?: (approval: ApprovalWorkflow) => boolean;
    isAdmin?: boolean;
}

export function ApprovalWorkflows({
    approvals,
    currentUserId,
    onApprove,
    onReject,
    onAdminOverride,
    loading = false,
    canApprove,
    canReject,
    isAdmin = false,
}: ApprovalWorkflowsProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [expandedApprovals, setExpandedApprovals] = useState<Set<string>>(new Set());

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        }).format(date);
    };

    const getStatusBadge = (status: string) => {
        const config = {
            pending: { variant: 'default' as const, label: 'Pending' },
            approved: { variant: 'default' as const, label: 'Approved', color: 'text-green-600' },
            rejected: { variant: 'destructive' as const, label: 'Rejected' },
            escalated: { variant: 'destructive' as const, label: 'Escalated' },
        };
        return config[status as keyof typeof config] || config.pending;
    };

    const toggleExpanded = (approvalId: string) => {
        const newExpanded = new Set(expandedApprovals);
        if (newExpanded.has(approvalId)) {
            newExpanded.delete(approvalId);
        } else {
            newExpanded.add(approvalId);
        }
        setExpandedApprovals(newExpanded);
    };

    // Get unique approval types
    const approvalTypes = useMemo(() => {
        const types = new Set(approvals.map((a) => a.type));
        return Array.from(types);
    }, [approvals]);

    // Filter approvals
    const filteredApprovals = useMemo(() => {
        return approvals.filter((approval) => {
            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesSearch =
                    approval.title.toLowerCase().includes(query) ||
                    approval.type.toLowerCase().includes(query) ||
                    approval.submittedBy.toLowerCase().includes(query);
                if (!matchesSearch) return false;
            }

            // Status filter
            if (statusFilter !== 'all' && approval.status !== statusFilter) {
                return false;
            }

            // Type filter
            if (typeFilter !== 'all' && approval.type !== typeFilter) {
                return false;
            }

            return true;
        });
    }, [approvals, searchQuery, statusFilter, typeFilter]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Loading approvals...</div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Search and Filters */}
            <div className="space-y-3">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search approvals by title, type, or submitter..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="escalated">Escalated</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            {approvalTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                    {type}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Results count */}
            <div className="text-sm text-muted-foreground">
                Showing {filteredApprovals.length} of {approvals.length} approvals
            </div>

            {/* Approval List */}
            {filteredApprovals.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                    <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No approvals found</p>
                    <p className="text-sm text-muted-foreground">
                        Try adjusting your search or filters
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredApprovals.map((approval) => {
                        const statusConfig = getStatusBadge(approval.status);
                        const isExpanded = expandedApprovals.has(approval.id);
                        const isPendingForUser =
                            currentUserId &&
                            approval.status === 'pending' &&
                            approval.approvalChain.some(
                                (a) => a.userId === currentUserId && a.status === 'pending'
                            );

                        return (
                            <Card key={approval.id} className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h3 className="font-semibold">{approval.title}</h3>
                                        <p className="text-sm text-muted-foreground">{approval.type}</p>
                                    </div>
                                    <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                                </div>

                                {/* Approval Chain Preview */}
                                <div className="space-y-2 mb-3">
                                    {approval.approvalChain.slice(0, isExpanded ? undefined : 2).map((approver) => (
                                        <div
                                            key={approver.userId}
                                            className="flex items-center justify-between p-2 bg-muted/50 rounded"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className={cn(
                                                        'h-2 w-2 rounded-full',
                                                        approver.status === 'approved'
                                                            ? 'bg-green-600'
                                                            : approver.status === 'rejected'
                                                                ? 'bg-red-600'
                                                                : 'bg-gray-400'
                                                    )}
                                                />
                                                <div>
                                                    <p className="text-sm font-medium">{approver.name}</p>
                                                    <p className="text-xs text-muted-foreground">{approver.role}</p>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="text-xs capitalize">
                                                {approver.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>

                                {/* Expand/Collapse Button */}
                                {approval.approvalChain.length > 2 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full mb-3"
                                        onClick={() => toggleExpanded(approval.id)}
                                    >
                                        {isExpanded ? (
                                            <>
                                                Show Less <ChevronUp className="h-4 w-4 ml-2" />
                                            </>
                                        ) : (
                                            <>
                                                Show All ({approval.approvalChain.length} approvers){' '}
                                                <ChevronDown className="h-4 w-4 ml-2" />
                                            </>
                                        )}
                                    </Button>
                                )}

                                {/* Metadata */}
                                <div className="text-xs text-muted-foreground border-t pt-3">
                                    Submitted: {formatDate(approval.submittedDate)} by {approval.submittedBy}
                                    {approval.completedDate && (
                                        <> • Completed: {formatDate(approval.completedDate)}</>
                                    )}
                                </div>

                                {/* Action Buttons (with permission checks) */}
                                {onApprove && onReject && (
                                    <div className="mt-3">
                                        {canApprove && canReject ? (
                                            // Use permission functions if provided
                                            canApprove(approval) || canReject(approval) ? (
                                                <div className="flex gap-2">
                                                    {canApprove(approval) && (
                                                        <Button
                                                            variant="default"
                                                            size="sm"
                                                            className="flex-1"
                                                            onClick={() => onApprove(approval.id)}
                                                        >
                                                            Approve
                                                        </Button>
                                                    )}
                                                    {canReject(approval) && (
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            className="flex-1"
                                                            onClick={() => onReject(approval.id)}
                                                        >
                                                            Reject
                                                        </Button>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground text-center py-2">
                                                    You are not authorized to act on this workflow
                                                </p>
                                            )
                                        ) : (
                                            // Fallback to old logic if permission functions not provided
                                            isPendingForUser && (
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="default"
                                                        size="sm"
                                                        className="flex-1"
                                                        onClick={() => onApprove(approval.id)}
                                                    >
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        className="flex-1"
                                                        onClick={() => onReject(approval.id)}
                                                    >
                                                        Reject
                                                    </Button>
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
