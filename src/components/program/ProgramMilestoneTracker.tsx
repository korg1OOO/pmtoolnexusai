import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Target,
    Calendar,
    CheckCircle2,
    AlertTriangle,
    Clock,
    TrendingUp,
    Link as LinkIcon,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getProgramMilestonesWithTasks } from '@/services/programTimelineService';

interface ProgramMilestoneTrackerProps {
    programId: string;
}

export function ProgramMilestoneTracker({ programId }: ProgramMilestoneTrackerProps) {
    const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);

    // Fetch milestones with linked tasks
    const { data: milestones = [], isLoading } = useQuery({
        queryKey: ['program-milestones-with-tasks', programId],
        queryFn: () => getProgramMilestonesWithTasks(programId),
    });

    const selectedMilestone = milestones.find(m => m.id === selectedMilestoneId);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-500/10 text-green-500';
            case 'in-progress': return 'bg-blue-500/10 text-blue-500';
            case 'pending': return 'bg-gray-500/10 text-gray-500';
            case 'missed': return 'bg-red-500/10 text-red-500';
            case 'cancelled': return 'bg-gray-500/10 text-gray-500';
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

    const calculateMilestoneProgress = (milestone: any) => {
        if (!milestone.linked_tasks || milestone.linked_tasks.length === 0) return 0;

        const totalProgress = milestone.linked_tasks.reduce((sum: number, task: any) => {
            return sum + (task.progress || 0);
        }, 0);

        return Math.round(totalProgress / milestone.linked_tasks.length);
    };

    const isAtRisk = (milestone: any) => {
        if (milestone.status === 'completed') return false;

        const targetDate = new Date(milestone.target_date);
        const today = new Date();
        const daysUntil = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        const progress = calculateMilestoneProgress(milestone);

        // At risk if less than 30 days and progress < 70%
        return daysUntil < 30 && progress < 70;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Loading milestones...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Target className="h-6 w-6" />
                    Program Milestones
                </h2>
                <p className="text-muted-foreground mt-1">
                    {milestones.length} milestones • {milestones.filter(m => isAtRisk(m)).length} at risk
                </p>
            </div>

            {/* Milestones Grid */}
            {milestones.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <AnimatePresence mode="popLayout">
                        {milestones.map(milestone => (
                            <MilestoneCard
                                key={milestone.id}
                                milestone={milestone}
                                progress={calculateMilestoneProgress(milestone)}
                                atRisk={isAtRisk(milestone)}
                                onClick={() => setSelectedMilestoneId(
                                    selectedMilestoneId === milestone.id ? null : milestone.id
                                )}
                                expanded={selectedMilestoneId === milestone.id}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Target className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Milestones Yet</h3>
                        <p className="text-muted-foreground text-center">
                            Create program milestones to track key deliverables
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function MilestoneCard({
    milestone,
    progress,
    atRisk,
    onClick,
    expanded,
}: {
    milestone: any;
    progress: number;
    atRisk: boolean;
    onClick: () => void;
    expanded: boolean;
}) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-500/10 text-green-500';
            case 'in-progress': return 'bg-blue-500/10 text-blue-500';
            case 'pending': return 'bg-gray-500/10 text-gray-500';
            case 'missed': return 'bg-red-500/10 text-red-500';
            case 'cancelled': return 'bg-gray-500/10 text-gray-500';
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

    const targetDate = new Date(milestone.target_date);
    const today = new Date();
    const daysUntil = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
        >
            <Card
                className={`cursor-pointer hover:shadow-lg transition-shadow ${atRisk ? 'border-yellow-500' : ''}`}
                onClick={onClick}
            >
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                            {getMilestoneIcon(milestone.status)}
                            <div className="flex-1">
                                <CardTitle className="text-lg">{milestone.name}</CardTitle>
                                {milestone.description && (
                                    <CardDescription className="mt-1">{milestone.description}</CardDescription>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <Badge className={getStatusColor(milestone.status)}>
                                {milestone.status}
                            </Badge>
                            {atRisk && (
                                <Badge variant="destructive" className="text-xs">
                                    At Risk
                                </Badge>
                            )}
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    <div className="space-y-4">
                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <div className="text-muted-foreground">Target Date</div>
                                <div className="font-medium flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {targetDate.toLocaleDateString()}
                                </div>
                                {daysUntil > 0 && (
                                    <div className="text-xs text-muted-foreground">
                                        {daysUntil} days remaining
                                    </div>
                                )}
                            </div>
                            {milestone.actual_date && (
                                <div>
                                    <div className="text-muted-foreground">Actual Date</div>
                                    <div className="font-medium flex items-center gap-1">
                                        <CheckCircle2 className="h-3 w-3" />
                                        {new Date(milestone.actual_date).toLocaleDateString()}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Progress */}
                        <div>
                            <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-muted-foreground">Overall Progress</span>
                                <span className="font-medium">{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                        </div>

                        {/* Linked Tasks */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <LinkIcon className="h-4 w-4" />
                            {milestone.linked_tasks?.length || 0} linked tasks
                        </div>

                        {/* Expanded View - Linked Tasks */}
                        {expanded && milestone.linked_tasks && milestone.linked_tasks.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-2 pt-4 border-t"
                            >
                                <div className="font-semibold text-sm">Linked Tasks:</div>
                                {milestone.linked_tasks.map((task: any) => (
                                    <div key={task.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                                        <div className="flex-1">
                                            <div className="font-medium">{task.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {task.projects?.name || 'Unknown Project'}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-xs">
                                                {task.status}
                                            </Badge>
                                            <div className="text-xs text-muted-foreground">
                                                {task.progress}%
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
