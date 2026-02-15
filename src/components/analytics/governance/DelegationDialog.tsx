import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, UserPlus } from 'lucide-react';
import type { DelegationRequest } from '@/types/analytics';

interface DelegationDialogProps {
    approvalId: string | null;
    approvalTitle: string;
    entityId: string;
    entityType: 'project' | 'portfolio' | 'program' | 'workspace';
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (delegation: DelegationRequest) => void;
    availableUsers?: Array<{ id: string; name: string; email: string }>;
}

export function DelegationDialog({
    approvalId,
    approvalTitle,
    entityId,
    entityType,
    isOpen,
    onClose,
    onConfirm,
    availableUsers = [],
}: DelegationDialogProps) {
    const [delegateId, setDelegateId] = useState<string>('');
    const [delegationType, setDelegationType] = useState<'temporary' | 'permanent'>('temporary');
    const [reason, setReason] = useState('');

    const handleConfirm = () => {
        if (!delegateId || !reason.trim()) {
            return;
        }

        onConfirm({
            delegateId,
            delegationType,
            approvalId: delegationType === 'temporary' ? approvalId : null,
            reason: reason.trim(),
        });

        // Reset form
        setDelegateId('');
        setDelegationType('temporary');
        setReason('');
    };

    const handleClose = () => {
        setDelegateId('');
        setDelegationType('temporary');
        setReason('');
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Delegate Approval Task
                    </DialogTitle>
                    <DialogDescription>
                        {approvalTitle && (
                            <span className="block mt-1 font-medium text-foreground">
                                {approvalTitle}
                            </span>
                        )}
                        Delegate this approval task to another user who will act on your behalf.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Warning Alert */}
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            The delegate will have full authority to approve or reject on your behalf.
                            This action will be logged in the audit trail.
                        </AlertDescription>
                    </Alert>

                    {/* Delegate Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="delegate">Delegate To *</Label>
                        <Select value={delegateId} onValueChange={setDelegateId}>
                            <SelectTrigger id="delegate">
                                <SelectValue placeholder="Select a user..." />
                            </SelectTrigger>
                            <SelectContent>
                                {availableUsers.map((user) => (
                                    <SelectItem key={user.id} value={user.id}>
                                        {user.name} ({user.email})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Delegation Type */}
                    <div className="space-y-2">
                        <Label htmlFor="type">Delegation Type *</Label>
                        <Select
                            value={delegationType}
                            onValueChange={(value) => setDelegationType(value as 'temporary' | 'permanent')}
                        >
                            <SelectTrigger id="type">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="temporary">
                                    Temporary - This approval only
                                </SelectItem>
                                <SelectItem value="permanent">
                                    Permanent - All future approvals
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            {delegationType === 'temporary'
                                ? 'Delegate only this specific approval task'
                                : 'Delegate all future approval tasks in this ' + entityType}
                        </p>
                    </div>

                    {/* Reason */}
                    <div className="space-y-2">
                        <Label htmlFor="reason">Reason for Delegation *</Label>
                        <Textarea
                            id="reason"
                            placeholder="Explain why you are delegating this approval..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                            className="resize-none"
                        />
                        <p className="text-xs text-muted-foreground">
                            This reason will be recorded in the audit trail
                        </p>
                    </div>

                    {/* Preview */}
                    {delegateId && reason && (
                        <div className="rounded-lg bg-muted p-3 text-sm">
                            <p className="font-medium mb-1">Delegation Summary:</p>
                            <ul className="space-y-1 text-muted-foreground">
                                <li>
                                    • <strong>Delegate:</strong>{' '}
                                    {availableUsers.find((u) => u.id === delegateId)?.name}
                                </li>
                                <li>
                                    • <strong>Type:</strong> {delegationType}
                                </li>
                                <li>
                                    • <strong>Scope:</strong>{' '}
                                    {delegationType === 'temporary'
                                        ? 'Single approval'
                                        : `All ${entityType} approvals`}
                                </li>
                            </ul>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!delegateId || !reason.trim()}
                    >
                        Confirm Delegation
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
