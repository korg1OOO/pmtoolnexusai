import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface EntityFormDialogProps {
    /** Whether the dialog is open */
    open: boolean;
    /** Callback for when the open state changes */
    onOpenChange: (open: boolean) => void;
    /** Title of the dialog */
    title: string;
    /** Optional description */
    description?: string;
    /** The content of the form */
    children: React.ReactNode;
    /** Submit handler */
    onSubmit: (e: React.FormEvent) => void | Promise<void>;
    /** Whether the form is currently submitting */
    loading?: boolean;
    /** The text for the submit button */
    submitLabel?: string;
    /** The text for the cancel button */
    cancelLabel?: string;
    /** Width class for the dialog */
    className?: string;
}

/**
 * A reusable dialog container for entity forms.
 * Handles the dialog wrapper, header, form element, and standard footer (Cancel / Submit buttons).
 */
export function EntityFormDialog({
    open,
    onOpenChange,
    title,
    description,
    children,
    onSubmit,
    loading = false,
    submitLabel = 'Save',
    cancelLabel = 'Cancel',
    className = 'max-w-lg',
}: EntityFormDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={className}>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && <DialogDescription>{description}</DialogDescription>}
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4">
                    {children}
                    <DialogFooter className="pt-4 border-t mt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            {cancelLabel}
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {submitLabel}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
