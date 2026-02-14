import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, Users, FolderKanban, TrendingUp, Plus, Settings } from 'lucide-react';
import { getTenantOverview, getWorkspaces, type TenantOverview, type WorkspaceListItem } from '@/services/tenantService';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export function TenantDashboard() {
    const nav = useNavigate();
    const [tenantId] = useState('default-tenant-id'); // TODO: Get from auth context

    const { data: overview, isLoading: overviewLoading } = useQuery({
        queryKey: ['tenant-overview', tenantId],
        queryFn: () => getTenantOverview(tenantId)
    });

    const { data: workspaces, isLoading: workspacesLoading } = useQuery({
        queryKey: ['tenant-workspaces', tenantId],
        queryFn: () => getWorkspaces(tenantId)
    });

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Company Dashboard</h1>
                    <p className="text-muted-foreground">Manage your organization</p>
                </div>
                <div className="flex gap-2">
                <Button variant="outline" onClick={() => nav('/tenant/settings')}>
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                    </Button>
                    <Button onClick={() => nav('/tenant/workspaces')}>
                        <Plus className="w-4 h-4 mr-2" />
                        New Workspace
                    </Button>
                </div>
            </div>

            {/* Overview Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    icon={Building}
                    label="Workspaces"
                    value={overview?.total_workspaces || 0}
                    loading={overviewLoading}
                />
                <MetricCard
                    icon={Users}
                    label="Team Members"
                    value={overview?.total_users || 0}
                    loading={overviewLoading}
                />
                <MetricCard
                    icon={FolderKanban}
                    label="Active Projects"
                    value={overview?.total_projects || 0}
                    loading={overviewLoading}
                />
                <MetricCard
                    icon={TrendingUp}
                    label="Programs"
                    value={overview?.active_programs || 0}
                    loading={overviewLoading}
                />
            </div>

            {/* Workspaces List */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Workspaces</h2>
                    <Button variant="ghost" size="sm" onClick={() => nav('/tenant/workspaces')}>
                        View All
                    </Button>
                </div>

                {workspacesLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : workspaces && workspaces.length > 0 ? (
                    <div className="space-y-2">
                        {workspaces.slice(0, 5).map((workspace) => (
                            <WorkspaceRow key={workspace.id} workspace={workspace} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        No workspaces yet. Create your first workspace to get started.
                    </div>
                )}
            </Card>

            {/* Quick Actions */}
            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <QuickActionCard
                        title="Invite Users"
                        description="Add team members to your organization"
                        onClick={() => nav('/tenant/users')}
                    />
                    <QuickActionCard
                        title="Manage Licenses"
                        description="Allocate licenses to users"
                        onClick={() => nav('/tenant/licenses')}
                    />
                    <QuickActionCard
                        title="View Analytics"
                        description="Company-wide insights and metrics"
                        onClick={() => nav('/tenant/analytics')}
                    />
                </div>
            </Card>
        </div>
    );
}

function MetricCard({ icon: Icon, label, value, loading }: {
    icon: any;
    label: string;
    value: number;
    loading?: boolean;
}) {
    return (
        <Card className="p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-3xl font-bold mt-2">
                        {loading ? '...' : value.toLocaleString()}
                    </p>
                </div>
                <Icon className="w-8 h-8 text-muted-foreground" />
            </div>
        </Card>
    );
}

function WorkspaceRow({ workspace }: { workspace: WorkspaceListItem }) {
    const navigate = useNavigate();

    return (
        <div
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
            onClick={() => navigate(`/workspace/${workspace.id}`)}
        >
            <div className="flex-1">
                <h3 className="font-semibold">{workspace.name}</h3>
                <p className="text-sm text-muted-foreground">
                    {workspace.member_count} members • {workspace.project_count} projects
                </p>
            </div>
            <div className="flex items-center gap-2">
                {workspace.is_active ? (
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">Active</span>
                ) : (
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">Inactive</span>
                )}
            </div>
        </div>
    );
}

function QuickActionCard({ title, description, onClick }: {
    title: string;
    description: string;
    onClick: () => void;
}) {
    return (
        <Card className="p-4 hover:bg-accent cursor-pointer transition-colors" onClick={onClick}>
            <h3 className="font-semibold mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
        </Card>
    );
}
