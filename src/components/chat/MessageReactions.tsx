import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Plus, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export interface Reaction {
  emoji: string;
  users: { id: string; email: string }[];
}

interface MessageReactionsProps {
  reactions: Reaction[];
  currentUserId?: string;
  onAddReaction: (emoji: string) => void;
  onRemoveReaction: (emoji: string) => void;
  isOwnMessage?: boolean;
}

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '👀'];

export function MessageReactions({
  reactions,
  currentUserId,
  onAddReaction,
  onRemoveReaction,
  isOwnMessage,
}: MessageReactionsProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const handleEmojiClick = (emoji: string) => {
    const existingReaction = reactions.find(r => r.emoji === emoji);
    const hasReacted = existingReaction?.users.some(u => u.id === currentUserId);
    
    if (hasReacted) {
      onRemoveReaction(emoji);
    } else {
      onAddReaction(emoji);
    }
    setIsPickerOpen(false);
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-1 mt-1', isOwnMessage && 'justify-end')}>
      {reactions.map((reaction) => {
        const hasReacted = reaction.users.some(u => u.id === currentUserId);
        const userNames = reaction.users.map(u => u.email.split('@')[0]).join(', ');
        
        return (
          <Tooltip key={reaction.emoji}>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleEmojiClick(reaction.emoji)}
                className={cn(
                  'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs transition-colors',
                  hasReacted
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'bg-muted hover:bg-muted/80 border border-transparent'
                )}
              >
                <span>{reaction.emoji}</span>
                <span className="font-medium">{reaction.users.length}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{userNames} reacted with {reaction.emoji}</p>
            </TooltipContent>
          </Tooltip>
        );
      })}
      
      <Popover open={isPickerOpen} onOpenChange={setIsPickerOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="iconSm"
            className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align={isOwnMessage ? 'end' : 'start'}>
          <div className="flex gap-1">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleEmojiClick(emoji)}
                className="p-1.5 hover:bg-muted rounded transition-colors text-base"
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Quick reaction picker shown on hover
interface QuickReactionPickerProps {
  onSelect: (emoji: string) => void;
  className?: string;
}

export function QuickReactionPicker({ onSelect, className }: QuickReactionPickerProps) {
  const QUICK_REACTIONS = ['👍', '❤️', '😂', '🎉'];
  
  return (
    <div className={cn(
      'absolute -top-8 right-0 flex items-center gap-0.5 px-1.5 py-1 bg-popover border rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10',
      className
    )}>
      {QUICK_REACTIONS.map((emoji) => (
        <button
          key={emoji}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(emoji);
          }}
          className="p-1 hover:bg-muted rounded-full transition-colors text-sm"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
