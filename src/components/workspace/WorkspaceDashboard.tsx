import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, Users, FolderKanban, TrendingUp, Plus, BarChart3 } from 'lucide-react';
import { getWorkspaceOverview } from '@/services/workspaceService';
import { WorkspacePortfoliosList } from './WorkspacePortfoliosList';
import { WorkspaceProgramsList } from './WorkspaceProgramsList';
import { WorkspaceTeamOverview } from './WorkspaceTeamOverview';
import { WorkspaceActivityFeed } from './WorkspaceActivityFeed';

export function WorkspaceDashboard() {
    const { workspaceId } = useParams();
    const navigate = useNavigate();

    const { data: overview, isLoading } = useQuery({
        queryKey: ['workspace-overview', workspaceId],
        queryFn: () => getWorkspaceOverview(workspaceId!),
        enabled: !!workspaceId
    });

    if (isLoading) {
        return <div className="p-6 text-center">Loading workspace...</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">{overview?.workspace_name}</h1>
                    <p className="text-muted-foreground">Division overview and management</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate(`/workspace/${workspaceId}/analytics`)}>
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Analytics
                    </Button>
                    <Button onClick={() => navigate(`/workspace/${workspaceId}/portfolios`)}>
                        <Plus className="w-4 h-4 mr-2" />
                        New Portfolio
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard icon={Briefcase} label="Portfolios" value={overview?.total_portfolios || 0} color="blue" />
                <MetricCard icon={FolderKanban} label="Programs" value={overview?.total_programs || 0} color="green" />
                <MetricCard icon={TrendingUp} label="Active Projects" value={overview?.active_projects || 0} color="purple" />
                <MetricCard icon={Users} label="Team Members" value={overview?.total_members || 0} color="orange" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <WorkspacePortfoliosList workspaceId={workspaceId!} />
                <WorkspaceProgramsList workspaceId={workspaceId!} />
            </div>

            <WorkspaceTeamOverview workspaceId={workspaceId!} />
            <WorkspaceActivityFeed workspaceId={workspaceId!} />
        </div>
    );
}

function MetricCard({ icon: Icon, label, value, color }: {
    icon: any; label: string; value: number; color: string;
}) {
    const colorClasses: Record<string, string> = {
        blue: 'text-blue-600 bg-blue-100',
        green: 'text-green-600 bg-green-100',
        purple: 'text-purple-600 bg-purple-100',
        orange: 'text-orange-600 bg-orange-100'
    };

    return (
        <Card className="p-6">
            <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
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
