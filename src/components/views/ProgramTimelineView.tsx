import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  Download,
  Milestone,
  Flag,
  AlertTriangle,
  CheckCircle2,
  X,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { mockPrograms, mockProjects } from '@/data/mockData';
import { StatusIndicator } from '@/components/enterprise/StatusIndicator';
import { ProgressRing } from '@/components/enterprise/ProgressRing';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

type TimeScale = 'month' | 'quarter' | 'year';

interface TimelineProject {
  id: string;
  name: string;
  code: string;
  programId: string;
  programName: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  health: 'green' | 'amber' | 'red';
  milestones: { date: Date; name: string; status: 'completed' | 'upcoming' | 'at-risk' }[];
}

// Extended project type with more details
interface ExtendedProject extends TimelineProject {
  budget: number;
  spent: number;
  manager: string;
  description: string;
  team: string[];
  risks: { name: string; severity: 'high' | 'medium' | 'low' }[];
  burndownData: { week: string; planned: number; actual: number }[];
}

export function ProgramTimelineView() {
  const [timeScale, setTimeScale] = useState<TimeScale>('quarter');
  const [viewDate, setViewDate] = useState(new Date(2024, 0, 1));
  const [expandedPrograms, setExpandedPrograms] = useState<string[]>(mockPrograms.map(p => p.id));
  const [selectedProject, setSelectedProject] = useState<ExtendedProject | null>(null);

  // Generate timeline data with extended info
  const timelineData = useMemo(() => {
    return mockProjects.map((project, index) => {
      const program = mockPrograms.find(p => p.projectIds.includes(project.id));
      
      // Generate realistic mock data for drill-down
      const burndownWeeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'];
      const variance = project.health === 'red' ? 15 : project.health === 'amber' ? 8 : 3;
      
      return {
        id: project.id,
        name: project.name,
        code: project.code,
        programId: program?.id || '',
        programName: program?.name || '',
        startDate: new Date(project.startDate),
        endDate: new Date(project.endDate),
        progress: project.progress,
        health: project.health,
        budget: project.budget.approved,
        spent: project.budget.actual,
        manager: project.manager,
        description: `${project.name} - Strategic initiative focused on delivering key capabilities and business value.`,
        team: ['Lead PM', 'Tech Lead', 'Designer', 'Developer 1', 'Developer 2'].slice(0, 3 + (index % 3)),
        risks: project.health === 'green' ? [] : 
               project.health === 'amber' ? [{ name: 'Timeline pressure', severity: 'medium' as const }] :
               [{ name: 'Critical blockers', severity: 'high' as const }, { name: 'Resource constraints', severity: 'medium' as const }],
        burndownData: burndownWeeks.map((week, i) => ({
          week,
          planned: 100 - (i * 15),
          actual: 100 - (i * 15) + (Math.random() * variance * (project.health === 'green' ? -1 : 1))
        })),
        milestones: [
          { date: new Date(project.startDate), name: 'Kickoff', status: 'completed' as const },
          { 
            date: new Date(new Date(project.startDate).getTime() + (new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) * 0.5),
            name: 'Mid-point Review',
            status: project.progress >= 50 ? 'completed' as const : project.progress >= 40 ? 'upcoming' as const : 'at-risk' as const
          },
          { 
            date: new Date(project.endDate), 
            name: 'Go-Live', 
            status: project.progress >= 100 ? 'completed' as const : project.health === 'red' ? 'at-risk' as const : 'upcoming' as const 
          },
        ],
      };
    });
  }, []);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  // Calculate timeline range
  const getTimelineRange = () => {
    const ranges: { [key in TimeScale]: { months: number; label: string } } = {
      month: { months: 6, label: 'Monthly' },
      quarter: { months: 12, label: 'Quarterly' },
      year: { months: 24, label: 'Yearly' },
    };
    return ranges[timeScale];
  };

  const timelineRange = getTimelineRange();
  const endDate = new Date(viewDate);
  endDate.setMonth(endDate.getMonth() + timelineRange.months);

  // Generate time periods for header
  const getTimePeriods = () => {
    const periods: { start: Date; end: Date; label: string }[] = [];
    const current = new Date(viewDate);

    while (current < endDate) {
      const periodStart = new Date(current);
      let periodEnd: Date;
      let label: string;

      if (timeScale === 'month') {
        periodEnd = new Date(current);
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        label = current.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      } else if (timeScale === 'quarter') {
        const quarter = Math.floor(current.getMonth() / 3) + 1;
        periodEnd = new Date(current);
        periodEnd.setMonth(Math.floor(current.getMonth() / 3) * 3 + 3);
        label = `Q${quarter} ${current.getFullYear()}`;
        current.setMonth(Math.floor(current.getMonth() / 3) * 3);
      } else {
        periodEnd = new Date(current);
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        label = current.getFullYear().toString();
      }

      periods.push({ start: periodStart, end: periodEnd, label });
      current.setTime(periodEnd.getTime());
    }

    return periods;
  };

  const timePeriods = getTimePeriods();

  // Calculate bar position and width
  const getBarStyle = (project: TimelineProject) => {
    const totalDays = (endDate.getTime() - viewDate.getTime()) / (1000 * 60 * 60 * 24);
    const startDays = Math.max(0, (project.startDate.getTime() - viewDate.getTime()) / (1000 * 60 * 60 * 24));
    const projectDays = (project.endDate.getTime() - project.startDate.getTime()) / (1000 * 60 * 60 * 24);
    const endDays = Math.min(totalDays, startDays + projectDays);

    const left = (startDays / totalDays) * 100;
    const width = ((endDays - startDays) / totalDays) * 100;

    return { left: `${left}%`, width: `${Math.max(width, 1)}%` };
  };

  // Calculate milestone position
  const getMilestonePosition = (date: Date) => {
    const totalDays = (endDate.getTime() - viewDate.getTime()) / (1000 * 60 * 60 * 24);
    const days = (date.getTime() - viewDate.getTime()) / (1000 * 60 * 60 * 24);
    return `${(days / totalDays) * 100}%`;
  };

  const toggleProgram = (programId: string) => {
    setExpandedPrograms(prev => 
      prev.includes(programId) 
        ? prev.filter(id => id !== programId)
        : [...prev, programId]
    );
  };

  const navigateTime = (direction: 'prev' | 'next') => {
    const newDate = new Date(viewDate);
    const offset = timeScale === 'month' ? 3 : timeScale === 'quarter' ? 6 : 12;
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? offset : -offset));
    setViewDate(newDate);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Cross-Project Timeline</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visualize project schedules across programs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Timeline Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => navigateTime('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {viewDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - {endDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
              </div>
              <Button variant="outline" size="icon" onClick={() => navigateTime('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-4">
              {/* Time Scale Selector */}
              <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
                {(['month', 'quarter', 'year'] as TimeScale[]).map((scale) => (
                  <button
                    key={scale}
                    onClick={() => setTimeScale(scale)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${
                      timeScale === scale
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {scale}
                  </button>
                ))}
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <ZoomOut className="h-3 w-3" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <ZoomIn className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="w-4 h-2 rounded bg-success" />
              <span className="text-xs text-muted-foreground">On Track</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-2 rounded bg-warning" />
              <span className="text-xs text-muted-foreground">At Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-2 rounded bg-destructive" />
              <span className="text-xs text-muted-foreground">Critical</span>
            </div>
            <div className="flex items-center gap-2">
              <Flag className="h-3 w-3 text-primary" />
              <span className="text-xs text-muted-foreground">Milestone</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-2 rounded bg-muted border border-dashed border-muted-foreground" />
              <span className="text-xs text-muted-foreground">Progress</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Grid */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex">
            {/* Left Panel - Project Names */}
            <div className="w-80 flex-shrink-0 border-r border-border bg-muted/30">
              {/* Header */}
              <div className="h-12 border-b border-border px-4 flex items-center">
                <span className="text-xs font-medium text-muted-foreground uppercase">Program / Project</span>
              </div>

              {/* Program/Project List */}
              {mockPrograms.map((program) => {
                const programProjects = timelineData.filter(p => p.programId === program.id);
                const isExpanded = expandedPrograms.includes(program.id);

                return (
                  <div key={program.id}>
                    {/* Program Row */}
                    <motion.div
                      className="h-10 border-b border-border/50 px-4 flex items-center gap-2 bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => toggleProgram(program.id)}
                    >
                      <motion.div
                        animate={{ rotate: isExpanded ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </motion.div>
                      <StatusIndicator status={program.health} size="sm" />
                      <span className="text-sm font-medium truncate">{program.name}</span>
                      <Badge variant="outline" className="ml-auto text-xs">
                        {programProjects.length}
                      </Badge>
                    </motion.div>

                    {/* Project Rows */}
                    {isExpanded && programProjects.map((project) => (
                      <div
                        key={project.id}
                        className="h-12 border-b border-border/30 px-4 pl-10 flex items-center gap-2 hover:bg-primary/5 transition-colors cursor-pointer group"
                        onClick={() => setSelectedProject(project as ExtendedProject)}
                      >
                        <StatusIndicator status={project.health} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate group-hover:text-primary transition-colors">{project.name}</p>
                          <p className="text-xs text-muted-foreground">{project.code}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Right Panel - Timeline Grid */}
            <div className="flex-1 overflow-x-auto">
              {/* Time Period Header */}
              <div className="h-12 border-b border-border flex">
                {timePeriods.map((period, index) => (
                  <div
                    key={index}
                    className="flex-1 min-w-[100px] border-r border-border/50 px-2 flex items-center justify-center"
                  >
                    <span className="text-xs font-medium text-muted-foreground">{period.label}</span>
                  </div>
                ))}
              </div>

              {/* Timeline Rows */}
              {mockPrograms.map((program) => {
                const programProjects = timelineData.filter(p => p.programId === program.id);
                const isExpanded = expandedPrograms.includes(program.id);

                return (
                  <div key={program.id}>
                    {/* Program Row - Summary Bar */}
                    <div className="h-10 border-b border-border/50 relative bg-muted/30">
                      <div className="absolute inset-0 flex">
                        {timePeriods.map((_, index) => (
                          <div key={index} className="flex-1 min-w-[100px] border-r border-border/20" />
                        ))}
                      </div>
                      {/* Program span bar */}
                      {programProjects.length > 0 && (
                        <div
                          className="absolute top-1/2 -translate-y-1/2 h-3 rounded-full bg-primary/30"
                          style={{
                            left: getBarStyle(programProjects.reduce((earliest, p) => 
                              p.startDate < earliest.startDate ? p : earliest
                            )).left,
                            width: (() => {
                              const earliest = programProjects.reduce((e, p) => p.startDate < e.startDate ? p : e);
                              const latest = programProjects.reduce((l, p) => p.endDate > l.endDate ? p : l);
                              const totalDays = (endDate.getTime() - viewDate.getTime()) / (1000 * 60 * 60 * 24);
                              const startDays = Math.max(0, (earliest.startDate.getTime() - viewDate.getTime()) / (1000 * 60 * 60 * 24));
                              const endDays = Math.min(totalDays, (latest.endDate.getTime() - viewDate.getTime()) / (1000 * 60 * 60 * 24));
                              return `${((endDays - startDays) / totalDays) * 100}%`;
                            })(),
                          }}
                        />
                      )}
                    </div>

                    {/* Project Rows */}
                    {isExpanded && programProjects.map((project) => {
                      const barStyle = getBarStyle(project);
                      const healthColor = project.health === 'green' ? 'bg-success' : 
                                         project.health === 'amber' ? 'bg-warning' : 'bg-destructive';

                      return (
                        <div key={project.id} className="h-12 border-b border-border/30 relative">
                          {/* Grid lines */}
                          <div className="absolute inset-0 flex">
                            {timePeriods.map((_, index) => (
                              <div key={index} className="flex-1 min-w-[100px] border-r border-border/10" />
                            ))}
                          </div>

                          {/* Today line */}
                          <div 
                            className="absolute top-0 bottom-0 w-px bg-primary z-10"
                            style={{ left: getMilestonePosition(new Date()) }}
                          />

                          {/* Project Bar */}
                          <motion.div
                            className={`absolute top-1/2 -translate-y-1/2 h-6 rounded ${healthColor} cursor-pointer group`}
                            style={barStyle}
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                            whileHover={{ scale: 1.05 }}
                            onClick={() => setSelectedProject(project as ExtendedProject)}
                          >
                            {/* Progress overlay */}
                            <div 
                              className="absolute inset-0 bg-foreground/20 rounded-l"
                              style={{ width: `${project.progress}%` }}
                            />

                            {/* Project name tooltip */}
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                              {project.name} ({project.progress}%) - Click for details
                            </div>
                          </motion.div>

                          {/* Milestones */}
                          {project.milestones.map((milestone, idx) => {
                            if (milestone.date < viewDate || milestone.date > endDate) return null;
                            const Icon = milestone.status === 'completed' ? CheckCircle2 : 
                                         milestone.status === 'at-risk' ? AlertTriangle : Milestone;
                            const color = milestone.status === 'completed' ? 'text-success' : 
                                         milestone.status === 'at-risk' ? 'text-destructive' : 'text-primary';

                            return (
                              <div
                                key={idx}
                                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 group"
                                style={{ left: getMilestonePosition(milestone.date) }}
                              >
                                <Icon className={`h-4 w-4 ${color}`} />
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                                  {milestone.name}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card variant="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{mockProjects.length}</p>
                <p className="text-xs text-muted-foreground">Active Projects</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-semibold">12</p>
                <p className="text-xs text-muted-foreground">Completed Milestones</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Flag className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-semibold">8</p>
                <p className="text-xs text-muted-foreground">Upcoming Milestones</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-semibold">3</p>
                <p className="text-xs text-muted-foreground">At-Risk Milestones</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Drill-Down Panel */}
      <AnimatePresence>
        {selectedProject && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
              onClick={() => setSelectedProject(null)}
            />

            {/* Slide-out Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-2xl bg-card border-l border-border shadow-2xl z-50 overflow-y-auto"
            >
              {/* Panel Header */}
              <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border p-6 z-10">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <StatusIndicator status={selectedProject.health} size="lg" />
                    <div>
                      <h2 className="text-xl font-semibold">{selectedProject.name}</h2>
                      <p className="text-sm text-muted-foreground">{selectedProject.code} • {selectedProject.programName}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedProject(null)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Panel Content */}
              <div className="p-6 space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                  <p className="text-sm">{selectedProject.description}</p>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <Card variant="glass">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Target className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-2xl font-semibold">{selectedProject.progress}%</p>
                          <p className="text-xs text-muted-foreground">Progress</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card variant="glass">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-success/10">
                          <DollarSign className="h-5 w-5 text-success" />
                        </div>
                        <div>
                          <p className="text-2xl font-semibold">{formatCurrency(selectedProject.budget)}</p>
                          <p className="text-xs text-muted-foreground">Budget</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card variant="glass">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-warning/10">
                          <TrendingUp className="h-5 w-5 text-warning" />
                        </div>
                        <div>
                          <p className="text-2xl font-semibold">{formatCurrency(selectedProject.spent)}</p>
                          <p className="text-xs text-muted-foreground">Spent ({Math.round(selectedProject.spent / selectedProject.budget * 100)}%)</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card variant="glass">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <Clock className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{selectedProject.endDate.toLocaleDateString()}</p>
                          <p className="text-xs text-muted-foreground">Target End Date</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Progress Ring and Burndown */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Overall Progress</CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center py-4">
                      <ProgressRing value={selectedProject.progress} size={120} strokeWidth={10} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Burndown Chart</CardTitle>
                    </CardHeader>
                    <CardContent className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={selectedProject.burndownData}>
                          <defs>
                            <linearGradient id="colorPlanned" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="week" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                          <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--popover))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              fontSize: '12px'
                            }} 
                          />
                          <Area type="monotone" dataKey="planned" stroke="hsl(var(--muted-foreground))" fillOpacity={1} fill="url(#colorPlanned)" strokeDasharray="5 5" />
                          <Area type="monotone" dataKey="actual" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorActual)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Timeline Milestones */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Project Milestones</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedProject.milestones.map((milestone, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-full ${
                            milestone.status === 'completed' ? 'bg-success/10' :
                            milestone.status === 'at-risk' ? 'bg-destructive/10' : 'bg-primary/10'
                          }`}>
                            {milestone.status === 'completed' ? (
                              <CheckCircle2 className="h-4 w-4 text-success" />
                            ) : milestone.status === 'at-risk' ? (
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                            ) : (
                              <Flag className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{milestone.name}</p>
                            <p className="text-xs text-muted-foreground">{milestone.date.toLocaleDateString()}</p>
                          </div>
                          <Badge variant={
                            milestone.status === 'completed' ? 'default' :
                            milestone.status === 'at-risk' ? 'destructive' : 'outline'
                          } className="text-xs capitalize">
                            {milestone.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Team */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Project Team
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {selectedProject.manager} (PM)
                      </Badge>
                      {selectedProject.team.map((member, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {member}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Risks */}
                {selectedProject.risks.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-warning" />
                        Active Risks
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedProject.risks.map((risk, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                            <span className="text-sm">{risk.name}</span>
                            <Badge variant={
                              risk.severity === 'high' ? 'destructive' :
                              risk.severity === 'medium' ? 'secondary' : 'outline'
                            } className="text-xs capitalize">
                              {risk.severity}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Budget Progress */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Budget Utilization</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Spent: {formatCurrency(selectedProject.spent)}</span>
                        <span>Budget: {formatCurrency(selectedProject.budget)}</span>
                      </div>
                      <Progress value={(selectedProject.spent / selectedProject.budget) * 100} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(selectedProject.budget - selectedProject.spent)} remaining
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
