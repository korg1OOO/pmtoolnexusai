import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ListTodo,
  Plus,
  Filter,
  Search,
  MoreHorizontal,
  GripVertical,
  User,
  Calendar,
  Clock,
  ChevronDown,
  ChevronRight,
  Layers,
  Target,
  Zap,
  Edit2,
  Trash2,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { KPICard } from '@/components/enterprise/KPICard';
import { PDFExporter } from '@/components/common/PDFExporter';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEpics, Epic, EpicInput } from '@/hooks/useEpics';
import { useBacklogItems, BacklogItem, BacklogItemInput, ItemType, BacklogStatus, PriorityLevel } from '@/hooks/useBacklogItems';
import { toast } from 'sonner';

const getTypeColor = (type: ItemType) => {
  switch (type) {
    case 'story': return 'bg-primary/10 text-primary';
    case 'bug': return 'bg-destructive/10 text-destructive';
    case 'task': return 'bg-success/10 text-success';
    case 'tech-debt': return 'bg-warning/10 text-warning';
    case 'epic': return 'bg-purple-500/10 text-purple-500';
    default: return 'bg-muted text-muted-foreground';
  }
};

const getPriorityVariant = (priority: PriorityLevel) => {
  switch (priority) {
    case 'critical': return 'destructive' as const;
    case 'high': return 'warning' as const;
    case 'medium': return 'default' as const;
    case 'low': return 'outline' as const;
  }
};

