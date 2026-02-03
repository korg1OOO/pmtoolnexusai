import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Play, Plus, Copy, Trash2, ChevronRight,
  Calendar, DollarSign, AlertCircle, CheckCircle2,
  TrendingDown, TrendingUp, BarChart3, Clock,
  Info, Settings2, Loader2, Sparkles, Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogTrigger, DialogFooter, DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useProjectContext } from '@/contexts/ProjectContext';
import { useScenarios } from '@/hooks/useScenarios';
import { mockScenarios } from '@/data/aiMockData';
import { aiService } from '@/services/aiService';

interface Adjustment {
  id: string;
  type: 'acceleration' | 'delay' | 'resource' | 'scope';
  taskId: string;
  taskName: string;
  field: string;
  originalValue: any;
  newValue: any;
  unit: string;
}

interface Scenario {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'draft' | 'archived';
  createdDate: string;
  modifiedDate: string;
  author: string;
  adjustments: Adjustment[];
  impact: {
    endDateChange: number;
    costChange: number;
    riskLevel: 'low' | 'medium' | 'high';
    criticalPathAffected: boolean;
    tasksAffected: number;
  };
}

const mockTasks = [
  { id: 'T-010', name: 'System Architecture' },
  { id: 'T-011', name: 'Database Design' },
  { id: 'T-012', name: 'Wave 2 Migration' },
  { id: 'T-013', name: 'Data Migration' },
  { id: 'T-014', name: 'API Integration' },
  { id: 'T-015', name: 'Testing & Validation' },
];

