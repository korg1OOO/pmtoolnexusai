import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, Users, FolderKanban, TrendingUp, Plus, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface WorkspaceOverview {
    workspace_name: string;
    total_portfolios: number;
    total_programs: number;
    total_projects: number;
    total_members: number;
    active_projects: number;
}

export function WorkspaceDashboard() {
    const { workspaceId } = useParams();

    const { data: overview, isLoading } = useQuery({
        queryKey: ['workspace-overview', workspaceId],
        queryFn: async () => {
            // Mock data - replace with actual API
            const mockOverview: WorkspaceOverview = {
                workspace_name: 'Engineering Division',
                total_portfolios: 3,
                total_programs: 8,
                total_projects: 24,
                total_members: 45,
                active_projects: 18
            };
            return mockOverview;
        }
    });

    if (isLoading) {
        return <div className="p-6 text-center">Loading workspace...</div>;
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">{overview?.workspace_name}</h1>
                    <p className="text-muted-foreground">Division overview and management</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Analytics
                    </Button>
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        New Portfolio
                    </Button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    icon={Briefcase}
                    label="Portfolios"
                    value={overview?.total_portfolios || 0}
                    color="blue"
                />
                <MetricCard
                    icon={FolderKanban}
                    label="Programs"
                    value={overview?.total_programs || 0}
                    color="green"
                />
                <MetricCard
                    icon={TrendingUp}
                    label="Active Projects"
                    value={overview?.active_projects || 0}
                    color="purple"
                />
                <MetricCard
                    icon={Users}
                    label="Team Members"
                    value={overview?.total_members || 0}
                    color="orange"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Portfolios */}
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold">Active Portfolios</h2>
                        <Button variant="ghost" size="sm">View All</Button>
                    </div>
                    <div className="space-y-3">
                        <PortfolioItem
                            name="Digital Transformation"
                            programs={3}
                            projects={12}
                            status="on-track"
                        />
                        <PortfolioItem
                            name="Product Innovation"
                            programs={2}
                            projects={8}
                            status="at-risk"
                        />
                        <PortfolioItem
                            name="Infrastructure Modernization"
                            programs={3}
                            projects={4}
                            status="on-track"
                        />
                    </div>
                </Card>

                {/* Programs */}
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold">Recent Programs</h2>
                        <Button variant="ghost" size="sm">View All</Button>
                    </div>
                    <div className="space-y-3">
                        <ProgramItem
                            name="Cloud Migration"
                            projects={5}
                            completion={75}
                            status="on-track"
                        />
                        <ProgramItem
                            name="Mobile App Redesign"
                            projects={3}
                            completion={45}
                            status="on-track"
                        />
                        <ProgramItem
                            name="API Platform"
                            projects={4}
                            completion={30}
                            status="at-risk"
                        />
                    </div>
                </Card>
            </div>

            {/* Team Overview */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Team Overview</h2>
                    <Button variant="ghost" size="sm">Manage Team</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border rounded-lg p-4">
                        <div className="text-sm text-muted-foreground">Portfolio Managers</div>
                        <div className="text-2xl font-bold mt-1">3</div>
                    </div>
                    <div className="border rounded-lg p-4">
                        <div className="text-sm text-muted-foreground">Program Managers</div>
                        <div className="text-2xl font-bold mt-1">8</div>
                    </div>
                    <div className="border rounded-lg p-4">
                        <div className="text-sm text-muted-foreground">Project Managers</div>
                        <div className="text-2xl font-bold mt-1">24</div>
                    </div>
                </div>
            </Card>

            {/* Activity Feed */}
            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
                <div className="space-y-3">
                    <ActivityItem
                        action="New program created"
                        details="API Platform added to Digital Transformation portfolio"
                        time="2 hours ago"
                    />
                    <ActivityItem
                        action="Team member assigned"
                        details="John Doe assigned to Cloud Migration program"
                        time="5 hours ago"
                    />
                    <ActivityItem
                        action="Budget updated"
                        details="Q2 budget allocated to Product Innovation portfolio"
                        time="1 day ago"
                    />
                </div>
            </Card>
        </div>
    );
}

function MetricCard({ icon: Icon, label, value, color }: {
    icon: any;
    label: string;
    value: number;
    color: string;
}) {
    const colorClasses = {
        blue: 'text-blue-600 bg-blue-100',
        green: 'text-green-600 bg-green-100',
        purple: 'text-purple-600 bg-purple-100',
        orange: 'text-orange-600 bg-orange-100'
    };

    return (
        <Card className="p-6">
            <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color as keyof typeof colorClasses]}`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-2xl font-bold">{value}</p>
                </div>
            </div>
        </Card>
    );
}

function PortfolioItem({ name, programs, projects, status }: {
    name: string;
    programs: number;
    projects: number;
    status: string;
}) {
    return (
        <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer">
            <div>
                <div className="font-medium">{name}</div>
                <div className="text-sm text-muted-foreground">
                    {programs} programs · {projects} projects
                </div>
            </div>
            <span className={`text-xs px-2 py-1 rounded ${status === 'on-track' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                }`}>
                {status === 'on-track' ? 'On Track' : 'At Risk'}
            </span>
        </div>
    );
}

function ProgramItem({ name, projects, completion, status }: {
    name: string;
    projects: number;
    completion: number;
    status: string;
}) {
    return (
        <div className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
                <div className="font-medium">{name}</div>
                <span className={`text-xs px-2 py-1 rounded ${status === 'on-track' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                    {completion}%
                </span>
            </div>
            <div className="text-sm text-muted-foreground mb-2">
                {projects} projects
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${completion}%` }}
                />
            </div>
        </div>
    );
}

function ActivityItem({ action, details, time }: {
    action: string;
    details: string;
    time: string;
}) {
    return (
        <div className="flex items-start gap-3 p-3 border rounded-lg">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2" />
            <div className="flex-1">
                <div className="font-medium">{action}</div>
                <div className="text-sm text-muted-foreground">{details}</div>
                <div className="text-xs text-muted-foreground mt-1">{time}</div>
            </div>
        </div>
    );
}
