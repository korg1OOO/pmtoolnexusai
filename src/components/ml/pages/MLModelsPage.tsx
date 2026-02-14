/**
 * ML Models Page
 * Manage and monitor all machine learning models
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Brain,
    TrendingUp,
    TrendingDown,
    Activity,
    Search,
    ArrowLeft,
    CheckCircle2,
    XCircle,
    Clock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMLModels } from '@/hooks/useMLModels';

export function MLModelsPage() {
    const navigate = useNavigate();
    const { data: models = [], isLoading } = useMLModels(undefined, false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const filteredModels = models.filter((model) => {
        const matchesSearch = model.model_type.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'active' && model.is_active) ||
            (statusFilter === 'inactive' && !model.is_active);
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (isActive: boolean) => {
        return isActive ? (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Active
            </Badge>
        ) : (
            <Badge variant="secondary">
                <XCircle className="h-3 w-3 mr-1" />
                Inactive
            </Badge>
        );
    };

    const getAccuracyBadge = (metrics: Record<string, number> | null) => {
        const accuracy = metrics?.accuracy || 0;
        if (accuracy >= 0.9) {
            return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">{(accuracy * 100).toFixed(1)}%</Badge>;
        } else if (accuracy >= 0.75) {
            return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">{(accuracy * 100).toFixed(1)}%</Badge>;
        } else {
            return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">{(accuracy * 100).toFixed(1)}%</Badge>;
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Button variant="ghost" onClick={() => navigate('/admin/ml')} className="mb-2">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to ML Dashboard
                    </Button>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Brain className="h-8 w-8 text-purple-600" />
                        ML Models
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        View and manage all machine learning models
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Models</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{models.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Active Models</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {models.filter(m => m.is_active).length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Avg Accuracy</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {models.length > 0
                                ? ((models.reduce((sum, m) => sum + (m.accuracy_metrics?.accuracy || 0), 0) / models.length) * 100).toFixed(1)
                                : 0}%
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Training Data Size</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {models.reduce((sum, m) => sum + (m.training_data_size || 0), 0).toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Models</CardTitle>
                        <div className="flex gap-2">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search models..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-8 w-64"
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8 text-muted-foreground">Loading models...</div>
                    ) : filteredModels.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            {searchQuery || statusFilter !== 'all' ? 'No models match your filters' : 'No models found'}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Model</TableHead>
                                    <TableHead>Algorithm</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Accuracy</TableHead>
                                    <TableHead>Training Data</TableHead>
                                    <TableHead>Last Trained</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredModels.map((model) => (
                                    <TableRow key={model.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <Brain className="h-4 w-4 text-purple-600" />
                                                {model.model_type} v{model.model_version}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{model.algorithm}</Badge>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(model.is_active)}</TableCell>
                                        <TableCell>{getAccuracyBadge(model.accuracy_metrics)}</TableCell>
                                        <TableCell>{(model.training_data_size || 0).toLocaleString()}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                <Clock className="h-3 w-3" />
                                                {new Date(model.training_date).toLocaleDateString()}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="sm">
                                                View Details
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
