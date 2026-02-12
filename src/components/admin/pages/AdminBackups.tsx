/**
 * Admin Database Backups
 * Backup job tracking and scheduling
 */

import React from 'react';
import {
    Database,
    Play,
    Download,
    Clock,
    CheckCircle2,
    Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { useBackupJobs, useBackupSchedules } from '@/hooks/useBackups';



export function AdminBackups() {
    const { data: backups = [], isLoading: jobsLoading } = useBackupJobs();
    const { data: schedules = [], isLoading: schedulesLoading } = useBackupSchedules();
    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-gray-600';
            case 'running': return 'bg-blue-600';
            case 'completed': return 'bg-green-600';
            case 'failed': return 'bg-red-600';
            default: return 'bg-gray-600';
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Database className="h-8 w-8" />
                        Database Backups
                    </h1>
                    <p className="text-muted-foreground">
                        Manage database backups and schedules
                    </p>
                </div>
                <Button>
                    <Play className="mr-2 h-4 w-4" />
                    Trigger Backup
                </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Backups</CardTitle>
                        <Database className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{backups.length}</div>
                        <p className="text-xs text-muted-foreground">All time</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">100%</div>
                        <p className="text-xs text-muted-foreground">Last 30 days</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Active Schedules</CardTitle>
                        <Calendar className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{schedules.filter(s => s.is_active).length}</div>
                        <p className="text-xs text-muted-foreground">Running</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
                        <Download className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">2.5 GB</div>
                        <p className="text-xs text-muted-foreground">Of 50 GB limit</p>
                    </CardContent>
                </Card>
            </div>

            {/* Backup History */}
            <Card>
                <CardHeader>
                    <CardTitle>Backup History</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Size</TableHead>
                                <TableHead>Started</TableHead>
                                <TableHead>Completed</TableHead>
                                <TableHead>Created By</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {backups.map((backup) => (
                                <TableRow key={backup.id}>
                                    <TableCell>
                                        <Badge variant="outline">{backup.backup_type}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={getStatusColor(backup.status)}>
                                            {backup.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{formatBytes(backup.file_size)}</TableCell>
                                    <TableCell className="text-sm">
                                        {format(new Date(backup.started_at), 'MMM d, h:mm a')}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {backup.completed_at ?
                                            format(new Date(backup.completed_at), 'MMM d, h:mm a') :
                                            '-'
                                        }
                                    </TableCell>
                                    <TableCell className="text-sm">{backup.created_by_email}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="sm">
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Backup Schedules */}
            <Card>
                <CardHeader>
                    <CardTitle>Backup Schedules</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Schedule</TableHead>
                                <TableHead>Last Run</TableHead>
                                <TableHead>Next Run</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {schedules.map((schedule) => (
                                <TableRow key={schedule.id}>
                                    <TableCell className="font-medium">{schedule.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{schedule.backup_type}</Badge>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">{schedule.cron_expression}</TableCell>
                                    <TableCell className="text-sm">
                                        {schedule.last_run_at ?
                                            format(new Date(schedule.last_run_at), 'MMM d, h:mm a') :
                                            'Never'
                                        }
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {schedule.next_run_at ?
                                            format(new Date(schedule.next_run_at), 'MMM d, h:mm a') :
                                            '-'
                                        }
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={schedule.is_active ? 'bg-green-600' : 'bg-gray-600'}>
                                            {schedule.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
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
