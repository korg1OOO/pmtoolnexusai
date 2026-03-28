import React, { useState } from 'react';
import {
  Check,
  ChevronDown,
  Plus,
  X,
  FileText,
  Layout,
  BarChart3,
  Calendar,
  Users,
  AlertTriangle,
  DollarSign,
  Target,
  MessageSquare,
  Folder,
  Flag,
  GitBranch,
  TrendingUp,
  CheckCircle2,
  ListTodo,
  Scale,
  Settings,
  Presentation,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

export interface ContextItem {
  id: string;
  type: 'page' | 'text';
  label: string;
  icon?: React.ReactNode;
  description?: string;
}

interface ContextSelectorProps {
  selectedContexts: ContextItem[];
  onContextChange: (contexts: ContextItem[]) => void;
  currentView: string;
  compact?: boolean;
}

// Available pages/modules
const AVAILABLE_PAGES: ContextItem[] = [
  { id: 'dashboard', type: 'page', label: 'Dashboard', icon: <Layout className="h-4 w-4" />, description: 'Project overview and KPIs' },
  { id: 'gantt', type: 'page', label: 'Gantt Chart', icon: <BarChart3 className="h-4 w-4" />, description: 'Schedule and dependencies' },
  { id: 'project-plan', type: 'page', label: 'Project Plan', icon: <ListTodo className="h-4 w-4" />, description: 'Task breakdown and assignments' },
  { id: 'sprints', type: 'page', label: 'Sprint Board', icon: <Target className="h-4 w-4" />, description: 'Agile sprint management' },
  { id: 'risks', type: 'page', label: 'Risk Register', icon: <AlertTriangle className="h-4 w-4" />, description: 'Risks and mitigation' },
  { id: 'issues', type: 'page', label: 'Issues Register', icon: <AlertTriangle className="h-4 w-4" />, description: 'Active issues and blockers' },
  { id: 'financials', type: 'page', label: 'Financials', icon: <DollarSign className="h-4 w-4" />, description: 'Budget and costs' },
  { id: 'evm', type: 'page', label: 'Earned Value', icon: <TrendingUp className="h-4 w-4" />, description: 'EVM metrics and forecasts' },
  { id: 'resources', type: 'page', label: 'Resources', icon: <Users className="h-4 w-4" />, description: 'Team allocation and capacity' },
  { id: 'meetings', type: 'page', label: 'Meetings', icon: <Calendar className="h-4 w-4" />, description: 'Meeting notes and actions' },
  { id: 'calendar', type: 'page', label: 'Calendar', icon: <Calendar className="h-4 w-4" />, description: 'Project calendar' },
  { id: 'communications', type: 'page', label: 'Communications', icon: <MessageSquare className="h-4 w-4" />, description: 'Email and messages' },
  { id: 'documents', type: 'page', label: 'Documents', icon: <Folder className="h-4 w-4" />, description: 'Project files' },
  { id: 'notes', type: 'page', label: 'Notes', icon: <FileText className="h-4 w-4" />, description: 'Project notes' },
  { id: 'presentations', type: 'page', label: 'Presentations', icon: <Presentation className="h-4 w-4" />, description: 'Slides and decks' },
  { id: 'stakeholders', type: 'page', label: 'Stakeholders', icon: <Users className="h-4 w-4" />, description: 'Stakeholder register' },
  { id: 'milestones', type: 'page', label: 'Milestones', icon: <Flag className="h-4 w-4" />, description: 'Key milestones' },
  { id: 'deliverables', type: 'page', label: 'Deliverables', icon: <CheckCircle2 className="h-4 w-4" />, description: 'Project deliverables' },
  { id: 'change-requests', type: 'page', label: 'Change Requests', icon: <GitBranch className="h-4 w-4" />, description: 'Change control' },
  { id: 'tracking', type: 'page', label: 'Tracking', icon: <TrendingUp className="h-4 w-4" />, description: 'Baseline comparison' },
  { id: 'decisions', type: 'page', label: 'Decisions', icon: <Scale className="h-4 w-4" />, description: 'Decision log' },
  { id: 'actions', type: 'page', label: 'Actions', icon: <CheckCircle2 className="h-4 w-4" />, description: 'Action items' },
  { id: 'team-chat', type: 'page', label: 'Team Chat', icon: <MessageSquare className="h-4 w-4" />, description: 'Team collaboration' },
];

export function ContextSelector({ selectedContexts, onContextChange, currentView, compact = false }: ContextSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [customText, setCustomText] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

  const selectedPageIds = selectedContexts.filter(c => c.type === 'page').map(c => c.id);
  const customTexts = selectedContexts.filter(c => c.type === 'text');

  const handlePageToggle = (page: ContextItem) => {
    const isSelected = selectedPageIds.includes(page.id);
    if (isSelected) {
      onContextChange(selectedContexts.filter(c => c.id !== page.id));
    } else {
      onContextChange([...selectedContexts, page]);
    }
  };

  const handleAddCustomText = () => {
    if (!customText.trim()) return;

    const newContext: ContextItem = {
      id: `text-${Date.now()}`,
      type: 'text',
      label: customText.trim().slice(0, 50) + (customText.length > 50 ? '...' : ''),
      description: customText.trim(),
    };

    onContextChange([...selectedContexts, newContext]);
    setCustomText('');
    setShowTextInput(false);
  };

  const handleRemoveContext = (contextId: string) => {
    onContextChange(selectedContexts.filter(c => c.id !== contextId));
  };

  const handleSelectAll = () => {
    const allPages = AVAILABLE_PAGES.map(p => ({ ...p }));
    const existingTexts = selectedContexts.filter(c => c.type === 'text');
    onContextChange([...allPages, ...existingTexts]);
  };

  const handleClearPages = () => {
    onContextChange(selectedContexts.filter(c => c.type === 'text'));
  };

  // Track if we've already auto-added to prevent infinite loops
  const hasAutoAddedRef = React.useRef(false);

  // Auto-add current page only once on mount when contexts are empty
  React.useEffect(() => {
    if (!hasAutoAddedRef.current && selectedContexts.length === 0) {
      const currentPage = AVAILABLE_PAGES.find(p => p.id === currentView);
      if (currentPage) {
        hasAutoAddedRef.current = true;
        onContextChange([currentPage]);
      }
    }
  }, [currentView, selectedContexts.length, onContextChange]);

  // Reset ref when view changes to allow re-initialization
  React.useEffect(() => {
    hasAutoAddedRef.current = false;
  }, [currentView]);

  // Compact mode: Just show a button to add more context
  if (compact) {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-5 px-2 text-xs gap-1">
            <Plus className="h-3 w-3" />
            Add
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search pages..." />
            <div className="flex items-center justify-between px-2 py-1.5 border-b">
              <Button variant="ghost" size="sm" className="text-xs h-6" onClick={handleSelectAll}>
                Select All
              </Button>
              <Button variant="ghost" size="sm" className="text-xs h-6" onClick={handleClearPages}>
                Clear
              </Button>
            </div>
            <CommandList>
              <CommandEmpty>No pages found.</CommandEmpty>
              <CommandGroup heading="Pages">
                <ScrollArea className="h-48">
                  {AVAILABLE_PAGES.map((page) => (
                    <CommandItem
                      key={page.id}
                      onSelect={() => handlePageToggle(page)}
                      className="cursor-pointer"
                    >
                      <div className={cn(
                        "flex items-center justify-center w-4 h-4 mr-2 border rounded",
                        selectedPageIds.includes(page.id)
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-muted-foreground"
                      )}>
                        {selectedPageIds.includes(page.id) && (
                          <Check className="h-3 w-3" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        {page.icon}
                        <span className="text-sm">{page.label}</span>
                      </div>
                    </CommandItem>
                  ))}
                </ScrollArea>
              </CommandGroup>
              <Separator />
              <CommandGroup heading="Custom Text">
                {showTextInput ? (
                  <div className="p-2 space-y-2">
                    <Textarea
                      placeholder="Add custom context..."
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      className="min-h-[60px] text-xs resize-none"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 text-xs" onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); handleAddCustomText(); }}>
                        Add
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onPointerDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowTextInput(false);
                          setCustomText('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <CommandItem onSelect={() => setShowTextInput(true)} className="cursor-pointer">
                    <Plus className="h-3 w-3 mr-2" />
                    Add custom text
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="border rounded-lg bg-muted/30">
        <CollapsibleTrigger asChild>
          <button className="flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Context</span>
              <Badge variant="secondary" className="text-xs">
                {selectedContexts.length}
              </Badge>
            </div>
            <ChevronDown className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              isExpanded && "rotate-180"
            )} />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-2">
            {/* Selected Contexts Display */}
            {selectedContexts.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedContexts.map((ctx) => (
                  <Badge
                    key={ctx.id}
                    variant="outline"
                    className={cn(
                      "gap-1 pr-1",
                      ctx.type === 'text' ? "bg-primary/10 border-primary/30" : ""
                    )}
                  >
                    {ctx.type === 'page' ? ctx.icon : <FileText className="h-3 w-3" />}
                    <span className="text-xs max-w-[80px] truncate">{ctx.label}</span>
                    <button
                      onClick={() => handleRemoveContext(ctx.id)}
                      className="ml-0.5 hover:bg-muted rounded p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Page Selector */}
            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-between">
                  <span className="text-xs">Add pages/modules...</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search pages..." />
                  <div className="flex items-center justify-between px-2 py-1.5 border-b">
                    <Button variant="ghost" size="sm" className="text-xs h-6" onClick={handleSelectAll}>
                      Select All
                    </Button>
                    <Button variant="ghost" size="sm" className="text-xs h-6" onClick={handleClearPages}>
                      Clear
                    </Button>
                  </div>
                  <CommandList>
                    <CommandEmpty>No pages found.</CommandEmpty>
                    <CommandGroup>
                      <ScrollArea className="h-64">
                        {AVAILABLE_PAGES.map((page) => (
                          <CommandItem
                            key={page.id}
                            onSelect={() => handlePageToggle(page)}
                            className="cursor-pointer"
                          >
                            <div className={cn(
                              "flex items-center justify-center w-4 h-4 mr-2 border rounded",
                              selectedPageIds.includes(page.id)
                                ? "bg-primary border-primary text-primary-foreground"
                                : "border-muted-foreground"
                            )}>
                              {selectedPageIds.includes(page.id) && (
                                <Check className="h-3 w-3" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-1">
                              {page.icon}
                              <div>
                                <div className="text-sm">{page.label}</div>
                                <div className="text-xs text-muted-foreground">{page.description}</div>
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </ScrollArea>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            <Separator className="my-2" />

            {/* Custom Text Input */}
            {showTextInput ? (
              <div className="space-y-2">
                <Label className="text-xs">Additional Context</Label>
                <Textarea
                  placeholder="Add custom context or instructions..."
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="min-h-[60px] text-xs resize-none"
                />
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 text-xs" onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); handleAddCustomText(); }}>
                    Add
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowTextInput(false);
                      setCustomText('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs text-muted-foreground"
                onClick={() => setShowTextInput(true)}
              >
                <Plus className="h-3 w-3 mr-2" />
                Add custom text context
              </Button>
            )}

            {/* Custom Text Contexts */}
            {customTexts.length > 0 && (
              <div className="space-y-1 pt-1">
                <Label className="text-xs text-muted-foreground">Custom Context:</Label>
                {customTexts.map((ctx) => (
                  <div
                    key={ctx.id}
                    className="flex items-start gap-2 p-2 rounded bg-muted/50 text-xs"
                  >
                    <FileText className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" />
                    <p className="flex-1 line-clamp-2">{ctx.description}</p>
                    <button
                      onClick={() => handleRemoveContext(ctx.id)}
                      className="shrink-0 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// Helper to format contexts for AI message
export function formatContextsForAI(contexts: ContextItem[]): string {
  const pages = contexts.filter(c => c.type === 'page');
  const texts = contexts.filter(c => c.type === 'text');

  let contextString = '';

  if (pages.length > 0) {
    contextString += `[Context Pages: ${pages.map(p => p.label).join(', ')}] `;
  }

  if (texts.length > 0) {
    contextString += `[Additional Context: ${texts.map(t => t.description).join('; ')}] `;
  }

  return contextString;
}
