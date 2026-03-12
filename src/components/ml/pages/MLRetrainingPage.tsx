/**
 * ML Retraining Jobs Page
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, ArrowLeft, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useActiveRetrainingJobs, useRetrainingJobStats } from '@/hooks/useMLRetraining';

export function MLRetrainingPage() {
    const navigate = useNavigate();
    const { data: activeJobs = [] } = useActiveRetrainingJobs();
    const { data: stats } = useRetrainingJobStats();

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'running':
                return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Running</Badge>;
            case 'completed':
                return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>;
            case 'failed':
                return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div>
                <Button variant="ghost" onClick={() => navigate('/admin/ml')} className="mb-2">
                    <ArrowLeft className="h-4 w-4 mr-2" />Back to ML Dashboard
                </Button>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <RefreshCw className="h-8 w-8 text-green-600" />Retraining Jobs
                </h1>
                <p className="text-muted-foreground mt-1">Manage model retraining jobs and schedules</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active Jobs</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-blue-600">{stats?.active || 0}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-green-600">{stats?.completed || 0}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Failed</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-red-600">{stats?.failed || 0}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{stats?.total || 0}</div></CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Active Retraining Jobs</CardTitle>
                        <Button size="sm"><RefreshCw className="h-4 w-4 mr-2" />Schedule New Job</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {activeJobs.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">No active retraining jobs</div>
                    ) : (
                        <div className="space-y-4">
                            {activeJobs.map((job) => (
                                <Card key={job.id}>
                                    <CardContent className="pt-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="font-semibold">{job.model_type}</h3>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Started {job.started_at ? new Date(job.started_at).toLocaleString() : 'N/A'}
                                                </p>
                                            </div>
                                            {getStatusBadge(job.status)}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}