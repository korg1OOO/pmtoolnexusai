import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, Reorder, useDragControls } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Plus,
  Filter,
  Search,
  MoreHorizontal,
  User,
  Clock,
  Flame,
  GripVertical,
  Link2,
  SortAsc,
  X,
  Keyboard,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { mockSprintItems, mockSprint } from '@/data/mockData';
import type { SprintItem, SprintStatus, Priority } from '@/types/project';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LinkDialog, LinkableItem } from '@/components/linking/LinkDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const columns: { id: SprintStatus; label: string; color: string }[] = [
  { id: 'todo', label: 'To Do', color: 'bg-muted' },
  { id: 'in-progress', label: 'In Progress', color: 'bg-primary' },
  { id: 'review', label: 'In Review', color: 'bg-purple-500' },
  { id: 'done', label: 'Done', color: 'bg-success' },
];

const priorityOrder: Record<Priority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

interface SprintCardProps {
  item: SprintItem;
  isSelected: boolean;
  onSelect: () => void;
  onOpenLinks: () => void;
}

function SprintCard({ item, isSelected, onSelect, onOpenLinks }: SprintCardProps) {
  const dragControls = useDragControls();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={cn(
        'p-3 bg-card rounded-lg border shadow-sm hover:shadow-md transition-all cursor-pointer group',
        isSelected && 'ring-2 ring-primary'
      )}
    >
      <div className="flex items-start gap-2">
        <div
          className="cursor-grab opacity-0 group-hover:opacity-100 transition-opacity pt-1"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <Badge variant={item.type as any} className="text-[10px]">
              {item.type.replace('-', ' ')}
            </Badge>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="iconXs"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenLinks();
                }}
              >
                <Link2 className="h-3 w-3" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="iconXs" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Edit</DropdownMenuItem>
                  <DropdownMenuItem onClick={onOpenLinks}>Manage Links</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <p className="text-sm font-medium mb-2 line-clamp-2">{item.title}</p>

          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-muted-foreground font-mono">{item.key}</span>
            {item.priority === 'critical' && (
              <Flame className="h-3 w-3 text-destructive" />
            )}
          </div>

          {item.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {item.labels.slice(0, 2).map((label) => (
                <span
                  key={label}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                >
                  {label}
                </span>
              ))}
              {item.labels.length > 2 && (
                <span className="text-[10px] text-muted-foreground">
                  +{item.labels.length - 2}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex items-center gap-2">
              {item.assignee ? (
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                    {item.assignee
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                  <User className="h-3 w-3 text-muted-foreground/50" />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {item.storyPoints && (
                <span className="text-xs font-medium bg-muted px-1.5 py-0.5 rounded">
                  {item.storyPoints}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Keyboard shortcuts dialog
function KeyboardShortcutsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const shortcuts = [
    { key: 'N', description: 'Create new item' },
    { key: 'F', description: 'Open filters' },
    { key: '/', description: 'Focus search' },
    { key: '←/→', description: 'Move item between columns' },
    { key: '↑/↓', description: 'Navigate items' },
    { key: 'Enter', description: 'Open item details' },
    { key: 'L', description: 'Open link dialog' },
    { key: 'Esc', description: 'Clear selection' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-4">
          {shortcuts.map(({ key, description }) => (
            <div key={key} className="flex items-center justify-between py-2 border-b last:border-0">
              <span className="text-sm text-muted-foreground">{description}</span>
              <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded border">{key}</kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Linked Items panel component
function LinkedItemsPanel({ item, onClose }: { item: SprintItem | null; onClose: () => void }) {
  if (!item) return null;

  const mockLinkedItems = {
    tasks: [
      { id: 'T-011', title: 'Application Migration - Wave 1', status: 'in-progress' },
    ],
    issues: [
      { id: 'ISS-001', title: 'API Gateway timeout during peak load', status: 'investigating' },
    ],
    meetings: [
      { id: 'MTG-002', title: 'Sprint 12 Daily Standup', status: 'completed' },
    ],
    actions: [
      { id: 'ACT-001', title: 'Configure load balancer auto-scaling rules', status: 'in-progress' },
    ],
  };

  return (
    <div className="w-80 border-l bg-card flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <h3 className="font-medium text-sm">{item.key}</h3>
          <p className="text-xs text-muted-foreground truncate">{item.title}</p>
        </div>
        <Button variant="ghost" size="iconSm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="linked" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start px-4 rounded-none border-b">
          <TabsTrigger value="linked">Linked Items</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="linked" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {Object.entries(mockLinkedItems).map(([type, items]) => (
                <div key={type}>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2">
                    {type} ({items.length})
                  </h4>
                  <div className="space-y-2">
                    {items.map((linked) => (
                      <div
                        key={linked.id}
                        className="p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">{linked.id}</span>
                          <Badge variant="secondary" className="text-[10px]">{linked.status}</Badge>
                        </div>
                        <p className="text-sm truncate">{linked.title}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="details" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <div>
                <span className="text-xs font-medium text-muted-foreground">Type</span>
                <p className="text-sm capitalize">{item.type}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-muted-foreground">Status</span>
                <p className="text-sm capitalize">{item.status}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-muted-foreground">Priority</span>
                <p className="text-sm capitalize">{item.priority}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-muted-foreground">Assignee</span>
                <p className="text-sm">{item.assignee || 'Unassigned'}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-muted-foreground">Story Points</span>
                <p className="text-sm">{item.storyPoints || '-'}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-muted-foreground">Epic</span>
                <p className="text-sm">{item.epic || '-'}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-muted-foreground">Labels</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {item.labels.map((label) => (
                    <Badge key={label} variant="secondary" className="text-xs">{label}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function SprintBoardView() {
  const [items, setItems] = useState(mockSprintItems);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<SprintItem | null>(null);
  const [showLinkedPanel, setShowLinkedPanel] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkingItem, setLinkingItem] = useState<SprintItem | null>(null);
  const [focusedColumnIndex, setFocusedColumnIndex] = useState(0);
  const [focusedItemIndex, setFocusedItemIndex] = useState(0);
  const [quickFilterType, setQuickFilterType] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState({
    assignees: [] as string[],
    priorities: [] as Priority[],
    labels: [] as string[],
    types: [] as string[],
    storyPointsMin: 0,
    storyPointsMax: 100,
  });

  // Sort state
  const [sortBy, setSortBy] = useState<'priority' | 'storyPoints' | 'assignee'>('priority');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Get unique values for filters
  const allAssignees = useMemo(() => {
    const assignees = new Set<string>();
    mockSprintItems.forEach(item => {
      if (item.assignee) assignees.add(item.assignee);
    });
    return Array.from(assignees);
  }, []);

  const allLabels = useMemo(() => {
    const labels = new Set<string>();
    mockSprintItems.forEach(item => {
      item.labels.forEach(label => labels.add(label));
    });
    return Array.from(labels);
  }, []);

  const allTypes = useMemo(() => {
    const types = new Set<string>();
    mockSprintItems.forEach(item => types.add(item.type));
    return Array.from(types);
  }, []);

  const allPriorities: Priority[] = ['critical', 'high', 'medium', 'low'];

  // Apply filters and sorting
  const getColumnItems = useCallback((status: SprintStatus) => {
    let filtered = items.filter(item => {
      if (item.status !== status) return false;
      if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !item.key.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filters.assignees.length > 0 && !filters.assignees.includes(item.assignee || '')) return false;
      if (filters.priorities.length > 0 && !filters.priorities.includes(item.priority)) return false;
      if (filters.labels.length > 0 && !filters.labels.some(l => item.labels.includes(l))) return false;
      if (filters.types.length > 0 && !filters.types.includes(item.type)) return false;
      if (quickFilterType && item.type !== quickFilterType) return false;
      if (item.storyPoints !== undefined) {
        if (item.storyPoints < filters.storyPointsMin || item.storyPoints > filters.storyPointsMax) return false;
      }
      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'priority':
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'storyPoints':
          comparison = (a.storyPoints || 0) - (b.storyPoints || 0);
          break;
        case 'assignee':
          comparison = (a.assignee || '').localeCompare(b.assignee || '');
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [items, searchQuery, filters, sortBy, sortOrder, quickFilterType]);

  const getColumnPoints = (status: SprintStatus) =>
    getColumnItems(status).reduce((sum, item) => sum + (item.storyPoints || 0), 0);

  const totalPoints = items.reduce((sum, item) => sum + (item.storyPoints || 0), 0);
  const donePoints = getColumnPoints('done');
  const progressPercent = Math.round((donePoints / totalPoints) * 100);
  
  const activeFiltersCount = filters.assignees.length + filters.priorities.length + 
    filters.labels.length + filters.types.length + (quickFilterType ? 1 : 0);

  // Drag and drop handlers
  const handleDragEnd = (itemId: string, newStatus: SprintStatus) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, status: newStatus } : item
    ));
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case 'n':
          // Create new item
          break;
        case 'f':
          e.preventDefault();
          setShowFilters(!showFilters);
          break;
        case '/':
          e.preventDefault();
          document.querySelector<HTMLInputElement>('[data-search-input]')?.focus();
          break;
        case 'l':
          if (selectedItem) {
            e.preventDefault();
            setLinkingItem(selectedItem);
            setLinkDialogOpen(true);
          }
          break;
        case 'escape':
          setSelectedItem(null);
          setShowLinkedPanel(false);
          break;
        case '?':
          e.preventDefault();
          setShowShortcuts(true);
          break;
        case 'arrowleft':
        case 'arrowright':
          if (selectedItem) {
            e.preventDefault();
            const currentIndex = columns.findIndex(c => c.id === selectedItem.status);
            const newIndex = e.key === 'arrowleft' 
              ? Math.max(0, currentIndex - 1)
              : Math.min(columns.length - 1, currentIndex + 1);
            handleDragEnd(selectedItem.id, columns[newIndex].id);
            setSelectedItem({ ...selectedItem, status: columns[newIndex].id });
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem, showFilters]);

  const clearFilters = () => {
    setFilters({
      assignees: [],
      priorities: [],
      labels: [],
      types: [],
      storyPointsMin: 0,
      storyPointsMax: 100,
    });
    setQuickFilterType(null);
  };

  const hasActiveFilters = filters.assignees.length > 0 || filters.priorities.length > 0 || 
    filters.labels.length > 0 || filters.types.length > 0 || filters.storyPointsMin > 0 || 
    filters.storyPointsMax < 100 || quickFilterType !== null;

  const handleOpenLinks = (item: SprintItem) => {
    setLinkingItem(item);
    setLinkDialogOpen(true);
  };

  const handleLinkItems = (linkedItems: LinkableItem[]) => {
    // In a real app, save the links
    console.log('Linked items:', linkedItems);
  };

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col">
        {/* Sprint Header */}
        <div className="p-4 border-b bg-card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">{mockSprint.name}</h2>
              <Badge variant="info">Active</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="iconSm"
                onClick={() => setShowShortcuts(true)}
                title="Keyboard shortcuts (?)"
              >
                <Keyboard className="h-4 w-4" />
              </Button>
              <Button
                variant={showFilters ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-1" />
                Filter
                {hasActiveFilters && (
                  <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 text-[10px]">
                    !
                  </Badge>
                )}
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  {new Date(mockSprint.startDate).toLocaleDateString()} —{' '}
                  {new Date(mockSprint.endDate).toLocaleDateString()}
                </span>
              </div>
              <div className="text-muted-foreground">
                <span className="font-medium text-foreground">{donePoints}</span> /{' '}
                {totalPoints} pts completed
              </div>
            </div>

            <div className="flex items-center gap-3 w-64">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-success rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-sm font-medium">{progressPercent}%</span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mt-2">
            <span className="font-medium">Goal:</span> {mockSprint.goal}
          </p>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b bg-muted/30 overflow-hidden"
          >
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm">Filters & Sorting</h3>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-3 w-3 mr-1" />
                    Clear all
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Assignee Filter */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Assignee</label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full justify-between">
                        {filters.assignees.length > 0 
                          ? `${filters.assignees.length} selected`
                          : 'All assignees'}
                        <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48">
                      {allAssignees.map(assignee => (
                        <DropdownMenuCheckboxItem
                          key={assignee}
                          checked={filters.assignees.includes(assignee)}
                          onCheckedChange={(checked) => {
                            setFilters(prev => ({
                              ...prev,
                              assignees: checked 
                                ? [...prev.assignees, assignee]
                                : prev.assignees.filter(a => a !== assignee),
                            }));
                          }}
                        >
                          {assignee}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Priority Filter */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Priority</label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full justify-between">
                        {filters.priorities.length > 0 
                          ? `${filters.priorities.length} selected`
                          : 'All priorities'}
                        <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48">
                      {allPriorities.map(priority => (
                        <DropdownMenuCheckboxItem
                          key={priority}
                          checked={filters.priorities.includes(priority)}
                          onCheckedChange={(checked) => {
                            setFilters(prev => ({
                              ...prev,
                              priorities: checked 
                                ? [...prev.priorities, priority]
                                : prev.priorities.filter(p => p !== priority),
                            }));
                          }}
                        >
                          <span className="capitalize">{priority}</span>
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Labels Filter */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Labels</label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full justify-between">
                        {filters.labels.length > 0 
                          ? `${filters.labels.length} selected`
                          : 'All labels'}
                        <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48 max-h-64 overflow-y-auto">
                      {allLabels.map(label => (
                        <DropdownMenuCheckboxItem
                          key={label}
                          checked={filters.labels.includes(label)}
                          onCheckedChange={(checked) => {
                            setFilters(prev => ({
                              ...prev,
                              labels: checked 
                                ? [...prev.labels, label]
                                : prev.labels.filter(l => l !== label),
                            }));
                          }}
                        >
                          {label}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Sort */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Sort by</label>
                  <div className="flex gap-2">
                    <Select value={sortBy} onValueChange={(v: typeof sortBy) => setSortBy(v)}>
                      <SelectTrigger className="flex-1 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="priority">Priority</SelectItem>
                        <SelectItem value="storyPoints">Story Points</SelectItem>
                        <SelectItem value="assignee">Assignee</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      className="px-2"
                      onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    >
                      <SortAsc className={cn('h-4 w-4 transition-transform', sortOrder === 'desc' && 'rotate-180')} />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Story Points Range */}
              <div className="flex items-center gap-4">
                <span className="text-xs font-medium text-muted-foreground">Story Points:</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={filters.storyPointsMin}
                    onChange={(e) => setFilters(prev => ({ ...prev, storyPointsMin: Number(e.target.value) }))}
                    className="w-16 h-8"
                    min={0}
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="number"
                    value={filters.storyPointsMax}
                    onChange={(e) => setFilters(prev => ({ ...prev, storyPointsMax: Number(e.target.value) }))}
                    className="w-16 h-8"
                    min={0}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              data-search-input
              placeholder="Search items... (press / to focus)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Board */}
        <div className="flex-1 overflow-x-auto p-4">
          <div className="flex gap-4 h-full min-w-max">
            {columns.map((column) => {
              const columnItems = getColumnItems(column.id);
              const points = getColumnPoints(column.id);

              return (
                <div
                  key={column.id}
                  className="w-80 flex flex-col bg-muted/30 rounded-lg"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const itemId = e.dataTransfer.getData('itemId');
                    if (itemId) handleDragEnd(itemId, column.id);
                  }}
                >
                  {/* Column Header */}
                  <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn('h-2 w-2 rounded-full', column.color)} />
                      <span className="font-medium text-sm">{column.label}</span>
                      <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {columnItems.length}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">{points} pts</span>
                  </div>

                  {/* Column Content */}
                  <div className="flex-1 overflow-y-auto p-2 pt-0 space-y-2">
                    {columnItems.map((item) => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('itemId', item.id);
                        }}
                        onClick={() => {
                          setSelectedItem(item);
                          setShowLinkedPanel(true);
                        }}
                      >
                        <SprintCard
                          item={item}
                          isSelected={selectedItem?.id === item.id}
                          onSelect={() => {
                            setSelectedItem(item);
                            setShowLinkedPanel(true);
                          }}
                          onOpenLinks={() => handleOpenLinks(item)}
                        />
                      </div>
                    ))}

                    {columnItems.length === 0 && (
                      <div className="flex items-center justify-center h-24 border-2 border-dashed border-border/50 rounded-lg">
                        <span className="text-sm text-muted-foreground">No items</span>
                      </div>
                    )}
                  </div>

                  {/* Add Item */}
                  <div className="p-2">
                    <Button variant="ghost" className="w-full justify-start text-muted-foreground">
                      <Plus className="h-4 w-4 mr-1" />
                      Add item
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Linked Items Panel */}
      {showLinkedPanel && selectedItem && (
        <LinkedItemsPanel
          item={selectedItem}
          onClose={() => {
            setShowLinkedPanel(false);
            setSelectedItem(null);
          }}
        />
      )}

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog open={showShortcuts} onOpenChange={setShowShortcuts} />

      {/* Link Dialog */}
      {linkingItem && (
        <LinkDialog
          open={linkDialogOpen}
          onOpenChange={setLinkDialogOpen}
          sourceItem={{ id: linkingItem.key, title: linkingItem.title, type: 'sprint-item' }}
          onLink={handleLinkItems}
          allowedTypes={['task', 'issue', 'meeting', 'action']}
        />
      )}
    </div>
  );
}
