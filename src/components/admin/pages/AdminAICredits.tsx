import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Coins, TrendingUp, Users, DollarSign, Plus, Minus, Download, Search, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface CreditBalance {
    user_id: string;
    user_email: string;
    user_name: string;
    total_credits: number;
    used_credits: number;
    available_credits: number;
    auto_recharge_enabled: boolean;
    last_recharged_at: string | null;
}

interface UsageStats {
    total_users: number;
    total_credits_issued: number;
    total_credits_used: number;
    total_revenue: number;
    active_auto_recharge: number;
}

export function AdminAICredits() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<CreditBalance | null>(null);
    const [adjustmentAmount, setAdjustmentAmount] = useState('');
    const [adjustmentType, setAdjustmentType] = useState<'add' | 'deduct'>('add');
    const [adjustmentReason, setAdjustmentReason] = useState('');
    const [isAdjusting, setIsAdjusting] = useState(false);

    // Fetch usage stats
    const { data: stats } = useQuery({
        queryKey: ['admin-ai-credits-stats'],
        queryFn: async (): Promise<UsageStats> => {
            try {
                const [creditsRes, purchasesRes] = await Promise.all([
                    (supabase as any).from('ai_credits').select('total_credits, used_credits, auto_recharge_enabled'),
                    (supabase as any).from('ai_credit_purchases').select('amount_paid').eq('payment_status', 'completed'),
                ]);

                const credits = creditsRes.data || [];
                const purchases = purchasesRes.data || [];

                return {
                    total_users: credits.length,
                    total_credits_issued: credits.reduce((sum: number, c: any) => sum + (parseFloat(c.total_credits) || 0), 0),
                    total_credits_used: credits.reduce((sum: number, c: any) => sum + (parseFloat(c.used_credits) || 0), 0),
                    total_revenue: purchases.reduce((sum: number, p: any) => sum + (parseFloat(p.amount_paid) || 0), 0),
                    active_auto_recharge: credits.filter((c: any) => c.auto_recharge_enabled).length,
                };
            } catch {
                // Tables may not exist yet (pending migration)
                return { total_users: 0, total_credits_issued: 0, total_credits_used: 0, total_revenue: 0, active_auto_recharge: 0 };
            }
        },
        retry: false
    });

    // Fetch all user balances — joined with profiles for real name/email
    const { data: balances, refetch: refetchBalances } = useQuery({
        queryKey: ['admin-ai-credits-balances', searchTerm],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from('ai_credits')
                .select('*, profiles(full_name, email)')
                .order('available_credits', { ascending: false })
                .limit(100);

            if (error) return [] as CreditBalance[]; // Table may not exist

            return (data || [])
                .map((item: any) => ({
                    user_id: item.user_id,
                    user_email: item.profiles?.email || item.user_id,
                    user_name: item.profiles?.full_name || 'Unknown User',
                    total_credits: parseFloat(item.total_credits),
                    used_credits: parseFloat(item.used_credits),
                    available_credits: parseFloat(item.available_credits),
                    auto_recharge_enabled: item.auto_recharge_enabled,
                    last_recharged_at: item.last_recharged_at,
                }))
                .filter((b: CreditBalance) =>
                    !searchTerm ||
                    b.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    b.user_email.toLowerCase().includes(searchTerm.toLowerCase())
                ) as CreditBalance[];
        },
        retry: false
    });

    // Fetch recent transactions (purchases + manual adjustments)
    const { data: recentTransactions, refetch: refetchTransactions } = useQuery({
        queryKey: ['admin-ai-credits-transactions'],
        queryFn: async () => {
            try {
                const [purchasesRes, adjustmentsRes] = await Promise.all([
                    (supabase as any)
                        .from('ai_credit_purchases')
                        .select('*, profiles(full_name, email)')
                        .order('purchased_at', { ascending: false })
                        .limit(15),
                    (supabase as any)
                        .from('ai_credit_adjustments')
                        .select('*, profiles(full_name, email)')
                        .order('created_at', { ascending: false })
                        .limit(15),
                ]);

                const purchases = (purchasesRes.data || []).map((p: any) => ({
                    id: p.id,
                    type: 'purchase' as const,
                    user_name: p.profiles?.full_name || p.user_id,
                    user_email: p.profiles?.email || p.user_id,
                    amount: parseFloat(p.credits_purchased),
                    amount_paid: parseFloat(p.amount_paid),
                    status: p.payment_status,
                    date: p.purchased_at,
                }));

                const adjustments = (adjustmentsRes.data || []).map((a: any) => ({
                    id: a.id,
                    type: 'adjustment' as const,
                    user_name: a.profiles?.full_name || a.user_id,
                    user_email: a.profiles?.email || a.user_id,
                    amount: parseFloat(a.amount),
                    amount_paid: null,
                    status: a.amount > 0 ? 'credited' : 'deducted',
                    date: a.created_at,
                    reason: a.reason,
                }));

                return [...purchases, ...adjustments]
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 20);
            } catch {
                return []; // Tables may not exist
            }
        },
        retry: false
    });

    const handleAdjustCredits = async () => {
        if (!selectedUser || !adjustmentAmount || !adjustmentReason) {
            toast.error('Please fill in all fields');
            return;
        }

        const amount = parseFloat(adjustmentAmount);
        if (isNaN(amount) || amount <= 0) {
            toast.error('Please enter a valid positive amount');
            return;
        }

        setIsAdjusting(true);
        try {
            if (adjustmentType === 'add') {
                // Add credits via direct DB update
                const { error } = await (supabase as any).rpc('add_ai_credits', {
                    p_tenant_id: null, // admin bypass — will be resolved in RPC
                    p_user_id: selectedUser.user_id,
                    p_credits: amount,
                });
                // Fallback: direct UPDATE if RPC fails
                if (error) {
                    const { error: updateError } = await (supabase as any)
                        .from('ai_credits')
                        .update({
                            total_credits: selectedUser.total_credits + amount,
                            available_credits: selectedUser.available_credits + amount,
                        })
                        .eq('user_id', selectedUser.user_id);
                    if (updateError) throw updateError;
                }
                toast.success(`Added ${amount} credits to ${selectedUser.user_name}`);
            } else {
                // Deduct credits — admin-level direct DB deduction
                if (amount > selectedUser.available_credits) {
                    toast.error(`Cannot deduct ${amount} credits — user only has ${selectedUser.available_credits} available`);
                    return;
                }
                const { error: updateError } = await (supabase as any)
                    .from('ai_credits')
                    .update({
                        used_credits: selectedUser.used_credits + amount,
                        available_credits: selectedUser.available_credits - amount,
                    })
                    .eq('user_id', selectedUser.user_id);
                if (updateError) throw updateError;
                toast.success(`Deducted ${amount} credits from ${selectedUser.user_name}`);
            }

            // Log the adjustment
            await (supabase as any).from('ai_credit_adjustments').insert({
                user_id: selectedUser.user_id,
                amount: adjustmentType === 'add' ? amount : -amount,
                reason: adjustmentReason,
                adjusted_by: 'admin',
            });

            setSelectedUser(null);
            setAdjustmentAmount('');
            setAdjustmentReason('');
            queryClient.invalidateQueries({ queryKey: ['admin-ai-credits-stats'] });
            queryClient.invalidateQueries({ queryKey: ['admin-ai-credits-balances'] });
            queryClient.invalidateQueries({ queryKey: ['admin-ai-credits-transactions'] });
        } catch (error: any) {
            toast.error(`Failed to adjust credits: ${error.message}`);
        } finally {
            setIsAdjusting(false);
        }
    };

    const exportData = () => {
        if (!balances) return;
        const csv = [
            ['User Name', 'User Email', 'Total Credits', 'Used Credits', 'Available Credits', 'Auto-Recharge', 'Last Recharged'],
            ...balances.map(b => [
                b.user_name, b.user_email, b.total_credits, b.used_credits, b.available_credits,
                b.auto_recharge_enabled ? 'Yes' : 'No',
                b.last_recharged_at ? format(new Date(b.last_recharged_at), 'yyyy-MM-dd') : 'Never'
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-credits-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">AI Credits Management</h1>
                    <p className="text-muted-foreground">Monitor and manage user AI credit balances</p>
                </div>
                <Button onClick={exportData} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{stats?.total_users || 0}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Credits Issued</CardTitle>
                        <Coins className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{stats?.total_credits_issued?.toLocaleString() || 0}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Credits Used</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{stats?.total_credits_used?.toLocaleString() || 0}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ${stats?.total_revenue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="balances" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="balances">User Balances</TabsTrigger>
                    <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
                </TabsList>

                <TabsContent value="balances" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>User Credit Balances</CardTitle>
                            <CardDescription>View and manage individual user credit balances</CardDescription>
                            <div className="flex items-center gap-2 mt-4">
                                <Search className="h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name or email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="max-w-sm"
                                />
                                <Button variant="ghost" size="icon" onClick={() => refetchBalances()}>
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                        <TableHead className="text-right">Used</TableHead>
                                        <TableHead className="text-right">Available</TableHead>
                                        <TableHead>Auto-Recharge</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {balances?.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                                No users found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {balances?.map((balance) => (
                                        <TableRow key={balance.user_id}>
                                            <TableCell>
                                                <div className="font-medium">{balance.user_name}</div>
                                                <div className="text-xs text-muted-foreground">{balance.user_email}</div>
                                            </TableCell>
                                            <TableCell className="text-right">{balance.total_credits.toLocaleString()}</TableCell>
                                            <TableCell className="text-right">{balance.used_credits.toLocaleString()}</TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant={balance.available_credits < 10 ? 'destructive' : 'default'}>
                                                    {balance.available_credits.toLocaleString()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {balance.auto_recharge_enabled
                                                    ? <Badge variant="outline">Enabled</Badge>
                                                    : <span className="text-muted-foreground text-sm">Disabled</span>
                                                }
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" onClick={() => setSelectedUser(balance)}>
                                                    Adjust
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="transactions">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Recent Transactions</CardTitle>
                                <CardDescription>Purchases and manual credit adjustments</CardDescription>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => refetchTransactions()}>
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {!recentTransactions?.length ? (
                                <p className="text-muted-foreground text-sm text-center py-8">No transactions yet</p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead className="text-right">Credits</TableHead>
                                            <TableHead className="text-right">Amount Paid</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Date</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recentTransactions.map((tx) => (
                                            <TableRow key={tx.id}>
                                                <TableCell>
                                                    <div className="font-medium text-sm">{tx.user_name}</div>
                                                    <div className="text-xs text-muted-foreground">{tx.user_email}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={tx.type === 'purchase' ? 'secondary' : 'outline'}>
                                                        {tx.type === 'purchase' ? 'Purchase' : 'Admin Adj.'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <span className={tx.amount >= 0 ? 'text-green-500' : 'text-red-500'}>
                                                        {tx.amount >= 0 ? '+' : ''}{tx.amount.toLocaleString()}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {tx.amount_paid != null ? `$${tx.amount_paid.toFixed(2)}` : '—'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={
                                                        tx.status === 'completed' || tx.status === 'credited' ? 'default' :
                                                            tx.status === 'failed' ? 'destructive' : 'secondary'
                                                    }>
                                                        {tx.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {format(new Date(tx.date), 'MMM d, yyyy HH:mm')}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Credit Adjustment Dialog */}
            <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Adjust Credits — {selectedUser?.user_name}</DialogTitle>
                        <DialogDescription>
                            Current balance: <strong>{selectedUser?.available_credits?.toLocaleString()}</strong> available credits
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Adjustment Type</Label>
                            <Select value={adjustmentType} onValueChange={(v) => setAdjustmentType(v as 'add' | 'deduct')}>
                                <SelectTrigger id="adjustment-type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="add"><Plus className="inline h-3 w-3 mr-1" />Add Credits</SelectItem>
                                    <SelectItem value="deduct"><Minus className="inline h-3 w-3 mr-1" />Deduct Credits</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount</Label>
                            <Input
                                id="amount"
                                type="number"
                                min="1"
                                placeholder="e.g. 100"
                                value={adjustmentAmount}
                                onChange={(e) => setAdjustmentAmount(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="reason">Reason (required for audit log)</Label>
                            <Input
                                id="reason"
                                placeholder="e.g. Compensation for service outage"
                                value={adjustmentReason}
                                onChange={(e) => setAdjustmentReason(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedUser(null)}>Cancel</Button>
                        <Button onClick={handleAdjustCredits} disabled={isAdjusting}>
                            {isAdjusting ? 'Processing...' : `${adjustmentType === 'add' ? 'Add' : 'Deduct'} Credits`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}