export function ScenariosView() {
  const { settings } = useProjectContext();
  const { data: fetchedScenarios = [], isLoading } = useScenarios(settings.id);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<any | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareScenarioId, setCompareScenarioId] = useState<string | null>(null);
  const [showAdjustmentDialog, setShowAdjustmentDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newScenarioName, setNewScenarioName] = useState('');
  const [newScenarioDesc, setNewScenarioDesc] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);

  // Sync state with fetched data
  useEffect(() => {
    if (fetchedScenarios.length > 0) {
      const formatted = fetchedScenarios.map(s => ({
        ...s.data,
        id: s.id,
        name: s.name,
        description: s.description,
      }));
      setScenarios(formatted);
      if (!selectedScenario && formatted.length > 0) {
        setSelectedScenario(formatted[0]);
      }
    } else if (!isLoading) {
      // Use mock if no data and not loading
      setScenarios(mockScenarios);
      setSelectedScenario(mockScenarios[1]);
    }
  }, [fetchedScenarios, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const baselineScenario = scenarios.find(s => s.status === 'active');
  const compareScenario = compareScenarioId ? scenarios.find(s => s.id === compareScenarioId) : null;

  const handleCreateScenario = () => {
    const newScenario: Scenario = {
      id: `S-${Date.now()}`,
      name: newScenarioName,
      description: newScenarioDesc,
      status: 'draft',
      createdDate: new Date().toISOString().split('T')[0],
      modifiedDate: new Date().toISOString().split('T')[0],
      author: 'Current User',
      adjustments: [],
      impact: {
        endDateChange: 0,
        costChange: 0,
        riskLevel: 'low',
        criticalPathAffected: false,
        tasksAffected: 0
      }
    };
    setScenarios([...scenarios, newScenario]);
    setSelectedScenario(newScenario);
    setShowCreateDialog(false);
    setNewScenarioName('');
    setNewScenarioDesc('');
  };

  const handleDuplicateScenario = (scenario: Scenario) => {
    const duplicated: Scenario = {
      ...JSON.parse(JSON.stringify(scenario)),
      id: `S-${Date.now()}`,
      name: `${scenario.name} (Copy)`,
      status: 'draft',
      createdDate: new Date().toISOString().split('T')[0],
      modifiedDate: new Date().toISOString().split('T')[0]
    };
    setScenarios([...scenarios, duplicated]);
    setSelectedScenario(duplicated);
  };

  const handleRunSimulation = async () => {
    if (!selectedScenario || !settings?.id) return;

    setIsSimulating(true);
    toast.info('AI is simulating scenario impacts...');

    const { data, error } = await aiService.simulateScenarios(settings.id, selectedScenario.adjustments);
    setIsSimulating(false);

    if (error) {
      toast.error('Simulation failed: ' + error);
    } else {
      const updatedScenario = {
        ...selectedScenario,
        impact: data,
        modifiedDate: new Date().toISOString().split('T')[0]
      };

      setScenarios(scenarios.map(s => s.id === selectedScenario.id ? updatedScenario : s));
      setSelectedScenario(updatedScenario);
      toast.success('Simulation complete!');
    }
  };

  return (
    <div className="p-6 h-full flex flex-col gap-6 overflow-hidden">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings2 className="h-6 w-6 text-primary" />
            AI Scenario Builder
          </h1>
          <p className="text-muted-foreground italic">Project "What-If" Analysis & Impact Simulator</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={compareMode ? "default" : "outline"}
            onClick={() => setCompareMode(!compareMode)}
            className="gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            {compareMode ? "Disable Comparison" : "Compare Scenarios"}
          </Button>
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Scenario
          </Button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden">
        {/* Scenario List */}
        <Card className="col-span-12 lg:col-span-3 flex flex-col overflow-hidden">
          <CardHeader className="py-4 shrink-0 border-b">
            <CardTitle className="text-base flex items-center justify-between">
              Scenarios
              <Badge variant="outline" className="font-normal">{scenarios.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-3 space-y-2">
                {scenarios.map((scenario) => (
                  <div
                    key={scenario.id}
                    onClick={() => setSelectedScenario(scenario)}
                    className={cn(
                      "group p-3 rounded-lg border cursor-pointer transition-all hover:border-primary/50",
                      selectedScenario?.id === scenario.id ? "border-primary bg-primary/5 shadow-sm" : "bg-card"
                    )}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="text-sm font-semibold truncate">{scenario.name}</h3>
                      <Badge
                        variant={(scenario.status === 'active' ? 'success' : 'secondary') as any}
                        className="text-[10px] h-4 px-1"
                      >
                        {scenario.status}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mb-2">
                      {scenario.description}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {scenario.modifiedDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {scenario.adjustments.length} adjs
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Workspace */}
        <div className="col-span-12 lg:col-span-9 flex flex-col gap-6 overflow-hidden">
          {selectedScenario ? (
            <>
              {/* Scenario Detail Header */}
              <div className="flex items-start justify-between shrink-0 bg-card p-4 rounded-xl border">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold">{selectedScenario.name}</h2>
                    <Badge variant={(selectedScenario.status === 'active' ? 'success' : 'secondary') as any}>
                      {selectedScenario.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedScenario.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Created: {selectedScenario.createdDate}</span>
                    <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Modified: {selectedScenario.modifiedDate}</span>
                    <span className="flex items-center gap-1.5"><Info className="h-3.5 w-3.5" /> Author: {selectedScenario.author}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleDuplicateScenario(selectedScenario)} className="gap-2">
                    <Copy className="h-4 w-4" /> Duplicate
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 gap-2 border-destructive/20">
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                  <Button
                    size="sm"
                    className="gap-2 bg-primary hover:bg-primary/90"
                    disabled={isSimulating || selectedScenario.adjustments.length === 0}
                    onClick={handleRunSimulation}
                  >
                    {isSimulating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    Run Simulation
                  </Button>
                </div>
              </div>

              {/* Compare Mode or Detail Mode */}
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
                {/* Left Side: Visualizations/Impact */}
                <div className="flex flex-col gap-6 overflow-hidden">
                  <Card className="flex-1 flex flex-col overflow-hidden">
                    <CardHeader className="py-4 border-b shrink-0 flex flex-row items-center justify-between">
                      <CardTitle className="text-sm">Timeline Impact Analysis</CardTitle>
                      {compareMode && (
                        <Select value={compareScenarioId || ""} onValueChange={setCompareScenarioId}>
                          <SelectTrigger className="h-8 w-40 text-xs">
                            <SelectValue placeholder="Compare with..." />
                          </SelectTrigger>
                          <SelectContent>
                            {scenarios.filter(s => s.id !== selectedScenario.id).map(s => (
                              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </CardHeader>
                    <CardContent className="p-6 overflow-y-auto">
                      <div className="space-y-8">
                        {/* Summary Metrics */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 rounded-xl bg-primary/5 flex flex-col gap-1 border border-primary/10">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> End Date Shift
                            </span>
                            <span className={cn(
                              "text-2xl font-bold font-mono tracking-tight",
                              selectedScenario.impact.endDateChange <= 0 ? "text-success" : "text-destructive"
                            )}>
                              {selectedScenario.impact.endDateChange > 0 ? "+" : ""}{selectedScenario.impact.endDateChange} Days
                            </span>
                            {compareScenario && (
                              <span className="text-[10px] text-muted-foreground border-t mt-1 pt-1 italic">
                                vs {compareScenario.name}: {selectedScenario.impact.endDateChange - compareScenario.impact.endDateChange}D diff
                              </span>
                            )}
                          </div>
                          <div className="p-4 rounded-xl bg-primary/5 flex flex-col gap-1 border border-primary/10">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <DollarSign className="h-3 w-3" /> Total Cost Impact
                            </span>
                            <span className={cn(
                              "text-2xl font-bold font-mono tracking-tight",
                              selectedScenario.impact.costChange <= 0 ? "text-success" : "text-destructive"
                            )}>
                              {selectedScenario.impact.costChange > 0 ? "+" : ""}${Math.abs(selectedScenario.impact.costChange).toLocaleString()}
                            </span>
                            {compareScenario && (
                              <span className="text-[10px] text-muted-foreground border-t mt-1 pt-1 italic">
                                vs {compareScenario.name}: ${Math.abs(selectedScenario.impact.costChange - compareScenario.impact.costChange).toLocaleString()} diff
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Visual Progress/Timeline Simulation */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Critical Path Trajectory</h4>
                            <Badge variant={(selectedScenario.impact.riskLevel === 'high' ? 'destructive' : selectedScenario.impact.riskLevel === 'medium' ? 'warning' : 'success') as any} className="text-[10px]">
                              {selectedScenario.impact.riskLevel.toUpperCase()} RISK
                            </Badge>
                          </div>

                          <div className="space-y-6">
                            {/* Baseline Visualization */}
                            {baselineScenario && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-medium">Baseline ({baselineScenario.name})</span>
                                  <span className="text-muted-foreground font-mono">100% Target</span>
                                </div>
                                <div className="h-4 w-full bg-muted rounded-full relative overflow-hidden">
                                  <div className="absolute inset-0 bg-muted-foreground/20 rounded-full" />
                                  <div className="absolute h-full w-[85%] bg-muted-foreground/40 rounded-full" />
                                </div>
                              </div>
                            )}

                            {/* Current Scenario Visualization */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-medium text-primary flex items-center gap-2">
                                  <Sparkles className="h-3 w-3" /> Current Scenario
                                </span>
                                <span className="font-mono">{100 + (selectedScenario.impact.endDateChange / 2)}% Adjust</span>
                              </div>
                              <div className="h-8 w-full bg-muted rounded-full relative overflow-hidden p-1">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all duration-500 relative",
                                    selectedScenario.impact.endDateChange <= 0 ? "bg-success" : "bg-destructive"
                                  )}
                                  style={{ width: `${Math.min(100, 70 - (selectedScenario.impact.endDateChange / 2))}%` }}
                                >
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20" />
                                </div>
                              </div>
                            </div>

                            {/* Comparison Scenario Visualization */}
                            {compareMode && compareScenario && (
                              <div className="space-y-2 opacity-80 border-l-4 border-primary/40 pl-4 py-2 bg-primary/5 rounded-r">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-medium">Compare ({compareScenario.name})</span>
                                  <span className="text-muted-foreground font-mono">{100 + (compareScenario.impact.endDateChange / 2)}%</span>
                                </div>
                                <div className="h-4 w-full bg-muted rounded-full relative overflow-hidden">
                                  <div className="absolute h-full bg-primary/40 rounded-full" style={{ width: `${Math.min(100, 70 - (compareScenario.impact.endDateChange / 2))}%` }} />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Key Insights Alert */}
                        {selectedScenario.impact.riskLevel !== 'low' && (
                          <div className={cn(
                            "p-3 rounded-lg border text-sm flex gap-3",
                            selectedScenario.impact.riskLevel === 'high' ? "bg-destructive/5 border-destructive/20 text-destructive" : "bg-warning/5 border-warning/20 text-warning-foreground"
                          )}>
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            <div>
                              <p className="font-semibold">AI Risk Warning</p>
                              <p className="text-xs mt-1 leading-relaxed">
                                {selectedScenario.impact.criticalPathAffected
                                  ? "This scenario results in critical path divergence. New bottlenecks may form in late Q3."
                                  : "Increased resource pressure detected. Team may face burn-out risks if prolonged beyond 2 weeks."}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Side: Adjustments List */}
                <Card className="flex flex-col overflow-hidden">
                  <CardHeader className="py-4 border-b shrink-0 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm">Scenario Adjustments</CardTitle>
                      <CardDescription className="text-xs">Dynamic changes from baseline</CardDescription>
                    </div>
                    <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setShowAdjustmentDialog(true)}>
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0 flex-1 overflow-hidden">
                    <ScrollArea className="h-full">
                      <div className="p-4 space-y-4">
                        {selectedScenario.adjustments.length > 0 ? (
                          selectedScenario.adjustments.map((adj: Adjustment) => (
                            <div key={adj.id} className="p-3 rounded-lg border group hover:bg-muted/30 transition-colors">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <Badge
                                    variant={(adj.type === 'acceleration' ? 'success' : adj.type === 'delay' ? 'destructive' : 'info') as any}
                                    className="text-[9px] h-4 mb-1"
                                  >
                                    {adj.type.toUpperCase()}
                                  </Badge>
                                  <h4 className="text-sm font-medium">{adj.taskName}</h4>
                                </div>
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="flex items-center gap-3 text-xs bg-muted/40 p-2 rounded border border-dashed">
                                <div className="text-muted-foreground">{adj.field}:</div>
                                <div className="line-through opacity-50">{adj.originalValue} {adj.unit}</div>
                                <ChevronRight className="h-3 w-3 opacity-50" />
                                <div className="font-semibold text-primary">{adj.newValue} {adj.unit}</div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="h-32 flex flex-col items-center justify-center text-muted-foreground gap-2 border-2 border-dashed rounded-xl">
                            <Filter className="h-8 w-8 opacity-20" />
                            <p className="text-xs italic">No specific adjustments added yet</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground border-2 border-dashed rounded-3xl p-12 text-center bg-muted/10">
              <div className="p-6 rounded-full bg-card shadow-sm mb-4">
                <Settings2 className="h-12 w-12 opacity-80" />
              </div>
              <h2 className="text-xl font-semibold">Ready to simulate?</h2>
              <p className="max-w-xs text-sm italic">
                Select an existing scenario from the left or create a new "What-If" plan to dynamicly simulate project impacts.
              </p>
              <Button size="lg" onClick={() => setShowCreateDialog(true)} className="mt-4 gap-2">
                <Plus className="h-4 w-4" /> Start New Simulation
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Scenario</DialogTitle>
            <DialogDescription>
              Start from project baseline and add adjustments to simulate impacts.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Scenario Name</Label>
              <Input
                id="name"
                placeholder="e.g. Q4 Acceleration Plan"
                value={newScenarioName}
                onChange={(e) => setNewScenarioName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea
                id="desc"
                placeholder="What objective are you simulating?"
                value={newScenarioDesc}
                onChange={(e) => setNewScenarioDesc(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateScenario} disabled={!newScenarioName}>Create Scenario</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
