import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Clock, Smile, Heart, ThumbsUp, Coffee, Flag, Briefcase, PartyPopper } from 'lucide-react';

const emojiCategories = [
  {
    id: 'recent',
    icon: Clock,
    emojis: ['👍', '❤️', '😊', '🎉', '🚀', '✅', '👀', '🔥'],
  },
  {
    id: 'smileys',
    icon: Smile,
    emojis: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '😝', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '😮‍💨', '🤥'],
  },
  {
    id: 'gestures',
    icon: ThumbsUp,
    emojis: ['👍', '👎', '👌', '🤌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾'],
  },
  {
    id: 'hearts',
    icon: Heart,
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️'],
  },
  {
    id: 'celebrations',
    icon: PartyPopper,
    emojis: ['🎉', '🎊', '🎈', '🎁', '🏆', '🏅', '🥇', '🥈', '🥉', '⭐', '🌟', '✨', '💫', '🔥', '💥', '💯', '🙌', '👑'],
  },
  {
    id: 'work',
    icon: Briefcase,
    emojis: ['💼', '📁', '📂', '📅', '📆', '🗓️', '📋', '📌', '📎', '🖇️', '📝', '✏️', '✒️', '🖊️', '📊', '📈', '📉', '💹', '📧', '📨', '📩', '✅', '❌', '⚠️', '🔔', '🔕', '🔒', '🔓'],
  },
  {
    id: 'objects',
    icon: Coffee,
    emojis: ['☕', '🍵', '🧃', '🥤', '🧋', '💻', '🖥️', '📱', '📲', '⌨️', '🖱️', '💡', '🔌', '🔋', '📡', '🛠️', '⚙️', '🔧', '🔨', '⚡', '🎯', '🚀', '🛸', '✈️'],
  },
  {
    id: 'flags',
    icon: Flag,
    emojis: ['🏁', '🚩', '🎌', '🏴', '🏳️', '🏳️‍🌈', '🏳️‍⚧️', '🇺🇸', '🇬🇧', '🇨🇦', '🇦🇺', '🇯🇵', '🇰🇷', '🇨🇳', '🇮🇳', '🇩🇪', '🇫🇷', '🇮🇹', '🇪🇸', '🇧🇷'],
  },
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('recent');

  const allEmojis = emojiCategories.flatMap(c => c.emojis);
  const filteredEmojis = search
    ? allEmojis.filter(emoji => emoji.includes(search))
    : emojiCategories.find(c => c.id === selectedCategory)?.emojis || [];

  return (
    <div className="w-80 bg-popover border rounded-lg shadow-lg overflow-hidden">
      {/* Search */}
      <div className="p-2 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search emoji..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1 p-1 border-b overflow-x-auto">
        {emojiCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => {
              setSelectedCategory(category.id);
              setSearch('');
            }}
            className={cn(
              "p-1.5 rounded transition-colors",
              selectedCategory === category.id && !search
                ? "bg-primary/10 text-primary"
                : "hover:bg-muted text-muted-foreground"
            )}
          >
            <category.icon className="h-4 w-4" />
          </button>
        ))}
      </div>

      {/* Emoji Grid */}
      <ScrollArea className="h-48">
        <div className="p-2">
          <div className="grid grid-cols-8 gap-1">
            {filteredEmojis.map((emoji, i) => (
              <button
                key={`${emoji}-${i}`}
                onClick={() => {
                  onSelect(emoji);
                  onClose();
                }}
                className="h-8 w-8 flex items-center justify-center text-lg hover:bg-muted rounded transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
          {filteredEmojis.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">
              No emojis found
            </p>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-2 border-t text-xs text-muted-foreground flex items-center justify-between">
        <span>Click to add reaction</span>
        <button onClick={onClose} className="hover:text-foreground">
          Close
        </button>
      </div>
    </div>
  );
}

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
  existingReactions?: string[];
}

export function QuickReactionPicker({ onSelect, existingReactions = [] }: ReactionPickerProps) {
  const quickReactions = ['👍', '❤️', '😊', '🎉', '🚀', '👀', '✅', '🔥'];

  return (
    <div className="flex items-center gap-0.5 p-1 bg-popover border rounded-lg shadow-lg">
      {quickReactions.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onSelect(emoji)}
          className={cn(
            "h-7 w-7 flex items-center justify-center text-sm rounded transition-colors",
            existingReactions.includes(emoji)
              ? "bg-primary/20"
              : "hover:bg-muted"
          )}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
