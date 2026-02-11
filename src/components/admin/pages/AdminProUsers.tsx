/**
 * Pro Users Management Page
 * Subscription management matching the screenshot design
 */

import React, { useState } from 'react';
import { MetricCard } from '../components/MetricCard';
import { UserTierCard } from '../components/UserTierCard';
import {
    Card,
    CardContent,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Crown,
    Building2,
    Briefcase,
    RefreshCw,
    Download,
    Search,
    Filter,
    TrendingUp,
    DollarSign,
    Users,
    FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock data - replace with API calls
const mockSubscribers = [
    {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        tier: 'pro',
        status: 'active',
        mrr: 10,
        joinDate: '2024-01-15',
        articlesPerMonth: 12,
    },
    {
        id: '2',
        name: 'Sarah Smith',
        email: 'sarah@company.com',
        tier: 'business',
        status: 'active',
        mrr: 39,
        joinDate: '2024-02-01',
        articlesPerMonth: 35,
    },
    {
        id: '3',
        name: 'Mike Agency',
        email: 'mike@agency.com',
        tier: 'agency',
        status: 'active',
        mrr: 99,
        joinDate: '2024-01-20',
        articlesPerMonth: 95,
    },
    {
        id: '4',
        name: 'Emma Wilson',
        email: 'emma@example.com',
        tier: 'pro',
        status: 'cancelled',
        mrr: 0,
        joinDate: '2023-12-10',
        articlesPerMonth: 0,
    },
];

const tierColors: Record<string, string> = {
    pro: 'bg-green-500/20 text-green-400 border-green-500/30',
    business: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    agency: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

const statusColors: Record<string, string> = {
    active: 'bg-success/20 text-success border-success/30',
    cancelled: 'bg-muted text-muted-foreground border-border',
    past_due: 'bg-warning/20 text-warning border-warning/30',
};

export function AdminProUsers() {
    const [searchQuery, setSearchQuery] = useState('');
    const [tierFilter, setTierFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Calculate metrics
    const activeSubscribers = mockSubscribers.filter(s => s.status === 'active');
    const totalProUsers = activeSubscribers.length;
    const monthlyRevenue = activeSubscribers.reduce((sum, s) => sum + s.mrr, 0);
    const avgArticles = Math.round(
        activeSubscribers.reduce((sum, s) => sum + s.articlesPerMonth, 0) / activeSubscribers.length
    );
    const activeUsers7d = Math.floor(totalProUsers * 0.75); // Mock calculation

    // Filter subscribers
    const filteredSubscribers = mockSubscribers.filter(sub => {
        const matchesSearch =
            sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sub.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTier = tierFilter === 'all' || sub.tier === tierFilter;
        const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
        return matchesSearch && matchesTier && matchesStatus;
    });

    // Count by tier
    const proCount = activeSubscribers.filter(s => s.tier === 'pro').length;
    const businessCount = activeSubscribers.filter(s => s.tier === 'business').length;
    const agencyCount = activeSubscribers.filter(s => s.tier === 'agency').length;

    const handleExport = () => {
        // TODO: Implement CSV export
        console.log('Exporting to CSV...');
    };

    const handleStripeSync = () => {
        // TODO: Implement Stripe sync
        console.log('Syncing with Stripe...');
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Crown className="h-8 w-8 text-primary" />
                        Pro Users
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Track and manage all paid subscribers
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleStripeSync}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Sync Stripe
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExport}>
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                    </Button>
                </div>
            </div>

            {/* Top Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Total Pro Users"
                    value={totalProUsers}
                    subtitle="All active subscriptions"
                    icon={Users}
                />
                <MetricCard
                    title="Monthly Revenue"
                    value={`$${monthlyRevenue}`}
                    subtitle="MRR from subscriptions"
                    icon={DollarSign}
                />
                <MetricCard
                    title="Avg Articles/User"
                    value={avgArticles}
                    subtitle="Monthly usage average"
                    icon={FileText}
                />
                <MetricCard
                    title="Active (7 days)"
                    value={activeUsers7d}
                    subtitle={`${Math.round((activeUsers7d / totalProUsers) * 100)}% of total`}
                    icon={TrendingUp}
                />
            </div>

            {/* User Tier Breakdown */}
            <div>
                <h2 className="text-lg font-semibold mb-4">Subscription Tiers</h2>
                <div className="grid gap-4 md:grid-cols-3">
                    <UserTierCard
                        tierName="Pro Users"
                        price="$10/mo"
                        userCount={proCount}
                        color="green"
                        trend={{ value: 12, isPositive: true }}
                        icon={<Crown className="h-6 w-6 text-green-500" />}
                    />
                    <UserTierCard
                        tierName="Business Users"
                        price="$39/mo"
                        userCount={businessCount}
                        color="blue"
                        trend={{ value: 8, isPositive: true }}
                        icon={<Briefcase className="h-6 w-6 text-blue-500" />}
                    />
                    <UserTierCard
                        tierName="Agency Users"
                        price="$99/mo"
                        userCount={agencyCount}
                        color="purple"
                        trend={{ value: 5, isPositive: true }}
                        icon={<Building2 className="h-6 w-6 text-purple-500" />}
                    />
                </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by email or name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Filter className="h-4 w-4 mr-2" />
                                All Tiers
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Filter by Tier</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {['all', 'pro', 'business', 'agency'].map((tier) => (
                                <DropdownMenuCheckboxItem
                                    key={tier}
                                    checked={tierFilter === tier}
                                    onCheckedChange={() => setTierFilter(tier)}
                                    className="capitalize"
                                >
                                    {tier === 'all' ? 'All Tiers' : tier}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Filter className="h-4 w-4 mr-2" />
                                All Status
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {['all', 'active', 'cancelled', 'past_due'].map((status) => (
                                <DropdownMenuCheckboxItem
                                    key={status}
                                    checked={statusFilter === status}
                                    onCheckedChange={() => setStatusFilter(status)}
                                    className="capitalize"
                                >
                                    {status === 'all' ? 'All Status' : status.replace('_', ' ')}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <TrendingUp className="h-4 w-4 mr-2" />
                                Subscription
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Subscription Type</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem>Monthly</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem>Annual</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem>Lifetime</DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* User Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Tier</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">MRR</TableHead>
                                <TableHead>Articles/mo</TableHead>
                                <TableHead>Join Date</TableHead>
                                <TableHead className="w-[80px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredSubscribers.map((subscriber) => (
                                <TableRow key={subscriber.id}>
                                    <TableCell className="font-medium">{subscriber.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{subscriber.email}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={cn('capitalize', tierColors[subscriber.tier])}
                                        >
                                            {subscriber.tier}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={cn('capitalize', statusColors[subscriber.status])}
                                        >
                                            {subscriber.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        ${subscriber.mrr}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {subscriber.articlesPerMonth}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {new Date(subscriber.joinDate).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="sm">
                                            View
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredSubscribers.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                        No subscribers found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
