/**
 * ML Predictions Page
 * View prediction history and analytics
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { TrendingUp, ArrowLeft, Search, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePredictionStats } from '@/hooks/useMLPredictions';

export function MLPredictionsPage() {
    const navigate = useNavigate();
    const { data: stats } = usePredictionStats();
    const [searchQuery, setSearchQuery] = useState('');

    // Mock prediction data - replace with real hook
    const predictions = [
        {
            id: '1',
            model_name: 'Risk Prediction Model',
            input: 'Project Alpha',
            output: 'High Risk',
            confidence: 0.92,
            created_at: new Date().toISOString(),
        },
        {
            id: '2',
            model_name: 'Cost Estimation Model',
            input: 'Project Beta',
            output: '$125,000',
            confidence: 0.87,
            created_at: new Date(Date.now() - 86400000).toISOString(),
        },
    ];

    const getConfidenceBadge = (confidence: number) => {
        if (confidence >= 0.9) {
            return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">{(confidence * 100).toFixed(0)}%</Badge>;
        } else if (confidence >= 0.75) {
            return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">{(confidence * 100).toFixed(0)}%</Badge>;
        } else {
            return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">{(confidence * 100).toFixed(0)}%</Badge>;
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <Button variant="ghost" onClick={() => navigate('/admin/ml')} className="mb-2">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to ML Dashboard
                </Button>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                    Predictions
                </h1>
                <p className="text-muted-foreground mt-1">
                    View prediction history and analytics
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Predictions (24h)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.last24h || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Avg Confidence</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {((stats?.avgConfidence || 0) * 100).toFixed(1)}%
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Predictions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.total || 0}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Predictions Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Prediction History</CardTitle>
                        <div className="flex gap-2">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search predictions..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-8 w-64"
                                />
                            </div>
                            <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                Export
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Model</TableHead>
                                <TableHead>Input</TableHead>
                                <TableHead>Output</TableHead>
                                <TableHead>Confidence</TableHead>
                                <TableHead>Timestamp</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {predictions.map((prediction) => (
                                <TableRow key={prediction.id}>
                                    <TableCell className="font-medium">{prediction.model_name}</TableCell>
                                    <TableCell>{prediction.input}</TableCell>
                                    <TableCell>{prediction.output}</TableCell>
                                    <TableCell>{getConfidenceBadge(prediction.confidence)}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {new Date(prediction.created_at).toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
