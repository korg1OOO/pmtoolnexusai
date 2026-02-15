import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { UserMinus, Calendar, FileText, AlertCircle } from 'lucide-react';
import type { Delegation } from '@/types/analytics';

interface DelegationListProps {
    delegations: Delegation[];
    onRevoke: (delegationId: string, reason: string) => void;
    loading?: boolean;
}

export function DelegationList({ delegations, onRevoke, loading = false }: DelegationListProps) {
    const [revokeDialog, setRevokeDialog] = useState<{
        isOpen: boolean;
        delegationId: string;
        delegateName: string;
    }>({
        isOpen: false,
        delegationId: '',
        delegateName: '',
    });
    const [revokeReason, setRevokeReason] = useState('');

    const handleRevokeClick = (delegation: Delegation) => {
        setRevokeDialog({
            isOpen: true,
            delegationId: delegation.id,
            delegateName: delegation.delegateName || 'Unknown User',
        });
    };

    const handleConfirmRevoke = () => {
        if (!revokeReason.trim()) return;

        onRevoke(revokeDialog.delegationId, revokeReason.trim());
        setRevokeDialog({ isOpen: false, delegationId: '', delegateName: '' });
        setRevokeReason('');
    };

    const handleCloseDialog = () => {
        setRevokeDialog({ isOpen: false, delegationId: '', delegateName: '' });
        setRevokeReason('');
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Loading delegations...</div>
            </div>
        );
    }

    if (delegations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-3" />
                <h3 className="text-lg font-medium">No Active Delegations</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    You haven't delegated any approval tasks yet.
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-3">
                {delegations.map((delegation) => (
                    <Card key={delegation.id} className="p-4">
                        <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-2">
                                {/* Header */}
                                <div className="flex items-center gap-2">
                                    <h4 className="font-medium">
                                        {delegation.delegateName || 'Unknown User'}
                                    </h4>
                                    <Badge
                                        variant={
                                            delegation.delegationType === 'permanent'
                                                ? 'default'
                                                : 'secondary'
                                        }
                                    >
                                        {delegation.delegationType}
                                    </Badge>
                                    {delegation.status === 'active' && (
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                            Active
                                        </Badge>
                                    )}
                                </div>

                                {/* Reason */}
                                <div className="flex items-start gap-2 text-sm">
                                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <p className="text-muted-foreground">{delegation.reason}</p>
                                </div>

                                {/* Metadata */}
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        <span>Created: {formatDate(delegation.createdAt)}</span>
                                    </div>
                                    {delegation.delegationType === 'temporary' && delegation.approvalId && (
                                        <div className="flex items-center gap-1">
                                            <span>• Approval ID: {delegation.approvalId.slice(0, 8)}...</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            {delegation.status === 'active' && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="ml-4 text-destructive hover:text-destructive"
                                    onClick={() => handleRevokeClick(delegation)}
                                >
                                    <UserMinus className="h-4 w-4 mr-1" />
                                    Revoke
                                </Button>
                            )}
                        </div>
                    </Card>
                ))}
            </div>

            {/* Revoke Confirmation Dialog */}
            <Dialog open={revokeDialog.isOpen} onOpenChange={handleCloseDialog}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle>Revoke Delegation</DialogTitle>
                        <DialogDescription>
                            You are about to revoke the delegation to{' '}
                            <strong>{revokeDialog.delegateName}</strong>. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2 py-4">
                        <Label htmlFor="revoke-reason">Reason for Revocation *</Label>
                        <Textarea
                            id="revoke-reason"
                            placeholder="Explain why you are revoking this delegation..."
                            value={revokeReason}
                            onChange={(e) => setRevokeReason(e.target.value)}
                            rows={3}
                            className="resize-none"
                        />
                        <p className="text-xs text-muted-foreground">
                            This reason will be recorded in the audit trail
                        </p>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={handleCloseDialog}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmRevoke}
                            disabled={!revokeReason.trim()}
                        >
                            Revoke Delegation
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
