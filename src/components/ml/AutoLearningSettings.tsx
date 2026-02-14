/**
 * Auto-Learning Settings Component
 * Admin controls for configuring the auto-learning system
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Settings, Play, Trash2, Zap } from 'lucide-react';
import { optimizeAllPatterns, mergeSimilarPatterns } from '@/services/patternOptimizationService';
import { runFullPruning } from '@/services/patternPruningService';

interface AutoLearningConfig {
    id: string;
    enabled: boolean;
    min_feedbacks_for_pattern: number;
    min_success_rate_threshold: number;
    pruning_enabled: boolean;
    optimization_enabled: boolean;
}

export function AutoLearningSettings() {
    const queryClient = useQueryClient();
    const [isProcessing, setIsProcessing] = useState(false);

    // Fetch config
    const { data: config, isLoading } = useQuery({
        queryKey: ['auto-learning-config'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('ml_auto_learning_config')
                .select('*')
                .single();

            if (error) throw error;
            return data as AutoLearningConfig;
        },
    });

    // Update config mutation
    const updateConfig = useMutation({
        mutationFn: async (updates: Partial<AutoLearningConfig>) => {
            const { error } = await supabase
                .from('ml_auto_learning_config')
                .update(updates)
                .eq('id', config?.id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['auto-learning-config'] });
            toast.success('Settings updated');
        },
        onError: () => {
            toast.error('Failed to update settings');
        },
    });

    // Manual optimization
    const handleOptimize = async () => {
        setIsProcessing(true);
        try {
            const count = await optimizeAllPatterns();
            toast.success(`Optimized ${count} patterns`);
        } catch (error) {
            toast.error('Optimization failed');
        } finally {
            setIsProcessing(false);
        }
    };

    // Manual merging
    const handleMerge = async () => {
        setIsProcessing(true);
        try {
            const count = await mergeSimilarPatterns();
            toast.success(`Merged ${count} similar patterns`);
        } catch (error) {
            toast.error('Merge failed');
        } finally {
            setIsProcessing(false);
        }
    };

    // Manual pruning
    const handlePrune = async () => {
        setIsProcessing(true);
        try {
            const stats = await runFullPruning();
            const total = stats.deactivated + stats.deleted + stats.archived;
            toast.success(`Pruned ${total} patterns`);
        } catch (error) {
            toast.error('Pruning failed');
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Auto-Learning Settings</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Loading...</p>
                </CardContent>
            </Card>
        );
    }

    if (!config) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Auto-Learning Settings</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">No configuration found</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Auto-Learning Settings
                </CardTitle>
                <CardDescription>
                    Configure automatic pattern creation, optimization, and pruning
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Enable/Disable Auto-Learning */}
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label htmlFor="enabled">Enable Auto-Learning</Label>
                        <p className="text-sm text-muted-foreground">
                            Automatically create patterns from user feedback
                        </p>
                    </div>
                    <Switch
                        id="enabled"
                        checked={config.enabled}
                        onCheckedChange={(checked) =>
                            updateConfig.mutate({ enabled: checked })
                        }
                    />
                </div>

                {/* Min Feedbacks Threshold */}
                <div className="space-y-2">
                    <Label htmlFor="min-feedbacks">
                        Minimum Feedbacks for Pattern Creation
                    </Label>
                    <Input
                        id="min-feedbacks"
                        type="number"
                        min={1}
                        max={10}
                        value={config.min_feedbacks_for_pattern}
                        onChange={(e) =>
                            updateConfig.mutate({
                                min_feedbacks_for_pattern: parseInt(e.target.value),
                            })
                        }
                        disabled={!config.enabled}
                    />
                    <p className="text-xs text-muted-foreground">
                        Number of similar feedbacks required before creating a pattern
                    </p>
                </div>

                {/* Optimization Toggle */}
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label htmlFor="optimization">Enable Pattern Optimization</Label>
                        <p className="text-sm text-muted-foreground">
                            Automatically optimize patterns based on performance
                        </p>
                    </div>
                    <Switch
                        id="optimization"
                        checked={config.optimization_enabled}
                        onCheckedChange={(checked) =>
                            updateConfig.mutate({ optimization_enabled: checked })
                        }
                    />
                </div>

                {/* Pruning Toggle */}
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label htmlFor="pruning">Enable Pattern Pruning</Label>
                        <p className="text-sm text-muted-foreground">
                            Automatically remove low-performing patterns
                        </p>
                    </div>
                    <Switch
                        id="pruning"
                        checked={config.pruning_enabled}
                        onCheckedChange={(checked) =>
                            updateConfig.mutate({ pruning_enabled: checked })
                        }
                    />
                </div>

                {/* Min Success Rate Threshold */}
                <div className="space-y-2">
                    <Label htmlFor="min-success">
                        Minimum Success Rate (%)
                    </Label>
                    <Input
                        id="min-success"
                        type="number"
                        min={0}
                        max={100}
                        step={5}
                        value={Math.round(config.min_success_rate_threshold * 100)}
                        onChange={(e) =>
                            updateConfig.mutate({
                                min_success_rate_threshold: parseInt(e.target.value) / 100,
                            })
                        }
                        disabled={!config.pruning_enabled}
                    />
                    <p className="text-xs text-muted-foreground">
                        Patterns below this success rate will be deactivated
                    </p>
                </div>

                {/* Manual Actions */}
                <div className="pt-4 border-t space-y-3">
                    <h4 className="text-sm font-medium">Manual Actions</h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <Button
                            variant="outline"
                            onClick={handleOptimize}
                            disabled={isProcessing}
                            className="w-full"
                        >
                            <Zap className="h-4 w-4 mr-2" />
                            Optimize All
                        </Button>

                        <Button
                            variant="outline"
                            onClick={handleMerge}
                            disabled={isProcessing}
                            className="w-full"
                        >
                            <Play className="h-4 w-4 mr-2" />
                            Merge Similar
                        </Button>

                        <Button
                            variant="outline"
                            onClick={handlePrune}
                            disabled={isProcessing}
                            className="w-full"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Prune Low Performers
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
