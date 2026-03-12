import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { getProgramProjects } from '@/services/programTimelineService';

interface SharedTaskBoardProps {
    programId: string;
}

export function SharedTaskBoard({ programId }: SharedTaskBoardProps) {
    const [groupBy, setGroupBy] = useState<'project' | 'status' | 'assignee'>('project');
    const [filterProject, setFilterProject] = useState<string>('all');

    const { data: projects = [] } = useQuery({
        queryKey: ['program-projects', programId],
        queryFn: () => getProgramProjects(programId),
    });

    const { data: tasks = [], isLoading } = useQuery({
        queryKey: ['program-tasks', programId, projects],
        queryFn: async () => {
            if (projects.length === 0) return [];
            const projectIds = projects.map((p: any) => p.id);
            const { data, error } = await (supabase as any)
                .from('tasks')
                .select('*, projects!tasks_project_id_fkey(name, code)')
                .in('project_id', projectIds)
                .eq('shared_across_program', true);
            if (error) throw error;
            return data || [];
        },
        enabled: projects.length > 0,
    });

    const filteredTasks = useMemo(() => {
        if (filterProject === 'all') return tasks;
        return tasks.filter((t: any) => t.project_id === filterProject);
    }, [tasks, filterProject]);

    const groupedTasks = useMemo(() => {
        const groups: Record<string, any[]> = {};
        filteredTasks.forEach((task: any) => {
            let key: string;
            switch (groupBy) {
                case 'project': key = task.projects?.name || 'Unknown Project'; break;
                case 'assignee': key = task.assignee_id || 'Unassigned'; break;
                case 'status': key = task.status || 'No Status'; break;
                default: key = 'All';
            }
            if (!groups[key]) groups[key] = [];
            groups[key].push(task);
        });
        return groups;
    }, [filteredTasks, groupBy]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Shared Task Board</h2>
                <div className="flex gap-2">
                    <Select value={groupBy} onValueChange={(v: any) => setGroupBy(v)}>
                        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="project">By Project</SelectItem>
                            <SelectItem value="status">By Status</SelectItem>
                            <SelectItem value="assignee">By Assignee</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={filterProject} onValueChange={setFilterProject}>
                        <SelectTrigger className="w-48"><SelectValue placeholder="Filter project" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Projects</SelectItem>
                            {projects.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-12 text-muted-foreground">Loading tasks...</div>
            ) : Object.keys(groupedTasks).length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No shared tasks found</div>
            ) : (
                <div className="space-y-4">
                    {Object.entries(groupedTasks).map(([group, tasks]) => (
                        <Card key={group}>
                            <CardHeader><CardTitle className="text-lg">{group} ({tasks.length})</CardTitle></CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {tasks.map((task: any) => (
                                        <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div>
                                                <p className="font-medium">{task.name}</p>
                                                <p className="text-sm text-muted-foreground">{task.projects?.name}</p>
                                            </div>
                                            <Badge variant="outline">{task.status}</Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}