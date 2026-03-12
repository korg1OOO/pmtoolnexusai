import React from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
    open: boolean;
    title?: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'destructive' | 'default';
    onConfirm: () => void;
    onCancel: () => void;
}

/**
 * ConfirmDialog — a proper modal replacement for window.confirm().
 * Pair it with useConfirmDialog() for async usage.
 *
 * @example
 * const { confirm, confirmState, handleConfirm, handleCancel } = useConfirmDialog();
 * return (
 *   <>
 *     <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />
 *     <button onClick={() => confirm({ description: 'Delete this item?' }).then(ok => ok && doDelete())}>
 *       Delete
 *     </button>
 *   </>
 * );
 */
export function ConfirmDialog({
    open,
    title = 'Are you sure?',
    description,
    confirmLabel = 'Continue',
    cancelLabel = 'Cancel',
    variant = 'destructive',
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={(v) => !v && onCancel()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onCancel}>{cancelLabel}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className={cn(
                            variant === 'destructive' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                        )}
                    >
                        {confirmLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
