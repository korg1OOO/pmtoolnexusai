import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Users, Edit3 } from 'lucide-react';
import type { PresenceUser } from '@/hooks/usePresence';

interface PresenceIndicatorProps {
  users: PresenceUser[];
  maxVisible?: number;
  className?: string;
}

export function PresenceIndicator({ users, maxVisible = 4, className }: PresenceIndicatorProps) {
  if (users.length === 0) {
    return null;
  }

  const visibleUsers = users.slice(0, maxVisible);
  const remainingCount = Math.max(0, users.length - maxVisible);
  const editingUsers = users.filter(u => u.isEditing);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Presence avatars */}
      <div className="flex items-center -space-x-2">
        {visibleUsers.map((user) => (
          <Tooltip key={user.id}>
            <TooltipTrigger asChild>
              <div className="relative">
                <Avatar 
                  className={cn(
                    'h-7 w-7 border-2 border-background ring-2 ring-transparent transition-all hover:ring-primary/20 cursor-pointer',
                    user.isEditing && 'ring-2 ring-warning'
                  )}
                  style={{ 
                    backgroundColor: user.color,
                  }}
                >
                  <AvatarFallback 
                    className="text-[10px] font-medium text-white"
                    style={{ backgroundColor: user.color }}
                  >
                    {user.initials}
                  </AvatarFallback>
                </Avatar>
                {/* Online indicator */}
                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-success border border-background" />
                {/* Editing indicator */}
                {user.isEditing && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-warning flex items-center justify-center">
                    <Edit3 className="h-2 w-2 text-warning-foreground" />
                  </span>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              <div className="flex flex-col gap-1">
                <span className="font-medium">{user.displayName}</span>
                <span className="text-muted-foreground">{user.email}</span>
                {user.isEditing && (
                  <Badge variant="outline" className="text-[10px] w-fit">
                    <Edit3 className="h-2 w-2 mr-1" />
                    Editing
                  </Badge>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
        
        {/* Overflow indicator */}
        {remainingCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className="h-7 w-7 border-2 border-background bg-muted cursor-pointer">
                <AvatarFallback className="text-[10px] font-medium text-muted-foreground bg-muted">
                  +{remainingCount}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              <div className="flex flex-col gap-1">
                {users.slice(maxVisible).map((user) => (
                  <div key={user.id} className="flex items-center gap-2">
                    <span 
                      className="h-2 w-2 rounded-full" 
                      style={{ backgroundColor: user.color }} 
                    />
                    <span>{user.displayName}</span>
                    {user.isEditing && (
                      <Edit3 className="h-2 w-2 text-warning" />
                    )}
                  </div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Summary badge */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="secondary" 
            className="h-6 gap-1 text-[10px] font-medium cursor-default"
          >
            <Users className="h-3 w-3" />
            {users.length} online
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="text-xs">
            {editingUsers.length > 0 ? (
              <span>{editingUsers.length} user{editingUsers.length > 1 ? 's' : ''} editing</span>
            ) : (
              <span>All users viewing</span>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
