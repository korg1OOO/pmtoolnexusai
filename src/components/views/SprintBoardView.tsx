import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
  Loader2,
  TrendingDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PDFExporter } from '@/components/common/PDFExporter';
import { useSprints, Sprint } from '@/hooks/useSprints';
import { useBacklogItems, BacklogItem, BacklogStatus, PriorityLevel } from '@/hooks/useBacklogItems';
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

  const { sprints, activeSprint, loading: sprintsLoading } = useSprints();
  const { items, loading: itemsLoading, updateItem } = useBacklogItems();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<BacklogItem | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showBurndown, setShowBurndown] = useState(false);
  const [selectedSprint, setSelectedSprint] = useState<string>('active');
  const contentRef = useRef<HTMLDivElement>(null);

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
          document.querySelector<HTMLInputElement>('[data-search-input]')?.focus();
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

  return (
    <div className="flex flex-col h-full" ref={contentRef}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-4">
          <Select value={selectedSprint} onValueChange={setSelectedSprint}>
            <SelectTrigger className="w-48">
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
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{new Date(currentSprint.start_date).toLocaleDateString()} - {new Date(currentSprint.end_date).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 pl-9"
              data-search-input
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2">{activeFiltersCount}</Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Assignees</DropdownMenuLabel>
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
                >
                  {assignee}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Priority</DropdownMenuLabel>
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
                >
                  {priority}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" onClick={() => setShowBurndown(true)}>
            <TrendingDown className="h-4 w-4 mr-2" />
            Burndown
          </Button>

          <PDFExporter
            title={currentSprint?.name || 'Sprint Board'}
            filename="sprint-board"
            contentRef={contentRef}
            orientation="landscape"
            variant="dropdown"
          />

          <Button variant="ghost" size="iconSm" onClick={() => setShowShortcuts(true)}>
            <Keyboard className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Sprint Progress */}
      {currentSprint && (
        <div className="p-4 bg-muted/30 border-b">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <span className="font-medium">{currentSprint.name}</span>
              <Badge variant={currentSprint.status === 'active' ? 'success' : 'secondary'}>
                {currentSprint.status}
              </Badge>
              {currentSprint.goal && (
                <span className="text-sm text-muted-foreground">Goal: {currentSprint.goal}</span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm">{donePoints} / {totalPoints} points</span>
              <span className="text-sm font-medium">{progressPercent}%</span>
            </div>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <Progress value={progressPercent} className="h-full bg-success" />
          </div>
        </div>
      )}

      {/* Board */}
      <div className="flex-1 overflow-auto p-4">
        {!currentSprint ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No sprint selected. Create or select a sprint to view the board.</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4 min-h-full">
            {columns.map((column) => {
              const columnItems = getColumnItems(column.id);
              const columnPoints = getColumnPoints(column.id);

              return (
                <div key={column.id} className="flex flex-col min-h-0">
                  <div className="flex items-center justify-between p-3 rounded-t-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <div className={cn('w-2 h-2 rounded-full', column.color)} />
                      <span className="font-medium text-sm">{column.label}</span>
                      <Badge variant="secondary" className="text-xs">
                        {columnItems.length}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">{columnPoints} pts</span>
                  </div>

                  <ScrollArea className="flex-1 p-2 bg-muted/20 rounded-b-lg">
                    <div className="space-y-2">
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
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          No items
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
    </div>
  );
}
