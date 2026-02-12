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
import { useSubscriptions, useSubscriptionMetrics, useUpdateSubscription, useCancelSubscription, type SubscriptionTier } from '@/hooks/useSubscriptions';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Mock data removed - now using live subscriptions from database

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

    // Fetch live data
    const { data: subscribers = [], isLoading } = useSubscriptions();
    const { data: metrics } = useSubscriptionMetrics();
    const updateSubscription = useUpdateSubscription();
    const cancelSubscription = useCancelSubscription();

    // Dialog states
    const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
    const [showHistory, setShowHistory] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [tierToChange, setTierToChange] = useState<SubscriptionTier | ''>('');

    // Calculate metrics from live data
    const activeSubscribers = subscribers.filter(s => s.status === 'active');
    const totalProUsers = activeSubscribers.length;
    const monthlyRevenue = metrics?.total_mrr || 0;
    const avgArticles = activeSubscribers.length > 0
        ? Math.round(
            activeSubscribers.reduce((sum, s) => sum + (s.usage_stats?.articles_per_month || 0), 0) / activeSubscribers.length
        )
        : 0;
    const activeUsers7d = Math.floor(totalProUsers * 0.75); // Placeholder calculation

    // Filter subscribers
    const filteredSubscribers = subscribers.filter(sub => {
        const matchesSearch =
            (sub.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
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
        <>
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
                                        <TableCell className="font-medium">{(subscriber as any).full_name || (subscriber as any).email}</TableCell>
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
                                            {(subscriber as any).usage_stats?.articles_per_month || 0}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date((subscriber as any).joined_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Select
                                                    value={subscriber.tier}
                                                    onValueChange={(newTier: SubscriptionTier) => {
                                                        updateSubscription.mutate({
                                                            id: subscriber.id,
                                                            tier: newTier,
                                                            mrr: newTier === 'free' ? 0 : newTier === 'pro' ? 10 : newTier === 'business' ? 39 : 99
                                                        });
                                                    }}
                                                >
                                                    <SelectTrigger className="w-[110px] h-8">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="free">Free</SelectItem>
                                                        <SelectItem value="pro">Pro</SelectItem>
                                                        <SelectItem value="business">Business</SelectItem>
                                                        <SelectItem value="agency">Agency</SelectItem>
                                                    </SelectContent>
                                                </Select>

                                                {subscriber.status === 'active' ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedSubscription(subscriber);
                                                            setShowCancelDialog(true);
                                                        }}
                                                    >
                                                        Cancel
                                                    </Button>
                                                ) : subscriber.status === 'cancelled' ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            updateSubscription.mutate({
                                                                id: subscriber.id,
                                                                status: 'active',
                                                                cancelled_at: null
                                                            } as any);
                                                        }}
                                                    >
                                                        Reactivate
                                                    </Button>
                                                ) : null}

                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedSubscription(subscriber);
                                                        setShowHistory(true);
                                                    }}
                                                >
                                                    History
                                                </Button>
                                            </div>
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

            {/* Subscription History Dialog */}
            <Dialog open={showHistory} onOpenChange={setShowHistory}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Subscription History</DialogTitle>
                        <DialogDescription>
                            {selectedSubscription?.full_name || selectedSubscription?.email}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Current Tier</p>
                                <p className="font-medium capitalize">{selectedSubscription?.tier}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Status</p>
                                <p className="font-medium capitalize">{selectedSubscription?.status}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">MRR</p>
                                <p className="font-medium">${selectedSubscription?.mrr}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Joined</p>
                                <p className="font-medium">
                                    {selectedSubscription?.joined_at && new Date(selectedSubscription.joined_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        {selectedSubscription?.trial_ends_at && (
                            <div className="p-3 bg-muted rounded-md">
                                <p className="text-sm">
                                    Trial ends: {new Date(selectedSubscription.trial_ends_at).toLocaleDateString()}
                                </p>
                            </div>
                        )}
                        {selectedSubscription?.cancelled_at && (
                            <div className="p-3 bg-destructive/10 rounded-md">
                                <p className="text-sm">
                                    Cancelled: {new Date(selectedSubscription.cancelled_at).toLocaleDateString()}
                                </p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Cancel Confirmation Dialog */}
            <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to cancel {selectedSubscription?.full_name || selectedSubscription?.email}'s subscription?
                            This action can be reversed by reactivating the subscription.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Keep Active</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (selectedSubscription) {
                                    cancelSubscription.mutate(selectedSubscription.id);
                                    setShowCancelDialog(false);
                                }
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Cancel Subscription
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
