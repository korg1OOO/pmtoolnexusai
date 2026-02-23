import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface SidePanelProps {
    /** The title displayed in the panel header */
    title: React.ReactNode;
    /** Optional icon to display next to the title */
    icon?: LucideIcon;
    /** Close handler */
    onClose: () => void;
    /** Width of the panel. Defaults to 480px. */
    width?: number | string;
    /** Optional class name for the wrapper */
    className?: string;
    /** The content of the panel */
    children: React.ReactNode;
    /** Render content un-scrolled (consumer adds their own ScrollArea) or padded. Defaults to rendering a default padded ScrollArea */
    noScroll?: boolean;
}

/**
 * A reusable side panel for detail views.
 * Must be rendered inside an <AnimatePresence> tag conditionally.
 */
export function SidePanel({
    title,
    icon: Icon,
    onClose,
    width = 480,
    className,
    children,
    noScroll = false,
}: SidePanelProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            style={{ width }}
            className={cn(
                "border-l bg-card flex flex-col h-full z-10 shadow-lg shrink-0",
                className
            )}
        >
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2 max-w-[80%]">
                    {Icon && <Icon className="h-5 w-5 text-muted-foreground shrink-0" />}
                    {typeof title === 'string' ? (
                        <span className="font-mono text-sm truncate">{title}</span>
                    ) : (
                        title
                    )}
                </div>
                <Button variant="ghost" size="iconSm" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {noScroll ? (
                children
            ) : (
                <ScrollArea className="flex-1">
                    <div className="p-4 space-y-6">
                        {children}
                    </div>
                </ScrollArea>
            )}
        </motion.div>
    );
}
