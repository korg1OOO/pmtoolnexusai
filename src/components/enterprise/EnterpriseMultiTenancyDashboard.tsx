/**
 * Enterprise Multi-Tenancy Dashboard
 * Main interface for workspace, portfolio, and manual learning management
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    Building2,
    FolderKanban,
    BookOpen,
    Upload,
    Download,
    Plus,
    Users,
    TrendingUp,
    Share2,
} from 'lucide-react';
import { getWorkspaces, createWorkspace, getWorkspaceMembers } from '@/services/workspaceService';
import { getPortfolios, createPortfolio, getPortfolioStats } from '@/services/portfolioService';
import { getManualLearnings, createManualLearning, convertToPattern } from '@/services/manualLearningService';
import { getMLSharingStats } from '@/services/mlSharingService';
import { getDefaultTenant } from '@/services/tenantService';

export function EnterpriseMultiTenancyDashboard() {
    const [activeTab, setActiveTab] = useState('workspaces');
    const queryClient = useQueryClient();

    // Get default tenant
    const { data: tenant } = useQuery({
        queryKey: ['default-tenant'],
        queryFn: getDefaultTenant,
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Enterprise Management</h1>
                <p className="text-muted-foreground">
                    Manage workspaces, portfolios, and ML learnings across your organization
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="workspaces">
                        <Building2 className="h-4 w-4 mr-2" />
                        Workspaces
                    </TabsTrigger>
                    <TabsTrigger value="portfolios">
                        <FolderKanban className="h-4 w-4 mr-2" />
                        Portfolios
                    </TabsTrigger>
                    <TabsTrigger value="manual-learning">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Manual Learning
                    </TabsTrigger>
                    <TabsTrigger value="ml-sharing">
                        <Share2 className="h-4 w-4 mr-2" />
                        ML Sharing
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="workspaces" className="space-y-4">
                    {tenant && <WorkspacesTab tenantId={tenant.id} />}
                </TabsContent>

                <TabsContent value="portfolios" className="space-y-4">
                    {tenant && <PortfoliosTab tenantId={tenant.id} />}
                </TabsContent>

                <TabsContent value="manual-learning" className="space-y-4">
                    {tenant && <ManualLearningTab tenantId={tenant.id} />}
                </TabsContent>

                <TabsContent value="ml-sharing" className="space-y-4">
                    {tenant && <MLSharingTab tenantId={tenant.id} />}
                </TabsContent>
            </Tabs>
        </div>
    );
}

function WorkspacesTab({ tenantId }: { tenantId: string }) {
    const [showCreate, setShowCreate] = useState(false);
    const queryClient = useQueryClient();

    const { data: workspaces, isLoading } = useQuery({
        queryKey: ['workspaces', tenantId],
        queryFn: () => getWorkspaces(tenantId),
    });

    const createMutation = useMutation({
        mutationFn: createWorkspace,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspaces'] });
            toast.success('Workspace created');
            setShowCreate(false);
        },
    });

    if (isLoading) return <p>Loading workspaces...</p>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Workspaces ({workspaces?.length || 0})</h2>
                <Button onClick={() => setShowCreate(!showCreate)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Workspace
                </Button>
            </div>

            {showCreate && (
                <CreateWorkspaceForm
                    tenantId={tenantId}
                    onSubmit={(data) => createMutation.mutate(data)}
                    onCancel={() => setShowCreate(false)}
                />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workspaces?.map((workspace) => (
                    <WorkspaceCard key={workspace.id} workspace={workspace} />
                ))}
            </div>
        </div>
    );
}

function WorkspaceCard({ workspace }: { workspace: any }) {
    const { data: members } = useQuery({
        queryKey: ['workspace-members', workspace.id],
        queryFn: () => getWorkspaceMembers(workspace.id),
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>{workspace.name}</span>
                    <Badge variant="outline">{workspace.slug}</Badge>
                </CardTitle>
                {workspace.description && (
                    <CardDescription>{workspace.description}</CardDescription>
                )}
            </CardHeader>
            <CardContent>
                <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{members?.length || 0} members</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Share2 className="h-4 w-4 text-muted-foreground" />
                        <span>ML Sharing: {workspace.ml_sharing_enabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function CreateWorkspaceForm({ tenantId, onSubmit, onCancel }: any) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [slug, setSlug] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ tenant_id: tenantId, name, description, slug });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Create New Workspace</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                            }}
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <div>
                        <Label htmlFor="slug">Slug</Label>
                        <Input
                            id="slug"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            required
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button type="submit">Create</Button>
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

function PortfoliosTab({ tenantId }: { tenantId: string }) {
    const { data: workspaces } = useQuery({
        queryKey: ['workspaces', tenantId],
        queryFn: () => getWorkspaces(tenantId),
    });

    const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');

    const { data: portfolios } = useQuery({
        queryKey: ['portfolios', selectedWorkspace],
        queryFn: () => getPortfolios(selectedWorkspace),
        enabled: !!selectedWorkspace,
    });

    return (
        <div className="space-y-4">
            <div>
                <Label>Select Workspace</Label>
                <Select value={selectedWorkspace} onValueChange={setSelectedWorkspace}>
                    <SelectTrigger>
                        <SelectValue placeholder="Choose a workspace" />
                    </SelectTrigger>
                    <SelectContent>
                        {workspaces?.map((ws) => (
                            <SelectItem key={ws.id} value={ws.id}>
                                {ws.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {selectedWorkspace && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {portfolios?.map((portfolio) => (
                        <PortfolioCard key={portfolio.id} portfolio={portfolio} />
                    ))}
                </div>
            )}
        </div>
    );
}

function PortfolioCard({ portfolio }: { portfolio: any }) {
    const { data: stats } = useQuery({
        queryKey: ['portfolio-stats', portfolio.id],
        queryFn: () => getPortfolioStats(portfolio.id),
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle>{portfolio.name}</CardTitle>
                <CardDescription>{portfolio.description}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Projects:</span>
                        <span className="font-medium">{stats?.total_projects || 0}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">ML Patterns:</span>
                        <span className="font-medium">{stats?.ml_patterns_count || 0}</span>
                    </div>
                    <Badge>{portfolio.status}</Badge>
                </div>
            </CardContent>
        </Card>
    );
}

function ManualLearningTab({ tenantId }: { tenantId: string }) {
    const [showCreate, setShowCreate] = useState(false);
    const queryClient = useQueryClient();

    const { data: learnings } = useQuery({
        queryKey: ['manual-learnings', tenantId],
        queryFn: () => getManualLearnings({ tenant_id: tenantId }),
    });

    const createMutation = useMutation({
        mutationFn: createManualLearning,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['manual-learnings'] });
            toast.success('Learning created');
            setShowCreate(false);
        },
    });

    const convertMutation = useMutation({
        mutationFn: convertToPattern,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['manual-learnings'] });
            toast.success('Converted to ML pattern');
        },
    });

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Manual Learnings ({learnings?.length || 0})</h2>
                <Button onClick={() => setShowCreate(!showCreate)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Learning
                </Button>
            </div>

            {showCreate && (
                <CreateLearningForm
                    tenantId={tenantId}
                    onSubmit={(data) => createMutation.mutate(data)}
                    onCancel={() => setShowCreate(false)}
                />
            )}

            <div className="space-y-3">
                {learnings?.map((learning) => (
                    <LearningCard
                        key={learning.id}
                        learning={learning}
                        onConvert={() => convertMutation.mutate(learning.id)}
                    />
                ))}
            </div>
        </div>
    );
}

function CreateLearningForm({ tenantId, onSubmit, onCancel }: any) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [learningType, setLearningType] = useState('best_practice');
    const [scope, setScope] = useState('tenant');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            tenant_id: tenantId,
            title,
            description,
            learning_type: learningType,
            applies_to_scope: scope,
            learning_data: {
                pattern_type: 'general',
                condition: {},
                prediction_adjustment: { type: 'manual', value: description },
                confidence: 0.8,
            },
            created_by_user_id: 'current-user-id', // TODO: Get from auth
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Add Manual Learning</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                        />
                    </div>
                    <div>
                        <Label htmlFor="type">Learning Type</Label>
                        <Select value={learningType} onValueChange={setLearningType}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="best_practice">Best Practice</SelectItem>
                                <SelectItem value="lesson_learned">Lesson Learned</SelectItem>
                                <SelectItem value="expert_knowledge">Expert Knowledge</SelectItem>
                                <SelectItem value="historical_data">Historical Data</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="scope">Applies To</Label>
                        <Select value={scope} onValueChange={setScope}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="tenant">Entire Company</SelectItem>
                                <SelectItem value="workspace">Workspace</SelectItem>
                                <SelectItem value="portfolio">Portfolio</SelectItem>
                                <SelectItem value="project">Single Project</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex gap-2">
                        <Button type="submit">Create</Button>
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

function LearningCard({ learning, onConvert }: any) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>{learning.title}</span>
                    <div className="flex gap-2">
                        <Badge>{learning.learning_type}</Badge>
                        <Badge variant="outline">{learning.applies_to_scope}</Badge>
                    </div>
                </CardTitle>
                {learning.description && (
                    <CardDescription>{learning.description}</CardDescription>
                )}
            </CardHeader>
            <CardContent>
                <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                        {learning.tags?.join(', ')}
                    </div>
                    {!learning.converted_to_pattern_id && (
                        <Button size="sm" onClick={onConvert}>
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Convert to Pattern
                        </Button>
                    )}
                    {learning.converted_to_pattern_id && (
                        <Badge variant="secondary">✓ Converted</Badge>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function MLSharingTab({ tenantId }: { tenantId: string }) {
    const { data: stats } = useQuery({
        queryKey: ['ml-sharing-stats', tenantId],
        queryFn: () => getMLSharingStats(tenantId),
    });

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">ML Sharing Statistics</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Total Patterns</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{stats?.total_patterns || 0}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>By Scope</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Project:</span>
                            <span className="font-medium">{stats?.project_patterns || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Portfolio:</span>
                            <span className="font-medium">{stats?.portfolio_patterns || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Workspace:</span>
                            <span className="font-medium">{stats?.workspace_patterns || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Tenant:</span>
                            <span className="font-medium">{stats?.tenant_patterns || 0}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>By Source</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Auto-generated:</span>
                            <span className="font-medium">{stats?.auto_patterns || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Manual:</span>
                            <span className="font-medium">{stats?.manual_patterns || 0}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
