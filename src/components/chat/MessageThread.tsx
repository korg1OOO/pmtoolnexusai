import React from 'react';
import { Reply, CornerDownRight, X, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';

export interface ThreadMessage {
  id: string;
  content: string;
  user_id: string;
  user_email: string;
  created_at: string;
  reply_to?: string | null;
}

interface ReplyPreviewProps {
  replyingTo: ThreadMessage;
  onCancel: () => void;
}

export function ReplyPreview({ replyingTo, onCancel }: ReplyPreviewProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-l-2 border-primary rounded-sm">
      <CornerDownRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">
          Replying to {replyingTo.user_email.split('@')[0]}
        </p>
        <p className="text-sm truncate">{replyingTo.content}</p>
      </div>
      <Button
        variant="ghost"
        size="iconSm"
        onClick={onCancel}
        className="shrink-0 h-6 w-6"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

interface ReplyButtonProps {
  onReply: () => void;
  className?: string;
}

export function ReplyButton({ onReply, className }: ReplyButtonProps) {
  return (
    <Button
      variant="ghost"
      size="iconSm"
      onClick={onReply}
      className={cn("h-6 w-6", className)}
      title="Reply to message"
    >
      <Reply className="h-3 w-3" />
    </Button>
  );
}

interface ParentMessagePreviewProps {
  parentMessage: ThreadMessage | undefined;
  onJumpToMessage: (messageId: string) => void;
}

export function ParentMessagePreview({ parentMessage, onJumpToMessage }: ParentMessagePreviewProps) {
  if (!parentMessage) return null;

  return (
    <button
      onClick={() => onJumpToMessage(parentMessage.id)}
      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-1 group"
    >
      <CornerDownRight className="h-3 w-3" />
      <span className="truncate max-w-[180px] group-hover:underline">
        {parentMessage.user_email.split('@')[0]}: {parentMessage.content}
      </span>
    </button>
  );
}

interface ThreadIndicatorProps {
  replyCount: number;
  lastReplyTime?: string;
  onClick: () => void;
}

export function ThreadIndicator({ replyCount, lastReplyTime, onClick }: ThreadIndicatorProps) {
  if (replyCount === 0) return null;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-xs text-primary hover:underline mt-1"
    >
      <MessageSquare className="h-3 w-3" />
      <span>
        {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
        {lastReplyTime && (
          <span className="text-muted-foreground ml-1">
            • {format(new Date(lastReplyTime), 'MMM d, HH:mm')}
          </span>
        )}
      </span>
    </button>
  );
}

// Helper to get reply count for a message
export function getReplyCount(messageId: string, allMessages: ThreadMessage[]): number {
  return allMessages.filter(m => m.reply_to === messageId).length;
}

// Helper to get last reply time
export function getLastReplyTime(messageId: string, allMessages: ThreadMessage[]): string | undefined {
  const replies = allMessages
    .filter(m => m.reply_to === messageId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  
  return replies[0]?.created_at;
}
