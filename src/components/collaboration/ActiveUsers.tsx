/**
 * ActiveUsers Component
 * Display list of active users on the dashboard
 */

import React from 'react';
import { Users } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { usePresence } from '@/hooks/usePresence';
import { useProject } from '@/contexts/ProjectContext';

interface ActiveUsersProps {
    className?: string;
    maxDisplay?: number;
}

export function ActiveUsers({ className, maxDisplay = 5 }: ActiveUsersProps) {
    const { currentProject } = useProject();
    const { users } = usePresence(currentProject?.id || null);

    if (users.length === 0) {
        return null;
    }

    const displayedUsers = users.slice(0, maxDisplay);
    const remainingCount = users.length - maxDisplay;

    return (
        <div className={cn('flex items-center gap-2', className)}>
            <TooltipProvider>
                <div className="flex items-center">
                    <Users className="h-4 w-4 text-muted-foreground mr-2" />
                    <span className="text-sm text-muted-foreground mr-2">
                        {users.length} {users.length === 1 ? 'user' : 'users'} viewing
                    </span>
                </div>

                <div className="flex -space-x-2">
                    {displayedUsers.map((user) => (
                        <Tooltip key={user.id}>
                            <TooltipTrigger asChild>
                                <Avatar
                                    className={cn(
                                        'h-8 w-8 border-2 border-background cursor-pointer',
                                        user.isEditing && 'ring-2 ring-primary ring-offset-2'
                                    )}
                                    style={{ backgroundColor: user.color }}
                                >
                                    <AvatarFallback
                                        className="text-white text-xs font-medium"
                                        style={{ backgroundColor: user.color }}
                                    >
                                        {user.initials}
                                    </AvatarFallback>
                                </Avatar>
                            </TooltipTrigger>
                            <TooltipContent>
                                <div className="space-y-1">
                                    <p className="font-medium">{user.displayName}</p>
                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                    {user.isEditing && user.editingTaskId && (
                                        <Badge variant="secondary" className="text-xs">
                                            Editing task
                                        </Badge>
                                    )}
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    ))}

                    {remainingCount > 0 && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Avatar className="h-8 w-8 border-2 border-background cursor-pointer bg-muted">
                                    <AvatarFallback className="text-xs font-medium">
                                        +{remainingCount}
                                    </AvatarFallback>
                                </Avatar>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{remainingCount} more {remainingCount === 1 ? 'user' : 'users'}</p>
                            </TooltipContent>
                        </Tooltip>
                    )}
                </div>
            </TooltipProvider>
        </div>
    );
}
