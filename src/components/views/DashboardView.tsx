
import React, { useMemo, useState, useEffect } from 'react';
import GridLayout, { Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Users,
  BarChart3,
  Zap,
  ArrowRight,
  Loader2,
  Plus,
  Layout as LayoutIcon,
  X,
  GripVertical
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KPICard } from '@/components/enterprise/KPICard';
import { ProgressRing } from '@/components/enterprise/ProgressRing';
import { StatusIndicator } from '@/components/enterprise/StatusIndicator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useProjectContext } from '@/contexts/ProjectContext';
import { useProject } from '@/hooks/useProject';
import { useTasks } from '@/hooks/useTasks';
import { useRisks } from '@/hooks/useRisks';
import { useMeetings } from '@/hooks/useMeetings';
import { useActions } from '@/hooks/useActions';
import { useBacklogItems } from '@/hooks/useBacklogItems';
import { useFinancials } from '@/hooks/useFinancials';
import { kpiData as mockKPIData } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserPreferences } from '@/hooks/useUserPreferences';

const WIDGET_TYPES = [
  { id: 'kpi-schedule', name: 'Schedule Variance (KPI)', icon: Calendar, defaultW: 2, defaultH: 2 },
  { id: 'kpi-cost', name: 'Cost Variance (KPI)', icon: DollarSign, defaultW: 2, defaultH: 2 },
  { id: 'kpi-velocity', name: 'Sprint Velocity (KPI)', icon: TrendingUp, defaultW: 2, defaultH: 2 },
  { id: 'kpi-risks', name: 'Open Risks (KPI)', icon: AlertTriangle, defaultW: 2, defaultH: 2 },
  { id: 'kpi-util', name: 'Team Utilization (KPI)', icon: Users, defaultW: 2, defaultH: 2 },
  { id: 'kpi-actions', name: 'Actions Due (KPI)', icon: CheckCircle2, defaultW: 2, defaultH: 2 },
  { id: 'project-progress', name: 'Project Progress Ring', icon: ProgressRing, defaultW: 4, defaultH: 8 },
  { id: 'budget-overview', name: 'Budget Overview', icon: DollarSign, defaultW: 4, defaultH: 8 },
  { id: 'active-risks', name: 'Active Risks List', icon: AlertTriangle, defaultW: 4, defaultH: 8 },
  { id: 'in-progress', name: 'In Progress Work', icon: LayoutIcon, defaultW: 6, defaultH: 8 },
  { id: 'upcoming-meetings', name: 'Upcoming Meetings', icon: Calendar, defaultW: 6, defaultH: 8 },
];

interface DashboardViewProps {
  onViewChange?: (view: string) => void;
}

interface DashboardWidget {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type: string;
}

const DEFAULT_LAYOUT: DashboardWidget[] = [
  { i: '1', x: 0, y: 0, w: 2, h: 2, type: 'kpi-schedule' },
  { i: '2', x: 2, y: 0, w: 2, h: 2, type: 'kpi-cost' },
  { i: '3', x: 4, y: 0, w: 2, h: 2, type: 'kpi-velocity' },
  { i: '4', x: 6, y: 0, w: 2, h: 2, type: 'kpi-risks' },
  { i: '5', x: 8, y: 0, w: 2, h: 2, type: 'kpi-util' },
  { i: '6', x: 10, y: 0, w: 2, h: 2, type: 'kpi-actions' },
  { i: '7', x: 0, y: 2, w: 4, h: 8, type: 'project-progress' },
  { i: '8', x: 4, y: 2, w: 4, h: 8, type: 'budget-overview' },
  { i: '9', x: 8, y: 2, w: 4, h: 8, type: 'active-risks' },
  { i: '10', x: 0, y: 10, w: 6, h: 8, type: 'in-progress' },
  { i: '11', x: 6, y: 10, w: 6, h: 8, type: 'upcoming-meetings' },
];

