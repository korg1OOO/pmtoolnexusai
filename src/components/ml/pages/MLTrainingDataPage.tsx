/**
 * ML Training Data Management Page
 * Manage training datasets and monitor data quality
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    ArrowLeft,
    Database,
    Upload,
    Download,
    CheckCircle,
    AlertCircle,
    Search,
    Filter,
    BarChart3,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function MLTrainingDataPage() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    // Mock training datasets
    const datasets = [
        {
            id: '1',
            name: 'Customer Sentiment Dataset',
            type: 'Text',
            size: '2.4 GB',
            records: 150000,
            quality: 98.5,
            status: 'active',
            lastUpdated: '2024-02-11',
            usedBy: ['Sentiment Analysis v2.1'],
        },
        {
            id: '2',
            name: 'Product Images Collection',
            type: 'Image',
            size: '15.2 GB',
            records: 45000,
            quality: 95.2,
            status: 'active',
            lastUpdated: '2024-02-10',
            usedBy: ['Image Classifier v3.0'],
        },
        {
            id: '3',
            name: 'Transaction History',
            type: 'Tabular',
            size: '890 MB',
            records: 500000,
            quality: 99.1,
            status: 'active',
            lastUpdated: '2024-02-12',
            usedBy: ['Fraud Detection v1.5'],
        },
        {
            id: '4',
            name: 'User Behavior Logs',
            type: 'Time Series',
            size: '3.8 GB',
            records: 2000000,
            quality: 92.8,
            status: 'processing',
            lastUpdated: '2024-02-13',
            usedBy: ['Recommendation Engine'],
        },
    ];

    const qualityMetrics = [
        { label: 'Completeness', value: 97.2, status: 'good' },
        { label: 'Consistency', value: 95.8, status: 'good' },
        { label: 'Accuracy', value: 98.5, status: 'excellent' },
        { label: 'Timeliness', value: 89.3, status: 'warning' },
    ];

    const getQualityColor = (quality: number) => {
        if (quality >= 95) return 'text-green-600';
        if (quality >= 85) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: any; label: string }> = {
            active: { variant: 'default', label: 'Active' },
            processing: { variant: 'secondary', label: 'Processing' },
            archived: { variant: 'outline', label: 'Archived' },
        };
        const config = variants[status] || variants.active;
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <Button variant="ghost" onClick={() => navigate('/admin/ml')} className="mb-4">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to ML Dashboard
                </Button>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Training Data</h1>
                        <p className="text-muted-foreground mt-1">
                            Manage training datasets and monitor data quality
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Dataset
                        </Button>
                        <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                    </div>
                </div>
            </div>

            {/* Quality Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {qualityMetrics.map((metric) => (
                    <Card key={metric.label}>
                        <CardHeader className="pb-3">
                            <CardDescription>{metric.label}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-end justify-between">
                                <div>
                                    <div className={`text-3xl font-bold ${getQualityColor(metric.value)}`}>
                                        {metric.value}%
                                    </div>
                                    <div className="flex items-center gap-1 text-sm mt-1">
                                        {metric.status === 'excellent' || metric.status === 'good' ? (
                                            <CheckCircle className="h-3 w-3 text-green-600" />
                                        ) : (
                                            <AlertCircle className="h-3 w-3 text-yellow-600" />
                                        )}
                                        <span className="text-muted-foreground capitalize">
                                            {metric.status}
                                        </span>
                                    </div>
                                </div>
                                <BarChart3 className="h-8 w-8 text-muted-foreground opacity-20" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Search and Filter */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search datasets..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Button variant="outline" size="icon">
                            <Filter className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Datasets List */}
            <Card>
                <CardHeader>
                    <CardTitle>Datasets</CardTitle>
                    <CardDescription>
                        {datasets.length} datasets • {datasets.reduce((sum, d) => sum + d.records, 0).toLocaleString()} total records
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {datasets.map((dataset) => (
                            <div
                                key={dataset.id}
                                className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-start gap-4">
                                    <Database className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold">{dataset.name}</h3>
                                            {getStatusBadge(dataset.status)}
                                            <Badge variant="outline">{dataset.type}</Badge>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span>{dataset.records.toLocaleString()} records</span>
                                            <span>•</span>
                                            <span>{dataset.size}</span>
                                            <span>•</span>
                                            <span>Updated {dataset.lastUpdated}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="text-muted-foreground">Used by:</span>
                                            {dataset.usedBy.map((model) => (
                                                <Badge key={model} variant="secondary" className="text-xs">
                                                    {model}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-muted-foreground mb-1">Quality Score</div>
                                    <div className={`text-2xl font-bold ${getQualityColor(dataset.quality)}`}>
                                        {dataset.quality}%
                                    </div>
                                    <div className="mt-2">
                                        <Button variant="ghost" size="sm">
                                            View Details
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Data Distribution */}
            <Card>
                <CardHeader>
                    <CardTitle>Data Distribution</CardTitle>
                    <CardDescription>
                        Dataset breakdown by type and size
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {['Text', 'Image', 'Tabular', 'Time Series'].map((type) => {
                            const typeDatasets = datasets.filter((d) => d.type === type);
                            const totalRecords = typeDatasets.reduce((sum, d) => sum + d.records, 0);
                            const percentage = (totalRecords / datasets.reduce((sum, d) => sum + d.records, 0)) * 100;

                            return (
                                <div key={type} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{type}</span>
                                            <Badge variant="outline">{typeDatasets.length} datasets</Badge>
                                        </div>
                                        <span className="text-sm text-muted-foreground">
                                            {totalRecords.toLocaleString()} records ({percentage.toFixed(1)}%)
                                        </span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-2">
                                        <div
                                            className="bg-primary rounded-full h-2 transition-all"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
