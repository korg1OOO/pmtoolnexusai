import React from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Link2,
  FileText,
  Sparkles,
  Network,
  Tag,
} from 'lucide-react';
import type { NotebookPage, PageLink } from '@/hooks/useNotebooks';

interface BacklinksSidebarProps {
  currentPage: NotebookPage | null;
  outgoingLinks: PageLink[];
  incomingLinks: PageLink[];
  allPages: { id: string; title: string; tags: string[] }[];
  onNavigateToPage: (pageId: string) => void;
}

export function BacklinksSidebar({
  currentPage,
  outgoingLinks,
  incomingLinks,
  allPages,
  onNavigateToPage,
}: BacklinksSidebarProps) {
  // Parse wiki links from content to show outgoing references
  const parsedOutgoingLinks = React.useMemo(() => {
    if (!currentPage?.content) return [];
    const wikiLinkRegex = /\[\[(.*?)\]\]/g;
    const links: string[] = [];
    let match;
    while ((match = wikiLinkRegex.exec(currentPage.content)) !== null) {
      if (!links.includes(match[1])) {
        links.push(match[1]);
      }
    }
    return links.map(title => {
      const page = allPages.find(p => p.title === title);
      return { title, pageId: page?.id };
    });
  }, [currentPage?.content, allPages]);

  // Find pages that link to current page
  const backlinks = React.useMemo(() => {
    if (!currentPage) return [];
    return allPages.filter(page => {
      if (page.id === currentPage.id) return false;
      // This would need to check the content of each page
      // For now, we use the incomingLinks from the database
      return incomingLinks.some(link => link.source_page_id === page.id);
    });
  }, [currentPage, allPages, incomingLinks]);

  // Get related pages by shared tags
  const relatedByTags = React.useMemo(() => {
    if (!currentPage?.tags.length) return [];
    return allPages
      .filter(page => {
        if (page.id === currentPage.id) return false;
        return page.tags.some(tag => currentPage.tags.includes(tag));
      })
      .slice(0, 5);
  }, [currentPage, allPages]);

  if (!currentPage) {
    return (
      <div className="w-full h-full border-l border-border bg-sidebar p-4">
        <div className="text-center text-muted-foreground py-8">
          <Network className="h-8 w-8 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Select a page to see connections</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full border-l border-border bg-sidebar flex flex-col overflow-hidden">
      <Tabs defaultValue="links" className="flex flex-col h-full">
        <div className="p-3 border-b border-border">
          <TabsList className="w-full">
            <TabsTrigger value="links" className="flex-1 text-xs">
              <Link2 className="h-3.5 w-3.5 mr-1" />
              Links
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex-1 text-xs">
              <Sparkles className="h-3.5 w-3.5 mr-1" />
              AI
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="links" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6">
              {/* Outgoing Links */}
              <div>
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2 mb-3">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  Outgoing Links ({parsedOutgoingLinks.length})
                </h4>
                {parsedOutgoingLinks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No outgoing links</p>
                ) : (
                  <div className="space-y-1">
                    {parsedOutgoingLinks.map((link, i) => (
                      <button
                        key={i}
                        onClick={() => link.pageId && onNavigateToPage(link.pageId)}
                        disabled={!link.pageId}
                        className={cn(
                          'w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm',
                          'hover:bg-accent transition-colors text-left',
                          !link.pageId && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{link.title}</span>
                        {!link.pageId && (
                          <Badge variant="outline" className="text-[10px] ml-auto shrink-0">
                            Not found
                          </Badge>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Backlinks */}
              <div>
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2 mb-3">
                  <ArrowDownLeft className="h-3.5 w-3.5" />
                  Backlinks ({incomingLinks.length})
                </h4>
                {incomingLinks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No pages link here</p>
                ) : (
                  <div className="space-y-1">
                    {incomingLinks.map(link => {
                      const sourcePage = allPages.find(p => p.id === link.source_page_id);
                      return (
                        <button
                          key={link.id}
                          onClick={() => onNavigateToPage(link.source_page_id)}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-accent transition-colors text-left"
                        >
                          <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate">{sourcePage?.title || 'Unknown'}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Related by Tags */}
              {relatedByTags.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2 mb-3">
                    <Tag className="h-3.5 w-3.5" />
                    Related Pages
                  </h4>
                  <div className="space-y-1">
                    {relatedByTags.map(page => (
                      <button
                        key={page.id}
                        onClick={() => onNavigateToPage(page.id)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-accent transition-colors text-left"
                      >
                        <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{page.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="ai" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <div className="text-center py-8">
                <Sparkles className="h-10 w-10 mx-auto mb-3 text-primary opacity-70" />
                <h4 className="font-medium mb-2">AI Assistant</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Get AI-powered suggestions for your notes
                </p>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                    <Sparkles className="h-4 w-4" />
                    Summarize this page
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                    <Tag className="h-4 w-4" />
                    Suggest tags
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                    <Link2 className="h-4 w-4" />
                    Find related pages
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                    <FileText className="h-4 w-4" />
                    Generate action items
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
