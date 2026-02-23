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
  List,
  Table,
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DynamicDataGrid, type DynamicColumnDef } from '@/components/ui/DynamicDataGrid';
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
import { useSprints, Sprint } from '@/hooks/useSprints';
import { toast } from 'sonner';

const STANDARD_COLUMNS: DynamicColumnDef<BacklogItem>[] = [
  { key: 'key', label: 'Item Key', width: 100, type: 'text', sticky: true },
  { key: 'title', label: 'Title', width: 240, type: 'text' },
  { key: 'type', label: 'Type', width: 120, type: 'select', options: ['story', 'task', 'bug', 'tech-debt'] },
  { key: 'status', label: 'Status', width: 120, type: 'select', options: ['new', 'refined', 'ready', 'in-sprint', 'done'] },
  { key: 'priority', label: 'Priority', width: 120, type: 'select', options: ['low', 'medium', 'high', 'critical'] },
  { key: 'story_points', label: 'Story Points', width: 100, type: 'text' },
  { key: 'assignee_name', label: 'Assignee', width: 140, type: 'text' },
];

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
  sprint?: Sprint;
  onUpdate: (id: string, updates: Partial<BacklogItemInput>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onEdit: (item: BacklogItem) => void;
}

function BacklogItemRow({ item, epic, sprint, onUpdate, onDelete, onEdit }: BacklogItemRowProps) {
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
          <DropdownMenuItem onClick={() => onEdit(item)}>
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

interface EditItemDialogProps {
  item: BacklogItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (id: string, input: Partial<BacklogItemInput>) => Promise<boolean>;
  epics: Epic[];
  sprints: Sprint[];
}

function EditItemDialog({ item, open, onOpenChange, onSubmit, epics, sprints }: EditItemDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Partial<BacklogItemInput>>({});

  useMemo(() => {
    if (item) {
      setForm({
        title: item.title,
        description: item.description,
        type: item.type,
        priority: item.priority,
        story_points: item.story_points,
        epic_id: item.epic_id,
        assignee_name: item.assignee_name,
        sprint_id: item.sprint_id,
      });
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item || !form.title?.trim()) {
      toast.error('Title is required');
      return;
    }
    setLoading(true);
    const result = await onSubmit(item.id, form);
    setLoading(false);
    if (result) {
      onOpenChange(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Backlog Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Item title" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the item" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              <Select value={form.story_points?.toString() || 'none'} onValueChange={v => setForm(f => ({ ...f, story_points: v === 'none' ? undefined : parseInt(v) }))}>
                <SelectTrigger><SelectValue placeholder="Est" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {[1, 2, 3, 5, 8, 13, 21].map(p => (
                    <SelectItem key={p} value={p.toString()}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assignee</Label>
              <Input value={form.assignee_name || ''} onChange={e => setForm(f => ({ ...f, assignee_name: e.target.value }))} placeholder="Name" />
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
              <Label>Sprint</Label>
              <Select value={form.sprint_id || 'none'} onValueChange={v => setForm(f => ({ ...f, sprint_id: v === 'none' ? undefined : v }))}>
                <SelectTrigger><SelectValue placeholder="Backlog" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Backlog (No Sprint)</SelectItem>
                  {sprints.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
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
  const { sprints, loading: sprintsLoading } = useSprints();
  const { items, loading: itemsLoading, createItem, updateItem, deleteItem, totalPoints, scheduledItems } = useBacklogItems();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set());
  const [listMode, setListMode] = useState<'flat' | 'epics'>('epics');
  const [viewMode, setViewMode] = useState<'list' | 'spreadsheet'>('list');
  const [customColumns, setCustomColumns] = useState<DynamicColumnDef<BacklogItem>[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addEpicDialogOpen, setAddEpicDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BacklogItem | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleEditItem = (item: BacklogItem) => {
    setEditingItem(item);
    setEditDialogOpen(true);
  };

  const handleCellSave = async (rowId: string, key: string, value: string) => {
    const isCustom = !STANDARD_COLUMNS.find(c => c.key === key);
    const item = items.find(i => i.id === rowId);
    if (!item) return;

    if (isCustom) {
      const cf = { ...(item.custom_fields ?? {}), [key]: value };
      await updateItem(rowId, { custom_fields: cf });
    } else {
      if (key === 'story_points') {
        const numVal = parseInt(value, 10);
        await updateItem(rowId, { [key]: isNaN(numVal) ? undefined : numVal });
      } else {
        await updateItem(rowId, { [key]: value });
      }
    }
  };

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
          {viewMode === 'list' && (
            <div className="flex gap-1 p-1 bg-muted rounded-lg mr-2">
              <button
                onClick={() => setListMode('flat')}
                className={cn(
                  'px-3 py-1 rounded text-sm font-medium transition-all',
                  listMode === 'flat' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Flat
              </button>
              <button
                onClick={() => setListMode('epics')}
                className={cn(
                  'px-3 py-1 rounded text-sm font-medium transition-all',
                  listMode === 'epics' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Layers className="h-3 w-3 inline mr-1" />
                Epics
              </button>
            </div>
          )}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'spreadsheet')} className="w-auto">
            <TabsList className="h-8">
              <TabsTrigger value="list" className="h-6 px-2.5 text-xs"><List className="h-3.5 w-3.5 mr-1.5" /> Dashboard & List</TabsTrigger>
              <TabsTrigger value="spreadsheet" className="h-6 px-2.5 text-xs"><Table className="h-3.5 w-3.5 mr-1.5" /> Spreadsheet</TabsTrigger>
            </TabsList>
          </Tabs>
          <PDFExporter
            title="Product Backlog"
            filename="product-backlog"
            contentRef={contentRef}
            sections={[]} // Assuming sections is an empty array or defined elsewhere
            showSectionPicker
            variant="dropdown"
          />
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          {viewMode !== 'spreadsheet' && (
            <>
              <Button size="sm" onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </>
          )}
        </div>
      </div>

      {viewMode !== 'spreadsheet' && (
        <div className="flex items-center justify-between gap-3 px-6 py-2.5 border-b bg-muted/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                className="pl-8 h-7 text-xs w-56 border-border/60"
                placeholder="Search backlog items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 h-7">
              <Badge
                variant={filterType === null ? 'default' : 'outline'}
                className="cursor-pointer text-[10px] h-full flex items-center"
                onClick={() => setFilterType(null)}
              >
                All
              </Badge>
              <Badge
                variant={filterType === 'story' ? 'default' : 'outline'}
                className="cursor-pointer text-[10px] h-full flex items-center"
                onClick={() => setFilterType('story')}
              >
                Stories
              </Badge>
              <Badge
                variant={filterType === 'task' ? 'default' : 'outline'}
                className="cursor-pointer text-[10px] h-full flex items-center"
                onClick={() => setFilterType('task')}
              >
                Tasks
              </Badge>
              <Badge
                variant={filterType === 'bug' ? 'destructive' : 'outline'}
                className="cursor-pointer text-[10px] h-full flex items-center"
                onClick={() => setFilterType('bug')}
              >
                Bugs
              </Badge>
              <Badge
                variant={filterType === 'tech-debt' ? 'warning' : 'outline'}
                className="cursor-pointer text-[10px] h-full flex items-center"
                onClick={() => setFilterType('tech-debt')}
              >
                Tech Debt
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {viewMode === 'list' && (
              <div className="flex gap-1 p-1 bg-muted rounded-lg">
                <button
                  onClick={() => setListMode('flat')}
                  className={cn(
                    'px-3 py-1 rounded text-sm font-medium transition-all',
                    listMode === 'flat' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Flat
                </button>
                <button
                  onClick={() => setListMode('epics')}
                  className={cn(
                    'px-3 py-1 rounded text-sm font-medium transition-all',
                    listMode === 'epics' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Layers className="h-3 w-3 inline mr-1" />
                  Epics
                </button>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        className="pl-8 h-7 text-xs w-56 border-border/60"
                        placeholder="Search backlog items..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-2 h-7">
                      <Badge
                        variant={filterType === null ? 'default' : 'outline'}
                        className="cursor-pointer text-[10px] h-full flex items-center"
                        onClick={() => setFilterType(null)}
                      >
                        All
                      </Badge>
                      <Badge
                        variant={filterType === 'story' ? 'default' : 'outline'}
                        className="cursor-pointer text-[10px] h-full flex items-center"
                        onClick={() => setFilterType('story')}
                      >
                        Stories
                      </Badge>
                      <Badge
                        variant={filterType === 'task' ? 'default' : 'outline'}
                        className="cursor-pointer text-[10px] h-full flex items-center"
                        onClick={() => setFilterType('task')}
                      >
                        Tasks
                      </Badge>
                      <Badge
                        variant={filterType === 'bug' ? 'destructive' : 'outline'}
                        className="cursor-pointer text-[10px] h-full flex items-center"
                        onClick={() => setFilterType('bug')}
                      >
                        Bugs
                      </Badge>
                      <Badge
                        variant={filterType === 'tech-debt' ? 'warning' : 'outline'}
                        className="cursor-pointer text-[10px] h-full flex items-center"
                        onClick={() => setFilterType('tech-debt')}
                      >
                        Tech Debt
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {viewMode === 'list' && (
                      <div className="flex gap-1 p-1 bg-muted rounded-lg">
                        <button
                          onClick={() => setListMode('flat')}
                          className={cn(
                            'px-3 py-1 rounded text-sm font-medium transition-all',
                            listMode === 'flat' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          Flat
                        </button>
                        <button
                          onClick={() => setListMode('epics')}
                          className={cn(
                            'px-3 py-1 rounded text-sm font-medium transition-all',
                            listMode === 'epics' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          <Layers className="h-3 w-3 inline mr-1" />
                          Epics
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {viewMode !== 'spreadsheet' && (
              <>
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
              </>
            )}

            {
              viewMode === 'spreadsheet' ? (
                <div className="h-[600px] bg-background border rounded-md shadow-sm overflow-hidden mt-6">
                  <DynamicDataGrid
                    data={filteredItems}
                    baseColumns={STANDARD_COLUMNS}
                    customColumns={customColumns}
                    idExtractor={(item) => item.id}
                    customFieldExtractor={(item, key) => String(item.custom_fields?.[key] ?? '')}
                    onCellSave={handleCellSave}
                    onDeleteRows={(ids) => {
                      ids.forEach(id => deleteItem(id));
                    }}
                    onAddColumn={(col) => {
                      if (customColumns.find(c => c.key === col.key)) {
                        toast.error('Column already exists');
                        return;
                      }
                      setCustomColumns(prev => [...prev, col]);
                      toast.success(`Column "${col.label}" added`);
                    }}
                    onRemoveColumn={(key) => setCustomColumns(prev => prev.filter(c => c.key !== key))}
                    onAddRow={() => setAddDialogOpen(true)}
                    emptyStateMessage={items.length === 0 ? 'No backlog items yet.' : 'No items match filters.'}
                    containerStyles="h-full border-0"
                  />
                </div>
              ) : (
                <>
                  {/* Epic View */}
                  {listMode === 'epics' && (
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
                                        onEdit={handleEditItem}
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
                                      onEdit={handleEditItem}
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
                  {listMode === 'flat' && (
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
                              onEdit={handleEditItem}
                            />
                          ))
                        )}
                      </div>
                    </Card>
                  )}
                </>
              )
            }
          </div>
        )}      <AddItemDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onSubmit={createItem} epics={epics} />
          <AddEpicDialog open={addEpicDialogOpen} onOpenChange={setAddEpicDialogOpen} onSubmit={createEpic} />
          <EditItemDialog
            item={editingItem}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onSubmit={updateItem}
            epics={epics}
            sprints={sprints}
          />
        </div>
      );
}
