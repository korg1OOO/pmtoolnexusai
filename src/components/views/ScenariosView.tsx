import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  GitBranch,
  Plus,
  Save,
  Trash2,
  Copy,
  Play,
  Pause,
  Calendar,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  Layers,
  BarChart3,
  Settings2,
  Eye,
  EyeOff,
  RefreshCw,
  Download,
  Diff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
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
import { mockTasks } from '@/data/mockData';
import type { Task } from '@/types/project';

interface Scenario {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'archived';
  createdDate: string;
  modifiedDate: string;
  author: string;
  adjustments: ScenarioAdjustment[];
  impact: ScenarioImpact;
}

interface ScenarioAdjustment {
  id: string;
  type: 'delay' | 'acceleration' | 'resource' | 'scope' | 'dependency';
  taskId: string;
  taskName: string;
  field: string;
  originalValue: number | string;
  newValue: number | string;
  unit: string;
}

interface ScenarioImpact {
  endDateChange: number;
  costChange: number;
  riskLevel: 'low' | 'medium' | 'high';
  criticalPathAffected: boolean;
  tasksAffected: number;
}

const mockScenarios: Scenario[] = [
  {
    id: 'SCN-001',
    name: 'Baseline Plan',
    description: 'Current approved project timeline - the reference point for all comparisons',
    status: 'active',
    createdDate: '2024-01-15',
    modifiedDate: '2024-01-15',
    author: 'Sarah Mitchell',
    adjustments: [],
    impact: { endDateChange: 0, costChange: 0, riskLevel: 'medium', criticalPathAffected: false, tasksAffected: 0 },
  },
  {
    id: 'SCN-002',
    name: 'Accelerated Delivery',
    description: 'Fast-track Wave 2 migration with additional resources to meet Q3 deadline',
    status: 'draft',
    createdDate: '2024-08-01',
    modifiedDate: '2024-08-05',
    author: 'John Doe',
    adjustments: [
      { id: 'adj-1', type: 'acceleration', taskId: 'T-012', taskName: 'Wave 2 Migration', field: 'duration', originalValue: 61, newValue: 45, unit: 'days' },
      { id: 'adj-2', type: 'resource', taskId: 'T-012', taskName: 'Wave 2 Migration', field: 'resources', originalValue: 3, newValue: 5, unit: 'FTEs' },
      { id: 'adj-3', type: 'acceleration', taskId: 'T-013', taskName: 'Data Migration', field: 'duration', originalValue: 77, newValue: 60, unit: 'days' },
    ],
    impact: { endDateChange: -16, costChange: 150000, riskLevel: 'high', criticalPathAffected: true, tasksAffected: 3 },
  },
  {
    id: 'SCN-003',
    name: 'Risk Mitigation',
    description: 'Extended testing phase to reduce go-live risks and improve quality',
    status: 'draft',
    createdDate: '2024-08-05',
    modifiedDate: '2024-08-10',
    author: 'Emily Brown',
    adjustments: [
      { id: 'adj-1', type: 'delay', taskId: 'T-015', taskName: 'Testing & Validation', field: 'duration', originalValue: 90, newValue: 120, unit: 'days' },
      { id: 'adj-2', type: 'resource', taskId: 'T-015', taskName: 'Testing & Validation', field: 'resources', originalValue: 2, newValue: 3, unit: 'FTEs' },
    ],
    impact: { endDateChange: 30, costChange: 75000, riskLevel: 'low', criticalPathAffected: true, tasksAffected: 2 },
  },
  {
    id: 'SCN-004',
    name: 'Phased Go-Live',
    description: 'Split go-live into regional phases to reduce cutover risk',
    status: 'draft',
    createdDate: '2024-08-08',
    modifiedDate: '2024-08-12',
    author: 'Mike Johnson',
    adjustments: [
      { id: 'adj-1', type: 'scope', taskId: 'T-016', taskName: 'Go-Live & Transition', field: 'scope', originalValue: 'Single cutover', newValue: '3 regional phases', unit: '' },
      { id: 'adj-2', type: 'delay', taskId: 'T-016', taskName: 'Go-Live & Transition', field: 'duration', originalValue: 46, newValue: 75, unit: 'days' },
    ],
    impact: { endDateChange: 29, costChange: 50000, riskLevel: 'low', criticalPathAffected: false, tasksAffected: 1 },
  },
];

interface TimelinePhase {
  phase: string;
  baseline: { start: number; end: number };
  scenario: { start: number; end: number };
}