interface BacklogItemRowProps {
  item: BacklogItem;
  epic?: Epic;
  onUpdate: (id: string, updates: Partial<BacklogItemInput>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

function BacklogItemRow({ item, epic, onUpdate, onDelete }: BacklogItemRowProps) {
  return (
    <div className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors group">
      <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab" />

      <div className={cn('px-2 py-1 rounded text-xs font-medium', getTypeColor(item.type))}>
        {item.type}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">{item.key || item.id.slice(0, 8)}</span>
          <span className="font-medium truncate">{item.title}</span>
        </div>
        {item.description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{item.description}</p>
        )}
      </div>

      <Badge variant={getPriorityVariant(item.priority)}>{item.priority}</Badge>

      {item.story_points && (
        <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded">
          <Target className="h-3 w-3" />
          <span className="text-xs font-medium">{item.story_points}</span>
        </div>
      )}

      {item.assignee_name ? (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <User className="h-3 w-3" />
          <span>{item.assignee_name}</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-xs text-muted-foreground/50">
          <User className="h-3 w-3" />
          <span>Unassigned</span>
        </div>
      )}

      {item.sprint_id && (
        <Badge variant="secondary" className="text-xs">Sprint</Badge>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="iconXs" className="opacity-0 group-hover:opacity-100">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive" onClick={() => onDelete(item.id)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: BacklogItemInput) => Promise<BacklogItem | null>;
  epics: Epic[];
}

function AddItemDialog({ open, onOpenChange, onSubmit, epics }: AddItemDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<BacklogItemInput>({
    title: '',
    description: '',
    type: 'story',
    priority: 'medium',
    story_points: 3,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    setLoading(true);
    const result = await onSubmit(form);
    setLoading(false);
    if (result) {
      setForm({ title: '', description: '', type: 'story', priority: 'medium', story_points: 3 });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Backlog Item</DialogTitle>
          <DialogDescription>Create a new item in the product backlog.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Item title" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the item" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as ItemType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="story">Story</SelectItem>
                  <SelectItem value="task">Task</SelectItem>
                  <SelectItem value="bug">Bug</SelectItem>
                  <SelectItem value="tech-debt">Tech Debt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v as PriorityLevel }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Story Points</Label>
              <Select value={form.story_points?.toString()} onValueChange={v => setForm(f => ({ ...f, story_points: parseInt(v) }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 5, 8, 13, 21].map(p => (
                    <SelectItem key={p} value={p.toString()}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Epic</Label>
              <Select value={form.epic_id || 'none'} onValueChange={v => setForm(f => ({ ...f, epic_id: v === 'none' ? undefined : v }))}>
                <SelectTrigger><SelectValue placeholder="Select epic" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Epic</SelectItem>
                  {epics.map(epic => (
                    <SelectItem key={epic.id} value={epic.id}>{epic.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assignee</Label>
              <Input value={form.assignee_name || ''} onChange={e => setForm(f => ({ ...f, assignee_name: e.target.value }))} placeholder="Assignee name" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Item
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AddEpicDialog({ open, onOpenChange, onSubmit }: { open: boolean, onOpenChange: (open: boolean) => void, onSubmit: (input: EpicInput) => Promise<Epic | null> }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<EpicInput>({ name: '', description: '', color: 'blue' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    const result = await onSubmit(form);
    setLoading(false);
    if (result) {
      setForm({ name: '', description: '', color: 'blue' });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Epic</DialogTitle>
          <DialogDescription>Create a new epic initiative.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Epic name" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the epic" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Epic
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function BacklogView() {
  const { epics, loading: epicsLoading, createEpic } = useEpics();
  const { items, loading: itemsLoading, createItem, updateItem, deleteItem, totalPoints, scheduledItems } = useBacklogItems();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'flat' | 'epics'>('epics');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addEpicDialogOpen, setAddEpicDialogOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Initialize expanded epics when epics load
  useMemo(() => {
    if (epics.length > 0 && expandedEpics.size === 0) {
      setExpandedEpics(new Set(epics.map(e => e.id)));
    }
  }, [epics]);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = !filterType || item.type === filterType;
    return matchesSearch && matchesType;
  });

  // Group items by epic
  const itemsByEpic = useMemo(() => {
    const grouped: Record<string, BacklogItem[]> = { unassigned: [] };
    epics.forEach(epic => { grouped[epic.id] = []; });

    filteredItems.forEach(item => {
      if (item.epic_id && grouped[item.epic_id]) {
        grouped[item.epic_id].push(item);
      } else {
        grouped.unassigned.push(item);
      }
    });

    return grouped;
  }, [filteredItems, epics]);

  const typeCounts = useMemo(() => ({
    story: items.filter(i => i.type === 'story').length,
    bug: items.filter(i => i.type === 'bug').length,
    task: items.filter(i => i.type === 'task').length,
    techDebt: items.filter(i => i.type === 'tech-debt').length,
  }), [items]);

  const toggleEpic = (epicId: string) => {
    setExpandedEpics(prev => {
      const next = new Set(prev);
      if (next.has(epicId)) {
        next.delete(epicId);
      } else {
        next.add(epicId);
      }
      return next;
    });
  };

  const loading = epicsLoading || itemsLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6" ref={contentRef}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Product Backlog</h1>
          <p className="text-sm text-muted-foreground mt-1">Prioritize and manage upcoming work items</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setViewMode('flat')}
              className={cn(
                'px-3 py-1 rounded text-sm font-medium transition-all',
                viewMode === 'flat' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Flat
            </button>
            <button
              onClick={() => setViewMode('epics')}
              className={cn(
                'px-3 py-1 rounded text-sm font-medium transition-all',
                viewMode === 'epics' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Layers className="h-3 w-3 inline mr-1" />
              Epics
            </button>
          </div>
          <PDFExporter
            title="Product Backlog"
            filename="backlog"
            contentRef={contentRef}
            variant="dropdown"
          />
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAddEpicDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Epic
          </Button>
          <Button size="sm" onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-4">
        <KPICard
          title="Total Items"
          value={items.length.toString()}
          subtitle={`${totalPoints} story points`}
          icon={ListTodo}
          status="neutral"
        />
        <KPICard
          title="Epics"
          value={epics.length.toString()}
          subtitle="Active initiatives"
          icon={Layers}
          status="neutral"
        />
        <KPICard
          title="Stories"
          value={typeCounts.story.toString()}
          subtitle="User stories"
          icon={Zap}
          status="neutral"
        />
        <KPICard
          title="Bugs"
          value={typeCounts.bug.toString()}
          subtitle="Issues to resolve"
          icon={Target}
          status={typeCounts.bug > 3 ? 'warning' : 'success'}
        />
        <KPICard
          title="Scheduled"
          value={scheduledItems.length.toString()}
          subtitle="In sprints"
          icon={Calendar}
          status="neutral"
        />
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search backlog items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Badge
            variant={filterType === null ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setFilterType(null)}
          >
            All
          </Badge>
          <Badge
            variant={filterType === 'feature' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setFilterType('story')}
          >
            Stories
          </Badge>
          <Badge
            variant={filterType === 'task' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setFilterType('task')}
          >
            Tasks
          </Badge>
          <Badge
            variant={filterType === 'bug' ? 'destructive' : 'outline'}
            className="cursor-pointer"
            onClick={() => setFilterType('bug')}
          >
            Bugs
          </Badge>

          <Badge
            variant={filterType === 'tech-debt' ? 'warning' : 'outline'}
            className="cursor-pointer"
            onClick={() => setFilterType('tech-debt')}
          >
            Tech Debt
          </Badge>
        </div>
      </div>

      {/* Epic View */}
      {viewMode === 'epics' && (
        <div className="space-y-4">
          {epics.map((epic) => {
            const epicItems = itemsByEpic[epic.id] || [];
            const isExpanded = expandedEpics.has(epic.id);
            const epicPoints = epicItems.reduce((sum, i) => sum + (i.story_points || 0), 0);

            return (
              <Card key={epic.id} className="overflow-hidden">
                <div
                  className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => toggleEpic(epic.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div className={cn('w-3 h-3 rounded-full', `bg-${epic.color}-500`)} style={{ backgroundColor: epic.color.startsWith('#') ? epic.color : undefined }} />
                      <div>
                        <h3 className="font-semibold">{epic.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {epicItems.length} items • {epicPoints} points
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{epic.progress}%</span>
                        </div>
                        <Progress value={epic.progress} className="h-2" />
                      </div>
                      <Badge variant="outline">{epic.completed_points}/{epic.total_points} pts</Badge>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && epicItems.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t"
                    >
                      <div className="divide-y divide-border">
                        {epicItems.map((item) => (
                          <BacklogItemRow
                            key={item.id}
                            item={item}
                            epic={epic}
                            onUpdate={updateItem}
                            onDelete={deleteItem}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })}

          {/* Unassigned Items */}
          {itemsByEpic.unassigned.length > 0 && (
            <Card>
              <div
                className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => toggleEpic('unassigned')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {expandedEpics.has('unassigned') ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
                    <div>
                      <h3 className="font-semibold text-muted-foreground">No Epic</h3>
                      <p className="text-xs text-muted-foreground">
                        {itemsByEpic.unassigned.length} items
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {expandedEpics.has('unassigned') && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t"
                  >
                    <div className="divide-y divide-border">
                      {itemsByEpic.unassigned.map((item) => (
                        <BacklogItemRow
                          key={item.id}
                          item={item}
                          onUpdate={updateItem}
                          onDelete={deleteItem}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          )}

          {items.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No backlog items found. Add your first item to get started.</p>
            </Card>
          )}
        </div>
      )}

      {/* Flat View */}
      {viewMode === 'flat' && (
        <Card>
          <div className="divide-y divide-border">
            {filteredItems.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">No backlog items found.</p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <BacklogItemRow
                  key={item.id}
                  item={item}
                  epic={epics.find(e => e.id === item.epic_id)}
                  onUpdate={updateItem}
                  onDelete={deleteItem}
                />
              ))
            )}
          </div>
        </Card>
      )}

      <AddItemDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onSubmit={createItem} epics={epics} />
      <AddEpicDialog open={addEpicDialogOpen} onOpenChange={setAddEpicDialogOpen} onSubmit={createEpic} />
    </div>
  );
}
