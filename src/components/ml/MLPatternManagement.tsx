/**
 * ML Pattern Management Component
 * Manage learning patterns - view, activate/deactivate, analyze performance
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Power,
    PowerOff,
    Trash2,
    Eye,
    Search,
    TrendingUp,
    TrendingDown,
    Minus
} from 'lucide-react';
import { useAllLearningPatterns, useToggleLearningPattern } from '@/hooks/useMLLearning';
import { toast } from 'sonner';

export function MLPatternManagement() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'success_rate' | 'sample_size' | 'created_at'>('success_rate');
    const [selectedPattern, setSelectedPattern] = useState<any>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    const { data: patterns, isLoading } = useAllLearningPatterns();
    const togglePattern = useToggleLearningPattern();

    // Filter and sort patterns
    const filteredPatterns = useMemo(() => {
        if (!patterns) return [];

        let filtered = patterns;

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(p =>
                p.pattern_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.prediction_type.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by prediction type
        if (filterType !== 'all') {
            filtered = filtered.filter(p => p.prediction_type === filterType);
        }

        // Sort
        filtered = [...filtered].sort((a, b) => {
            if (sortBy === 'success_rate') {
                return (b.success_rate || 0) - (a.success_rate || 0);
            } else if (sortBy === 'sample_size') {
                return b.sample_size - a.sample_size;
            } else {
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            }
        });

        return filtered;
    }, [patterns, searchTerm, filterType, sortBy]);

    // Get unique prediction types for filter
    const predictionTypes = useMemo(() => {
        if (!patterns) return [];
        return Array.from(new Set(patterns.map(p => p.prediction_type)));
    }, [patterns]);

    const handleToggle = (pattern: any) => {
        togglePattern.mutate(
            { patternId: pattern.id, activate: !pattern.is_active },
            {
                onSuccess: () => {
                    toast.success(
                        pattern.is_active
                            ? 'Pattern deactivated'
                            : 'Pattern activated'
                    );
                },
            }
        );
    };

    const handleViewDetails = (pattern: any) => {
        setSelectedPattern(pattern);
        setShowDetailModal(true);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <p className="text-muted-foreground">Loading patterns...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold">Learning Pattern Management</h2>
                <p className="text-muted-foreground mt-1">
                    Manage and monitor ML learning patterns
                </p>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Filters & Search</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search patterns..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filter by type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                {predictionTypes.map(type => (
                                    <SelectItem key={type} value={type}>
                                        {type}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="success_rate">Success Rate</SelectItem>
                                <SelectItem value="sample_size">Sample Size</SelectItem>
                                <SelectItem value="created_at">Date Created</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Patterns Table */}
            <Card>
                <CardHeader>
                    <CardTitle>
                        Patterns ({filteredPatterns.length})
                    </CardTitle>
                    <CardDescription>
                        Active patterns are automatically applied to improve predictions
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Status</TableHead>
                                <TableHead>Pattern Type</TableHead>
                                <TableHead>Prediction Type</TableHead>
                                <TableHead>Success Rate</TableHead>
                                <TableHead>Sample Size</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPatterns.map((pattern) => (
                                <TableRow key={pattern.id}>
                                    <TableCell>
                                        {pattern.is_active ? (
                                            <Badge className="bg-green-500">Active</Badge>
                                        ) : (
                                            <Badge variant="secondary">Inactive</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {pattern.pattern_type}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{pattern.prediction_type}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {pattern.success_rate !== null ? (
                                                <>
                                                    <span className="font-medium">
                                                        {Math.round(pattern.success_rate * 100)}%
                                                    </span>
                                                    {pattern.success_rate >= 0.8 && (
                                                        <TrendingUp className="h-4 w-4 text-green-500" />
                                                    )}
                                                    {pattern.success_rate < 0.5 && (
                                                        <TrendingDown className="h-4 w-4 text-red-500" />
                                                    )}
                                                    {pattern.success_rate >= 0.5 && pattern.success_rate < 0.8 && (
                                                        <Minus className="h-4 w-4 text-yellow-500" />
                                                    )}
                                                </>
                                            ) : (
                                                <span className="text-muted-foreground">N/A</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>{pattern.sample_size}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {new Date(pattern.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleViewDetails(pattern)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleToggle(pattern)}
                                                disabled={togglePattern.isPending}
                                            >
                                                {pattern.is_active ? (
                                                    <PowerOff className="h-4 w-4 text-red-500" />
                                                ) : (
                                                    <Power className="h-4 w-4 text-green-500" />
                                                )}
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredPatterns.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        No patterns found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Pattern Detail Modal */}
            <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Pattern Details</DialogTitle>
                        <DialogDescription>
                            View detailed information about this learning pattern
                        </DialogDescription>
                    </DialogHeader>
                    {selectedPattern && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Pattern Type</label>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedPattern.pattern_type}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Prediction Type</label>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedPattern.prediction_type}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Success Rate</label>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedPattern.success_rate !== null
                                            ? `${Math.round(selectedPattern.success_rate * 100)}%`
                                            : 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Sample Size</label>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedPattern.sample_size} predictions
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium">Context</label>
                                <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-40">
                                    {JSON.stringify(selectedPattern.context, null, 2)}
                                </pre>
                            </div>

                            <div>
                                <label className="text-sm font-medium">Adjustment</label>
                                <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-40">
                                    {JSON.stringify(selectedPattern.adjustment, null, 2)}
                                </pre>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t">
                                <Badge variant={selectedPattern.is_active ? 'default' : 'secondary'}>
                                    {selectedPattern.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                                <Button
                                    onClick={() => {
                                        handleToggle(selectedPattern);
                                        setShowDetailModal(false);
                                    }}
                                >
                                    {selectedPattern.is_active ? 'Deactivate' : 'Activate'}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
