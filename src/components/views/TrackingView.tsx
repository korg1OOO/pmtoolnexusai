import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  Table2,
  GanttChart,
  Filter,
  Download,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useProjects } from '@/hooks/useProjects';
import { useTasksWithBaseline, useProjectBaselines } from '@/hooks/useBaselines';
import { BaselineManager } from '@/components/tracking/BaselineManager';
import { VarianceTable } from '@/components/tracking/VarianceTable';
import { TrackingGantt } from '@/components/tracking/TrackingGantt';

export default function TrackingView() {
  const { data: projects = [] } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    projects[0]?.id || null
  );
  const [selectedBaseline, setSelectedBaseline] = useState<string | null>(null);
  const [showMilestones, setShowMilestones] = useState(true);
  const [showSummaryTasks, setShowSummaryTasks] = useState(true);
  const [showBaseline, setShowBaseline] = useState(true);

  // Update selected project when projects load
  React.useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const { data: baselines = [] } = useProjectBaselines(selectedProjectId);
  const { data: tasks = [], isLoading } = useTasksWithBaseline(selectedProjectId, selectedBaseline);

  // Set default baseline when baselines load
  React.useEffect(() => {
    if (baselines.length > 0 && !selectedBaseline) {
      setSelectedBaseline(baselines[0].name);
    }
  }, [baselines, selectedBaseline]);

  // Calculate summary metrics
  const metrics = React.useMemo(() => {
    const tasksWithBaseline = tasks.filter(t => t.status !== 'no-baseline');
    const behind = tasksWithBaseline.filter(t => t.status === 'behind');
    const ahead = tasksWithBaseline.filter(t => t.status === 'ahead');
    const onTrack = tasksWithBaseline.filter(t => t.status === 'on-track');
    
    const totalVariance = tasksWithBaseline.reduce(
      (sum, t) => sum + t.variance.finishDays,
      0
    );
    const avgVariance = tasksWithBaseline.length > 0 
      ? totalVariance / tasksWithBaseline.length 
      : 0;
    
    const criticalBehind = behind.filter(t => t.is_critical).length;

    return {
      total: tasks.length,
      withBaseline: tasksWithBaseline.length,
      behind: behind.length,
      ahead: ahead.length,
      onTrack: onTrack.length,
      avgVariance: Math.round(avgVariance * 10) / 10,
      criticalBehind,
    };
  }, [tasks]);

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className="p-6 border-b bg-card">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/20">
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Baseline & Tracking</h1>
              <p className="text-muted-foreground">
                Compare schedule against baselines and analyze variances
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={selectedProjectId || ''}
              onValueChange={setSelectedProjectId}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6">
        {/* Metrics Cards */}
        <div className="grid grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{metrics.total}</div>
              <p className="text-sm text-muted-foreground">Total Tasks</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-success">{metrics.ahead}</div>
              <p className="text-sm text-muted-foreground">Ahead of Schedule</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-primary">{metrics.onTrack}</div>
              <p className="text-sm text-muted-foreground">On Track</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-destructive">{metrics.behind}</div>
              <p className="text-sm text-muted-foreground">Behind Schedule</p>
            </CardContent>
          </Card>
          <Card className={cn(
            metrics.criticalBehind > 0 && 'border-destructive/50 bg-destructive/5'
          )}>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-destructive">
                {metrics.criticalBehind}
              </div>
              <p className="text-sm text-muted-foreground">Critical Tasks Behind</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Baseline Manager */}
          <div className="col-span-1">
            {selectedProjectId && (
              <BaselineManager
                projectId={selectedProjectId}
                selectedBaseline={selectedBaseline}
                onSelectBaseline={setSelectedBaseline}
              />
            )}
          </div>

          {/* Main Content */}
          <div className="col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Schedule Variance Analysis</CardTitle>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="show-milestones"
                        checked={showMilestones}
                        onCheckedChange={setShowMilestones}
                      />
                      <Label htmlFor="show-milestones" className="text-sm">
                        Milestones
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="show-summary"
                        checked={showSummaryTasks}
                        onCheckedChange={setShowSummaryTasks}
                      />
                      <Label htmlFor="show-summary" className="text-sm">
                        Summary Tasks
                      </Label>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="table">
                  <div className="flex items-center justify-between mb-4">
                    <TabsList>
                      <TabsTrigger value="table">
                        <Table2 className="h-4 w-4 mr-2" />
                        Table View
                      </TabsTrigger>
                      <TabsTrigger value="gantt">
                        <GanttChart className="h-4 w-4 mr-2" />
                        Gantt View
                      </TabsTrigger>
                    </TabsList>
                    
                    {selectedBaseline && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowBaseline(!showBaseline)}
                        >
                          {showBaseline ? (
                            <Eye className="h-4 w-4 mr-1" />
                          ) : (
                            <EyeOff className="h-4 w-4 mr-1" />
                          )}
                          {showBaseline ? 'Hide' : 'Show'} Baseline
                        </Button>
                      </div>
                    )}
                  </div>

                  {!selectedBaseline && (
                    <div className="text-center py-8 text-muted-foreground border rounded-lg">
                      <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>Select or create a baseline to view variance analysis</p>
                    </div>
                  )}

                  {isLoading && selectedBaseline && (
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  )}

                  {!isLoading && selectedBaseline && (
                    <>
                      <TabsContent value="table" className="m-0">
                        <VarianceTable
                          tasks={tasks}
                          showMilestones={showMilestones}
                          showSummaryTasks={showSummaryTasks}
                        />
                      </TabsContent>

                      <TabsContent value="gantt" className="m-0">
                        <TrackingGantt
                          tasks={tasks}
                          showBaseline={showBaseline}
                        />
                      </TabsContent>
                    </>
                  )}
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
