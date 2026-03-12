/**
 * Admin Email Automation
 * Email template library and campaign management dashboard
 */

import React, { useState } from 'react';
import {
    Mail,
    Plus,
    Search,
    Send,
    Eye,
    TrendingUp,
    Users,
    BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    useEmailTemplates,
    useEmailCampaigns,
    useEmailAnalytics
} from '@/hooks/useEmailAutomation';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export function AdminEmailAutomation() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [templateTypeFilter, setTemplateTypeFilter] = useState<string>('');
    const [campaignStatusFilter, setCampaignStatusFilter] = useState<string>('');

    const { data: templates = [] } = useEmailTemplates(templateTypeFilter || undefined);
    const { data: campaigns = [] } = useEmailCampaigns(campaignStatusFilter || undefined);
    const { data: analytics = [] } = useEmailAnalytics();

    // Filter by search
    const filteredTemplates = templates.filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.subject.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredCampaigns = campaigns.filter(campaign =>
        campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        campaign.subject.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Calculate quick stats
    const totalSent = campaigns.reduce((sum, c) => sum + c.sent_count, 0);
    const totalOpens = campaigns.reduce((sum, c) => sum + c.open_count, 0);
    const totalClicks = campaigns.reduce((sum, c) => sum + c.click_count, 0);
    const avgOpenRate = totalSent > 0 ? ((totalOpens / totalSent) * 100).toFixed(1) : '0.0';
    const avgClickRate = totalOpens > 0 ? ((totalClicks / totalOpens) * 100).toFixed(1) : '0.0';

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft': return 'bg-gray-600';
            case 'scheduled': return 'bg-blue-600';
            case 'sending': return 'bg-yellow-600';
            case 'sent': return 'bg-green-600';
            case 'cancelled': return 'bg-red-600';
            default: return 'bg-gray-600';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'transactional': return 'bg-blue-600';
            case 'marketing': return 'bg-purple-600';
            case 'onboarding': return 'bg-green-600';
            default: return 'bg-gray-600';
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Mail className="h-8 w-8" />
                        Email Automation
                    </h1>
                    <p className="text-muted-foreground">
                        Manage email templates and campaigns
                    </p>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
                        <Send className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalSent.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">All campaigns</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Avg Open Rate</CardTitle>
                        <Eye className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{avgOpenRate}%</div>
                        <p className="text-xs text-muted-foreground">Industry avg: 21%</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Avg Click Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{avgClickRate}%</div>
                        <p className="text-xs text-muted-foreground">Industry avg: 2.6%</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Active Templates</CardTitle>
                        <BarChart3 className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{templates.length}</div>
                        <p className="text-xs text-muted-foreground">Ready to use</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="campaigns" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
                    <TabsTrigger value="templates">Templates</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>

                {/* Campaigns Tab */}
                <TabsContent value="campaigns" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Email Campaigns</CardTitle>
                                <Button onClick={() => navigate('/admin/email/campaigns/new')}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Campaign
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-4 mb-6">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search campaigns..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-9"
                                        />
                                    </div>
                                </div>
                                <Select value={campaignStatusFilter} onValueChange={setCampaignStatusFilter}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="All Statuses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value=" ">All Statuses</SelectItem>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="scheduled">Scheduled</SelectItem>
                                        <SelectItem value="sending">Sending</SelectItem>
                                        <SelectItem value="sent">Sent</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Campaign Name</TableHead>
                                            <TableHead>Subject</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Sent</TableHead>
                                            <TableHead>Opens</TableHead>
                                            <TableHead>Clicks</TableHead>
                                            <TableHead>Created</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredCampaigns.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                    No campaigns found
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredCampaigns.map((campaign) => (
                                                <TableRow
                                                    key={campaign.id}
                                                    className="cursor-pointer hover:bg-muted/50"
                                                    onClick={() => navigate(`/admin/email/campaigns/${campaign.id}`)}
                                                >
                                                    <TableCell className="font-medium">{campaign.name}</TableCell>
                                                    <TableCell className="max-w-xs truncate">{campaign.subject}</TableCell>
                                                    <TableCell>
                                                        <Badge className={getStatusColor(campaign.status)}>
                                                            {campaign.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{campaign.sent_count.toLocaleString()}</TableCell>
                                                    <TableCell>
                                                        {campaign.open_count.toLocaleString()}
                                                        <span className="text-xs text-muted-foreground ml-1">
                                                            ({campaign.sent_count > 0 ?
                                                                ((campaign.open_count / campaign.sent_count) * 100).toFixed(1) : 0}%)
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        {campaign.click_count.toLocaleString()}
                                                        <span className="text-xs text-muted-foreground ml-1">
                                                            ({campaign.open_count > 0 ?
                                                                ((campaign.click_count / campaign.open_count) * 100).toFixed(1) : 0}%)
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {format(new Date(campaign.created_at), 'MMM d, yyyy')}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Templates Tab */}
                <TabsContent value="templates" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Email Templates</CardTitle>
                                <Button onClick={() => navigate('/admin/email/templates/new')}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Template
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-4 mb-6">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search templates..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-9"
                                        />
                                    </div>
                                </div>
                                <Select value={templateTypeFilter} onValueChange={setTemplateTypeFilter}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="All Types" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value=" ">All Types</SelectItem>
                                        <SelectItem value="transactional">Transactional</SelectItem>
                                        <SelectItem value="marketing">Marketing</SelectItem>
                                        <SelectItem value="onboarding">Onboarding</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredTemplates.length === 0 ? (
                                    <div className="col-span-full text-center py-12 text-muted-foreground">
                                        No templates found
                                    </div>
                                ) : (
                                    filteredTemplates.map((template) => (
                                        <Card
                                            key={template.id}
                                            className="cursor-pointer hover:border-primary transition-colors"
                                            onClick={() => navigate(`/admin/email/templates/${template.id}`)}
                                        >
                                            <CardHeader>
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold">{template.name}</h3>
                                                        <p className="text-sm text-muted-foreground truncate">
                                                            {template.subject}
                                                        </p>
                                                    </div>
                                                    <Badge className={getTypeColor(template.template_type)}>
                                                        {template.template_type}
                                                    </Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-xs text-muted-foreground">
                                                    Variables: {template.variables?.length || 0}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    Created {format(new Date(template.created_at), 'MMM d, yyyy')}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Analytics Tab */}
                <TabsContent value="analytics" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Campaign Performance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Campaign</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Sent</TableHead>
                                            <TableHead>Open Rate</TableHead>
                                            <TableHead>Click Rate</TableHead>
                                            <TableHead>CTR</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {analytics.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                    No analytics data available
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            analytics.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell className="font-medium">{item.name}</TableCell>
                                                    <TableCell>
                                                        <Badge className={getStatusColor(item.status)}>
                                                            {item.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{item.sent_count.toLocaleString()}</TableCell>
                                                    <TableCell>
                                                        <span className={item.open_rate > 25 ? 'text-green-600 font-semibold' : ''}>
                                                            {item.open_rate}%
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className={item.click_rate > 3 ? 'text-green-600 font-semibold' : ''}>
                                                            {item.click_rate}%
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className={item.click_through_rate > 2 ? 'text-green-600 font-semibold' : ''}>
                                                            {item.click_through_rate}%
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
