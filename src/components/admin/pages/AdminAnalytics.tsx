/**
 * Admin Analytics Dashboard
 * MRR trends, churn analysis, discount performance, license usage
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Users, Percent, Key, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';

export function AdminAnalytics() {
    const [dateRange, setDateRange] = useState('30d');

    // Fetch MRR trends
    const { data: mrrData } = useQuery({
        queryKey: ['analytics-mrr', dateRange],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('analytics_mrr_daily')
                .select('*')
                .order('date', { ascending: true })
                .limit(30);

            if (error) throw error;
            return data || [];
        },
    });

    // Fetch churn analysis
    const { data: churnData } = useQuery({
        queryKey: ['analytics-churn'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('analytics_churn')
                .select('*')
                .order('month', { ascending: true })
                .limit(12);

            if (error) throw error;
            return data || [];
        },
    });

    // Fetch discount performance
    const { data: discountData } = useQuery({
        queryKey: ['analytics-discount'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('analytics_discount_performance')
                .select('*')
                .limit(10);

            if (error) throw error;
            return data || [];
        },
    });

    // Fetch license usage
    const { data: licenseData } = useQuery({
        queryKey: ['analytics-license'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('analytics_license_usage')
                .select('*');

            if (error) throw error;
            return data || [];
        },
    });

    // Calculate summary metrics
    const totalMRR = mrrData?.reduce((sum, day) => sum + (day.total_mrr || 0), 0) || 0;
    const avgDailyMRR = totalMRR / (mrrData?.length || 1);
    const totalChurn = churnData?.reduce((sum, month) => sum + (month.churned_count || 0), 0) || 0;
    const totalDiscountGiven = discountData?.reduce((sum, code) => sum + (code.total_discount_given || 0), 0) || 0;
    const totalLicenses = licenseData?.reduce((sum, type) => sum + (type.total_keys || 0), 0) || 0;

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <TrendingUp className="h-8 w-8 text-primary" />
                    Analytics Dashboard
                </h1>
                <p className="text-muted-foreground mt-1">
                    Revenue trends, churn analysis, and performance metrics
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total MRR</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-8 w-8 text-success" />
                            <div>
                                <div className="text-3xl font-bold">${totalMRR.toFixed(2)}</div>
                                <p className="text-xs text-muted-foreground">
                                    ${avgDailyMRR.toFixed(2)}/day avg
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Churn Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Users className="h-8 w-8 text-warning" />
                            <div>
                                <div className="text-3xl font-bold">{totalChurn}</div>
                                <p className="text-xs text-muted-foreground">
                                    Last 12 months
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Discounts Given</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Percent className="h-8 w-8 text-primary" />
                            <div>
                                <div className="text-3xl font-bold">${totalDiscountGiven.toFixed(2)}</div>
                                <p className="text-xs text-muted-foreground">
                                    Total savings provided
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">License Keys</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Key className="h-8 w-8 text-info" />
                            <div>
                                <div className="text-3xl font-bold">{totalLicenses}</div>
                                <p className="text-xs text-muted-foreground">
                                    Total generated
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Analytics Tabs */}
            <Tabs defaultValue="mrr" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="mrr">MRR Trends</TabsTrigger>
                    <TabsTrigger value="churn">Churn Analysis</TabsTrigger>
                    <TabsTrigger value="discounts">Discount Performance</TabsTrigger>
                    <TabsTrigger value="licenses">License Usage</TabsTrigger>
                </TabsList>

                {/* MRR Trends Tab */}
                <TabsContent value="mrr" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Monthly Recurring Revenue</CardTitle>
                            <CardDescription>Daily MRR trends over the last 30 days</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={350}>
                                <AreaChart data={mrrData}>
                                    <defs>
                                        <linearGradient id="colorMRR" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Area
                                        type="monotone"
                                        dataKey="total_mrr"
                                        stroke="#8b5cf6"
                                        fillOpacity={1}
                                        fill="url(#colorMRR)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Churn Analysis Tab */}
                <TabsContent value="churn" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Churn Analysis</CardTitle>
                            <CardDescription>Monthly churn trends and average lifetime</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={churnData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="churned_count" fill="#ef4444" name="Churned Users" />
                                    <Bar dataKey="avg_lifetime_days" fill="#3b82f6" name="Avg Lifetime (days)" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Discount Performance Tab */}
                <TabsContent value="discounts" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Discount Code Performance</CardTitle>
                            <CardDescription>Top performing discount codes</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Code</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Value</TableHead>
                                        <TableHead>Redemptions</TableHead>
                                        <TableHead>Discount Given</TableHead>
                                        <TableHead>Revenue</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {discountData?.map((code) => (
                                        <TableRow key={code.code}>
                                            <TableCell className="font-mono font-bold">{code.code}</TableCell>
                                            <TableCell className="capitalize">{code.discount_type}</TableCell>
                                            <TableCell>
                                                {code.discount_type === 'percentage' ? `${code.discount_value}%` : `$${code.discount_value}`}
                                            </TableCell>
                                            <TableCell>
                                                {code.redemptions}/{code.max_uses || '∞'}
                                            </TableCell>
                                            <TableCell className="text-destructive">
                                                -${code.total_discount_given?.toFixed(2) || '0.00'}
                                            </TableCell>
                                            <TableCell className="text-success font-semibold">
                                                ${code.total_revenue?.toFixed(2) || '0.00'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* License Usage Tab */}
                <TabsContent value="licenses" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>License Key Usage Statistics</CardTitle>
                            <CardDescription>License key metrics by type</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Total Keys</TableHead>
                                        <TableHead>Active</TableHead>
                                        <TableHead>Redeemed</TableHead>
                                        <TableHead>Total Activations</TableHead>
                                        <TableHead>Avg Activations/Key</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {licenseData?.map((type) => (
                                        <TableRow key={type.license_type}>
                                            <TableCell className="capitalize font-semibold">
                                                <Badge variant="outline">{type.license_type}</Badge>
                                            </TableCell>
                                            <TableCell>{type.total_keys}</TableCell>
                                            <TableCell className="text-success">{type.active_keys}</TableCell>
                                            <TableCell>{type.redeemed_keys}</TableCell>
                                            <TableCell>{type.total_activations}</TableCell>
                                            <TableCell>{type.avg_activations_per_key?.toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
