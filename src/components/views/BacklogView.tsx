import { useState, useMemo } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  ListTodo, 
  Plus,
  Filter,
  Search,
  MoreHorizontal,
  GripVertical,
  User,
  Calendar,
  Tag,
  Clock,
  ChevronDown,
  ChevronRight,
  Layers,
  Target,
  Zap,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { KPICard } from '@/components/enterprise/KPICard';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';

interface Epic {
  id: string;
  name: string;
  color: string;
  progress: number;
  totalPoints: number;
  completedPoints: number;
}

interface BacklogItem {
  id: string;
  title: string;
  description: string;
  type: 'feature' | 'bug' | 'enhancement' | 'technical-debt';
  priority: 'critical' | 'high' | 'medium' | 'low';
  storyPoints: number;
  assignee?: string;
  labels: string[];
  createdAt: string;
  sprint?: string;
  epicId?: string;
}

const mockEpics: Epic[] = [
  { id: 'epic-1', name: 'User Authentication', color: 'bg-blue-500', progress: 75, totalPoints: 21, completedPoints: 16 },
  { id: 'epic-2', name: 'Dashboard Redesign', color: 'bg-purple-500', progress: 30, totalPoints: 34, completedPoints: 10 },
  { id: 'epic-3', name: 'API Performance', color: 'bg-orange-500', progress: 50, totalPoints: 18, completedPoints: 9 },
  { id: 'epic-4', name: 'Mobile Responsiveness', color: 'bg-green-500', progress: 10, totalPoints: 13, completedPoints: 1 },
];

const mockBacklogItems: BacklogItem[] = [
  { id: 'bl-1', title: 'Implement user authentication flow', description: 'Add OAuth2 integration with Google and GitHub providers', type: 'feature', priority: 'critical', storyPoints: 8, assignee: 'Emily Johnson', labels: ['auth', 'security'], createdAt: '2024-03-01', sprint: 'Sprint 12', epicId: 'epic-1' },
  { id: 'bl-2', title: 'Fix dashboard loading performance', description: 'Optimize API calls and implement lazy loading for charts', type: 'bug', priority: 'high', storyPoints: 5, assignee: 'Robert Kim', labels: ['performance', 'dashboard'], createdAt: '2024-03-05', epicId: 'epic-2' },
  { id: 'bl-3', title: 'Add dark mode support', description: 'Implement system-wide dark theme with user preference persistence', type: 'enhancement', priority: 'medium', storyPoints: 3, labels: ['ui', 'theming'], createdAt: '2024-03-10', epicId: 'epic-2' },
  { id: 'bl-4', title: 'Refactor database queries', description: 'Optimize N+1 queries in project listing endpoints', type: 'technical-debt', priority: 'high', storyPoints: 5, labels: ['backend', 'database'], createdAt: '2024-03-12', epicId: 'epic-3' },
  { id: 'bl-5', title: 'Real-time notifications', description: 'Implement WebSocket-based notification system', type: 'feature', priority: 'medium', storyPoints: 13, labels: ['notifications', 'real-time'], createdAt: '2024-03-15' },
  { id: 'bl-6', title: 'Export reports to PDF', description: 'Add PDF export functionality for all report types', type: 'feature', priority: 'low', storyPoints: 5, labels: ['reports', 'export'], createdAt: '2024-03-18' },
  { id: 'bl-7', title: 'Mobile responsive improvements', description: 'Fix layout issues on mobile devices', type: 'bug', priority: 'medium', storyPoints: 3, assignee: 'Anna Martinez', labels: ['mobile', 'responsive'], createdAt: '2024-03-20', epicId: 'epic-4' },
  { id: 'bl-8', title: 'API rate limiting', description: 'Implement rate limiting for public API endpoints', type: 'technical-debt', priority: 'high', storyPoints: 8, labels: ['api', 'security'], createdAt: '2024-03-22', epicId: 'epic-3' },
  { id: 'bl-9', title: 'Session management', description: 'Add multi-device session tracking and management', type: 'feature', priority: 'medium', storyPoints: 5, labels: ['auth', 'security'], createdAt: '2024-03-25', epicId: 'epic-1' },
  { id: 'bl-10', title: 'Password reset flow', description: 'Implement secure password reset with email verification', type: 'feature', priority: 'high', storyPoints: 8, labels: ['auth'], createdAt: '2024-03-28', epicId: 'epic-1' },
];

const fibonacciPoints = [1, 2, 3, 5, 8, 13, 21];

const getTypeColor = (type: BacklogItem['type']) => {
  switch (type) {
    case 'feature': return 'bg-primary/10 text-primary';
    case 'bug': return 'bg-destructive/10 text-destructive';
    case 'enhancement': return 'bg-success/10 text-success';
    case 'technical-debt': return 'bg-warning/10 text-warning';
  }
};

