import { useState, useCallback, useRef } from 'react';

interface ConfirmOptions {
    title?: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'destructive' | 'default';
}

interface ConfirmState extends ConfirmOptions {
    open: boolean;
    resolve: ((value: boolean) => void) | null;
}

/**
 * useConfirmDialog — replaces window.confirm() with a proper async dialog.
 *
 * @example
 * const { confirm, ConfirmDialog } = useConfirmDialog();
 *
 * const handleDelete = async () => {
 *   const ok = await confirm({ description: 'Delete this item?' });
 *   if (!ok) return;
 *   // proceed
 * };
 *
 * return (
 *   <>
 *     <ConfirmDialog />
 *     <button onClick={handleDelete}>Delete</button>
 *   </>
 * );
 */
export function useConfirmDialog() {
    const [state, setState] = useState<ConfirmState>({
        open: false,
        title: 'Are you sure?',
        description: '',
        confirmLabel: 'Continue',
        cancelLabel: 'Cancel',
        variant: 'destructive',
        resolve: null,
    });

    const resolveRef = useRef<((value: boolean) => void) | null>(null);

    const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            resolveRef.current = resolve;
            setState({
                open: true,
                title: options.title ?? 'Are you sure?',
                description: options.description,
                confirmLabel: options.confirmLabel ?? 'Continue',
                cancelLabel: options.cancelLabel ?? 'Cancel',
                variant: options.variant ?? 'destructive',
                resolve,
            });
        });
    }, []);

    const handleConfirm = useCallback(() => {
        resolveRef.current?.(true);
        setState((prev) => ({ ...prev, open: false, resolve: null }));
    }, []);

    const handleCancel = useCallback(() => {
        resolveRef.current?.(false);
        setState((prev) => ({ ...prev, open: false, resolve: null }));
    }, []);

    return {
        confirm,
        confirmState: state,
        handleConfirm,
        handleCancel,
    };
}
