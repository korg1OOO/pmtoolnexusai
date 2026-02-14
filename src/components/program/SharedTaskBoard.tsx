import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutGrid,
    Filter,
    Users,
    FolderKanban,
    Clock,
    AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getProgramProjects } from '@/services/programService';
import { supabase } from '@/integrations/supabase/client';

interface SharedTaskBoardProps {
    programId: string;
}

type GroupBy = 'project' | 'assignee' | 'status' | 'priority';

export function SharedTaskBoard({ programId }: SharedTaskBoardProps) {
    const [groupBy, setGroupBy] = useState<GroupBy>('project');
    const [filterProject, setFilterProject] = useState<string>('all');

    // Fetch projects
    const { data: projects = [] } = useQuery({
        queryKey: ['program-projects', programId],
        queryFn: () => getProgramProjects(programId),
    });

    // Fetch all tasks for these projects
    const { data: tasks = [], isLoading } = useQuery({
        queryKey: ['program-tasks', programId, projects],
        queryFn: async () => {
            if (projects.length === 0) return [];

            const projectIds = projects.map(p => p.id);
            const { data, error } = await supabase
                .from('tasks')
                .select('*, projects(name, code)')
                .in('project_id', projectIds)
                .eq('shared_across_program', true);

            if (error) throw error;
            return data || [];
        },
        enabled: projects.length > 0,
    });

    // Filter tasks
    const filteredTasks = useMemo(() => {
        if (filterProject === 'all') return tasks;
        return tasks.filter(t => t.project_id === filterProject);
    }, [tasks, filterProject]);

    // Group tasks
    const groupedTasks = useMemo(() => {
        const groups: Record<string, any[]> = {};

        filteredTasks.forEach(task => {
            let key: string;

            switch (groupBy) {
                case 'project':
                    key = task.projects?.name || 'Unknown Project';
                    break;
                case 'assignee':
                    key = task.assignee_id || 'Unassigned';
                    break;
                case 'status':
                    key = task.status || 'No Status';
                    break;
                case 'priority':
                    key = task.priority || 'No Priority';
                    break;
                default:
                    key = 'Other';
            }

            if (!groups[key]) groups[key] = [];
            groups[key].push(task);
        });

        return groups;
    }, [filteredTasks, groupBy]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Loading tasks...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <LayoutGrid className="h-6 w-6" />
                        Shared Task Board
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        {filteredTasks.length} shared tasks across {projects.length} projects
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Group By */}
                    <Select value={groupBy} onValueChange={(value: GroupBy) => setGroupBy(value)}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="project">By Project</SelectItem>
                            <SelectItem value="assignee">By Assignee</SelectItem>
                            <SelectItem value="status">By Status</SelectItem>
                            <SelectItem value="priority">By Priority</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Filter Project */}
                    <Select value={filterProject} onValueChange={setFilterProject}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Projects</SelectItem>
                            {projects.map(project => (
                                <SelectItem key={project.id} value={project.id}>
                                    {project.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Task Board */}
            {Object.keys(groupedTasks).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
                        <TaskColumn
                            key={groupName}
                            title={groupName}
                            tasks={groupTasks}
                            count={groupTasks.length}
                        />
                    ))}
                </div>
            ) : (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <LayoutGrid className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Shared Tasks</h3>
                        <p className="text-muted-foreground text-center">
                            Mark tasks as "shared across program" to see them here
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function TaskColumn({ title, tasks, count }: { title: string; tasks: any[]; count: number }) {
    return (
        <div className="space-y-4">
            {/* Column Header */}
            <div className="flex items-center justify-between">
                <h3 className="font-semibold">{title}</h3>
                <Badge variant="secondary">{count}</Badge>
            </div>

            {/* Tasks */}
            <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                    {tasks.map(task => (
                        <TaskCard key={task.id} task={task} />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}

function TaskCard({ task }: { task: any }) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-500/10 text-green-500';
            case 'in-progress': return 'bg-blue-500/10 text-blue-500';
            case 'blocked': return 'bg-red-500/10 text-red-500';
            case 'pending': return 'bg-yellow-500/10 text-yellow-500';
            default: return 'bg-gray-500/10 text-gray-500';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'text-red-500';
            case 'medium': return 'text-yellow-500';
            case 'low': return 'text-green-500';
            default: return 'text-gray-500';
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
        >
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-4">
                    <div className="space-y-3">
                        {/* Task Name */}
                        <div className="font-medium">{task.name}</div>

                        {/* Project */}
                        <div className="text-xs text-muted-foreground">
                            {task.projects?.name || 'Unknown Project'}
                        </div>

                        {/* Metadata */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={getStatusColor(task.status)} variant="outline">
                                {task.status}
                            </Badge>
                            {task.priority && (
                                <Badge variant="outline" className={getPriorityColor(task.priority)}>
                                    {task.priority}
                                </Badge>
                            )}
                        </div>

                        {/* Progress */}
                        {task.progress !== undefined && (
                            <div>
                                <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="text-muted-foreground">Progress</span>
                                    <span>{task.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div
                                        className="bg-blue-600 h-1.5 rounded-full transition-all"
                                        style={{ width: `${task.progress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Dates */}
                        {task.end_date && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                Due: {new Date(task.end_date).toLocaleDateString()}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
