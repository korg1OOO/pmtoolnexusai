/**
 * Example: Task Priority Prediction with ML Learning
 * Demonstrates how to integrate ML predictions with user feedback
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2 } from 'lucide-react';
import { MLPredictionFeedback } from '@/components/ml/MLPredictionFeedback';
import { useLogMLPrediction, useApplyLearningPatterns } from '@/hooks/useMLLearning';
import { toast } from 'sonner';

export function TaskPriorityMLExample() {
    const [taskTitle, setTaskTitle] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [prediction, setPrediction] = useState<any>(null);
    const [predictionId, setPredictionId] = useState<string | null>(null);

    const logPrediction = useLogMLPrediction();
    const applyPatterns = useApplyLearningPatterns();

    const handlePredict = async () => {
        if (!taskTitle) {
            toast.error('Please enter a task title');
            return;
        }

        // 1. Generate base prediction (simplified - in production, use AI)
        const basePrediction = {
            priority: taskTitle.toLowerCase().includes('bug') ? 'high' : 'medium',
            reasoning: 'Based on task title keywords',
        };

        // 2. Apply learned patterns to enhance prediction
        const enhanced = await applyPatterns.mutateAsync({
            predictionType: 'task_priority',
            inputData: { title: taskTitle, description: taskDescription },
            basePrediction,
            baseConfidence: 0.7,
        });

        // 3. Log the prediction
        const logged = await logPrediction.mutateAsync({
            prediction_type: 'task_priority',
            input_data: {
                title: taskTitle,
                description: taskDescription,
            },
            prediction: enhanced.enhancedPrediction,
            confidence: enhanced.enhancedConfidence,
        });

        setPrediction(enhanced.enhancedPrediction);
        setPredictionId(logged.id);

        toast.success(`Prediction: ${enhanced.enhancedPrediction.priority} priority (${Math.round(enhanced.enhancedConfidence * 100)}% confidence)`);
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto p-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-500" />
                        ML-Powered Task Priority Prediction
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="title">Task Title</Label>
                        <Input
                            id="title"
                            placeholder="e.g., Fix login authentication bug"
                            value={taskTitle}
                            onChange={(e) => setTaskTitle(e.target.value)}
                        />
                    </div>

                    <div>
                        <Label htmlFor="description">Description (optional)</Label>
                        <Input
                            id="description"
                            placeholder="Additional context..."
                            value={taskDescription}
                            onChange={(e) => setTaskDescription(e.target.value)}
                        />
                    </div>

                    <Button
                        onClick={handlePredict}
                        disabled={logPrediction.isPending || applyPatterns.isPending}
                        className="w-full"
                    >
                        {(logPrediction.isPending || applyPatterns.isPending) && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        )}
                        Predict Priority
                    </Button>

                    {prediction && (
                        <div className="mt-4 p-4 border rounded-lg bg-muted/30">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium">AI Suggestion:</span>
                                <Badge variant={
                                    prediction.priority === 'critical' ? 'destructive' :
                                        prediction.priority === 'high' ? 'default' :
                                            prediction.priority === 'medium' ? 'secondary' :
                                                'outline'
                                }>
                                    {prediction.priority.toUpperCase()} Priority
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">
                                {prediction.reasoning}
                            </p>

                            {predictionId && (
                                <MLPredictionFeedback
                                    predictionId={predictionId}
                                    predictionType="task_priority"
                                    prediction={prediction}
                                    onFeedbackSubmitted={() => {
                                        setPrediction(null);
                                        setPredictionId(null);
                                        setTaskTitle('');
                                        setTaskDescription('');
                                    }}
                                    compact
                                />
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">How ML Learning Works</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>1. <strong>AI predicts</strong> task priority based on title/description</p>
                    <p>2. <strong>You provide feedback</strong> by accepting or modifying the suggestion</p>
                    <p>3. <strong>System learns patterns</strong> from your corrections</p>
                    <p>4. <strong>Future predictions improve</strong> using learned insights</p>
                    <p className="pt-2 text-xs">
                        Example: If you consistently change "login" tasks to "critical",
                        the system learns and will predict "critical" for future login-related tasks.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
