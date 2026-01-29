import React from 'react';
import { Lock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PresenceUser } from '@/hooks/usePresence';
import { cn } from '@/lib/utils';

interface TaskLockIndicatorProps {
  taskId: string;
  users: PresenceUser[];
  currentUserId?: string;
  className?: string;
}

export function TaskLockIndicator({ 
  taskId, 
  users, 
  currentUserId,
  className 
}: TaskLockIndicatorProps) {
  // Find users editing this specific task
  const editingUsers = users.filter(
    (u) => u.isEditing && u.editingTaskId === taskId && u.id !== currentUserId
  );

  if (editingUsers.length === 0) return null;

  const editor = editingUsers[0];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs',
            'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
            'border border-amber-200 dark:border-amber-800',
            className
          )}
        >
          <Lock className="h-3 w-3" />
          <span className="truncate max-w-[80px]">{editor.displayName}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p><strong>{editor.displayName}</strong> is currently editing this task</p>
        <p className="text-xs text-muted-foreground mt-1">
          Wait for them to finish or coordinate
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

// Hook to check if a task is locked by another user
export function useTaskLock(
  taskId: string,
  users: PresenceUser[],
  currentUserId?: string
): { isLocked: boolean; lockedBy: PresenceUser | null } {
  const lockedBy = users.find(
    (u) => u.isEditing && u.editingTaskId === taskId && u.id !== currentUserId
  );

  return {
    isLocked: !!lockedBy,
    lockedBy: lockedBy || null,
  };
}
