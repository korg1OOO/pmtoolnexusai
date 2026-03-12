import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Calendar, CheckCircle2, AlertTriangle, Clock, TrendingUp, Link as LinkIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getProgramMilestonesWithTasks } from '@/services/programTimelineService';

interface ProgramMilestoneTrackerProps {
    programId: string;
}

export function ProgramMilestoneTracker({ programId }: ProgramMilestoneTrackerProps) {
    const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);

    const { data: milestones = [], isLoading } = useQuery({
        queryKey: ['program-milestones-with-tasks', programId],
        queryFn: () => getProgramMilestonesWithTasks(programId),
    });

    const selectedMilestone = milestones.find((m: any) => m.id === selectedMilestoneId);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-500/10 text-green-500';
            case 'in-progress': return 'bg-blue-500/10 text-blue-500';
            case 'pending': return 'bg-gray-500/10 text-gray-500';
            case 'missed': return 'bg-red-500/10 text-red-500';
            default: return 'bg-gray-500/10 text-gray-500';
        }
    };

    const getMilestoneIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case 'missed': return <AlertTriangle className="h-5 w-5 text-red-500" />;
            case 'in-progress': return <Clock className="h-5 w-5 text-blue-500" />;
            default: return <Target className="h-5 w-5 text-gray-500" />;
        }
    };

    if (isLoading) {
        return <div className="text-center py-12 text-muted-foreground">Loading milestones...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2"><Target className="h-6 w-6" />Program Milestones</h2>
                    <p className="text-muted-foreground">Track milestone progress and linked tasks</p>
                </div>
            </div>

            <div className="space-y-4">
                {milestones.map((milestone: any) => (
                    <Card
                        key={milestone.id}
                        className={`cursor-pointer transition-all ${selectedMilestoneId === milestone.id ? 'ring-2 ring-primary' : ''}`}
                        onClick={() => setSelectedMilestoneId(selectedMilestoneId === milestone.id ? null : milestone.id)}
                    >
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {getMilestoneIcon(milestone.status)}
                                    <div>
                                        <CardTitle className="text-lg">{milestone.name}</CardTitle>
                                        <CardDescription>{milestone.due_date ? new Date(milestone.due_date).toLocaleDateString() : 'No date'}</CardDescription>
                                    </div>
                                </div>
                                <Badge className={getStatusColor(milestone.status)}>{milestone.status}</Badge>
                            </div>
                        </CardHeader>
                        <AnimatePresence>
                            {selectedMilestoneId === milestone.id && milestone.linked_tasks && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                                    <CardContent>
                                        <h4 className="text-sm font-medium mb-2 flex items-center gap-1"><LinkIcon className="h-4 w-4" />Linked Tasks ({milestone.linked_tasks?.length || 0})</h4>
                                        <div className="space-y-2">
                                            {(milestone.linked_tasks || []).map((task: any) => (
                                                <div key={task.id} className="flex items-center justify-between p-2 border rounded">
                                                    <span className="text-sm">{task.name}</span>
                                                    <Badge variant="outline">{task.status}</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Card>
                ))}
                {milestones.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No milestones found</p>
                    </div>
                )}
            </div>
        </div>
    );
}