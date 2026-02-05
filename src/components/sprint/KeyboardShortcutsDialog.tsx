import React from 'react';
import { Keyboard } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface KeyboardShortcutsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
    const shortcuts = [
        { key: 'N', description: 'Create new item' },
        { key: 'F', description: 'Open filters' },
        { key: '/', description: 'Focus search' },
        { key: '←/→', description: 'Move item between columns' },
        { key: '↑/↓', description: 'Navigate items' },
        { key: 'Enter', description: 'Open item details' },
        { key: 'Esc', description: 'Clear selection' },
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Keyboard className="h-5 w-5" />
                        Keyboard Shortcuts
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-2 py-4">
                    {shortcuts.map(({ key, description }) => (
                        <div key={key} className="flex items-center justify-between py-2 border-b last:border-0">
                            <span className="text-sm text-muted-foreground">{description}</span>
                            <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded border">{key}</kbd>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
