import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { useProjectContext } from '@/contexts/ProjectContext';
import { motion, useDragControls } from 'framer-motion';
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
  X,
  Keyboard,
  ChevronDown,
  TrendingDown,
  List,
  Table,
  Loader2,
} from 'lucide-react';
import { DataRegisterPage } from '@/components/ui/DataRegisterPage';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DynamicDataGrid, type DynamicColumnDef } from '@/components/ui/DynamicDataGrid';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PDFExporter } from '@/components/common/PDFExporter';
import { useSprints, Sprint, SprintInput } from '@/hooks/useSprints';
import { useBacklogItems, BacklogItem, BacklogStatus, PriorityLevel } from '@/hooks/useBacklogItems';
import { Label } from '@/components/ui/label';
import { SprintBurndownChart } from '@/components/sprint/SprintBurndownChart';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { SprintCard } from '@/components/sprint/SprintCard';
import { KeyboardShortcutsDialog } from '@/components/sprint/KeyboardShortcutsDialog';
import { Progress } from '@/components/ui/progress';

type SprintStatus = 'todo' | 'in-progress' | 'review' | 'done';
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

export function AddSprintDialog({ open, onOpenChange, onSubmit }: { open: boolean, onOpenChange: (open: boolean) => void, onSubmit: (input: SprintInput) => Promise<Sprint | null> }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<SprintInput>({
    name: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    goal: '',
    capacity: 0,
    status: 'planning'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.start_date || !form.end_date) return;
    setLoading(true);
    const result = await onSubmit(form);
    setLoading(false);
    if (result) {
      setForm({ name: '', start_date: new Date().toISOString().split('T')[0], end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], goal: '', capacity: 0, status: 'planning' });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Sprint</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Sprint name" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>End Date *</Label>
              <Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Goal</Label>
            <Input value={form.goal || ''} onChange={e => setForm(f => ({ ...f, goal: e.target.value }))} placeholder="Sprint goal" />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function SprintBoardView() {
  const columns: { id: SprintStatus; label: string; color: string; dbStatus: BacklogStatus }[] = useMemo(() => [
    { id: 'todo', label: 'To Do', color: 'bg-muted', dbStatus: 'todo' },
    { id: 'in-progress', label: 'In Progress', color: 'bg-primary', dbStatus: 'in-progress' },
    { id: 'review', label: 'In Review', color: 'bg-purple-500', dbStatus: 'review' },
    { id: 'done', label: 'Done', color: 'bg-success', dbStatus: 'done' },
  ], []);

  const priorityOrder: Record<PriorityLevel, number> = useMemo(() => ({
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  }), []);

  const { sprints, activeSprint, loading: sprintsLoading, createSprint } = useSprints();
  const { items, loading: itemsLoading, updateItem } = useBacklogItems();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<BacklogItem | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showBurndown, setShowBurndown] = useState(false);
  const [addSprintDialogOpen, setAddSprintDialogOpen] = useState(false);
  const [selectedSprint, setSelectedSprint] = useState<string>('active');
  const [customColumns, setCustomColumns] = useState<DynamicColumnDef<BacklogItem>[]>([]);
  const { settings } = useProjectContext();
  const { can } = usePermissions(settings?.id);
  const canCreate = can('task.create');
  const canEdit = can('task.edit');

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

  // Filter state
  const [filters, setFilters] = useState({
    assignees: [] as string[],
    priorities: [] as PriorityLevel[],
    labels: [] as string[],
    types: [] as string[],
  });

  // Sort state
  const [sortBy, setSortBy] = useState<'priority' | 'storyPoints' | 'assignee'>('priority');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Get sprint items
  const sprintItems = useMemo(() => {
    const sprintId = selectedSprint === 'active' ? activeSprint?.id : selectedSprint;
    if (!sprintId) return [];
    return items.filter(item => item.sprint_id === sprintId);
  }, [items, selectedSprint, activeSprint]);

  // Get unique values for filters
  const allAssignees = useMemo(() => {
    const assignees = new Set<string>();
    sprintItems.forEach(item => {
      if (item.assignee_name) assignees.add(item.assignee_name);
    });
    return Array.from(assignees);
  }, [sprintItems]);

  const allLabels = useMemo(() => {
    const labels = new Set<string>();
    sprintItems.forEach(item => {
      item.labels.forEach(label => labels.add(label));
    });
    return Array.from(labels);
  }, [sprintItems]);

  const allPriorities: PriorityLevel[] = ['critical', 'high', 'medium', 'low'];

  // Apply filters and sorting
  const getColumnItems = useCallback((status: SprintStatus) => {
    const dbStatus = columns.find(c => c.id === status)?.dbStatus;

    const filtered = sprintItems.filter(item => {
      if (item.status !== dbStatus) return false;
      if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !(item.key?.toLowerCase().includes(searchQuery.toLowerCase()))) return false;
      if (filters.assignees.length > 0 && !filters.assignees.includes(item.assignee_name || '')) return false;
      if (filters.priorities.length > 0 && !filters.priorities.includes(item.priority)) return false;
      if (filters.labels.length > 0 && !filters.labels.some(l => item.labels.includes(l))) return false;
      if (filters.types.length > 0 && !filters.types.includes(item.type)) return false;
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
          comparison = (a.story_points || 0) - (b.story_points || 0);
          break;
        case 'assignee':
          comparison = (a.assignee_name || '').localeCompare(b.assignee_name || '');
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [sprintItems, searchQuery, filters, sortBy, sortOrder, columns, priorityOrder]);

  const getColumnPoints = (status: SprintStatus) =>
    getColumnItems(status).reduce((sum, item) => sum + (item.story_points || 0), 0);

  const totalPoints = sprintItems.reduce((sum, item) => sum + (item.story_points || 0), 0);
  const donePoints = getColumnPoints('done');
  const progressPercent = totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : 0;

  const activeFiltersCount = filters.assignees.length + filters.priorities.length +
    filters.labels.length + filters.types.length;

  const handleStatusChange = useCallback(async (itemId: string, newStatus: BacklogStatus) => {
    await updateItem(itemId, { status: newStatus });
  }, [updateItem]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case 'f':
          e.preventDefault();
          setShowFilters(!showFilters);
          break;
        case '/':
          e.preventDefault();
          const searchInput = document.querySelector<HTMLInputElement>('input[placeholder*="search" i]');
          if (searchInput) searchInput.focus();
          break;
        case 'escape':
          setSelectedItem(null);
          break;
        case '?':
          e.preventDefault();
          setShowShortcuts(true);
          break;
        case 'arrowleft':
        case 'arrowright':
          if (selectedItem) {
            e.preventDefault();
            const currentColIndex = columns.findIndex(c => c.dbStatus === selectedItem.status);
            const newIndex = e.key === 'arrowleft'
              ? Math.max(0, currentColIndex - 1)
              : Math.min(columns.length - 1, currentColIndex + 1);
            handleStatusChange(selectedItem.id, columns[newIndex].dbStatus);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem, showFilters, columns, handleStatusChange]);

  const loading = sprintsLoading || itemsLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentSprint = selectedSprint === 'active' ? activeSprint : sprints.find(s => s.id === selectedSprint);

  const toolbarFilters = (
    <div className="flex items-center gap-3 w-full">
      <Select value={selectedSprint} onValueChange={setSelectedSprint}>
        <SelectTrigger className="w-48 h-8 text-xs bg-background">
          <SelectValue placeholder="Select sprint" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="active">Active Sprint</SelectItem>
          {sprints.map(sprint => (
            <SelectItem key={sprint.id} value={sprint.id}>{sprint.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {currentSprint && (
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground border-l border-border/50 pl-3 ml-1 mr-auto hidden sm:flex">
          <Clock className="h-3 w-3" />
          <span>{new Date(currentSprint.start_date).toLocaleDateString()} - {new Date(currentSprint.end_date).toLocaleDateString()}</span>
        </div>
      )}

      <DropdownMenu open={showFilters} onOpenChange={setShowFilters}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 text-xs border-border/60 bg-background">
            <Filter className="h-3.5 w-3.5 mr-2" />
            Filter
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-4 px-1 rounded-sm text-[10px]">{activeFiltersCount}</Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="text-xs">Assignees</DropdownMenuLabel>
          {allAssignees.map(assignee => (
            <DropdownMenuCheckboxItem
              key={assignee}
              checked={filters.assignees.includes(assignee)}
              onCheckedChange={(checked) => {
                setFilters(prev => ({
                  ...prev,
                  assignees: checked
                    ? [...prev.assignees, assignee]
                    : prev.assignees.filter(a => a !== assignee)
                }));
              }}
              className="text-xs"
            >
              {assignee}
            </DropdownMenuCheckboxItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs">Priority</DropdownMenuLabel>
          {allPriorities.map(priority => (
            <DropdownMenuCheckboxItem
              key={priority}
              checked={filters.priorities.includes(priority)}
              onCheckedChange={(checked) => {
                setFilters(prev => ({
                  ...prev,
                  priorities: checked
                    ? [...prev.priorities, priority]
                    : prev.priorities.filter(p => p !== priority)
                }));
              }}
              className="text-xs capitalize"
            >
              {priority}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="outline" size="sm" className="h-8 text-xs border-border/60 bg-background" onClick={() => setShowBurndown(true)}>
        <TrendingDown className="h-3.5 w-3.5 mr-2" />
        Burndown
      </Button>

      <Button variant="ghost" size="icon" className="h-8 w-8 ml-1 text-muted-foreground hover:text-foreground" onClick={() => setShowShortcuts(true)}>
        <Keyboard className="h-4 w-4" />
      </Button>
    </div>
  );

  const listContent = (
    <div className="flex flex-col h-full space-y-4">
      {/* Sprint Progress */}
      {currentSprint && (
        <div className="p-4 bg-background border rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-sm">{currentSprint.name}</span>
              <Badge variant={currentSprint.status === 'active' ? 'success' : 'secondary'} className="text-[10px] uppercase">
                {currentSprint.status}
              </Badge>
              {currentSprint.goal && (
                <span className="text-xs text-muted-foreground hidden md:inline ml-2"><span className="font-medium">Goal:</span> {currentSprint.goal}</span>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="text-muted-foreground"><span className="font-medium text-foreground">{donePoints}</span> / {totalPoints} pts</span>
              <span className="font-bold text-primary">{progressPercent}%</span>
            </div>
          </div>
          <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
            <Progress value={progressPercent} className="h-full bg-primary transition-all duration-500" />
          </div>
        </div>
      )}

      {/* Board */}
      <div className="flex-1 min-h-[500px]">
        {!currentSprint ? (
          <div className="flex flex-col items-center justify-center h-full border rounded-lg bg-muted/10 border-dashed">
            <List className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No sprint selected. Create or select a sprint to view the board.</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4 h-full">
            {columns.map((column) => {
              const columnItems = getColumnItems(column.id);
              const columnPoints = getColumnPoints(column.id);

              return (
                <div key={column.id} className="flex flex-col h-full bg-muted/30 border rounded-lg overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between p-3 border-b bg-background/50 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <div className={cn('w-2 h-2 rounded-full', column.color)} />
                      <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">{column.label}</span>
                      <Badge variant="secondary" className="text-[10px] px-1.5 min-w-[20px] justify-center ml-1">
                        {columnItems.length}
                      </Badge>
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground">{columnPoints} pts</span>
                  </div>

                  <ScrollArea className="flex-1 p-2">
                    <div className="space-y-2 pb-2">
                      {columnItems.map((item) => (
                        <SprintCard
                          key={item.id}
                          item={item}
                          isSelected={selectedItem?.id === item.id}
                          onSelect={() => setSelectedItem(item)}
                          onStatusChange={(status) => handleStatusChange(item.id, status)}
                          columns={columns}
                        />
                      ))}
                      {columnItems.length === 0 && (
                        <div className="p-4 text-center text-xs text-muted-foreground/60 flex flex-col items-center justify-center h-24 border border-dashed rounded-md mx-1 mt-1 bg-background/30">
                          Empty
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <KeyboardShortcutsDialog open={showShortcuts} onOpenChange={setShowShortcuts} />

      <Dialog open={showBurndown} onOpenChange={setShowBurndown}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Sprint Burndown</DialogTitle>
          </DialogHeader>
          {currentSprint && (
            <SprintBurndownChart
              sprintName={currentSprint.name}
              totalPoints={totalPoints}
              completedPoints={donePoints}
              daysRemaining={Math.max(0, Math.ceil((new Date(currentSprint.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))}
            />
          )}
        </DialogContent>
      </Dialog>

      <AddSprintDialog open={addSprintDialogOpen} onOpenChange={setAddSprintDialogOpen} onSubmit={createSprint} />
    </div>
  );

  return (
    <DataRegisterPage
      title="Sprint Board"
      description="Manage tasks and track sprint progress"
      icon={List}
      iconBgClass="bg-primary/20"
      iconColorClass="text-primary"
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      toolbarFilters={toolbarFilters}
      onAddRow={canCreate ? () => setAddSprintDialogOpen(true) : undefined}
      addLabel="Create Sprint"
      pdfFilename="sprint-board"
      data={sprintItems}
      baseColumns={STANDARD_COLUMNS}
      customColumns={customColumns}
      idExtractor={(item) => item.id}
      customFieldExtractor={(item, key) => String(item.custom_fields?.[key] ?? '')}
      onCellSave={canEdit ? handleCellSave : undefined}
      onAddColumn={(col) => {
        if (customColumns.find(c => c.key === col.key)) {
          toast.error('Column already exists');
          return;
        }
        setCustomColumns(prev => [...prev, col]);
        toast.success(`Column "${col.label}" added`);
      }}
      onRemoveColumn={(key) => setCustomColumns(prev => prev.filter(c => c.key !== key))}
      onDeleteRows={() => toast.error("Bulk deletion not supported in sprint board")}
      emptyStateMessage={sprintItems.length === 0 ? 'No items in this sprint.' : 'No items match filters.'}
      listContent={listContent}
    />
  );
}
