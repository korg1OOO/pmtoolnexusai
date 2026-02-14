import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Coins, TrendingUp, Users, DollarSign, Plus, Minus, RefreshCw, Download, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { aiCreditsService } from '@/services/aiCreditsService';

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
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<CreditBalance | null>(null);
    const [adjustmentAmount, setAdjustmentAmount] = useState('');
    const [adjustmentType, setAdjustmentType] = useState<'add' | 'deduct'>('add');
    const [adjustmentReason, setAdjustmentReason] = useState('');

    // Fetch usage stats
    const { data: stats } = useQuery({
        queryKey: ['admin-ai-credits-stats'],
        queryFn: async (): Promise<UsageStats> => {
            const { data, error } = await (supabase as any)
                .from('ai_credits')
                .select('*');
            
            if (error) throw error;
            const credits = data || [];
            return {
                total_users: credits.length,
                total_credits_issued: credits.reduce((sum: number, c: any) => sum + (parseFloat(c.total_credits) || 0), 0),
                total_credits_used: credits.reduce((sum: number, c: any) => sum + (parseFloat(c.used_credits) || 0), 0),
                total_revenue: 0,
                active_auto_recharge: credits.filter((c: any) => c.auto_recharge_enabled).length,
            };
        }
    });

    // Fetch all user balances
    const { data: balances, refetch: refetchBalances } = useQuery({
        queryKey: ['admin-ai-credits-balances', searchTerm],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from('ai_credits')
                .select('*')
                .order('available_credits', { ascending: false })
                .limit(100);

            if (error) throw error;

            return (data || []).map((item: any) => ({
                user_id: item.user_id,
                user_email: item.user_id || 'Unknown',
                user_name: 'User',
                total_credits: parseFloat(item.total_credits),
                used_credits: parseFloat(item.used_credits),
                available_credits: parseFloat(item.available_credits),
                auto_recharge_enabled: item.auto_recharge_enabled,
                last_recharged_at: item.last_recharged_at
            })) as CreditBalance[];
        }
    });

    // Fetch recent transactions
    const { data: recentTransactions } = useQuery({
        queryKey: ['admin-ai-credits-transactions'],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from('ai_credit_purchases')
                .select('*')
                .order('purchased_at', { ascending: false })
                .limit(20);

            if (error) throw error;
            return data || [];
        }
    });

    const handleAdjustCredits = async () => {
        if (!selectedUser || !adjustmentAmount || !adjustmentReason) {
            toast.error('Please fill in all fields');
            return;
        }

        try {
            const amount = parseFloat(adjustmentAmount);

            if (adjustmentType === 'add') {
                await aiCreditsService.addCredits(selectedUser.user_id, selectedUser.user_id, amount);
                toast.success(`Added ${amount} credits`);
            } else {
                toast.info('Credit deduction not yet implemented');
            }

            await (supabase as any).from('ai_credit_adjustments').insert({
                user_id: selectedUser.user_id,
                amount: adjustmentType === 'add' ? amount : -amount,
                reason: adjustmentReason,
                adjusted_by: 'admin'
            });

            setSelectedUser(null);
            setAdjustmentAmount('');
            setAdjustmentReason('');
            refetchBalances();
        } catch (error: any) {
            toast.error(`Failed to adjust credits: ${error.message}`);
        }
    };

    const exportData = () => {
        if (!balances) return;
        const csv = [
            ['User Email', 'User Name', 'Total Credits', 'Used Credits', 'Available Credits', 'Auto-Recharge', 'Last Recharged'],
            ...balances.map(b => [b.user_email, b.user_name, b.total_credits, b.used_credits, b.available_credits, b.auto_recharge_enabled ? 'Yes' : 'No', b.last_recharged_at || 'Never'])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-credits-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
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
                    <CardContent><div className="text-2xl font-bold">${stats?.total_revenue?.toLocaleString() || 0}</div></CardContent>
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
                                <Input placeholder="Search by email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm" />
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
                                    {balances?.map((balance) => (
                                        <TableRow key={balance.user_id}>
                                            <TableCell><div className="font-medium">{balance.user_name}</div></TableCell>
                                            <TableCell className="text-right">{balance.total_credits.toLocaleString()}</TableCell>
                                            <TableCell className="text-right">{balance.used_credits.toLocaleString()}</TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant={balance.available_credits < 10 ? 'destructive' : 'default'}>{balance.available_credits.toLocaleString()}</Badge>
                                            </TableCell>
                                            <TableCell>{balance.auto_recharge_enabled ? <Badge variant="outline">Enabled</Badge> : <span className="text-muted-foreground">Disabled</span>}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" onClick={() => setSelectedUser(balance)}>Adjust</Button>
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
                        <CardHeader>
                            <CardTitle>Recent Transactions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">No recent transactions</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}