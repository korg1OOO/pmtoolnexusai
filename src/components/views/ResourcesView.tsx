import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import { mockResources, mockProject } from '@/data/mockData';
import type { Resource } from '@/types/project';

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

// Generate allocation data for heatmap
const generateAllocationData = (resource: Resource) => {
  return weeks.map((week, index) => {
    const totalAllocation = resource.allocation.reduce((sum, a) => sum + a.allocation, 0);
    // Add some variance for realistic visualization
    const variance = Math.random() * 20 - 10;
    const allocation = Math.min(120, Math.max(0, totalAllocation + variance));
    return {
      week: week.id,
      allocation: Math.round(allocation),
    };
  });
};

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
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'heatmap'>('heatmap');
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  const totalCapacity = mockResources.reduce((sum, r) => sum + r.availability, 0);
  const totalAllocated = mockResources.reduce((sum, r) => 
    sum + r.allocation.reduce((a, alloc) => a + alloc.allocation, 0), 0
  );
  const avgUtilization = Math.round((totalAllocated / totalCapacity) * 100);

  const overAllocated = mockResources.filter(r => 
    r.allocation.reduce((sum, a) => sum + a.allocation, 0) > 100
  ).length;

  const underUtilized = mockResources.filter(r => 
    r.allocation.reduce((sum, a) => sum + a.allocation, 0) < 50
  ).length;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Resource Management</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Capacity planning and allocation tracking
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
            <Button variant="default" size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
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
                  <p className="text-2xl font-bold text-foreground">{mockResources.length}</p>
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
                  <p className="text-2xl font-bold text-destructive">{overAllocated}</p>
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
                  <p className="text-2xl font-bold text-warning">{underUtilized}</p>
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
            {viewMode === 'heatmap' && (
              <div className="bg-card rounded-lg border border-border overflow-hidden">
                {/* Heatmap Header */}
                <div className="flex border-b border-border">
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
                {mockResources.map((resource) => {
                  const allocationData = generateAllocationData(resource);
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
                        {allocationData.map((data, idx) => (
                          <div
                            key={data.week}
                            className="flex-1 p-1.5 border-r border-border/50 last:border-r-0"
                          >
                            <div
                              className={cn(
                                'h-8 rounded flex items-center justify-center text-xs font-medium transition-all',
                                getHeatmapColor(data.allocation),
                                data.allocation >= 100 ? 'text-destructive-foreground' : 
                                data.allocation >= 70 ? 'text-foreground' : 'text-muted-foreground'
                              )}
                            >
                              {data.allocation}%
                            </div>
                          </div>
                        ))}
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
              <div className="grid grid-cols-3 gap-4">
                {mockResources.map((resource) => {
                  const totalAllocation = resource.allocation.reduce((sum, a) => sum + a.allocation, 0);
                  const status = getUtilizationStatus(totalAllocation);

                  return (
                    <Card
                      key={resource.id}
                      className="hover-lift cursor-pointer"
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
                          <Button variant="ghost" size="iconSm">
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
                            <span>{resource.availability}% available</span>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-border">
                          <p className="text-xs text-muted-foreground mb-2">Skills</p>
                          <div className="flex flex-wrap gap-1">
                            {resource.skills.slice(0, 3).map((skill) => (
                              <Badge key={skill} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {resource.skills.length > 3 && (
                              <Badge variant="outline" className="text-xs">
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
                          {resource.hourlyRate && (
                            <span className="text-muted-foreground flex items-center gap-1">
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
              <Card>
                <div className="overflow-hidden">
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
                      {mockResources.map((resource) => {
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
                            <td className="p-4 text-sm text-foreground">{resource.role}</td>
                            <td className="p-4 text-sm text-muted-foreground">{resource.department}</td>
                            <td className="p-4">
                              <div className="flex flex-wrap gap-1">
                                {resource.skills.slice(0, 2).map((skill) => (
                                  <Badge key={skill} variant="secondary" className="text-xs">
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
                              <div className="flex flex-col items-center gap-1">
                                <Badge variant={status.color as any} className="text-xs">
                                  {totalAllocation}%
                                </Badge>
                                <Progress value={Math.min(100, totalAllocation)} className="w-16 h-1" />
                              </div>
                            </td>
                            <td className="p-4 text-center text-sm font-mono text-foreground">
                              {resource.hourlyRate ? `$${resource.hourlyRate}` : '-'}
                            </td>
                            <td className="p-4 text-right">
                              <Button variant="ghost" size="iconSm">
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
          </div>
        </ScrollArea>
      </div>

      {/* Resource Detail Panel */}
      {selectedResource && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          className="absolute right-0 top-0 h-full w-96 bg-card border-l border-border shadow-overlay z-50"
        >
          <div className="h-full flex flex-col">
            <div className="p-6 border-b border-border">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarFallback className="bg-primary/20 text-primary text-lg">
                      {selectedResource.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{selectedResource.name}</h2>
                    <p className="text-sm text-muted-foreground">{selectedResource.role}</p>
                  </div>
                </div>
                <Button variant="ghost" size="iconSm" onClick={() => setSelectedResource(null)}>
                  ×
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-6 space-y-6">
                {/* Contact */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Contact</h4>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedResource.email}</span>
                  </div>
                </div>

                {/* Current Allocations */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Current Projects</h4>
                  {selectedResource.allocation.map((alloc) => (
                    <Card key={alloc.projectId} className="bg-muted/30">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{alloc.projectName}</span>
                          <Badge variant="outline">{alloc.allocation}%</Badge>
                        </div>
                        <Progress value={alloc.allocation} className="h-1.5" />
                        <div className="flex justify-between text-xs text-muted-foreground mt-2">
                          <span>{alloc.startDate}</span>
                          <span>{alloc.endDate}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Skills */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedResource.skills.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Rate */}
                {selectedResource.hourlyRate && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Billing Rate</h4>
                    <p className="text-2xl font-bold text-foreground">
                      ${selectedResource.hourlyRate}<span className="text-sm font-normal text-muted-foreground">/hour</span>
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-border flex gap-2">
              <Button variant="outline" className="flex-1 gap-2">
                <Settings className="h-4 w-4" />
                Edit
              </Button>
              <Button variant="default" className="flex-1 gap-2">
                <Calendar className="h-4 w-4" />
                Schedule
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
