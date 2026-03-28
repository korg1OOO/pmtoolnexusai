import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface StandardEntityCardProps {
    /** The main title of the entity */
    title: string;
    /** Subtitle or identifier (e.g. ID, key) */
    subtitle?: string;
    /** Primary icon for the entity */
    icon?: LucideIcon;
    /** Optional background class for the icon container */
    iconBgClass?: string;
    /** Optional text color class for the icon */
    iconColorClass?: string;
    /** Whether the card is currently selected */
    isSelected?: boolean;
    /** Click handler for the card */
    onClick?: () => void;
    /** Badges to display next to the subtitle */
    badges?: React.ReactNode;
    /** Metadata to display below the title (e.g. assignee, date) */
    metadata?: React.ReactNode;
    /** Optional bottom content (e.g. progress bar, SLA warning) */
    footer?: React.ReactNode;
    /** Actions available in the dropdown menu */
    actions?: {
        label: string;
        onClick: () => void;
        destructive?: boolean;
    }[];
    /** Optional class name */
    className?: string;
}

/**
 * A reusable entity card for list views.
 */
export function StandardEntityCard({
    title,
    subtitle,
    icon: Icon,
    iconBgClass = 'bg-muted',
    iconColorClass = 'text-muted-foreground',
    isSelected = false,
    onClick,
    badges,
    metadata,
    footer,
    actions,
    className,
}: StandardEntityCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={onClick ? { scale: 1.01 } : {}}
            whileTap={onClick ? { scale: 0.99 } : {}}
            onClick={onClick}
            className={cn(
                'p-4 rounded-lg border transition-all group relative',
                onClick && 'cursor-pointer',
                isSelected ? 'bg-primary/10 border-primary' : 'bg-card hover:bg-muted/50',
                className
            )}
        >
            <div className="flex items-start gap-3">
                {Icon && (
                    <div className={cn(
                        'h-10 w-10 flex shrink-0 items-center justify-center rounded-lg',
                        iconBgClass
                    )}>
                        <Icon className={cn('h-5 w-5', iconColorClass)} />
                    </div>
                )}

                <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-2 mb-1">
                        {subtitle && (
                            <span className="text-xs font-mono text-muted-foreground">
                                {subtitle}
                            </span>
                        )}
                        {badges && (
                            <div className="flex items-center gap-2">
                                {badges}
                            </div>
                        )}
                    </div>

                    <h3 className="font-medium text-sm line-clamp-1 mb-1">{title}</h3>

                    {metadata && (
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                            {metadata}
                        </div>
                    )}

                    {footer && (
                        <div className="mt-3">
                            {footer}
                        </div>
                    )}
                </div>
            </div>

            {actions && actions.length > 0 && (
                <div className="absolute top-4 right-4" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="iconXs" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {actions.map((action, i) => React.Fragment && (
                                <DropdownMenuItem
                                    key={i}
                                    className={action.destructive ? 'text-destructive' : ''}
                                    onClick={action.onClick}
                                >
                                    {action.label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}
        </motion.div>
    );
}
