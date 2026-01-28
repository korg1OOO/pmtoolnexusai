import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockTasks } from '@/data/mockData';

interface Scenario {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'archived';
  createdDate: string;
  adjustments: {
    type: 'delay' | 'acceleration' | 'resource' | 'scope';
    taskId: string;
    taskName: string;
    originalValue: number;
    newValue: number;
  }[];
  impact: {
    endDateChange: number;
    costChange: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
}

const mockScenarios: Scenario[] = [
  {
    id: 'SCN-001',
    name: 'Baseline Plan',
    description: 'Current approved project timeline',
    status: 'active',
    createdDate: '2024-01-15',
    adjustments: [],
    impact: { endDateChange: 0, costChange: 0, riskLevel: 'medium' },
  },
  {
    id: 'SCN-002',
    name: 'Accelerated Delivery',
    description: 'Fast-track Wave 2 migration with additional resources',
    status: 'draft',
    createdDate: '2024-08-01',
    adjustments: [
      { type: 'acceleration', taskId: 'T-012', taskName: 'Wave 2 Migration', originalValue: 61, newValue: 45 },
      { type: 'resource', taskId: 'T-012', taskName: 'Wave 2 Migration', originalValue: 3, newValue: 5 },
    ],
    impact: { endDateChange: -16, costChange: 150000, riskLevel: 'high' },
  },
  {
    id: 'SCN-003',
    name: 'Risk Mitigation',
    description: 'Extended testing phase to reduce go-live risks',
    status: 'draft',
    createdDate: '2024-08-05',
    adjustments: [
      { type: 'delay', taskId: 'T-015', taskName: 'Testing & Validation', originalValue: 90, newValue: 120 },
    ],
    impact: { endDateChange: 30, costChange: 75000, riskLevel: 'low' },
  },
];

export function ScenariosView() {
  const [scenarios, setScenarios] = useState(mockScenarios);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(mockScenarios[0]);
  const [compareMode, setCompareMode] = useState(false);
  const [compareScenario, setCompareScenario] = useState<Scenario | null>(null);

  const timelineData = [
    { phase: 'Discovery', baseline: { start: 0, end: 60 }, scenario: { start: 0, end: 60 } },
    { phase: 'Design', baseline: { start: 61, end: 137 }, scenario: { start: 61, end: 137 } },
    { phase: 'Implementation', baseline: { start: 138, end: 290 }, scenario: { start: 138, end: 274 } },
    { phase: 'Testing', baseline: { start: 245, end: 335 }, scenario: { start: 229, end: 319 } },
    { phase: 'Go-Live', baseline: { start: 305, end: 351 }, scenario: { start: 289, end: 335 } },
  ];

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className="p-6 border-b bg-card">
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
            <div className="flex items-center gap-2 mr-4">
              <Switch checked={compareMode} onCheckedChange={setCompareMode} />
              <Label className="text-sm">Compare Mode</Label>
            </div>
            <Button variant="outline">
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Scenario
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Scenario List */}
        <div className="w-80 border-r p-4 space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">SCENARIOS</h3>
          {scenarios.map((scenario) => (
            <motion.div
              key={scenario.id}
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
                  <span className="font-medium">{scenario.name}</span>
                </div>
                <Badge variant={scenario.status === 'active' ? 'success' : scenario.status === 'draft' ? 'warning' : 'secondary'}>
                  {scenario.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{scenario.description}</p>
              <div className="flex items-center gap-3 text-xs">
                <span className={cn(
                  "flex items-center gap-1",
                  scenario.impact.endDateChange < 0 ? 'text-success' : scenario.impact.endDateChange > 0 ? 'text-destructive' : 'text-muted-foreground'
                )}>
                  {scenario.impact.endDateChange < 0 ? <TrendingDown className="h-3 w-3" /> : scenario.impact.endDateChange > 0 ? <TrendingUp className="h-3 w-3" /> : null}
                  {scenario.impact.endDateChange !== 0 && `${Math.abs(scenario.impact.endDateChange)} days`}
                  {scenario.impact.endDateChange === 0 && 'No change'}
                </span>
                {compareMode && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCompareScenario(scenario);
                    }}
                  >
                    Compare
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main Content */}
        {selectedScenario && (
          <div className="flex-1 p-6 space-y-6">
            {/* Impact Summary */}
            <div className="grid grid-cols-4 gap-4">
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
            </div>

            {/* Timeline Comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Timeline Comparison
                </CardTitle>
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
                      <span>Scenario</span>
                    </div>
                  </div>

                  {/* Timeline Bars */}
                  <div className="space-y-4 pt-4">
                    {timelineData.map((phase, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium w-32">{phase.phase}</span>
                          <div className="flex-1 relative h-8">
                            {/* Baseline bar */}
                            <div
                              className="absolute top-0 h-3 rounded bg-muted-foreground/30"
                              style={{
                                left: `${(phase.baseline.start / 360) * 100}%`,
                                width: `${((phase.baseline.end - phase.baseline.start) / 360) * 100}%`,
                              }}
                            />
                            {/* Scenario bar */}
                            <div
                              className="absolute bottom-0 h-3 rounded bg-primary"
                              style={{
                                left: `${(phase.scenario.start / 360) * 100}%`,
                                width: `${((phase.scenario.end - phase.scenario.start) / 360) * 100}%`,
                              }}
                            />
                          </div>
                          <div className="w-24 text-right text-xs text-muted-foreground">
                            {phase.scenario.end - phase.baseline.end !== 0 && (
                              <span className={phase.scenario.end < phase.baseline.end ? 'text-success' : 'text-destructive'}>
                                {phase.scenario.end - phase.baseline.end > 0 ? '+' : ''}{phase.scenario.end - phase.baseline.end}d
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
                      <span>Dec</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Adjustments */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Scenario Adjustments</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedScenario.adjustments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>This is the baseline scenario with no adjustments</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedScenario.adjustments.map((adj, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                        <div className="flex items-center gap-3">
                          <Badge variant={
                            adj.type === 'delay' ? 'destructive' :
                            adj.type === 'acceleration' ? 'success' :
                            adj.type === 'resource' ? 'info' : 'warning'
                          }>
                            {adj.type}
                          </Badge>
                          <span className="font-medium">{adj.taskName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">{adj.originalValue}</span>
                          <ArrowRight className="h-4 w-4" />
                          <span className={cn(
                            "font-medium",
                            adj.newValue < adj.originalValue ? 'text-success' : 'text-destructive'
                          )}>
                            {adj.newValue}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {adj.type === 'resource' ? 'resources' : 'days'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button variant="outline" className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Scenario
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="outline">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                {selectedScenario.status === 'draft' && (
                  <Button>
                    <Play className="h-4 w-4 mr-2" />
                    Apply as Baseline
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
