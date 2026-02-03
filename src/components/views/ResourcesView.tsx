import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  User,
  Calendar,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Filter,
  Search,
  LayoutGrid,
  List,
  ChevronRight,
  Briefcase,
  DollarSign,
  Mail,
  BarChart3,
  Settings,
  MoreHorizontal,
  Loader2,
  AlertCircle,
  Download,
  XCircle,
} from 'lucide-react';
import { useProjectContext } from '@/contexts/ProjectContext';
import { useResources, useTaskResourceAssignments, useCreateResource } from '@/hooks/useResources';
import type { Resource, ResourceAllocation } from '@/types/project';
import { toast } from 'sonner';

// Generate weeks for heatmap
const generateWeeks = () => {
  const weeks = [];
  const startDate = new Date('2024-08-05');
  for (let i = 0; i < 12; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i * 7);
    weeks.push({
      id: `W${i + 1}`,
      label: `W${i + 33}`,
      startDate: date.toISOString().split('T')[0],
    });
  }
  return weeks;
};

const weeks = generateWeeks();

const getHeatmapColor = (allocation: number) => {
  if (allocation >= 100) return 'bg-destructive/80';
  if (allocation >= 90) return 'bg-warning/80';
  if (allocation >= 70) return 'bg-primary/60';
  if (allocation >= 50) return 'bg-primary/40';
  if (allocation >= 30) return 'bg-primary/20';
  return 'bg-muted';
};

const getUtilizationStatus = (allocation: number) => {
  if (allocation >= 100) return { label: 'Over-allocated', color: 'destructive' };
  if (allocation >= 90) return { label: 'At capacity', color: 'warning' };
  if (allocation >= 70) return { label: 'Optimal', color: 'success' };
  if (allocation >= 50) return { label: 'Available', color: 'primary' };
  return { label: 'Under-utilized', color: 'muted' };
};

