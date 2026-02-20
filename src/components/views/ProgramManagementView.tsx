import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { CrossProjectDependencyManager } from '@/components/program/CrossProjectDependencyManager';
import { ProgramMilestoneTracker } from '@/components/program/ProgramMilestoneTracker';
import { SharedTaskBoard } from '@/components/program/SharedTaskBoard';
import {
    Building2,
    Plus,
    Users,
    Calendar,
    TrendingUp,
    DollarSign,
    Target,
    AlertCircle,
    CheckCircle2,
    Clock,
    BarChart3,
    FolderKanban,
    Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
    getPrograms,
    createProgram,
    getProgramStats,
    getProgramProjects,
    getProgramMembers,
    getProgramMilestones,
    type Program,
    type ProgramStats,
} from '@/services/programService';
import { getPortfolios } from '@/services/portfolioService';
import { getWorkspaces } from '@/services/workspaceService';
import { getDefaultTenant } from '@/services/tenantService';

export function ProgramManagementView() {
    const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('');
    const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const queryClient = useQueryClient();

    // Get tenant
    const { data: tenant } = useQuery({
        queryKey: ['default-tenant'],
        queryFn: getDefaultTenant,
    });

    // Get workspaces
    const { data: workspaces = [] } = useQuery({
        queryKey: ['workspaces', tenant?.id],
        queryFn: () => getWorkspaces(tenant!.id),
        enabled: !!tenant?.id,
    });

    const defaultWorkspace = workspaces.find(w => w.slug === 'default');

    // Get portfolios
    const { data: portfolios = [] } = useQuery({
        queryKey: ['portfolios', defaultWorkspace?.id],
        queryFn: () => getPortfolios(defaultWorkspace!.id),
        enabled: !!defaultWorkspace?.id,
    });

    // Get programs
    const { data: programs = [], isLoading: programsLoading } = useQuery({
        queryKey: ['programs', selectedPortfolioId],
        queryFn: () => getPrograms(selectedPortfolioId),
        enabled: !!selectedPortfolioId,
    });

    // Get selected program details
    const selectedProgram = programs.find(p => p.id === selectedProgramId);

    // Get program stats
    const { data: programStats } = useQuery({
        queryKey: ['program-stats', selectedProgramId],
        queryFn: () => getProgramStats(selectedProgramId!),
        enabled: !!selectedProgramId,
    });

    // Get program projects
    const { data: programProjects = [] } = useQuery({
        queryKey: ['program-projects', selectedProgramId],
        queryFn: () => getProgramProjects(selectedProgramId!),
        enabled: !!selectedProgramId,
    });

    // Get program members
    const { data: programMembers = [] } = useQuery({
        queryKey: ['program-members', selectedProgramId],
        queryFn: () => getProgramMembers(selectedProgramId!),
        enabled: !!selectedProgramId,
    });

    // Get program milestones
    const { data: programMilestones = [] } = useQuery({
        queryKey: ['program-milestones', selectedProgramId],
        queryFn: () => getProgramMilestones(selectedProgramId!),
        enabled: !!selectedProgramId,
    });

    // Auto-select first portfolio
    if (portfolios.length > 0 && !selectedPortfolioId) {
        setSelectedPortfolioId(portfolios[0].id);
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-500/10 text-green-500';
            case 'planning': return 'bg-blue-500/10 text-blue-500';
            case 'on-hold': return 'bg-yellow-500/10 text-yellow-500';
            case 'completed': return 'bg-gray-500/10 text-gray-500';
            case 'cancelled': return 'bg-red-500/10 text-red-500';
            default: return 'bg-gray-500/10 text-gray-500';
        }
    };

    const getHealthColor = (health: string) => {
        switch (health) {
            case 'green': return 'bg-green-500';
            case 'amber': return 'bg-yellow-500';
            case 'red': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
            <div className="container mx-auto p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Program Management
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Coordinate related projects for strategic delivery
                        </p>
                    </div>
                    <CreateProgramDialog
                        portfolios={portfolios}
                        workspaces={workspaces}
                        tenant={tenant}
                        open={isCreateDialogOpen}
                        onOpenChange={setIsCreateDialogOpen}
                    />
                </div>

                {/* Portfolio Selector */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <Label htmlFor="portfolio-select" className="text-sm font-medium">
                                Portfolio:
                            </Label>
                            <Select value={selectedPortfolioId} onValueChange={setSelectedPortfolioId}>
                                <SelectTrigger id="portfolio-select" className="w-[300px]">
                                    <SelectValue placeholder="Select portfolio" />
                                </SelectTrigger>
                                <SelectContent>
                                    {portfolios.map(portfolio => (
                                        <SelectItem key={portfolio.id} value={portfolio.id}>
                                            {portfolio.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Programs Grid */}
                {!selectedProgramId ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence mode="popLayout">
                            {programs.map(program => (
                                <ProgramCard
                                    key={program.id}
                                    program={program}
                                    onClick={() => setSelectedProgramId(program.id)}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <ProgramDashboard
                        program={selectedProgram!}
                        stats={programStats}
                        projects={programProjects}
                        members={programMembers}
                        milestones={programMilestones}
                        onBack={() => setSelectedProgramId(null)}
                    />
                )}

                {programs.length === 0 && !programsLoading && selectedPortfolioId && (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Programs Yet</h3>
                            <p className="text-muted-foreground text-center mb-4">
                                Create your first program to start coordinating related projects
                            </p>
                            <Button onClick={() => setIsCreateDialogOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Create Program
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

function ProgramCard({ program, onClick }: { program: Program; onClick: () => void }) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
        >
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onClick}>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <CardTitle className="text-lg">{program.name}</CardTitle>
                            <CardDescription className="mt-1">{program.code}</CardDescription>
                        </div>
                        <div className={`h-3 w-3 rounded-full ${getHealthColor(program.health)}`} />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <Badge className={getStatusColor(program.status)}>
                            {program.status}
                        </Badge>

                        {program.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                                {program.description}
                            </p>
                        )}

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {program.start_date && (
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {new Date(program.start_date).toLocaleDateString()}
                                </div>
                            )}
                            {program.total_budget && (
                                <div className="flex items-center gap-1">
                                    <DollarSign className="h-4 w-4" />
                                    {formatCurrency(program.total_budget)}
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

function ProgramDashboard({
    program,
    stats,
    projects,
    members,
    milestones,
    onBack,
}: {
    program: Program;
    stats?: ProgramStats;
    projects: any[];
    members: any[];
    milestones: any[];
    onBack: () => void;
}) {
    return (
        <div className="space-y-6">
            {/* Back Button & Header */}
            <div className="flex items-center gap-4">
                <Button variant="outline" onClick={onBack}>
                    ← Back to Programs
                </Button>
                <div className="flex-1">
                    <h2 className="text-2xl font-bold">{program.name}</h2>
                    <p className="text-muted-foreground">{program.code}</p>
                </div>
                <div className={`h-4 w-4 rounded-full ${getHealthColor(program.health)}`} />
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Projects
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats.total_projects}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                                {stats.active_projects} active
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Budget
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{formatCurrency(stats.total_budget)}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                                {formatCurrency(stats.spent_budget)} spent
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Progress
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats.overall_progress}%</div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all"
                                    style={{ width: `${stats.overall_progress}%` }}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Health
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-2">
                                <div className="flex items-center gap-1">
                                    <div className="h-3 w-3 rounded-full bg-green-500" />
                                    <span className="text-sm">{stats.health_summary.green}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                                    <span className="text-sm">{stats.health_summary.amber}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="h-3 w-3 rounded-full bg-red-500" />
                                    <span className="text-sm">{stats.health_summary.red}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Tabs */}
            <Tabs defaultValue="projects" className="w-full">
                <TabsList>
                    <TabsTrigger value="projects">
                        <FolderKanban className="h-4 w-4 mr-2" />
                        Projects ({projects.length})
                    </TabsTrigger>
                    <TabsTrigger value="milestones">
                        <Target className="h-4 w-4 mr-2" />
                        Milestones
                    </TabsTrigger>
                    <TabsTrigger value="shared-tasks">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Shared Tasks
                    </TabsTrigger>
                    <TabsTrigger value="dependencies">
                        <Settings className="h-4 w-4 mr-2" />
                        Dependencies
                    </TabsTrigger>
                    <TabsTrigger value="members">
                        <Users className="h-4 w-4 mr-2" />
                        Members ({members.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="projects" className="space-y-4">
                    {projects.map(project => (
                        <Card key={project.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-base">{project.name}</CardTitle>
                                        <CardDescription>{project.code}</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge className={getStatusColor(project.status)}>
                                            {project.status}
                                        </Badge>
                                        <div className={`h-3 w-3 rounded-full ${getHealthColor(project.health)}`} />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-6 text-sm">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                        <span>{project.progress}% complete</span>
                                    </div>
                                    {project.budget && (
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                                            <span>{formatCurrency(project.budget)}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {projects.length === 0 && (
                        <Card className="border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-8">
                                <FolderKanban className="h-8 w-8 text-muted-foreground mb-2" />
                                <p className="text-muted-foreground">No projects in this program yet</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="milestones" className="space-y-4">
                    <ProgramMilestoneTracker programId={program.id} />
                </TabsContent>

                <TabsContent value="shared-tasks" className="space-y-4">
                    <SharedTaskBoard programId={program.id} />
                </TabsContent>

                <TabsContent value="dependencies" className="space-y-4">
                    <CrossProjectDependencyManager programId={program.id} tenantId={program.portfolio_id ?? ''} />
                </TabsContent>

                <TabsContent value="members" className="space-y-4">
                    {members.map(member => (
                        <Card key={member.id}>
                            <CardContent className="flex items-center justify-between py-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                                        {member.user_id.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-medium">{member.user_id}</div>
                                        <div className="text-sm text-muted-foreground capitalize">{member.role}</div>
                                    </div>
                                </div>
                                <Badge variant="outline">{member.role}</Badge>
                            </CardContent>
                        </Card>
                    ))}
                    {members.length === 0 && (
                        <Card className="border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-8">
                                <Users className="h-8 w-8 text-muted-foreground mb-2" />
                                <p className="text-muted-foreground">No members assigned yet</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

function CreateProgramDialog({
    portfolios,
    workspaces,
    tenant,
    open,
    onOpenChange,
}: {
    portfolios: any[];
    workspaces: any[];
    tenant: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [formData, setFormData] = useState({
        portfolio_id: '',
        name: '',
        code: '',
        description: '',
        program_type: 'standard',
        start_date: '',
        end_date: '',
        total_budget: '',
    });

    const queryClient = useQueryClient();

    const createMutation = useMutation({
        mutationFn: createProgram,
        onSuccess: () => {
            toast.success('Program created successfully');
            queryClient.invalidateQueries({ queryKey: ['programs'] });
            onOpenChange(false);
            setFormData({
                portfolio_id: '',
                name: '',
                code: '',
                description: '',
                program_type: 'standard',
                start_date: '',
                end_date: '',
                total_budget: '',
            });
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to create program');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const defaultWorkspace = workspaces.find(w => w.slug === 'default');

        createMutation.mutate({
            tenant_id: tenant.id,
            workspace_id: defaultWorkspace.id,
            portfolio_id: formData.portfolio_id,
            name: formData.name,
            code: formData.code,
            description: formData.description,
            program_type: formData.program_type,
            start_date: formData.start_date || undefined,
            end_date: formData.end_date || undefined,
            total_budget: formData.total_budget ? parseFloat(formData.total_budget) : undefined,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Program
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Create New Program</DialogTitle>
                    <DialogDescription>
                        Create a program to coordinate related projects for strategic delivery
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="portfolio">Portfolio *</Label>
                            <Select
                                value={formData.portfolio_id}
                                onValueChange={(value) => setFormData({ ...formData, portfolio_id: value })}
                                required
                            >
                                <SelectTrigger id="portfolio">
                                    <SelectValue placeholder="Select portfolio" />
                                </SelectTrigger>
                                <SelectContent>
                                    {portfolios.map(portfolio => (
                                        <SelectItem key={portfolio.id} value={portfolio.id}>
                                            {portfolio.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="program_type">Program Type</Label>
                            <Select
                                value={formData.program_type}
                                onValueChange={(value) => setFormData({ ...formData, program_type: value })}
                            >
                                <SelectTrigger id="program_type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="standard">Standard</SelectItem>
                                    <SelectItem value="strategic">Strategic</SelectItem>
                                    <SelectItem value="operational">Operational</SelectItem>
                                    <SelectItem value="transformation">Transformation</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Program Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Customer Experience Platform"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="code">Program Code *</Label>
                            <Input
                                id="code"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                placeholder="CEP-2024"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Modernize customer touchpoints across all channels"
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start_date">Start Date</Label>
                            <Input
                                id="start_date"
                                type="date"
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="end_date">End Date</Label>
                            <Input
                                id="end_date"
                                type="date"
                                value={formData.end_date}
                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="total_budget">Total Budget</Label>
                            <Input
                                id="total_budget"
                                type="number"
                                value={formData.total_budget}
                                onChange={(e) => setFormData({ ...formData, total_budget: e.target.value })}
                                placeholder="5000000"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={createMutation.isPending}>
                            {createMutation.isPending ? 'Creating...' : 'Create Program'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function getStatusColor(status: string) {
    switch (status) {
        case 'active': return 'bg-green-500/10 text-green-500';
        case 'planning': return 'bg-blue-500/10 text-blue-500';
        case 'on-hold': return 'bg-yellow-500/10 text-yellow-500';
        case 'completed': return 'bg-gray-500/10 text-gray-500';
        case 'cancelled': return 'bg-red-500/10 text-red-500';
        default: return 'bg-gray-500/10 text-gray-500';
    }
}

function getHealthColor(health: string) {
    switch (health) {
        case 'green': return 'bg-green-500';
        case 'amber': return 'bg-yellow-500';
        case 'red': return 'bg-red-500';
        default: return 'bg-gray-500';
    }
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

export default ProgramManagementView;
