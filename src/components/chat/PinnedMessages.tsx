import React from 'react';
import { Pin, X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

export interface PinnedMessage {
  id: string;
  content: string;
  user_email: string;
  pinned_at: string;
  created_at: string;
}

interface PinnedMessagesProps {
  messages: PinnedMessage[];
  onUnpin: (messageId: string) => void;
  onJumpToMessage: (messageId: string) => void;
  canManagePins: boolean;
}

export function PinnedMessages({ 
  messages, 
  onUnpin, 
  onJumpToMessage,
  canManagePins 
}: PinnedMessagesProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);

  if (messages.length === 0) return null;

  return (
    <div className="border-b bg-muted/30">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          <Pin className="h-3.5 w-3.5 text-amber-500" />
          <span>Pinned Messages ({messages.length})</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      
      {isExpanded && (
        <ScrollArea className="max-h-32">
          <div className="px-3 pb-2 space-y-1">
            {messages.map((msg) => (
              <div 
                key={msg.id}
                className="group flex items-start gap-2 p-2 rounded-md bg-background/50 hover:bg-background transition-colors cursor-pointer"
                onClick={() => onJumpToMessage(msg.id)}
              >
                <Pin className="h-3 w-3 mt-1 text-amber-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">
                    {msg.user_email.split('@')[0]} • {format(new Date(msg.created_at), 'MMM d')}
                  </p>
                  <p className="text-sm truncate">{msg.content}</p>
                </div>
                {canManagePins && (
                  <Button
                    variant="ghost"
                    size="iconSm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnpin(msg.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

interface PinMessageButtonProps {
  isPinned: boolean;
  onTogglePin: () => void;
  className?: string;
}

export function PinMessageButton({ isPinned, onTogglePin, className }: PinMessageButtonProps) {
  return (
    <Button
      variant="ghost"
      size="iconSm"
      onClick={onTogglePin}
      className={cn(
        "h-6 w-6",
        isPinned && "text-amber-500",
        className
      )}
      title={isPinned ? "Unpin message" : "Pin message"}
    >
      <Pin className="h-3 w-3" />
    </Button>
  );
}
