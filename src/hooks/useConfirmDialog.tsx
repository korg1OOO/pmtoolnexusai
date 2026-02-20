/**
 * useConfirmDialog
 *
 * A shared, reusable confirmation dialog hook backed by Shadcn AlertDialog.
 * Replaces all native browser `confirm()` calls throughout the codebase.
 *
 * Usage:
 *   const { ConfirmDialog, confirm } = useConfirmDialog();
 *
 *   // In JSX:
 *   <ConfirmDialog />
 *
 *   // In handlers:
 *   const ok = await confirm('Delete this item?', {
 *     title: 'Delete Item',
 *     confirmLabel: 'Delete',
 *     variant: 'destructive',
 *   });
 *   if (ok) { ... }
 */

import React, { useState, useCallback, useRef } from 'react';
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

interface ConfirmOptions {
    title?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'default' | 'destructive';
}

interface DialogState {
    open: boolean;
    message: string;
    options: ConfirmOptions;
}

export function useConfirmDialog() {
    const [state, setState] = useState<DialogState>({
        open: false,
        message: '',
        options: {},
    });

    // Holds the resolve function for the pending promise
    const resolveRef = useRef<((value: boolean) => void) | null>(null);

    const confirm = useCallback(
        (message: string, options: ConfirmOptions = {}): Promise<boolean> => {
            return new Promise<boolean>((resolve) => {
                resolveRef.current = resolve;
                setState({ open: true, message, options });
            });
        },
        []
    );

    const handleConfirm = useCallback(() => {
        setState((s) => ({ ...s, open: false }));
        resolveRef.current?.(true);
        resolveRef.current = null;
    }, []);

    const handleCancel = useCallback(() => {
        setState((s) => ({ ...s, open: false }));
        resolveRef.current?.(false);
        resolveRef.current = null;
    }, []);

    const ConfirmDialog = useCallback(() => {
        const { title, confirmLabel, cancelLabel, variant } = state.options;
        return (
            <AlertDialog open={state.open} onOpenChange={(open) => !open && handleCancel()}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{title ?? 'Are you sure?'}</AlertDialogTitle>
                        <AlertDialogDescription>{state.message}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleCancel}>
                            {cancelLabel ?? 'Cancel'}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirm}
                            className={
                                variant === 'destructive'
                                    ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                                    : undefined
                            }
                        >
                            {confirmLabel ?? 'Continue'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        );
    }, [state, handleConfirm, handleCancel]);

    return { confirm, ConfirmDialog };
}
