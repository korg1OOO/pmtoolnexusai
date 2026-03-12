import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Briefcase, Plus, Search, TrendingUp, DollarSign, AlertTriangle, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { getPortfolios, createPortfolio, type Portfolio as ServicePortfolio } from '@/services/portfolioService';
import { toast } from 'sonner';

interface Portfolio {
    id: string;
    name: string;
    description?: string;
    tenant_id?: string;
    workspace_id?: string;
    slug?: string;
    portfolio_type?: string;
    start_date?: string;
    end_date?: string;
    status?: string;
    ml_sharing_scope?: string;
    inherit_workspace_ml?: boolean;
    total_budget?: number;
    currency?: string;
    created_at?: string;
    updated_at?: string;
    is_active?: boolean;
    programs_count?: number;
    projects_count?: number;
    budget?: number;
    spent?: number;
    health_status?: 'healthy' | 'at-risk' | 'critical';
    completion?: number;
}

export function PortfolioView() {
    const { workspaceId } = useParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    const { data: portfolios, isLoading } = useQuery<Portfolio[]>({
        queryKey: ['portfolios', workspaceId],
        queryFn: async () => {
            const data = await getPortfolios(workspaceId!);
            return (data || []).map((p: any) => ({
                ...p,
                programs_count: p.programs_count || 0,
                projects_count: p.projects_count || 0,
                budget: p.total_budget || p.budget || 0,
                spent: p.spent || 0,
                health_status: p.health_status || 'healthy',
                completion: p.completion || 0,
            }));
        },
        enabled: !!workspaceId
    });

    const filteredPortfolios = portfolios?.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Portfolios</h1>
                    <p className="text-muted-foreground">Strategic initiatives and programs</p>
                </div>
                <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Portfolio
                </Button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Search portfolios..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6">
                    <div className="flex items-center gap-3">
                        <Briefcase className="w-8 h-8 text-blue-600" />
                        <div>
                            <p className="text-sm text-muted-foreground">Total Portfolios</p>
                            <p className="text-2xl font-bold">{portfolios?.length || 0}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center gap-3">
                        <TrendingUp className="w-8 h-8 text-green-600" />
                        <div>
                            <p className="text-sm text-muted-foreground">Total Programs</p>
                            <p className="text-2xl font-bold">
                                {portfolios?.reduce((sum, p) => sum + (p.programs_count || 0), 0) || 0}
                            </p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center gap-3">
                        <DollarSign className="w-8 h-8 text-purple-600" />
                        <div>
                            <p className="text-sm text-muted-foreground">Total Budget</p>
                            <p className="text-2xl font-bold">
                                ${((portfolios?.reduce((sum, p) => sum + (p.total_budget || p.budget || 0), 0) || 0) / 1000000).toFixed(1)}M
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Portfolios Grid */}
            {isLoading ? (
                <div className="text-center py-12 text-muted-foreground">Loading portfolios...</div>
            ) : filteredPortfolios && filteredPortfolios.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredPortfolios.map((portfolio) => (
                        <PortfolioCard key={portfolio.id} portfolio={portfolio} />
                    ))}
                </div>
            ) : (
                <Card className="p-12 text-center">
                    <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No portfolios found</h3>
                    <p className="text-muted-foreground mb-4">
                        {searchQuery ? 'Try adjusting your search' : 'Create your first portfolio to get started'}
                    </p>
                    {!searchQuery && (
                        <Button onClick={() => setCreateDialogOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Portfolio
                        </Button>
                    )}
                </Card>
            )}

            {/* Create Dialog */}
            <CreatePortfolioDialog
                open={createDialogOpen}
                onClose={() => setCreateDialogOpen(false)}
                workspaceId={workspaceId ?? ''}
            />
        </div>
    );
}

function PortfolioCard({ portfolio }: { portfolio: Portfolio }) {
    const healthColors = {
        healthy: 'bg-green-100 text-green-700',
        'at-risk': 'bg-orange-100 text-orange-700',
        critical: 'bg-red-100 text-red-700'
    };

    const healthIcons = {
        healthy: TrendingUp,
        'at-risk': AlertTriangle,
        critical: AlertTriangle
    };

    const HealthIcon = healthIcons[portfolio.health_status];
    const budgetUtilization = (portfolio.spent / portfolio.budget) * 100;

    return (
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-1">{portfolio.name}</h3>
                    <p className="text-sm text-muted-foreground">{portfolio.description}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${healthColors[portfolio.health_status]}`}>
                    <HealthIcon className="w-3 h-3" />
                    {portfolio.health_status === 'healthy' ? 'Healthy' : portfolio.health_status === 'at-risk' ? 'At Risk' : 'Critical'}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <p className="text-sm text-muted-foreground">Programs</p>
                    <p className="text-lg font-semibold">{portfolio.programs_count}</p>
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">Projects</p>
                    <p className="text-lg font-semibold">{portfolio.projects_count}</p>
                </div>
            </div>

            <div className="space-y-3">
                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Completion</span>
                        <span className="font-medium">{portfolio.completion}%</span>
                    </div>
                    <Progress value={portfolio.completion} className="h-2" />
                </div>

                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Budget</span>
                        <span className="font-medium">
                            ${(portfolio.spent / 1000000).toFixed(1)}M / ${(portfolio.budget / 1000000).toFixed(1)}M
                        </span>
                    </div>
                    <Progress value={budgetUtilization} className="h-2" />
                </div>
            </div>

            <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                    View Details
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                    Roadmap
                </Button>
            </div>
        </Card>
    );
}

function CreatePortfolioDialog({ open, onClose, workspaceId }: {
    open: boolean;
    onClose: () => void;
    workspaceId: string;
}) {
    const queryClient = useQueryClient();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const mutation = useMutation({
        mutationFn: async () => {
            // Get current user to fetch tenant_id
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data: tenantRow } = await (supabase as any)
                .from('user_tenants')
                .select('tenant_id')
                .eq('user_id', user.id)
                .limit(1)
                .single();

            if (!tenantRow) throw new Error('Tenant not found');

            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            return createPortfolio({
                tenant_id: tenantRow.tenant_id,
                workspace_id: workspaceId,
                name,
                description: description || undefined,
                slug,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['portfolios', workspaceId] });
            toast.success('Portfolio created');
            setName('');
            setDescription('');
            onClose();
        },
        onError: (err: any) => {
            toast.error('Failed to create portfolio: ' + err.message);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Portfolio</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">Portfolio Name</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Digital Transformation"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Description</label>
                        <Input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Strategic initiative description"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating…</>
                            ) : 'Create Portfolio'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