export function ScenariosView() {
  const [scenarios, setScenarios] = useState(mockScenarios);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(mockScenarios[1]);
  const [compareMode, setCompareMode] = useState(false);
  const [compareScenarioId, setCompareScenarioId] = useState<string | null>(null);
  const [showAdjustmentDialog, setShowAdjustmentDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newScenarioName, setNewScenarioName] = useState('');
  const [newScenarioDesc, setNewScenarioDesc] = useState('');

  const baselineScenario = scenarios.find(s => s.status === 'active');
  const compareScenario = compareScenarioId ? scenarios.find(s => s.id === compareScenarioId) : null;

  // Calculate timeline data for visualization
  const timelineData: TimelinePhase[] = useMemo(() => {
    if (!selectedScenario) return [];
    
    const baseData = [
      { phase: 'Discovery', baseline: { start: 0, end: 60 }, scenario: { start: 0, end: 60 } },
      { phase: 'Design', baseline: { start: 61, end: 137 }, scenario: { start: 61, end: 137 } },
      { phase: 'Implementation', baseline: { start: 138, end: 290 }, scenario: { start: 138, end: 290 + selectedScenario.impact.endDateChange / 3 } },
      { phase: 'Testing', baseline: { start: 245, end: 335 }, scenario: { start: 245 + selectedScenario.impact.endDateChange / 4, end: 335 + selectedScenario.impact.endDateChange / 2 } },
      { phase: 'Go-Live', baseline: { start: 305, end: 351 }, scenario: { start: 305 + selectedScenario.impact.endDateChange / 2, end: 351 + selectedScenario.impact.endDateChange } },
    ];
    
    return baseData;
  }, [selectedScenario]);

  const handleCreateScenario = () => {
    const newScenario: Scenario = {
      id: `SCN-${Date.now()}`,
      name: newScenarioName,
      description: newScenarioDesc,
      status: 'draft',
      createdDate: new Date().toISOString().split('T')[0],
      modifiedDate: new Date().toISOString().split('T')[0],
      author: 'Current User',
      adjustments: [],
      impact: { endDateChange: 0, costChange: 0, riskLevel: 'medium', criticalPathAffected: false, tasksAffected: 0 },
    };
    setScenarios([...scenarios, newScenario]);
    setSelectedScenario(newScenario);
    setShowCreateDialog(false);
    setNewScenarioName('');
    setNewScenarioDesc('');
  };

  const handleDuplicateScenario = () => {
    if (!selectedScenario) return;
    const duplicate: Scenario = {
      ...selectedScenario,
      id: `SCN-${Date.now()}`,
      name: `${selectedScenario.name} (Copy)`,
      status: 'draft',
      createdDate: new Date().toISOString().split('T')[0],
      modifiedDate: new Date().toISOString().split('T')[0],
    };
    setScenarios([...scenarios, duplicate]);
    setSelectedScenario(duplicate);
  };

  const handleSetAsBaseline = () => {
    if (!selectedScenario) return;
    setScenarios(scenarios.map(s => ({
      ...s,
      status: s.id === selectedScenario.id ? 'active' : s.status === 'active' ? 'archived' : s.status,
    })));
  };

  const handleDeleteScenario = () => {
    if (!selectedScenario || selectedScenario.status === 'active') return;
    setScenarios(scenarios.filter(s => s.id !== selectedScenario.id));
    setSelectedScenario(scenarios[0]);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b bg-card shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/20">
              <GitBranch className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Scenario Planning</h1>
              <p className="text-muted-foreground">Compare timeline impacts of different planning decisions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 mr-4 px-3 py-1.5 bg-muted rounded-lg">
              <Switch checked={compareMode} onCheckedChange={setCompareMode} />
              <Label className="text-sm cursor-pointer">Compare Mode</Label>
            </div>
            <Button variant="outline" onClick={handleDuplicateScenario} disabled={!selectedScenario}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </Button>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Scenario
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Scenario List */}
        <div className="w-80 border-r p-4 space-y-3 overflow-auto">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm text-muted-foreground">SCENARIOS</h3>
            <Badge variant="outline">{scenarios.length}</Badge>
          </div>
          <AnimatePresence>
            {scenarios.map((scenario) => (
              <motion.div
                key={scenario.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                whileHover={{ x: 2 }}
                onClick={() => setSelectedScenario(scenario)}
                className={cn(
                  "p-3 rounded-lg border cursor-pointer transition-colors",
                  selectedScenario?.id === scenario.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {scenario.status === 'active' && <CheckCircle2 className="h-4 w-4 text-success" />}
                    <span className="font-medium text-sm">{scenario.name}</span>
                  </div>
                  <Badge variant={scenario.status === 'active' ? 'success' : scenario.status === 'draft' ? 'warning' : 'secondary'}>
                    {scenario.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{scenario.description}</p>
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "flex items-center gap-1 text-xs font-medium",
                    scenario.impact.endDateChange < 0 ? 'text-success' : 
                    scenario.impact.endDateChange > 0 ? 'text-destructive' : 'text-muted-foreground'
                  )}>
                    {scenario.impact.endDateChange < 0 ? <TrendingDown className="h-3 w-3" /> : 
                     scenario.impact.endDateChange > 0 ? <TrendingUp className="h-3 w-3" /> : null}
                    {scenario.impact.endDateChange !== 0 && `${Math.abs(scenario.impact.endDateChange)} days`}
                    {scenario.impact.endDateChange === 0 && 'Baseline'}
                  </span>
                  {compareMode && scenario.id !== selectedScenario?.id && scenario.status !== 'active' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCompareScenarioId(scenario.id);
                      }}
                    >
                      <Diff className="h-3 w-3 mr-1" />
                      Compare
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Main Content */}
        {selectedScenario && (
          <div className="flex-1 p-6 space-y-6 overflow-auto">
            {/* Impact Summary */}
            <div className="grid grid-cols-5 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-xs">End Date Impact</span>
                  </div>
                  <div className={cn(
                    "text-2xl font-bold",
                    selectedScenario.impact.endDateChange < 0 ? 'text-success' :
                    selectedScenario.impact.endDateChange > 0 ? 'text-destructive' : ''
                  )}>
                    {selectedScenario.impact.endDateChange > 0 ? '+' : ''}{selectedScenario.impact.endDateChange} days
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs">Cost Impact</span>
                  </div>
                  <div className={cn(
                    "text-2xl font-bold",
                    selectedScenario.impact.costChange > 0 ? 'text-destructive' : 'text-success'
                  )}>
                    {selectedScenario.impact.costChange > 0 ? '+' : ''}${(selectedScenario.impact.costChange / 1000).toFixed(0)}K
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-xs">Risk Level</span>
                  </div>
                  <Badge
                    variant={
                      selectedScenario.impact.riskLevel === 'high' ? 'destructive' :
                      selectedScenario.impact.riskLevel === 'medium' ? 'warning' : 'success'
                    }
                    className="text-lg px-3 py-1"
                  >
                    {selectedScenario.impact.riskLevel}
                  </Badge>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Layers className="h-4 w-4" />
                    <span className="text-xs">Adjustments</span>
                  </div>
                  <div className="text-2xl font-bold">{selectedScenario.adjustments.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <RefreshCw className="h-4 w-4" />
                    <span className="text-xs">Tasks Affected</span>
                  </div>
                  <div className="text-2xl font-bold">{selectedScenario.impact.tasksAffected}</div>
                </CardContent>
              </Card>
            </div>

            {/* Timeline Comparison */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">Timeline Comparison</CardTitle>
                  </div>
                  {compareMode && compareScenario && (
                    <Badge variant="outline" className="gap-2">
                      Comparing with: {compareScenario.name}
                      <button onClick={() => setCompareScenarioId(null)} className="ml-1 hover:text-destructive">×</button>
                    </Badge>
                  )}
                </div>
                <CardDescription>Visual comparison of baseline vs scenario timeline</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Legend */}
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-8 rounded bg-muted-foreground/30" />
                      <span>Baseline</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-8 rounded bg-primary" />
                      <span>{selectedScenario.name}</span>
                    </div>
                    {compareMode && compareScenario && (
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-8 rounded bg-purple-500" />
                        <span>{compareScenario.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Timeline Bars */}
                  <div className="space-y-4 pt-4">
                    {timelineData.map((phase, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium w-32">{phase.phase}</span>
                          <div className="flex-1 relative h-10">
                            {/* Baseline bar */}
                            <div
                              className="absolute top-0 h-3 rounded bg-muted-foreground/30 transition-all"
                              style={{
                                left: `${(phase.baseline.start / 400) * 100}%`,
                                width: `${((phase.baseline.end - phase.baseline.start) / 400) * 100}%`,
                              }}
                            />
                            {/* Scenario bar */}
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                left: `${(phase.scenario.start / 400) * 100}%`,
                                width: `${((phase.scenario.end - phase.scenario.start) / 400) * 100}%`,
                              }}
                              className="absolute bottom-0 h-3 rounded bg-primary"
                              style={{
                                left: `${(phase.scenario.start / 400) * 100}%`,
                                width: `${((phase.scenario.end - phase.scenario.start) / 400) * 100}%`,
                              }}
                            />
                          </div>
                          <div className="w-24 text-right text-xs text-muted-foreground">
                            {phase.scenario.end - phase.baseline.end !== 0 && (
                              <span className={phase.scenario.end < phase.baseline.end ? 'text-success' : 'text-destructive'}>
                                {phase.scenario.end - phase.baseline.end > 0 ? '+' : ''}{Math.round(phase.scenario.end - phase.baseline.end)}d
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Time axis */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t ml-32">
                      <span>Jan</span>
                      <span>Mar</span>
                      <span>May</span>
                      <span>Jul</span>
                      <span>Sep</span>
                      <span>Nov</span>
                      <span>Dec+</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Adjustments */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Scenario Adjustments</CardTitle>
                  {selectedScenario.status === 'draft' && (
                    <Button size="sm" variant="outline" onClick={() => setShowAdjustmentDialog(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Adjustment
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {selectedScenario.adjustments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>This is the baseline scenario with no adjustments</p>
                    {selectedScenario.status === 'draft' && (
                      <Button variant="outline" className="mt-4" onClick={() => setShowAdjustmentDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Adjustment
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedScenario.adjustments.map((adj) => (
                      <motion.div
                        key={adj.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 group"
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant={
                            adj.type === 'delay' ? 'destructive' :
                            adj.type === 'acceleration' ? 'success' :
                            adj.type === 'resource' ? 'info' : 'warning'
                          }>
                            {adj.type}
                          </Badge>
                          <div>
                            <span className="font-medium">{adj.taskName}</span>
                            <span className="text-muted-foreground text-sm ml-2">({adj.field})</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">{adj.originalValue} {adj.unit}</span>
                            <ArrowRight className="h-4 w-4" />
                            <span className={cn(
                              "font-medium",
                              typeof adj.newValue === 'number' && typeof adj.originalValue === 'number' &&
                              (adj.newValue < adj.originalValue ? 'text-success' : 'text-destructive')
                            )}>
                              {adj.newValue} {adj.unit}
                            </span>
                          </div>
                          {selectedScenario.status === 'draft' && (
                            <Button
                              variant="ghost"
                              size="iconXs"
                              className="opacity-0 group-hover:opacity-100 text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Metadata & Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Created: {selectedScenario.createdDate} by {selectedScenario.author}</p>
                <p>Last modified: {selectedScenario.modifiedDate}</p>
              </div>
              <div className="flex items-center gap-2">
                {selectedScenario.status !== 'active' && (
                  <Button variant="outline" className="text-destructive" onClick={handleDeleteScenario}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                {selectedScenario.status === 'draft' && (
                  <>
                    <Button variant="outline">
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button onClick={handleSetAsBaseline}>
                      <Play className="h-4 w-4 mr-2" />
                      Apply as Baseline
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Scenario Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Scenario</DialogTitle>
            <DialogDescription>
              Create a new what-if scenario to explore alternative project timelines.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Scenario Name</Label>
              <Input
                placeholder="e.g., Accelerated Q3 Delivery"
                value={newScenarioName}
                onChange={(e) => setNewScenarioName(e.target.value)}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="Describe the scenario and its purpose..."
                value={newScenarioDesc}
                onChange={(e) => setNewScenarioDesc(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label>Base From</Label>
              <Select defaultValue="baseline">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baseline">Current Baseline</SelectItem>
                  {scenarios.filter(s => s.status === 'draft').map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateScenario} disabled={!newScenarioName}>
              Create Scenario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Adjustment Dialog */}
      <Dialog open={showAdjustmentDialog} onOpenChange={setShowAdjustmentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Scenario Adjustment</DialogTitle>
            <DialogDescription>
              Define what changes you want to make to the project plan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Adjustment Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="delay">Delay Task</SelectItem>
                  <SelectItem value="acceleration">Accelerate Task</SelectItem>
                  <SelectItem value="resource">Change Resources</SelectItem>
                  <SelectItem value="scope">Modify Scope</SelectItem>
                  <SelectItem value="dependency">Change Dependencies</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Select Task</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a task" />
                </SelectTrigger>
                <SelectContent>
                  {mockTasks.slice(0, 5).map(task => (
                    <SelectItem key={task.id} value={task.id}>{task.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Original Value</Label>
                <Input placeholder="e.g., 60" disabled />
              </div>
              <div>
                <Label>New Value</Label>
                <Input placeholder="e.g., 45" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdjustmentDialog(false)}>Cancel</Button>
            <Button onClick={() => setShowAdjustmentDialog(false)}>
              Add Adjustment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
