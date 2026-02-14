import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    Calendar,
    ZoomIn,
    ZoomOut,
    Filter,
    AlertTriangle,
    Target,
    TrendingUp,
    ChevronRight,
    ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    getProgramTimeline,
    type ProgramTimelineData,
    type TimelineTask,
} from '@/services/programTimelineService';

interface ProgramTimelineViewProps {
    programId: string;
}

type ZoomLevel = 'day' | 'week' | 'month' | 'quarter';

export function ProgramTimelineView({ programId }: ProgramTimelineViewProps) {
    const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('week');
    const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

    // Fetch timeline data
    const { data: timeline, isLoading } = useQuery({
        queryKey: ['program-timeline', programId],
        queryFn: () => getProgramTimeline(programId),
    });

    // Calculate timeline bounds
    const timelineBounds = useMemo(() => {
        if (!timeline || timeline.projects.length === 0) {
            const today = new Date();
            return {
                start: new Date(today.getFullYear(), today.getMonth(), 1),
                end: new Date(today.getFullYear(), today.getMonth() + 3, 0),
            };
        }

        const allTasks = timeline.projects.flatMap(p => p.tasks);
        const startDates = allTasks.map(t => new Date(t.start_date));
        const endDates = allTasks.map(t => new Date(t.end_date));

        return {
            start: new Date(Math.min(...startDates.map(d => d.getTime()))),
            end: new Date(Math.max(...endDates.map(d => d.getTime()))),
        };
    }, [timeline]);

    // Generate time columns based on zoom level
    const timeColumns = useMemo(() => {
        const columns: Date[] = [];
        const current = new Date(timelineBounds.start);
        const end = new Date(timelineBounds.end);

        while (current <= end) {
            columns.push(new Date(current));

            switch (zoomLevel) {
                case 'day':
                    current.setDate(current.getDate() + 1);
                    break;
                case 'week':
                    current.setDate(current.getDate() + 7);
                    break;
                case 'month':
                    current.setMonth(current.getMonth() + 1);
                    break;
                case 'quarter':
                    current.setMonth(current.getMonth() + 3);
                    break;
            }
        }

        return columns;
    }, [timelineBounds, zoomLevel]);

    const toggleProject = (projectId: string) => {
        const newExpanded = new Set(expandedProjects);
        if (newExpanded.has(projectId)) {
            newExpanded.delete(projectId);
        } else {
            newExpanded.add(projectId);
        }
        setExpandedProjects(newExpanded);
    };

    const filteredProjects = useMemo(() => {
        if (!timeline) return [];
        if (selectedProjectId === 'all') return timeline.projects;
        return timeline.projects.filter(p => p.project_id === selectedProjectId);
    }, [timeline, selectedProjectId]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-muted-foreground">Loading timeline...</div>
            </div>
        );
    }

    if (!timeline) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-muted-foreground">No timeline data available</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">{timeline.program_name} - Timeline</h2>
                    <p className="text-muted-foreground">
                        {timeline.projects.length} projects • {timeline.conflicts.length} conflicts
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Zoom Controls */}
                    <div className="flex items-center gap-1 border rounded-md p-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                const levels: ZoomLevel[] = ['day', 'week', 'month', 'quarter'];
                                const currentIndex = levels.indexOf(zoomLevel);
                                if (currentIndex > 0) setZoomLevel(levels[currentIndex - 1]);
                            }}
                            disabled={zoomLevel === 'day'}
                        >
                            <ZoomIn className="h-4 w-4" />
                        </Button>
                        <span className="text-sm px-2 capitalize">{zoomLevel}</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                const levels: ZoomLevel[] = ['day', 'week', 'month', 'quarter'];
                                const currentIndex = levels.indexOf(zoomLevel);
                                if (currentIndex < levels.length - 1) setZoomLevel(levels[currentIndex + 1]);
                            }}
                            disabled={zoomLevel === 'quarter'}
                        >
                            <ZoomOut className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Project Filter */}
                    <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Projects</SelectItem>
                            {timeline.projects.map(project => (
                                <SelectItem key={project.project_id} value={project.project_id}>
                                    {project.project_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Conflicts Alert */}
            {timeline.conflicts.length > 0 && (
                <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                            <CardTitle className="text-base">
                                {timeline.conflicts.length} Scheduling Conflict{timeline.conflicts.length > 1 ? 's' : ''}
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {timeline.conflicts.slice(0, 3).map((conflict, idx) => (
                                <div key={idx} className="text-sm">
                                    <p className="font-medium">{conflict.description}</p>
                                    {conflict.suggested_resolution && (
                                        <p className="text-muted-foreground">→ {conflict.suggested_resolution}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Timeline Chart */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <div className="min-w-[1200px]">
                            {/* Timeline Header */}
                            <div className="flex border-b sticky top-0 bg-background z-10">
                                <div className="w-64 p-4 border-r font-semibold">Project / Task</div>
                                <div className="flex-1 flex">
                                    {timeColumns.map((date, idx) => (
                                        <div
                                            key={idx}
                                            className="flex-1 p-2 text-center text-sm border-r"
                                            style={{ minWidth: '80px' }}
                                        >
                                            {formatDateColumn(date, zoomLevel)}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Projects and Tasks */}
                            {filteredProjects.map(project => (
                                <ProjectRow
                                    key={project.project_id}
                                    project={project}
                                    timelineBounds={timelineBounds}
                                    timeColumns={timeColumns}
                                    expanded={expandedProjects.has(project.project_id)}
                                    onToggle={() => toggleProject(project.project_id)}
                                    criticalTaskIds={timeline.critical_path.map(t => t.id)}
                                />
                            ))}

                            {/* Program Milestones */}
                            {timeline.program_milestones.length > 0 && (
                                <div className="border-t-2 border-blue-500">
                                    <div className="flex">
                                        <div className="w-64 p-4 border-r font-semibold bg-blue-50 dark:bg-blue-950">
                                            Program Milestones
                                        </div>
                                        <div className="flex-1 relative">
                                            {timeline.program_milestones.map(milestone => (
                                                <MilestoneMarker
                                                    key={milestone.id}
                                                    milestone={milestone}
                                                    timelineBounds={timelineBounds}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Critical Path */}
            {timeline.critical_path.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Critical Path ({timeline.critical_path.length} tasks)
                        </CardTitle>
                        <CardDescription>Tasks that directly impact program completion date</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {timeline.critical_path.map(task => (
                                <div key={task.id} className="flex items-center justify-between p-2 border rounded">
                                    <div>
                                        <div className="font-medium">{task.name}</div>
                                        <div className="text-sm text-muted-foreground">{task.project_name}</div>
                                    </div>
                                    <Badge variant="destructive">Critical</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function ProjectRow({
    project,
    timelineBounds,
    timeColumns,
    expanded,
    onToggle,
    criticalTaskIds,
}: {
    project: any;
    timelineBounds: { start: Date; end: Date };
    timeColumns: Date[];
    expanded: boolean;
    onToggle: () => void;
    criticalTaskIds: string[];
}) {
    const getHealthColor = (health: string) => {
        switch (health) {
            case 'green': return 'bg-green-500';
            case 'amber': return 'bg-yellow-500';
            case 'red': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <>
            {/* Project Header Row */}
            <div className="flex border-b hover:bg-muted/50">
                <div className="w-64 p-4 border-r">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={onToggle} className="h-6 w-6 p-0">
                            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                        <div className="flex-1">
                            <div className="font-semibold">{project.project_name}</div>
                            <div className="text-xs text-muted-foreground">{project.tasks.length} tasks</div>
                        </div>
                        <div className={`h-3 w-3 rounded-full ${getHealthColor(project.project_health)}`} />
                    </div>
                </div>
                <div className="flex-1" />
            </div>

            {/* Task Rows */}
            {expanded && project.tasks.map((task: TimelineTask) => (
                <TaskRow
                    key={task.id}
                    task={task}
                    timelineBounds={timelineBounds}
                    isCritical={criticalTaskIds.includes(task.id)}
                />
            ))}
        </>
    );
}

function TaskRow({
    task,
    timelineBounds,
    isCritical,
}: {
    task: TimelineTask;
    timelineBounds: { start: Date; end: Date };
    isCritical: boolean;
}) {
    const taskStart = new Date(task.start_date);
    const taskEnd = new Date(task.end_date);

    const totalDays = (timelineBounds.end.getTime() - timelineBounds.start.getTime()) / (1000 * 60 * 60 * 24);
    const taskStartOffset = (taskStart.getTime() - timelineBounds.start.getTime()) / (1000 * 60 * 60 * 24);
    const taskDuration = (taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24);

    const leftPercent = (taskStartOffset / totalDays) * 100;
    const widthPercent = (taskDuration / totalDays) * 100;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-600';
            case 'in-progress': return 'bg-blue-600';
            case 'blocked': return 'bg-red-600';
            default: return 'bg-gray-400';
        }
    };

    return (
        <div className="flex border-b hover:bg-muted/50">
            <div className="w-64 p-4 border-r">
                <div className="pl-8">
                    <div className="text-sm">{task.name}</div>
                    <div className="text-xs text-muted-foreground">
                        {task.progress}% • {task.duration}d
                    </div>
                </div>
            </div>
            <div className="flex-1 relative p-2">
                <div
                    className={`absolute h-6 rounded ${getStatusColor(task.status)} ${isCritical ? 'ring-2 ring-red-500' : ''}`}
                    style={{
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`,
                    }}
                >
                    <div className="h-full bg-green-500 rounded" style={{ width: `${task.progress}%` }} />
                </div>
            </div>
        </div>
    );
}

function MilestoneMarker({
    milestone,
    timelineBounds,
}: {
    milestone: any;
    timelineBounds: { start: Date; end: Date };
}) {
    const milestoneDate = new Date(milestone.target_date);
    const totalDays = (timelineBounds.end.getTime() - timelineBounds.start.getTime()) / (1000 * 60 * 60 * 24);
    const offset = (milestoneDate.getTime() - timelineBounds.start.getTime()) / (1000 * 60 * 60 * 24);
    const leftPercent = (offset / totalDays) * 100;

    return (
        <div
            className="absolute top-0 bottom-0 flex items-center"
            style={{ left: `${leftPercent}%` }}
        >
            <div className="relative">
                <Target className="h-6 w-6 text-blue-600" />
                <div className="absolute top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                    {milestone.name}
                </div>
            </div>
        </div>
    );
}

function formatDateColumn(date: Date, zoom: ZoomLevel): string {
    switch (zoom) {
        case 'day':
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        case 'week':
            return `W${getWeekNumber(date)}`;
        case 'month':
            return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        case 'quarter':
            return `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`;
    }
}

function getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}
