import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectContext } from '@/contexts/ProjectContext';
import { CollaborationMetricsView } from '@/components/analytics/CollaborationMetricsView';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Users,
    MessageSquare,
    BookOpen,
    BarChart3,
    Folder,
    ArrowRight,
} from 'lucide-react';

export default function CollaborationDashboardView() {
    const { settings } = useProjectContext();
    const navigate = useNavigate();

    if (!settings?.id) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No project selected.</p>
            </div>
        );
    }

    const collaborationFeatures = [
        {
            icon: Users,
            title: 'Collaboration Spaces',
            description: 'Shared workspaces for team collaboration, discussions, and document sharing.',
            route: '/collaboration-spaces',
            color: 'text-blue-500 bg-blue-500/10',
            action: 'Open Spaces',
        },
        {
            icon: MessageSquare,
            title: 'Team Chat',
            description: 'Real-time messaging and threaded conversations with your project team.',
            route: '/team-chat',
            color: 'text-green-500 bg-green-500/10',
            action: 'Open Chat',
        },
        {
            icon: BookOpen,
            title: 'Knowledge Base',
            description: 'Centralized repository of project knowledge, wikis, and documentation.',
            route: '/knowledge-base',
            color: 'text-purple-500 bg-purple-500/10',
            action: 'Open Knowledge Base',
        },
        {
            icon: Folder,
            title: 'Program Documents',
            description: 'Manage and share all program-level documents and files in one place.',
            route: '/program-documents',
            color: 'text-orange-500 bg-orange-500/10',
            action: 'Open Documents',
        },
    ];

    return (
        <div className="p-6 space-y-6 overflow-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">Collaboration Hub</h1>
                <p className="text-muted-foreground mt-1">
                    All collaboration tools and metrics for {settings.name}
                </p>
            </div>

            <Tabs defaultValue="overview">
                <TabsList>
                    <TabsTrigger value="overview" className="gap-2">
                        <Users className="h-4 w-4" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="metrics" className="gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Collaboration Metrics
                    </TabsTrigger>
                </TabsList>

                {/* Overview — Feature Cards */}
                <TabsContent value="overview" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {collaborationFeatures.map((feature) => {
                            const Icon = feature.icon;
                            return (
                                <Card
                                    key={feature.route}
                                    className="group hover:shadow-md transition-all duration-200 cursor-pointer border hover:border-primary/40"
                                    onClick={() => navigate(feature.route)}
                                >
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className={`p-3 rounded-xl ${feature.color}`}>
                                                <Icon className="h-6 w-6" />
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(feature.route);
                                                }}
                                            >
                                                {feature.action}
                                                <ArrowRight className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                        <CardTitle className="text-lg mt-3">{feature.title}</CardTitle>
                                        <CardDescription>{feature.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full gap-2"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(feature.route);
                                            }}
                                        >
                                            {feature.action}
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </TabsContent>

                {/* Collaboration Metrics Tab */}
                <TabsContent value="metrics" className="mt-6">
                    <CollaborationMetricsView programId={settings.id} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
