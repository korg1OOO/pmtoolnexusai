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

const mockLinkableItems: Record<LinkableItemType, LinkableItem[]> = {
  task: [
    { id: 'T-010', title: 'Infrastructure Provisioning', type: 'task', status: 'completed', assignee: 'David Wilson' },
    { id: 'T-011', title: 'Application Migration - Wave 1', type: 'task', status: 'in-progress', assignee: 'John Doe' },
    { id: 'T-012', title: 'Application Migration - Wave 2', type: 'task', status: 'not-started', assignee: 'Jane Smith' },
    { id: 'T-013', title: 'Data Migration', type: 'task', status: 'in-progress', assignee: 'Emily Brown' },
  ],
  issue: [
    { id: 'ISS-001', title: 'API Gateway timeout during peak load', type: 'issue', status: 'investigating', assignee: 'John Doe' },
    { id: 'ISS-002', title: 'Database migration scripts failing', type: 'issue', status: 'in-progress', assignee: 'Emily Brown' },
    { id: 'ISS-003', title: 'Authentication token expiration', type: 'issue', status: 'open', assignee: 'Sarah Mitchell' },
  ],
  meeting: [
    { id: 'MTG-001', title: 'Weekly Steering Committee', type: 'meeting', status: 'scheduled', date: '2024-08-12' },
    { id: 'MTG-002', title: 'Sprint 12 Daily Standup', type: 'meeting', status: 'completed', date: '2024-08-12' },
    { id: 'MTG-003', title: 'Architecture Review', type: 'meeting', status: 'scheduled', date: '2024-08-14' },
  ],
  action: [
    { id: 'ACT-001', title: 'Configure load balancer auto-scaling rules', type: 'action', status: 'in-progress', assignee: 'John Doe' },
    { id: 'ACT-002', title: 'Review and approve migration rollback plan', type: 'action', status: 'not-started', assignee: 'Sarah Mitchell' },
    { id: 'ACT-003', title: 'Implement token refresh mechanism', type: 'action', status: 'in-progress', assignee: 'Jane Smith' },
  ],
  decision: [
    { id: 'DEC-001', title: 'Use multi-cloud architecture', type: 'decision', status: 'active', date: '2024-03-15' },
    { id: 'DEC-002', title: 'Adopt Kubernetes for container orchestration', type: 'decision', status: 'active', date: '2024-04-01' },
  ],
  risk: [
    { id: 'RSK-001', title: 'Vendor Lock-in with Cloud Provider', type: 'risk', status: 'mitigating' },
    { id: 'RSK-002', title: 'Data Migration Complexity', type: 'risk', status: 'mitigating' },
    { id: 'RSK-003', title: 'Resource Availability', type: 'risk', status: 'identified' },
  ],
};

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
  const [activeTab, setActiveTab] = useState<LinkableItemType>(allowedTypes[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(
    new Set(existingLinks.map(l => `${l.type}-${l.id}`))
  );

  const filteredItems = useMemo(() => {
    return mockLinkableItems[activeTab].filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeTab, searchQuery]);

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
      const item = mockLinkableItems[type]?.find(i => i.id === id);
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
                const count = mockLinkableItems[type].filter(
                  i => selectedItems.has(`${type}-${i.id}`)
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
                    {filteredItems.length > 0 ? (
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
