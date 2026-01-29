import React, { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sparkles,
  Save,
  MoreHorizontal,
  Share2,
  Clock,
  Tag,
  X,
  Plus,
} from 'lucide-react';
import type { NotebookPage } from '@/hooks/useNotebooks';
import { formatDistanceToNow } from 'date-fns';
import { RichTextEditor } from './RichTextEditor';

interface PageEditorProps {
  page: NotebookPage | null;
  onUpdate: (id: string, updates: Partial<NotebookPage>) => void;
  allPages: { id: string; title: string }[];
  onNavigateToPage?: (pageId: string) => void;
}

export function PageEditor({ page, onUpdate, allPages, onNavigateToPage }: PageEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Reset state when page changes
  useEffect(() => {
    if (page) {
      setTitle(page.title);
      setContent(page.content || '');
      setTags(page.tags || []);
      setLastSaved(new Date(page.updated_at));
    }
  }, [page?.id]);

  // Auto-save with debounce
  const saveChanges = useCallback(() => {
    if (!page) return;
    
    setIsSaving(true);
    onUpdate(page.id, {
      title: title || 'Untitled',
      content,
      tags,
    });
    
    setTimeout(() => {
      setIsSaving(false);
      setLastSaved(new Date());
    }, 500);
  }, [page, title, content, tags, onUpdate]);

  // Debounced save
  useEffect(() => {
    if (!page) return;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      if (title !== page.title || content !== page.content || JSON.stringify(tags) !== JSON.stringify(page.tags)) {
        saveChanges();
      }
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [title, content, tags]);

  const handleAddTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
    setShowTagInput(false);
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  if (!page) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center text-muted-foreground">
          <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Select a page to edit</h3>
          <p className="text-sm">Or create a new page to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background min-w-0 h-full">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          {isSaving ? (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Save className="h-3 w-3 animate-pulse" />
              Saving...
            </span>
          ) : lastSaved && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Saved {formatDistanceToNow(lastSaved, { addSuffix: true })}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Assist
          </Button>
          <Button variant="ghost" size="iconSm">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="iconSm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Editor Content */}
      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto p-6 space-y-4">
          {/* Title */}
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled"
            className="text-3xl font-bold border-none shadow-none px-0 h-auto focus-visible:ring-0 bg-transparent"
          />

          {/* Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="h-4 w-4 text-muted-foreground" />
            {tags.map(tag => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <button onClick={() => handleRemoveTag(tag)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {showTagInput ? (
              <div className="flex items-center gap-1">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddTag();
                    if (e.key === 'Escape') setShowTagInput(false);
                  }}
                  placeholder="Add tag..."
                  className="h-6 w-24 text-xs"
                  autoFocus
                />
                <Button size="iconSm" variant="ghost" className="h-6 w-6" onClick={handleAddTag}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-muted-foreground"
                onClick={() => setShowTagInput(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add tag
              </Button>
            )}
          </div>

          {/* Rich Text Editor */}
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="Start writing... Use the toolbar above to format your text."
          />
        </div>
      </ScrollArea>
    </div>
  );
}
