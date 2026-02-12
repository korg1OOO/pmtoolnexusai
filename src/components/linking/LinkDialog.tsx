import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  X,
  Search,
  Link2,
  Check,
  Clock,
  AlertTriangle,
  Target,
  Users,
  CheckCircle2,
  Calendar,
  Plus,
} from 'lucide-react';
import { useProjectContext } from '@/contexts/ProjectContext';
import { useLinkableItems } from '@/hooks/useLinkableItems';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export type LinkableItemType = 'task' | 'issue' | 'meeting' | 'action' | 'decision' | 'risk';

export interface LinkableItem {
  id: string;
  title: string;
  type: LinkableItemType;
  status: string;
  date?: string;
  assignee?: string;
}

// Mock data removed - now using live database queries via useLinkableItems hook

const typeConfig: Record<LinkableItemType, { icon: React.ElementType; color: string }> = {
  task: { icon: CheckCircle2, color: 'text-success' },
  issue: { icon: AlertTriangle, color: 'text-destructive' },
  meeting: { icon: Users, color: 'text-info' },
  action: { icon: Target, color: 'text-primary' },
  decision: { icon: Target, color: 'text-purple-500' },
  risk: { icon: AlertTriangle, color: 'text-warning' },
};

interface LinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceItem: { id: string; title: string; type: string };
  existingLinks?: { type: LinkableItemType; id: string }[];
  onLink: (items: LinkableItem[]) => void;
  allowedTypes?: LinkableItemType[];
}

export function LinkDialog({
  open,
  onOpenChange,
  sourceItem,
  existingLinks = [],
  onLink,
  allowedTypes = ['task', 'issue', 'meeting', 'action', 'decision', 'risk'],
}: LinkDialogProps) {
  const { settings } = useProjectContext();
  const projectId = settings?.id || '';

  const [activeTab, setActiveTab] = useState<LinkableItemType>(allowedTypes[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(
    new Set(existingLinks.map(l => `${l.type}-${l.id}`))
  );

  // Fetch linkable items for active tab
  const { data: linkableItems = [], isLoading } = useLinkableItems(projectId, activeTab);

  const filteredItems = useMemo(() => {
    return linkableItems.filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [linkableItems, searchQuery]);

  const handleToggleItem = (item: LinkableItem) => {
    const key = `${item.type}-${item.id}`;
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    const linked: LinkableItem[] = [];
    selectedItems.forEach(key => {
      const [type, id] = key.split('-') as [LinkableItemType, string];
      const item = linkableItems.find(i => i.id === id && i.type === type);
      if (item) linked.push(item);
    });
    onLink(linked);
    onOpenChange(false);
  };

  const selectedCount = selectedItems.size - existingLinks.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Manage Links for {sourceItem.id}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LinkableItemType)}>
            <TabsList className="w-full justify-start">
              {allowedTypes.map(type => {
                const config = typeConfig[type];
                const Icon = config.icon;
                // Count selected items of this type
                const count = Array.from(selectedItems).filter(
                  key => key.startsWith(`${type}-`)
                ).length;
                return (
                  <TabsTrigger key={type} value={type} className="gap-1 capitalize">
                    <Icon className={cn('h-4 w-4', config.color)} />
                    {type}s
                    {count > 0 && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {count}
                      </Badge>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {allowedTypes.map(type => (
              <TabsContent key={type} value={type} className="mt-4">
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {isLoading ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Loading {type}s...</p>
                      </div>
                    ) : filteredItems.length > 0 ? (
                      filteredItems.map(item => {
                        const config = typeConfig[item.type];
                        const Icon = config.icon;
                        const isSelected = selectedItems.has(`${item.type}-${item.id}`);
                        const isExisting = existingLinks.some(
                          l => l.type === item.type && l.id === item.id
                        );

                        return (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onClick={() => handleToggleItem(item)}
                            className={cn(
                              'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                              isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                            )}
                          >
                            <Checkbox checked={isSelected} />
                            <div className={cn('h-8 w-8 rounded flex items-center justify-center bg-muted', config.color)}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-muted-foreground">{item.id}</span>
                                {isExisting && (
                                  <Badge variant="outline" className="text-[10px]">Existing</Badge>
                                )}
                              </div>
                              <p className="text-sm font-medium truncate">{item.title}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Badge variant="secondary" className="text-[10px]">{item.status}</Badge>
                                {item.assignee && <span>{item.assignee}</span>}
                                {item.date && <span>{new Date(item.date).toLocaleDateString()}</span>}
                              </div>
                            </div>
                            {isSelected && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </motion.div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No {type}s found</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <p className="text-sm text-muted-foreground">
              {selectedItems.size} items selected
              {selectedCount > 0 && (
                <span className="text-primary"> (+{selectedCount} new)</span>
              )}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirm}>
                <Link2 className="h-4 w-4 mr-1" />
                Update Links
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
