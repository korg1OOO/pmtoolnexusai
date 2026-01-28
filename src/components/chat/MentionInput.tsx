import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

interface User {
  id: string;
  name: string;
  role?: string;
  status?: 'online' | 'away' | 'offline';
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  users: User[];
  className?: string;
}

export function MentionInput({
  value,
  onChange,
  onSubmit,
  placeholder,
  users,
  className,
}: MentionInputProps) {
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionDropdownRef = useRef<HTMLDivElement>(null);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  // Detect @ trigger
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursor = e.target.selectionStart;
    setCursorPosition(cursor);
    onChange(newValue);

    // Check for @ trigger
    const textBeforeCursor = newValue.slice(0, cursor);
    const atMatch = textBeforeCursor.match(/@(\w*)$/);

    if (atMatch) {
      setMentionSearch(atMatch[1]);
      setShowMentions(true);
      setMentionIndex(0);
    } else {
      setShowMentions(false);
      setMentionSearch('');
    }
  };

  const insertMention = useCallback((user: User) => {
    const textBeforeCursor = value.slice(0, cursorPosition);
    const textAfterCursor = value.slice(cursorPosition);
    const atIndex = textBeforeCursor.lastIndexOf('@');
    
    const newText = 
      textBeforeCursor.slice(0, atIndex) + 
      `@${user.name} ` + 
      textAfterCursor;
    
    onChange(newText);
    setShowMentions(false);
    setMentionSearch('');
    
    // Focus back on textarea
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  }, [value, cursorPosition, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentions && filteredUsers.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setMentionIndex((prev) => 
            prev < filteredUsers.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setMentionIndex((prev) => 
            prev > 0 ? prev - 1 : filteredUsers.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          insertMention(filteredUsers[mentionIndex]);
          break;
        case 'Escape':
          e.preventDefault();
          setShowMentions(false);
          break;
        case 'Tab':
          e.preventDefault();
          insertMention(filteredUsers[mentionIndex]);
          break;
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  // Close mentions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        mentionDropdownRef.current &&
        !mentionDropdownRef.current.contains(e.target as Node) &&
        !textareaRef.current?.contains(e.target as Node)
      ) {
        setShowMentions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Render text with highlighted mentions
  const renderPreview = () => {
    const parts = value.split(/(@\w+(?:\s\w+)?)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return (
          <span key={i} className="bg-primary/20 text-primary rounded px-0.5">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(
          "min-h-[60px] w-full border-0 bg-transparent resize-none focus-visible:outline-none",
          className
        )}
      />

      {/* Mention Dropdown */}
      {showMentions && filteredUsers.length > 0 && (
        <div
          ref={mentionDropdownRef}
          className="absolute bottom-full left-0 mb-2 w-64 bg-popover border rounded-lg shadow-lg z-50"
        >
          <div className="p-2 text-xs text-muted-foreground border-b">
            People matching "{mentionSearch || '...'}"
          </div>
          <ScrollArea className="max-h-48">
            <div className="p-1">
              {filteredUsers.map((user, index) => (
                <button
                  key={user.id}
                  onClick={() => insertMention(user)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors",
                    index === mentionIndex
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted"
                  )}
                >
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-[10px]">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    {user.role && (
                      <p className="text-xs text-muted-foreground truncate">{user.role}</p>
                    )}
                  </div>
                  {user.status && (
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        user.status === 'online' && 'bg-success',
                        user.status === 'away' && 'bg-warning',
                        user.status === 'offline' && 'bg-muted-foreground'
                      )}
                    />
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
          <div className="p-2 text-[10px] text-muted-foreground border-t">
            ↑↓ to navigate • Enter to select • Esc to close
          </div>
        </div>
      )}
    </div>
  );
}