const getPriorityVariant = (priority: BacklogItem['priority']) => {
  switch (priority) {
    case 'critical': return 'critical' as const;
    case 'high': return 'warning' as const;
    case 'medium': return 'default' as const;
    case 'low': return 'outline' as const;
  }
};

export function BacklogView() {
  const [items, setItems] = useState(mockBacklogItems);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set(mockEpics.map(e => e.id)));
  const [viewMode, setViewMode] = useState<'flat' | 'epics'>('epics');
  const [estimationDialogOpen, setEstimationDialogOpen] = useState(false);
  const [estimatingItem, setEstimatingItem] = useState<BacklogItem | null>(null);
  const [estimatedPoints, setEstimatedPoints] = useState<number>(3);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !filterType || item.type === filterType;
    return matchesSearch && matchesType;
  });

  // Group items by epic
  const itemsByEpic = useMemo(() => {
    const grouped: Record<string, BacklogItem[]> = { unassigned: [] };
    mockEpics.forEach(epic => { grouped[epic.id] = []; });
    
    filteredItems.forEach(item => {
      if (item.epicId && grouped[item.epicId]) {
        grouped[item.epicId].push(item);
      } else {
        grouped.unassigned.push(item);
      }
    });
    
    return grouped;
  }, [filteredItems]);

  const totalPoints = items.reduce((sum, item) => sum + item.storyPoints, 0);
  const scheduledPoints = items.filter(i => i.sprint).reduce((sum, item) => sum + item.storyPoints, 0);
  const unestimatedCount = items.filter(i => !i.storyPoints || i.storyPoints === 0).length;

  const typeCounts = {
    feature: items.filter(i => i.type === 'feature').length,
    bug: items.filter(i => i.type === 'bug').length,
    enhancement: items.filter(i => i.type === 'enhancement').length,
    technicalDebt: items.filter(i => i.type === 'technical-debt').length,
  };

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

  const handleEstimate = (item: BacklogItem) => {
    setEstimatingItem(item);
    setEstimatedPoints(item.storyPoints || 3);
    setEstimationDialogOpen(true);
  };

  const saveEstimation = () => {
    if (estimatingItem) {
      setItems(prev => prev.map(i => 
        i.id === estimatingItem.id ? { ...i, storyPoints: estimatedPoints } : i
      ));
    }
    setEstimationDialogOpen(false);
    setEstimatingItem(null);
  };

  const moveToSprint = (itemId: string, sprint: string) => {
    setItems(prev => prev.map(i => 
      i.id === itemId ? { ...i, sprint } : i
    ));
  };

  const getEpicById = (epicId?: string) => mockEpics.find(e => e.id === epicId);

  return (
    <div className="space-y-6 p-6">
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
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button size="sm">
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
          value={mockEpics.length.toString()} 
          subtitle="Active initiatives" 
          icon={Layers} 
          status="neutral" 
        />
        <KPICard 
          title="Features" 
          value={typeCounts.feature.toString()} 
          subtitle="New functionality" 
          icon={Sparkles} 
          status="neutral" 
        />
        <KPICard 
          title="Bugs" 
          value={typeCounts.bug.toString()} 
          subtitle="Issues to resolve" 
          icon={Zap} 
          status={typeCounts.bug > 3 ? 'warning' : 'success'} 
        />
        <KPICard 
          title="Scheduled" 
          value={items.filter(i => i.sprint).length.toString()} 
          subtitle={`${scheduledPoints} points planned`}
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
            onClick={() => setFilterType('feature')}
          >
            Features
          </Badge>
          <Badge 
            variant={filterType === 'bug' ? 'critical' : 'outline'} 
            className="cursor-pointer"
            onClick={() => setFilterType('bug')}
          >
            Bugs
          </Badge>
          <Badge 
            variant={filterType === 'enhancement' ? 'active' : 'outline'} 
            className="cursor-pointer"
            onClick={() => setFilterType('enhancement')}
          >
            Enhancements
          </Badge>
          <Badge 
            variant={filterType === 'technical-debt' ? 'warning' : 'outline'} 
            className="cursor-pointer"
            onClick={() => setFilterType('technical-debt')}
          >
            Tech Debt
          </Badge>
        </div>
      </div>

      {/* Epic View */}
      {viewMode === 'epics' && (
        <div className="space-y-4">
          {mockEpics.map((epic) => {
            const epicItems = itemsByEpic[epic.id] || [];
            const isExpanded = expandedEpics.has(epic.id);
            const epicPoints = epicItems.reduce((sum, i) => sum + i.storyPoints, 0);
            
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
                      <div className={cn('w-3 h-3 rounded-full', epic.color)} />
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
                      <Badge variant="outline">{epic.completedPoints}/{epic.totalPoints} pts</Badge>
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
                            isExpanded={expandedItem === item.id}
                            onToggle={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                            onEstimate={() => handleEstimate(item)}
                            onMoveToSprint={moveToSprint}
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
                          isExpanded={expandedItem === item.id}
                          onToggle={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                          onEstimate={() => handleEstimate(item)}
                          onMoveToSprint={moveToSprint}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          )}
        </div>
      )}

      {/* Flat View */}
      {viewMode === 'flat' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Backlog Items</CardTitle>
              <span className="text-sm text-muted-foreground">{filteredItems.length} items</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {filteredItems.map((item) => (
                <BacklogItemRow 
                  key={item.id} 
                  item={item}
                  epic={getEpicById(item.epicId)}
                  isExpanded={expandedItem === item.id}
                  onToggle={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                  onEstimate={() => handleEstimate(item)}
                  onMoveToSprint={moveToSprint}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Story Point Estimation Dialog */}
      <Dialog open={estimationDialogOpen} onOpenChange={setEstimationDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Estimate Story Points
            </DialogTitle>
            <DialogDescription>
              {estimatingItem?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div>
              <Label className="text-sm font-medium mb-3 block">Fibonacci Scale</Label>
              <div className="flex gap-2">
                {fibonacciPoints.map((points) => (
                  <button
                    key={points}
                    onClick={() => setEstimatedPoints(points)}
                    className={cn(
                      'w-10 h-10 rounded-lg font-medium transition-all',
                      estimatedPoints === points 
                        ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2' 
                        : 'bg-muted hover:bg-muted/80'
                    )}
                  >
                    {points}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium mb-2 block">Or use slider</Label>
              <Slider
                value={[estimatedPoints]}
                onValueChange={([value]) => setEstimatedPoints(value)}
                max={21}
                min={1}
                step={1}
                className="py-4"
              />
              <div className="text-center text-2xl font-bold text-primary">{estimatedPoints} points</div>
            </div>

            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <p className="font-medium mb-1">Estimation Guide:</p>
              <ul className="text-muted-foreground space-y-1 text-xs">
                <li>• 1-2: Simple changes, quick fixes</li>
                <li>• 3-5: Medium complexity, few unknowns</li>
                <li>• 8-13: Complex, multiple components</li>
                <li>• 21: Very complex, consider breaking down</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEstimationDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEstimation}>
              Save Estimation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface BacklogItemRowProps {
  item: BacklogItem;
  epic?: Epic;
  isExpanded: boolean;
  onToggle: () => void;
  onEstimate: () => void;
  onMoveToSprint: (itemId: string, sprint: string) => void;
}

function BacklogItemRow({ item, epic, isExpanded, onToggle, onEstimate, onMoveToSprint }: BacklogItemRowProps) {
  return (
    <div className="group">
      <div 
        className="p-4 hover:bg-muted/30 transition-colors cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-start gap-4">
          <div className="cursor-grab text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="h-5 w-5" />
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(item.type)}`}>
                {item.type.replace('-', ' ')}
              </span>
              <h3 className="font-medium text-foreground">{item.title}</h3>
              <Badge variant={getPriorityVariant(item.priority)} className="text-xs">
                {item.priority}
              </Badge>
              {epic && (
                <div className="flex items-center gap-1.5">
                  <div className={cn('w-2 h-2 rounded-full', epic.color)} />
                  <span className="text-xs text-muted-foreground">{epic.name}</span>
                </div>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground line-clamp-1">{item.description}</p>
            
            {/* Expanded Content */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="pt-3 space-y-3"
                >
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {item.labels.map((label, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        {label}
                      </Badge>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {/* Story Points - Clickable for estimation */}
            <button
              onClick={(e) => { e.stopPropagation(); onEstimate(); }}
              className="flex items-center gap-1 px-2 py-1 rounded hover:bg-muted transition-colors"
            >
              <Clock className="h-4 w-4" />
              <span className="font-medium">{item.storyPoints} pts</span>
            </button>
            
            {item.assignee && (
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span className="max-w-[100px] truncate">{item.assignee}</span>
              </div>
            )}
            
            {item.sprint ? (
              <Badge variant="active" className="text-xs">
                {item.sprint}
              </Badge>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-6 text-xs" onClick={(e) => e.stopPropagation()}>
                    Schedule
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => onMoveToSprint(item.id, 'Sprint 12')}>
                    Sprint 12 (Current)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onMoveToSprint(item.id, 'Sprint 13')}>
                    Sprint 13
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onMoveToSprint(item.id, 'Sprint 14')}>
                    Sprint 14
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            <ChevronDown 
              className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
            />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEstimate()}>
                  <Target className="h-4 w-4 mr-2" />
                  Estimate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <ArrowUp className="h-4 w-4 mr-2" />
                  Move Up
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <ArrowDown className="h-4 w-4 mr-2" />
                  Move Down
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
