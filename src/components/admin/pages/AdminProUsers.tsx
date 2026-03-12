/**
 * Pro Users Management Page
 */

import React, { useState } from 'react';
import { MetricCard } from '../components/MetricCard';
import { UserTierCard } from '../components/UserTierCard';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Crown, Building2, Briefcase, RefreshCw, Download, Search, Filter, TrendingUp, DollarSign, Users, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSubscriptions, useSubscriptionMetrics, useUpdateSubscription, useCancelSubscription, type SubscriptionTier } from '@/hooks/useSubscriptions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

    const { data: subscribers = [], isLoading, refetch } = useSubscriptions();
    const { data: metrics } = useSubscriptionMetrics();
    const updateSubscription = useUpdateSubscription();
    const cancelSubscription = useCancelSubscription();

    const activeSubscribers = subscribers.filter(s => s.status === 'active');
    const totalProUsers = activeSubscribers.length;
    const monthlyRevenue = metrics?.total_mrr || 0;
    const activeUsers7d = subscribers.filter(s => {
        if (!s.status || s.status !== 'active') return false;
        // Use updated_at as a proxy for recent activity if available, otherwise created_at
        const lastSeen = (s as any).updated_at || (s as any).last_sign_in_at || s.created_at;
        if (!lastSeen) return false;
        const sevenDaysAgo = new Date(Date.now() - 7 * 86400_000);
        return new Date(lastSeen) >= sevenDaysAgo;
    }).length;

    const filteredSubscribers = subscribers.filter(sub => {
        const matchesSearch =
            (sub.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            sub.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTier = tierFilter === 'all' || sub.tier === tierFilter;
        const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
        return matchesSearch && matchesTier && matchesStatus;
    });

    const proCount = activeSubscribers.filter(s => s.tier === 'pro').length;
    const businessCount = activeSubscribers.filter(s => s.tier === 'business').length;
    const agencyCount = activeSubscribers.filter(s => s.tier === 'agency').length;

    const handleExport = () => {
        const headers = ['Email', 'Tier', 'Status', 'MRR', 'Created At'];
        const rows = filteredSubscribers.map(sub => [sub.email || 'N/A', sub.tier || 'N/A', sub.status || 'N/A', `$${sub.mrr || 0}`, sub.created_at ? new Date(sub.created_at).toLocaleDateString() : 'N/A']);
        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `pro-users-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleStripeSync = async () => {
        try {
            toast.loading('Syncing with Stripe...');
            const { data, error } = await supabase.functions.invoke('stripe-sync', {
                body: { action: 'sync_subscriptions' }
            });
            if (error) throw error;
            toast.dismiss();
            toast.success(`Synced ${(data as any)?.synced_count || 0} subscriptions from Stripe`);
            refetch();
        } catch (error: any) {
            toast.dismiss();
            console.error('Stripe sync error:', error);
            toast.error(`Failed to sync with Stripe: ${error.message || 'Unknown error'}`);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Crown className="h-8 w-8 text-primary" />
                        Pro Users
                    </h1>
                    <p className="text-muted-foreground mt-1">Track and manage all paid subscribers</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleStripeSync}>
                        <RefreshCw className="h-4 w-4 mr-2" />Sync Stripe
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExport}>
                        <Download className="h-4 w-4 mr-2" />Export CSV
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard title="Total Pro Users" value={totalProUsers} subtitle="All active subscriptions" icon={Users} />
                <MetricCard title="Monthly Revenue" value={`$${monthlyRevenue}`} subtitle="MRR from subscriptions" icon={DollarSign} />
                <MetricCard title="Avg Articles/User" value={0} subtitle="Monthly usage average" icon={FileText} />
                <MetricCard title="Active (7 days)" value={activeUsers7d} subtitle={`${totalProUsers > 0 ? Math.round((activeUsers7d / totalProUsers) * 100) : 0}% of total`} icon={TrendingUp} />
            </div>

            <div>
                <h2 className="text-lg font-semibold mb-4">Subscription Tiers</h2>
                <div className="grid gap-4 md:grid-cols-3">
                    <UserTierCard tierName="Pro Users" price="$10/mo" userCount={proCount} color="green" icon={<Crown className="h-6 w-6 text-green-500" />} />
                    <UserTierCard tierName="Business Users" price="$39/mo" userCount={businessCount} color="blue" icon={<Briefcase className="h-6 w-6 text-blue-500" />} />
                    <UserTierCard tierName="Agency Users" price="$99/mo" userCount={agencyCount} color="purple" icon={<Building2 className="h-6 w-6 text-purple-500" />} />
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search by email or name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
                </div>
            </div>

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
                                <TableHead>Join Date</TableHead>
                                <TableHead className="w-[80px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredSubscribers.map((subscriber) => (
                                <TableRow key={subscriber.id}>
                                    <TableCell className="font-medium">{(subscriber as any).full_name || subscriber.email}</TableCell>
                                    <TableCell className="text-muted-foreground">{subscriber.email}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn('capitalize', tierColors[subscriber.tier])}>{subscriber.tier}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn('capitalize', statusColors[subscriber.status])}>{subscriber.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">${subscriber.mrr}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {new Date((subscriber as any).joined_at || subscriber.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <Select
                                            value={subscriber.tier}
                                            onValueChange={(newTier: SubscriptionTier) => {
                                                updateSubscription.mutate({ id: subscriber.id, tier: newTier });
                                            }}
                                        >
                                            <SelectTrigger className="w-24 h-8"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pro">Pro</SelectItem>
                                                <SelectItem value="business">Business</SelectItem>
                                                <SelectItem value="agency">Agency</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}