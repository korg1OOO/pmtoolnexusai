import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  Plus,
  Search,
  Clock,
  Star,
  Pin,
  MoreHorizontal,
  Trash2,
  Copy,
  Share2,
} from 'lucide-react';
import type { NotebookPage } from '@/hooks/useNotebooks';
import { formatDistanceToNow } from 'date-fns';

interface PageListProps {
  pages: NotebookPage[];
  selectedPageId: string | null;
  sectionName: string;
  onSelectPage: (page: NotebookPage) => void;
  onCreatePage: () => void;
  onUpdatePage: (id: string, updates: Partial<NotebookPage>) => void;
  onDeletePage: (id: string) => void;
  loading: boolean;
}

export function PageList({
  pages,
  selectedPageId,
  sectionName,
  onSelectPage,
  onCreatePage,
  onUpdatePage,
  onDeletePage,
  loading,
}: PageListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPages = pages.filter(page => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      page.title.toLowerCase().includes(query) ||
      page.content.toLowerCase().includes(query) ||
      page.tags.some(t => t.toLowerCase().includes(query))
    );
  });

  const getPreview = (content: string) => {
    // Strip markdown and get first ~100 chars
    const stripped = content
      .replace(/^#+\s+/gm, '')
      .replace(/\*\*/g, '')
      .replace(/\[\[(.*?)\]\]/g, '$1')
      .replace(/`[^`]+`/g, '')
      .trim();
    return stripped.slice(0, 100) + (stripped.length > 100 ? '...' : '');
  };

  return (
    <div className="w-80 border-r border-border bg-card flex flex-col h-full">
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-foreground">{sectionName || 'Pages'}</h3>
          <Button variant="ghost" size="iconSm" onClick={onCreatePage}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search pages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-muted/50"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="text-sm text-muted-foreground mt-2">Loading pages...</p>
            </div>
          ) : filteredPages.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">
                {searchQuery ? 'No pages match your search' : 'No pages in this section'}
              </p>
              {!searchQuery && (
                <Button variant="link" size="sm" className="mt-2" onClick={onCreatePage}>
                  Create your first page
                </Button>
              )}
            </div>
          ) : (
            filteredPages.map(page => (
              <motion.div
                key={page.id}
                whileHover={{ x: 2 }}
                className={cn(
                  'group relative rounded-lg border border-transparent',
                  'hover:bg-accent/50 transition-all',
                  selectedPageId === page.id && 'bg-accent border-border'
                )}
              >
                <button
                  onClick={() => onSelectPage(page)}
                  className="w-full text-left p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {page.is_pinned && (
                        <Pin className="h-3.5 w-3.5 text-primary shrink-0" />
                      )}
                      <h4 className="font-medium text-sm text-foreground truncate">
                        {page.title || 'Untitled'}
                      </h4>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {page.is_favorite && (
                        <Star className="h-3.5 w-3.5 text-warning fill-current" />
                      )}
                    </div>
                  </div>

                  {page.content && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {getPreview(page.content)}
                    </p>
                  )}

                  {page.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {page.tags.slice(0, 3).map(tag => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {tag}
                        </Badge>
                      ))}
                      {page.tags.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{page.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{formatDistanceToNow(new Date(page.updated_at), { addSuffix: true })}</span>
                  </div>
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="iconSm"
                      className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onUpdatePage(page.id, { is_favorite: !page.is_favorite })}>
                      <Star className={cn('h-4 w-4 mr-2', page.is_favorite && 'fill-current text-warning')} />
                      {page.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onUpdatePage(page.id, { is_pinned: !page.is_pinned })}>
                      <Pin className={cn('h-4 w-4 mr-2', page.is_pinned && 'text-primary')} />
                      {page.is_pinned ? 'Unpin' : 'Pin to top'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => onDeletePage(page.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
