import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type StandardStatus =
    | 'open' | 'active' | 'in-progress' | 'pending' | 'new'
    | 'closed' | 'resolved' | 'completed' | 'done' | 'approved'
    | 'blocked' | 'rejected' | 'failed' | 'cancelled' | 'critical'
    | 'on-hold' | 'investigating' | 'review' | 'warning' | 'major'
    | 'moderate' | 'minor' | 'low' | 'medium' | 'high'
    | string;

interface StatusBadgeProps {
    status: StandardStatus;
    className?: string;
    variant?: 'default' | 'outline' | 'secondary' | 'ghost'; // override if needed
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const normalizedStatus = status.toLowerCase();
    let colorVariant: "default" | "secondary" | "destructive" | "outline" | "info" | "warning" | "success" = 'default';

    // Map common statuses to standard app colors
    switch (normalizedStatus) {
        // Success / Completed
        case 'closed':
        case 'resolved':
        case 'completed':
        case 'done':
        case 'approved':
        case 'success':
            colorVariant = 'success';
            break;

        // Warning / Attention
        case 'in-progress':
        case 'warning':
        case 'major':
        case 'high':
        case 'on-hold':
            colorVariant = 'warning';
            break;

        // Destructive / Blocked
        case 'blocked':
        case 'rejected':
        case 'failed':
        case 'cancelled':
        case 'critical':
        case 'destructive':
            colorVariant = 'destructive';
            break;

        // Info / Neutral
        case 'investigating':
        case 'review':
        case 'moderate':
        case 'medium':
        case 'info':
            colorVariant = 'info';
            break;

        // Secondary / Default
        case 'open':
        case 'active':
        case 'pending':
        case 'new':
        case 'minor':
        case 'low':
            colorVariant = 'secondary';
            break;

        default:
            colorVariant = 'outline';
            break;
    }

    return (
        <Badge variant={colorVariant} className={cn("capitalize whitespace-nowrap", className)}>
            {status.replace(/-/g, ' ')}
        </Badge>
    );
}