export function ResourcesView() {
  const { settings } = useProjectContext();
  const projectId = settings.id;

  const { data: dbResources = [], isLoading: loadingResources } = useResources(projectId);
  const { data: dbAssignments = [], isLoading: loadingAssignments } = useTaskResourceAssignments(projectId);
  const createResource = useCreateResource();

  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'heatmap'>('heatmap');
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  const resources = useMemo(() => {
    return dbResources.map(dr => {
      const resourceAssignments = dbAssignments.filter(da => da.resource_id === dr.id);
      const allocation = resourceAssignments.map(ra => ({
        projectId: projectId || '',
        projectName: 'Active Project',
        allocation: ra.units,
        startDate: ra.start_date || '',
        endDate: ra.end_date || '',
      }));

      const totalAllocated = allocation.reduce((sum, a) => sum + a.allocation, 0);

      return {
        id: dr.id,
        name: dr.name,
        email: dr.email || '',
        role: dr.notes && dr.notes.includes('Role:') ? dr.notes.split('Role:')[1].split(',')[0].trim() : 'Project Resource',
        department: dr.notes && dr.notes.includes('Dept:') ? dr.notes.split('Dept:')[1].split(',')[0].trim() : 'Operations',
        skills: dr.notes && dr.notes.includes('Skills:') ? dr.notes.split('Skills:')[1].split(';')[0].split(',').map(s => s.trim()) : [],
        availability: dr.max_units,
        allocation: allocation,
        hourlyRate: dr.standard_rate,
      } as Resource;
    });
  }, [dbResources, dbAssignments, projectId]);

  const totalCapacity = resources.reduce((sum, r) => sum + r.availability, 0);
  const totalAllocated = resources.reduce((sum, r) =>
    sum + r.allocation.reduce((a, alloc) => a + alloc.allocation, 0), 0
  );
  const avgUtilization = totalCapacity > 0 ? Math.round((totalAllocated / totalCapacity) * 100) : 0;

  const overAllocatedCount = resources.filter(r =>
    r.allocation.reduce((sum, a) => sum + a.allocation, 0) > 100
  ).length;

  const underUtilizedCount = resources.filter(r =>
    r.allocation.reduce((sum, a) => sum + a.allocation, 0) < 50
  ).length;

  const handleAddResource = async () => {
    if (!projectId) return;

    const newResource = {
      project_id: projectId,
      name: 'New Resource',
      email: 'resource@company.com',
      type: 'work' as const,
      max_units: 100,
      standard_rate: 100,
      overtime_rate: 150,
      cost_per_use: 0,
      calendar_id: null,
      notes: 'Skills: React, TypeScript; Role: Developer; Dept: Engineering',
    };

    try {
      await createResource.mutateAsync(newResource);
    } catch (error) {
      // Error handled by mutation toast
    }
  };

  const handleExport = () => {
    if (resources.length === 0) {
      toast.error('No resources to export');
      return;
    }

    const headers = ['Name', 'Email', 'Role', 'Department', 'Skills', 'Availability', 'Rate'];
    const csvContent = [
      headers.join(','),
      ...resources.map(r => [
        `"${r.name}"`,
        `"${r.email}"`,
        `"${r.role}"`,
        `"${r.department}"`,
        `"${r.skills.join('; ')}"`,
        r.availability,
        r.hourlyRate
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `resources_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Resources exported to CSV');
  };

  if (loadingResources || loadingAssignments) {
    return (
      <div className="flex items-center justify-center h-full p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Resource Management</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Capacity planning and allocation tracking from live project data
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button
              variant="default"
              size="sm"
              className="gap-2"
              onClick={handleAddResource}
              disabled={createResource.isPending}
            >
              {createResource.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add Resource
            </Button>
          </div>
        </div>

        {/* KPI Summary */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Team Members</p>
                  <p className="text-2xl font-bold text-foreground">{resources.length}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Avg Utilization</p>
                  <p className="text-2xl font-bold text-foreground">{avgUtilization}%</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
              </div>
              <Progress value={avgUtilization} className="mt-2 h-1" />
            </CardContent>
          </Card>

          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Over-allocated</p>
                  <p className="text-2xl font-bold text-destructive">{overAllocatedCount}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Under-utilized</p>
                  <p className="text-2xl font-bold text-warning">{underUtilizedCount}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* View Toggle & Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 py-3 border-b border-border flex items-center justify-between">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
            <TabsList className="bg-muted/50">
              <TabsTrigger value="heatmap" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Heatmap
              </TabsTrigger>
              <TabsTrigger value="grid" className="gap-2">
                <LayoutGrid className="h-4 w-4" />
                Cards
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-2">
                <List className="h-4 w-4" />
                List
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs">
            <span className="text-muted-foreground">Utilization:</span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-muted" />
                <span className="text-muted-foreground">0-30%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-primary/40" />
                <span className="text-muted-foreground">30-70%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-primary/60" />
                <span className="text-muted-foreground">70-90%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-warning/80" />
                <span className="text-muted-foreground">90-100%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-destructive/80" />
                <span className="text-muted-foreground">&gt;100%</span>
              </div>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6">
            {resources.length === 0 ? (
              <div className="bg-card rounded-lg border border-dashed border-border p-12 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                <h3 className="text-lg font-medium text-foreground">No resources allocated</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                  Start by adding resources to your project team to track capacity and utilization.
                </p>
                <Button variant="outline" className="mt-6" onClick={handleAddResource}>
                  Add Project Resource
                </Button>
              </div>
            ) : (
              <>
                {viewMode === 'heatmap' && (
                  <div className="bg-card rounded-lg border border-border overflow-hidden">
                    {/* Heatmap Header */}
                    <div className="flex border-b border-border bg-muted/30">
                      <div className="w-56 shrink-0 p-3 font-medium text-sm text-muted-foreground border-r border-border">
                        Resource
                      </div>
                      <div className="flex-1 flex">
                        {weeks.map((week) => (
                          <div
                            key={week.id}
                            className="flex-1 p-2 text-center text-xs text-muted-foreground border-r border-border last:border-r-0"
                          >
                            {week.label}
                          </div>
                        ))}
                      </div>
                      <div className="w-28 shrink-0 p-3 text-center text-xs font-medium text-muted-foreground">
                        Total
                      </div>
                    </div>

                    {/* Heatmap Rows */}
                    {resources.map((resource) => {
                      const totalAllocation = resource.allocation.reduce((sum, a) => sum + a.allocation, 0);
                      const status = getUtilizationStatus(totalAllocation);

                      return (
                        <motion.div
                          key={resource.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex border-b border-border last:border-b-0 hover:bg-accent/30 transition-colors cursor-pointer"
                          onClick={() => setSelectedResource(resource)}
                        >
                          <div className="w-56 shrink-0 p-3 border-r border-border">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary/20 text-primary text-xs">
                                  {resource.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="font-medium text-sm text-foreground truncate">
                                  {resource.name}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {resource.role}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex-1 flex">
                            {weeks.map((week) => {
                              // For live data, we'll just show current allocation across the board for now
                              // In a real app, this would be time-phasing DB data
                              return (
                                <div
                                  key={week.id}
                                  className="flex-1 p-1.5 border-r border-border/50 last:border-r-0"
                                >
                                  <div
                                    className={cn(
                                      'h-8 rounded flex items-center justify-center text-xs font-medium transition-all',
                                      getHeatmapColor(totalAllocation),
                                      totalAllocation >= 100 ? 'text-destructive-foreground' :
                                        totalAllocation >= 70 ? 'text-foreground' : 'text-muted-foreground'
                                    )}
                                  >
                                    {totalAllocation}%
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <div className="w-28 shrink-0 p-3 flex items-center justify-center">
                            <Badge variant={status.color as any} className="text-xs">
                              {totalAllocation}%
                            </Badge>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {viewMode === 'grid' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {resources.map((resource) => {
                      const totalAllocation = resource.allocation.reduce((sum, a) => sum + a.allocation, 0);
                      const status = getUtilizationStatus(totalAllocation);

                      return (
                        <Card
                          key={resource.id}
                          className="hover:shadow-md transition-shadow cursor-pointer border border-border bg-card"
                          onClick={() => setSelectedResource(resource)}
                        >
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-12 w-12">
                                  <AvatarFallback className="bg-primary/20 text-primary">
                                    {resource.name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h3 className="font-semibold text-foreground">{resource.name}</h3>
                                  <p className="text-sm text-muted-foreground">{resource.role}</p>
                                </div>
                              </div>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="space-y-3">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Utilization</span>
                                <Badge variant={status.color as any}>{status.label}</Badge>
                              </div>
                              <Progress value={Math.min(100, totalAllocation)} className="h-2" />
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{totalAllocation}% allocated</span>
                                <span>{resource.availability}% capacity</span>
                              </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-border">
                              <p className="text-xs text-muted-foreground mb-2">Skills</p>
                              <div className="flex flex-wrap gap-1">
                                {resource.skills.length > 0 ? (
                                  resource.skills.slice(0, 3).map((skill) => (
                                    <Badge key={skill} variant="secondary" className="text-xs font-normal">
                                      {skill}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-xs text-muted-foreground italic">No skills listed</span>
                                )}
                                {resource.skills.length > 3 && (
                                  <Badge variant="outline" className="text-xs font-normal">
                                    +{resource.skills.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between text-xs">
                              <span className="text-muted-foreground flex items-center gap-1">
                                <Briefcase className="h-3 w-3" />
                                {resource.department}
                              </span>
                              {resource.hourlyRate > 0 && (
                                <span className="text-muted-foreground flex items-center gap-1 font-mono">
                                  <DollarSign className="h-3 w-3" />
                                  ${resource.hourlyRate}/hr
                                </span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}

                {viewMode === 'list' && (
                  <Card className="border border-border">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted/30">
                          <tr className="border-b border-border">
                            <th className="text-left p-4 text-xs font-medium text-muted-foreground">Resource</th>
                            <th className="text-left p-4 text-xs font-medium text-muted-foreground">Role</th>
                            <th className="text-left p-4 text-xs font-medium text-muted-foreground">Department</th>
                            <th className="text-left p-4 text-xs font-medium text-muted-foreground">Skills</th>
                            <th className="text-center p-4 text-xs font-medium text-muted-foreground">Utilization</th>
                            <th className="text-center p-4 text-xs font-medium text-muted-foreground">Rate</th>
                            <th className="text-right p-4 text-xs font-medium text-muted-foreground">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {resources.map((resource) => {
                            const totalAllocation = resource.allocation.reduce((sum, a) => sum + a.allocation, 0);
                            const status = getUtilizationStatus(totalAllocation);

                            return (
                              <tr
                                key={resource.id}
                                className="border-b border-border hover:bg-accent/30 cursor-pointer transition-colors"
                                onClick={() => setSelectedResource(resource)}
                              >
                                <td className="p-4">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                      <AvatarFallback className="bg-primary/20 text-primary text-xs">
                                        {resource.name.split(' ').map(n => n[0]).join('')}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-medium text-sm text-foreground">{resource.name}</p>
                                      <p className="text-xs text-muted-foreground">{resource.email}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4 text-sm text-foreground font-medium">{resource.role}</td>
                                <td className="p-4 text-sm text-muted-foreground">{resource.department}</td>
                                <td className="p-4">
                                  <div className="flex flex-wrap gap-1">
                                    {resource.skills.slice(0, 2).map((skill) => (
                                      <Badge key={skill} variant="secondary" className="text-xs font-normal">
                                        {skill}
                                      </Badge>
                                    ))}
                                    {resource.skills.length > 2 && (
                                      <span className="text-xs text-muted-foreground">
                                        +{resource.skills.length - 2}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-4 text-center">
                                  <div className="flex flex-col items-center gap-1 min-w-[80px]">
                                    <Badge variant={status.color as any} className="text-[10px] px-1.5 h-4">
                                      {totalAllocation}%
                                    </Badge>
                                    <Progress value={Math.min(100, totalAllocation)} className="w-16 h-1" />
                                  </div>
                                </td>
                                <td className="p-4 text-center text-sm font-mono text-foreground">
                                  {resource.hourlyRate > 0 ? `$${resource.hourlyRate}` : '-'}
                                </td>
                                <td className="p-4 text-right">
                                  <Button variant="ghost" size="icon">
                                    <ChevronRight className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Resource Detail Panel */}
      <AnimatePresence>
        {selectedResource && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/40 backdrop-blur-[2px] z-40"
              onClick={() => setSelectedResource(null)}
            />
            <motion.div
              initial={{ x: '100%', opacity: 0.5 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0.5 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-sm bg-card border-l border-border shadow-2xl z-50 overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-border bg-muted/20">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 border-2 border-primary/20">
                      <AvatarFallback className="bg-primary/20 text-primary text-xl font-bold">
                        {selectedResource.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-xl font-bold text-foreground leading-tight">{selectedResource.name}</h2>
                      <p className="text-sm text-primary font-medium">{selectedResource.role}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" onClick={() => setSelectedResource(null)}>
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                  </Button>
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-6 space-y-8">
                  {/* Contact */}
                  <section className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Information</h4>
                    <div className="grid gap-3">
                      <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 border border-border/50">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{selectedResource.email}</span>
                      </div>
                      <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 border border-border/50">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{selectedResource.department}</span>
                      </div>
                    </div>
                  </section>

                  {/* Current Allocations */}
                  <section className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Current Assignments</h4>
                    {selectedResource.allocation.length > 0 ? (
                      selectedResource.allocation.map((alloc, idx) => (
                        <Card key={idx} className="border border-border/60 shadow-none overflow-hidden hover:border-primary/30 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-semibold text-sm text-foreground">{alloc.projectName}</span>
                              <Badge variant="outline" className="font-mono text-[10px]">{alloc.allocation}%</Badge>
                            </div>
                            <Progress value={alloc.allocation} className="h-1.5" />
                            <div className="flex justify-between text-[10px] font-medium text-muted-foreground mt-3">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {alloc.startDate ? new Date(alloc.startDate).toLocaleDateString() : 'TBD'}
                              </div>
                              <div className="flex items-center gap-1">
                                <ChevronRight className="h-3 w-3" />
                                {alloc.endDate ? new Date(alloc.endDate).toLocaleDateString() : 'Ongoing'}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="p-4 rounded-lg bg-muted/30 border border-dashed border-border text-center">
                        <p className="text-xs text-muted-foreground italic">No current project assignments</p>
                      </div>
                    )}
                  </section>

                  {/* Skills */}
                  <section className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Core Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedResource.skills.length > 0 ? (
                        selectedResource.skills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="px-2.5 py-0.5 font-medium rounded-full">
                            {skill}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground italic">No skills documented</span>
                      )}
                    </div>
                  </section>

                  {/* Rate */}
                  {selectedResource.hourlyRate > 0 && (
                    <section className="space-y-2 p-4 rounded-xl bg-primary/5 border border-primary/10">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-primary/70">Billing Information</h4>
                      <p className="text-3xl font-bold text-foreground">
                        ${selectedResource.hourlyRate}<span className="text-sm font-semibold text-muted-foreground ml-1">/ hour</span>
                      </p>
                    </section>
                  )}
                </div>
              </ScrollArea>

              <div className="p-6 border-t border-border bg-card flex gap-3">
                <Button variant="outline" className="flex-1 gap-2 h-11">
                  <Settings className="h-4 w-4" />
                  Edit Profile
                </Button>
                <Button variant="default" className="flex-1 gap-2 h-11">
                  <Calendar className="h-4 w-4" />
                  Allocation
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
