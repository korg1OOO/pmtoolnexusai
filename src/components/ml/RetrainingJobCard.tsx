import { useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, CheckCircle, XCircle, Clock, TrendingUp } from "lucide-react";
import { MLRetrainingJob } from "@/hooks/useMLRetraining";

interface RetrainingJobCardProps {
    job: MLRetrainingJob;
}

/**
 * Displays retraining job status in a card format
 */
export const RetrainingJobCard = ({ job }: RetrainingJobCardProps) => {
    const navigate = useNavigate();
    const getStatusIcon = () => {
        switch (job.status) {
            case 'completed':
                return <CheckCircle className="h-5 w-5 text-green-600" />;
            case 'failed':
                return <XCircle className="h-5 w-5 text-red-600" />;
            case 'running':
                return <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />;
            case 'pending':
                return <Clock className="h-5 w-5 text-yellow-600" />;
            default:
                return <Clock className="h-5 w-5 text-gray-600" />;
        }
    };

    const getStatusVariant = (): "default" | "destructive" | "secondary" | "outline" => {
        switch (job.status) {
            case 'completed': return 'default';
            case 'failed': return 'destructive';
            case 'running': return 'secondary';
            default: return 'outline';
        }
    };

    const duration = job.started_at && job.completed_at
        ? Math.round((new Date(job.completed_at).getTime() - new Date(job.started_at).getTime()) / 1000 / 60)
        : null;

    const progress = job.status === 'completed' ? 100 : job.status === 'running' ? ((job as any).progress_percent ?? 50) : 0;

    return (
        <Card className="p-4">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    {getStatusIcon()}
                    <div>
                        <h3 className="font-semibold capitalize">{job.model_type} Model Retraining</h3>
                        <p className="text-xs text-muted-foreground">
                            {new Date(job.created_at).toLocaleString()}
                        </p>
                    </div>
                </div>
                <Badge variant={getStatusVariant()}>
                    {job.status}
                </Badge>
            </div>

            {job.status === 'running' && (
                <div className="mb-4">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Training in progress...</span>
                        <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>
            )}

            <div className="space-y-2">
                {job.training_samples_count && (
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Training Samples</span>
                        <span className="font-medium">{job.training_samples_count.toLocaleString()}</span>
                    </div>
                )}

                {job.accuracy_before !== null && job.accuracy_after !== null && (
                    <>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Previous Accuracy</span>
                            <span className="font-medium">{(job.accuracy_before * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">New Accuracy</span>
                            <span className="font-medium">{(job.accuracy_after * 100).toFixed(1)}%</span>
                        </div>
                    </>
                )}

                {job.improvement_percent !== null && (
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Improvement</span>
                        <span className={`font-medium flex items-center gap-1 ${job.improvement_percent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            <TrendingUp className="h-3 w-3" />
                            {job.improvement_percent > 0 ? '+' : ''}{job.improvement_percent.toFixed(1)}%
                        </span>
                    </div>
                )}

                {duration && (
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Duration</span>
                        <span className="font-medium">{duration} minutes</span>
                    </div>
                )}

                {job.status === 'failed' && job.error_message && (
                    <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-800">
                        <strong>Error:</strong> {job.error_message}
                    </div>
                )}
            </div>

            {job.new_model_id && (
                <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => navigate(`/admin/ml/models/${job.new_model_id}`)}
                >
                    View New Model
                </Button>
            )}
        </Card>
    );
};
