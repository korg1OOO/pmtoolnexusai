import React, { useState, useMemo, useCallback } from 'react';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface SearchableMessage {
  id: string;
  content: string;
  user_email: string;
  created_at: string;
}

interface MessageSearchProps {
  messages: SearchableMessage[];
  onJumpToMessage: (messageId: string) => void;
  onClose: () => void;
}

export function MessageSearch({ messages, onJumpToMessage, onClose }: MessageSearchProps) {
  const [query, setQuery] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    
    const lowerQuery = query.toLowerCase();
    return messages.filter(
      m => m.content.toLowerCase().includes(lowerQuery) ||
           m.user_email.toLowerCase().includes(lowerQuery)
    ).reverse(); // Most recent first
  }, [messages, query]);

  const handleNext = useCallback(() => {
    if (searchResults.length === 0) return;
    const nextIndex = (currentIndex + 1) % searchResults.length;
    setCurrentIndex(nextIndex);
    onJumpToMessage(searchResults[nextIndex].id);
  }, [searchResults, currentIndex, onJumpToMessage]);

  const handlePrev = useCallback(() => {
    if (searchResults.length === 0) return;
    const prevIndex = currentIndex === 0 ? searchResults.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIndex);
    onJumpToMessage(searchResults[prevIndex].id);
  }, [searchResults, currentIndex, onJumpToMessage]);

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    setCurrentIndex(0);
    if (value.trim()) {
      const lowerQuery = value.toLowerCase();
      const results = messages.filter(
        m => m.content.toLowerCase().includes(lowerQuery) ||
             m.user_email.toLowerCase().includes(lowerQuery)
      ).reverse();
      if (results.length > 0) {
        onJumpToMessage(results[0].id);
      }
    }
  }, [messages, onJumpToMessage]);

  return (
    <div className="flex items-center gap-2 p-2 border-b bg-muted/30">
      <Search className="h-4 w-4 text-muted-foreground shrink-0" />
      <Input
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search messages..."
        className="h-7 text-sm flex-1"
        autoFocus
      />
      {searchResults.length > 0 && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
          <span>{currentIndex + 1}/{searchResults.length}</span>
          <Button variant="ghost" size="iconSm" onClick={handlePrev} className="h-6 w-6">
            <ChevronUp className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="iconSm" onClick={handleNext} className="h-6 w-6">
            <ChevronDown className="h-3 w-3" />
          </Button>
        </div>
      )}
      {query && searchResults.length === 0 && (
        <span className="text-xs text-muted-foreground shrink-0">No results</span>
      )}
      <Button variant="ghost" size="iconSm" onClick={onClose} className="h-6 w-6 shrink-0">
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

interface SearchToggleProps {
  onClick: () => void;
  className?: string;
}

export function SearchToggle({ onClick, className }: SearchToggleProps) {
  return (
    <Button
      variant="ghost"
      size="iconSm"
      onClick={onClick}
      className={className}
      title="Search messages"
    >
      <Search className="h-4 w-4" />
    </Button>
  );
}
