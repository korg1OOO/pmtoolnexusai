import { useState } from 'react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface AdminOverrideDialogProps {
    approvalId: string;
    approvalTitle: string;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
}

/**
 * Dialog for admin to override normal approval process
 * Requires a reason to be provided for audit trail
 */
export function AdminOverrideDialog({
    approvalId,
    approvalTitle,
    isOpen,
    onClose,
    onConfirm,
}: AdminOverrideDialogProps) {
    const [reason, setReason] = useState('');

    const handleConfirm = () => {
        if (reason.trim()) {
            onConfirm(reason);
            setReason(''); // Reset for next use
        }
    };

    const handleClose = () => {
        setReason(''); // Reset on close
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Admin Override Approval</DialogTitle>
                    <DialogDescription>
                        You are about to override the normal approval process
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            <strong>Warning:</strong> This action will bypass the approval chain and
                            immediately approve the workflow. This action will be logged for audit purposes.
                        </AlertDescription>
                    </Alert>

                    <div>
                        <p className="text-sm font-medium mb-2">Workflow:</p>
                        <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                            {approvalTitle}
                        </p>
                    </div>

                    <div>
                        <label htmlFor="override-reason" className="text-sm font-medium">
                            Reason for Override <span className="text-destructive">*</span>
                        </label>
                        <Textarea
                            id="override-reason"
                            placeholder="Please provide a detailed reason for this administrative override..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={4}
                            className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            This reason will be permanently recorded in the audit log
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={!reason.trim()}
                    >
                        Override and Approve
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
