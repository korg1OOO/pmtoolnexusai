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
    Percent,
    Loader2
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
import {
    useAnnouncements,
    useToggleAnnouncement,
    useFeatureFlags,
    useToggleFeatureFlag,
    useUpdateFeatureFlag,
} from '@/hooks/useMarketing';

// Mock data removed - now using live database

export function AdminMarketing() {
    const [selectedFlag, setSelectedFlag] = useState<string | null>(null);

    // Fetch data from database
    const { data: announcements = [], isLoading: announcementsLoading } = useAnnouncements();
    const { data: featureFlags = [], isLoading: flagsLoading } = useFeatureFlags();
    const toggleAnnouncement = useToggleAnnouncement();
    const toggleFlag = useToggleFeatureFlag();
    const updateFlag = useUpdateFeatureFlag();

    const isLoading = announcementsLoading || flagsLoading;

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
                        <div className="text-2xl font-bold">{announcements.filter(a => a.is_active).length}</div>
                        <p className="text-xs text-muted-foreground">Showing to users</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Feature Flags</CardTitle>
                        <ToggleLeft className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{featureFlags.filter(f => f.is_enabled).length}</div>
                        <p className="text-xs text-muted-foreground">Currently enabled</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Avg Dismissal Rate</CardTitle>
                        <Eye className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {announcements.length > 0
                                ? Math.round(
                                    (announcements.reduce((sum, a) => sum + (a.dismissal_count || 0), 0) / announcements.length / 100) * 100
                                )
                                : 0}%
                        </div>
                        <p className="text-xs text-muted-foreground">Of active announcements</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Rollout Coverage</CardTitle>
                        <Percent className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {featureFlags.length > 0
                                ? Math.round(
                                    featureFlags.reduce((sum, f) => sum + f.rollout_percentage, 0) / featureFlags.length
                                )
                                : 0}%
                        </div>
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
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : announcements.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Bell className="h-10 w-10 mx-auto mb-3 opacity-50" />
                                    <p className="text-sm">No announcements yet</p>
                                    <p className="text-xs">Create your first announcement to engage users</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {announcements.map((announcement) => (
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
                                                    <Switch
                                                        checked={announcement.is_active}
                                                        onCheckedChange={(checked) => {
                                                            toggleAnnouncement.mutate({
                                                                id: announcement.id,
                                                                isActive: checked,
                                                            });
                                                        }}
                                                    />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
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
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : featureFlags.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <ToggleLeft className="h-10 w-10 mx-auto mb-3 opacity-50" />
                                    <p className="text-sm">No feature flags yet</p>
                                    <p className="text-xs">Create feature flags for gradual rollouts</p>
                                </div>
                            ) : (
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
                                        {featureFlags.map((flag) => (
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
                                                                onValueChange={([value]) => {
                                                                    updateFlag.mutate({
                                                                        id: flag.id,
                                                                        updates: { rollout_percentage: value },
                                                                    });
                                                                }}
                                                            />
                                                        </div>
                                                        <span className="text-sm">{flag.rollout_percentage}%</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1">
                                                        {(flag.target_tiers || []).map((tier, idx) => (
                                                            <Badge key={idx} variant="outline">{tier}</Badge>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Switch
                                                        checked={flag.is_enabled}
                                                        onCheckedChange={(checked) => {
                                                            toggleFlag.mutate({
                                                                id: flag.id,
                                                                isEnabled: checked,
                                                            });
                                                        }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
