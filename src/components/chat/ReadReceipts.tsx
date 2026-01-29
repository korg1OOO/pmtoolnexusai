import React from 'react';
import { Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface ReadReceipt {
  userId: string;
  userEmail: string;
  readAt: string;
}

interface ReadReceiptsProps {
  receipts: ReadReceipt[];
  isOwnMessage: boolean;
  className?: string;
}

function getInitials(email: string): string {
  const name = email.split('@')[0];
  const parts = name.split(/[._-]/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function ReadReceipts({ receipts, isOwnMessage, className }: ReadReceiptsProps) {
  if (!isOwnMessage) return null;
  
  const hasReaders = receipts.length > 0;
  
  return (
    <div className={cn("flex items-center gap-0.5 mt-0.5", className)}>
      {hasReaders ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center">
              <CheckCheck className="h-3 w-3 text-primary" />
              {receipts.length <= 3 ? (
                <div className="flex -space-x-1 ml-1">
                  {receipts.map((receipt) => (
                    <Avatar key={receipt.userId} className="h-3.5 w-3.5 border border-background">
                      <AvatarFallback className="text-[6px] bg-muted">
                        {getInitials(receipt.userEmail)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              ) : (
                <span className="text-[10px] text-muted-foreground ml-1">
                  {receipts.length}
                </span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="left" className="text-xs">
            <p className="font-medium mb-1">Seen by:</p>
            <ul className="space-y-0.5">
              {receipts.map((receipt) => (
                <li key={receipt.userId} className="text-muted-foreground">
                  {receipt.userEmail.split('@')[0]}
                </li>
              ))}
            </ul>
          </TooltipContent>
        </Tooltip>
      ) : (
        <Tooltip>
          <TooltipTrigger>
            <Check className="h-3 w-3 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent side="left" className="text-xs">
            Sent
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

// Hook to manage read receipts
export function useReadReceipts() {
  const markAsRead = React.useCallback(async (
    messageId: string,
    userId: string,
    userEmail: string,
    currentReceipts: ReadReceipt[],
    updateFn: (messageId: string, receipts: ReadReceipt[]) => Promise<void>
  ) => {
    // Don't add duplicate receipts
    if (currentReceipts.some(r => r.userId === userId)) {
      return;
    }
    
    const newReceipt: ReadReceipt = {
      userId,
      userEmail,
      readAt: new Date().toISOString(),
    };
    
    const updatedReceipts = [...currentReceipts, newReceipt];
    await updateFn(messageId, updatedReceipts);
  }, []);

  return { markAsRead };
}
