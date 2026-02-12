/**
 * Admin Marketing Campaigns
 * In-app announcements and feature flag management
 */

import React, { useState } from 'react';
import {
    Megaphone,
    Plus,
    ToggleLeft,
    Bell,
    Eye,
    Percent
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Slider } from '@/components/ui/slider';

// Placeholder data - will be connected to real hooks
const mockAnnouncements = [
    {
        id: '1',
        title: 'New Pro Features Available',
        message: 'Check out the latest AI-powered insights!',
        type: 'feature',
        is_active: true,
        dismissal_count: 42
    }
];

const mockFeatureFlags = [
    {
        id: '1',
        name: 'ml_analytics_v2',
        description: 'Next-gen ML analytics dashboard',
        is_enabled: true,
        rollout_percentage: 50,
        target_tiers: ['pro']
    }
];

export function AdminMarketing() {
    const [selectedFlag, setSelectedFlag] = useState<string | null>(null);

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'info': return 'bg-blue-600';
            case 'warning': return 'bg-yellow-600';
            case 'success': return 'bg-green-600';
            case 'feature': return 'bg-purple-600';
            default: return 'bg-gray-600';
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Megaphone className="h-8 w-8" />
                        Marketing Campaigns
                    </h1>
                    <p className="text-muted-foreground">
                        Manage announcements and feature flags
                    </p>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Active Announcements</CardTitle>
                        <Bell className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{mockAnnouncements.filter(a => a.is_active).length}</div>
                        <p className="text-xs text-muted-foreground">Showing to users</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Feature Flags</CardTitle>
                        <ToggleLeft className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{mockFeatureFlags.filter(f => f.is_enabled).length}</div>
                        <p className="text-xs text-muted-foreground">Currently enabled</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Avg Dismissal Rate</CardTitle>
                        <Eye className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12%</div>
                        <p className="text-xs text-muted-foreground">Of active announcements</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Rollout Coverage</CardTitle>
                        <Percent className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">73%</div>
                        <p className="text-xs text-muted-foreground">Average across flags</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="announcements" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="announcements">Announcements</TabsTrigger>
                    <TabsTrigger value="flags">Feature Flags</TabsTrigger>
                </TabsList>

                {/* Announcements Tab */}
                <TabsContent value="announcements" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>In-App Announcements</CardTitle>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Announcement
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {mockAnnouncements.map((announcement) => (
                                    <Card key={announcement.id}>
                                        <CardContent className="pt-6">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h3 className="font-semibold">{announcement.title}</h3>
                                                        <Badge className={getTypeColor(announcement.type)}>
                                                            {announcement.type}
                                                        </Badge>
                                                        {announcement.is_active && (
                                                            <Badge variant="outline">Active</Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mb-2">
                                                        {announcement.message}
                                                    </p>
                                                    <div className="text-xs text-muted-foreground">
                                                        {announcement.dismissal_count} dismissals
                                                    </div>
                                                </div>
                                                <Switch checked={announcement.is_active} />
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Feature Flags Tab */}
                <TabsContent value="flags" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Feature Flags</CardTitle>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Flag
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Flag Name</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Rollout %</TableHead>
                                        <TableHead>Target Tiers</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {mockFeatureFlags.map((flag) => (
                                        <TableRow key={flag.id}>
                                            <TableCell className="font-mono text-sm">{flag.name}</TableCell>
                                            <TableCell>{flag.description}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-24">
                                                        <Slider
                                                            value={[flag.rollout_percentage]}
                                                            max={100}
                                                            step={10}
                                                            disabled
                                                        />
                                                    </div>
                                                    <span className="text-sm">{flag.rollout_percentage}%</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    {flag.target_tiers.map(tier => (
                                                        <Badge key={tier} variant="outline">{tier}</Badge>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Switch checked={flag.is_enabled} />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