export function DashboardView({ onViewChange }: DashboardViewProps) {
  const { settings } = useProjectContext();
  const projectId = settings.id;
  const queryClient = useQueryClient();

  // --- Data Fetching ---
  const { data: project, isLoading: loadingProject } = useProject(projectId);
  const { data: tasks = [], isLoading: loadingTasks } = useTasks(projectId);
  const { risks = [], loading: loadingRisks } = useRisks();
  const { meetings = [], isLoading: loadingMeetings } = useMeetings(projectId);
  const { actions = [], loading: loadingActions } = useActions();
  const { items: backlogItems = [], loading: loadingBacklog } = useBacklogItems();

  // --- Dashboard State ---
  // Using Supabase Persistence
  const { getPreference, updatePreference, isLoading: loadingPrefs } = useUserPreferences(projectId);
  const savedLayout = getPreference('dashboard_layout');

  const [layout, setLayout] = useState<DashboardWidget[]>(DEFAULT_LAYOUT);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddWidgetOpen, setIsAddWidgetOpen] = useState(false);

  // Initialize layout from prefs when loaded
  useEffect(() => {
    if (savedLayout && Array.isArray(savedLayout)) {
      setLayout(savedLayout);
    }
  }, [savedLayout]);

  // Save layout on change (Debounced manually via timeout if needed, but here simple mutation is fine if not dragging too fast)
  // React-Grid-Layout triggers this largely on drag end, so direct call is acceptable.
  const handleLayoutChange = (newLayout: Layout[]) => {
    // Merge new positions with existing type data
    const updated = newLayout.map(l => {
      const existing = layout.find(w => w.i === l.i);
      return {
        ...l,
        type: existing?.type || 'unknown'
      };
    });

    // Optimistic update
    setLayout(updated as DashboardWidget[]);

    // Persist
    updatePreference.mutate({ key: 'dashboard_layout', value: updated });
  };

  const handleAddWidget = (typeId: string) => {
    const def = WIDGET_TYPES.find(t => t.id === typeId);
    if (!def) return;

    const newWidget: DashboardWidget = {
      i: `w-${Date.now()}`,
      x: 0,
      y: Infinity, // Put at bottom
      w: def.defaultW,
      h: def.defaultH,
      type: typeId
    };

    // Grid Layout will auto-place it
    setLayout([...layout, newWidget]);
    setIsAddWidgetOpen(false);
  };

  const handleRemoveWidget = (id: string) => {
    const newLayout = layout.filter(w => w.i !== id);
    setLayout(newLayout);
    updatePreference.mutate({ key: 'dashboard_layout', value: newLayout });
  };


  // --- Derived Data ---
  const kpis = useMemo(() => {
    if (!project) return mockKPIData;
    const activeRisksCount = risks.filter(r => r.status !== 'closed').length;
    const criticalRisks = risks.filter(r => r.status !== 'closed' && r.impact === 'critical').length;
    const openActions = actions.filter(a => a.status === 'pending' || a.status === 'in-progress').length;
    const overdueActions = actions.filter(a => (a.status === 'pending' || a.status === 'in-progress') && a.due_date && new Date(a.due_date) < new Date()).length;

    // Simple cost variance calculation
    const budgetTotal = project.budget || 0;
    const spentTotal = project.spent || 0;
    const costVariance = budgetTotal > 0 ? ((budgetTotal - spentTotal) / budgetTotal) * 100 : 0;

    return {
      ...mockKPIData,
      costVariance: parseFloat(costVariance.toFixed(1)),
      openRisks: activeRisksCount,
      criticalRisks,
      openActions,
      overdueActions,
      teamUtilization: 85,
    };
  }, [project, risks, actions]);

  const activeProject = project || { name: settings.name, health: 'green', description: 'No description.', methodology: settings.methodology, progress: 0, start_date: new Date().toISOString(), end_date: new Date().toISOString(), spent: 0, budget: 0 };
  const inProgressItems = backlogItems.filter(t => t.status === 'in-progress');
  const upcomingMeetings = meetings.filter(m => m.status === 'scheduled');
  const activeRisks = risks.filter(r => r.status !== 'closed');
  const isLoading = loadingProject || loadingTasks || loadingRisks || loadingMeetings || loadingActions || loadingBacklog;

  // --- Widget Render Map ---
  const renderWidget = (widget: DashboardWidget) => {
    switch (widget.type) {
      case 'kpi-schedule': return <KPICard title="Schedule Variance" value={`${kpis.scheduleVariance > 0 ? '+' : ''}${kpis.scheduleVariance}%`} status={kpis.scheduleVariance >= 0 ? 'success' : 'warning'} icon={Calendar} subtitle="vs. baseline" />;
      case 'kpi-cost': return <KPICard title="Cost Variance" value={`${kpis.costVariance > 0 ? '+' : ''}${kpis.costVariance}%`} status={kpis.costVariance >= 0 ? 'success' : 'warning'} icon={DollarSign} subtitle="under budget" />;
      case 'kpi-velocity': return <KPICard title="Sprint Velocity" value={kpis.sprintVelocity} status="info" icon={TrendingUp} trend={{ value: 6, label: 'vs avg' }} subtitle={`Avg: ${kpis.avgVelocity} pts`} />;
      case 'kpi-risks': return <KPICard title="Open Risks" value={kpis.openRisks} status={kpis.criticalRisks > 0 ? 'error' : 'warning'} icon={AlertTriangle} subtitle={`${kpis.criticalRisks} critical`} />;
      case 'kpi-util': return <KPICard title="Team Utilization" value={`${kpis.teamUtilization}%`} status="info" icon={Users} subtitle="Current sprint" />;
      case 'kpi-actions': return <KPICard title="Actions Due" value={kpis.openActions} status={kpis.overdueActions > 0 ? 'warning' : 'success'} icon={CheckCircle2} subtitle={`${kpis.overdueActions} overdue`} />;

      case 'project-progress': return (
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Project Progress</CardTitle>
            <Badge variant={activeProject.methodology === 'hybrid' ? 'info' : 'secondary'}>{activeProject.methodology}</Badge>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-4">
              <ProgressRing value={activeProject.progress || 0} size={120} strokeWidth={10} color="primary" />
            </div>
            <div className="space-y-3 mt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Start Date</span>
                <span className="font-medium">{activeProject.start_date ? new Date(activeProject.start_date).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Target End</span>
                <span className="font-medium">{activeProject.end_date ? new Date(activeProject.end_date).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      );
      case 'budget-overview': return (
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Budget Overview</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Spent</span>
                  <span className="font-mono font-medium">${((activeProject.spent || 0) / 1000000).toFixed(2)}M / ${((activeProject.budget || 0) / 1000000).toFixed(2)}M</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${activeProject.budget > 0 ? ((activeProject.spent || 0) / activeProject.budget) * 100 : 0}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Burn Rate</p>
                  <p className="text-lg font-semibold font-mono">${(kpis.burnRate / 1000).toFixed(0)}K<span className="text-xs text-muted-foreground">/mo</span></p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Remaining</p>
                  <p className="text-lg font-semibold font-mono text-success">${(((activeProject.budget || 0) - (activeProject.spent || 0)) / 1000000).toFixed(2)}M</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
      case 'active-risks': return (
        <Card className="h-full overflow-hidden flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0">
            <CardTitle className="text-base font-semibold">Active Risks</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto min-h-0">
            <div className="space-y-3">
              {activeRisks.slice(0, 5).map((risk) => (
                <div key={risk.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${risk.impact === 'critical' ? 'bg-destructive' : risk.impact === 'high' ? 'bg-orange-500' : risk.impact === 'medium' ? 'bg-warning' : 'bg-success'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{risk.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={risk.impact as any} className="text-[10px] px-1.5 py-0">{risk.impact}</Badge>
                    </div>
                  </div>
                </div>
              ))}
              {activeRisks.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No active risks</p>}
            </div>
          </CardContent>
        </Card>
      );
      case 'in-progress': return (
        <Card className="h-full overflow-hidden flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0">
            <CardTitle className="text-base font-semibold">In Progress</CardTitle>
            <Badge variant="in-progress">{inProgressItems.length} items</Badge>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto min-h-0">
            <div className="space-y-2">
              {inProgressItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50">
                  <Badge variant={item.type as any} className="shrink-0">{item.type}</Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                  </div>
                </div>
              ))}
              {inProgressItems.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">No work in progress</p>}
            </div>
          </CardContent>
        </Card>
      );
      case 'upcoming-meetings': return (
        <Card className="h-full overflow-hidden flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0">
            <CardTitle className="text-base font-semibold">Upcoming Meetings</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto min-h-0">
            <div className="space-y-3">
              {upcomingMeetings.map((meeting) => (
                <div key={meeting.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50">
                  <div className="flex flex-col items-center justify-center bg-primary/10 rounded-lg p-2 min-w-[50px]">
                    <span className="text-xs text-primary font-medium">{new Date(meeting.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                    <span className="text-lg font-bold text-primary">{new Date(meeting.date).getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{meeting.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{meeting.start_time} - {meeting.end_time}</span>
                    </div>
                  </div>
                </div>
              ))}
              {upcomingMeetings.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">No upcoming meetings</p>}
            </div>
          </CardContent>
        </Card>
      );
      default: return <div className="p-4 border border-dashed rounded h-full flex items-center justify-center text-muted-foreground">Unknown Widget: {widget.type}</div>
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-full p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{activeProject.name} Dashboard</h1>
            <StatusIndicator status={activeProject.health as any} pulse />
          </div>
          <p className="text-muted-foreground max-w-2xl">{activeProject.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={isEditMode ? "secondary" : "outline"} onClick={() => setIsEditMode(!isEditMode)}>
            {isEditMode ? "Done Editing" : "Edit Layout"}
          </Button>
          {isEditMode && (
            <Dialog open={isAddWidgetOpen} onOpenChange={setIsAddWidgetOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" /> Add Widget</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Widget</DialogTitle>
                  <DialogDescription>Choose a widget to add to your dashboard.</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4 max-h-[60vh] overflow-y-auto">
                  {WIDGET_TYPES.map(type => (
                    <Button
                      key={type.id}
                      variant="outline"
                      className="h-24 flex flex-col gap-2 hover:bg-muted/50 whitespace-normal text-center"
                      onClick={() => handleAddWidget(type.id)}
                    >
                      <type.icon className="h-6 w-6" />
                      <span className="text-xs">{type.name}</span>
                    </Button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          )}
          <Button size="sm" onClick={() => onViewChange?.('morning-briefing')}>
            <Zap className="h-4 w-4 mr-2" />
            AI Insights
          </Button>
        </div>
      </div>

      {/* Grid Layout */}
      <GridLayout
        className="layout"
        layout={layout}
        cols={12}
        rowHeight={30}
        width={1200} // This ideally should be responsive/measured ref
        isDraggable={isEditMode}
        isResizable={isEditMode}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".drag-handle"
      >
        {layout.map(widget => (
          <div key={widget.i} className={cn("bg-background/50 rounded-lg", isEditMode && "ring-1 ring-border border-dashed")}>
            <div className="h-full relative group">
              {isEditMode && (
                <>
                  <div className="drag-handle absolute top-2 left-2 z-20 cursor-move p-1 bg-background/80 rounded hover:bg-background border opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 z-20 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveWidget(widget.i)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </>
              )}
              {renderWidget(widget)}
            </div>
          </div>
        ))}
      </GridLayout>

      {/* Manual Full Report Link (If needed) */}
      <div className="flex justify-center mt-8">
        <Button variant="link" onClick={() => onViewChange?.('final-report')}>View Full Project Report <ArrowRight className="h-4 w-4 ml-1" /></Button>
      </div>
    </div>
  );
}
