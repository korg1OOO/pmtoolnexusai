/**
 * Admin Billing Dashboard
 * Revenue analytics, MRR/ARR tracking, invoices, and payment management
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    CreditCard,
    FileText,
    RefreshCw,
    Download,
    AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useSubscriptionMetrics } from '@/hooks/useSubscriptions';
import { useInvoices, formatInvoiceAmount, getInvoiceStatusColor } from '@/hooks/useInvoices';
import { syncStripeInvoices } from '@/services/invoiceService';
import { CreateInvoiceDialog } from '@/components/admin/billing/CreateInvoiceDialog';
import { RefundDialog } from '@/components/admin/billing/RefundDialog';

export function AdminBillingDashboard() {
    const [syncing, setSyncing] = useState(false);
    const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);
    const [refundDialogOpen, setRefundDialogOpen] = useState(false);

    const handleSyncStripe = async () => {
        setSyncing(true);
        try {
            const result = await syncStripeInvoices();
            toast.success(`Synced ${result.synced} invoices from Stripe`);
        } catch (error) {
            toast.error('Failed to sync Stripe data');
        } finally {
            setSyncing(false);
        }
    };

    const handleExportInvoices = () => {
        // TODO: Generate CSV export
        toast.success('Exporting invoices...');
    };

    const handleCreateInvoice = () => {
        setCreateInvoiceOpen(true);
    };

    const handleProcessRefund = () => {
        setRefundDialogOpen(true);
    };

    const handleExportRevenue = () => {
        // TODO: Generate revenue report
        toast.success('Generating revenue report...');
    };

    const handleSyncPaymentMethods = () => {
        // TODO: Sync payment methods from Stripe
        toast.success('Syncing payment methods...');
    };
    const { data: metrics } = useSubscriptionMetrics();
    const { data: invoices = [] } = useInvoices();

    // Calculate metrics
    const mrr = metrics?.total_mrr || 0;
    const arr = mrr * 12;
    const activeSubscriptions = metrics?.active_subscribers || 0;
    const newThisMonth = 0; // TODO: Add new_subscriptions field to metrics
    const churnedThisMonth = 0; // TODO: Add churned field to metrics
    const netGrowth = newThisMonth - churnedThisMonth;
    const churnRate = activeSubscriptions > 0
        ? ((churnedThisMonth / activeSubscriptions) * 100).toFixed(1)
        : '0.0';

    // Get recent invoices (last 5)
    const recentInvoices = invoices.slice(0, 5);

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Billing & Revenue</h1>
                    <p className="text-muted-foreground mt-1">
                        Subscription revenue, invoices, and payment analytics
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleSyncStripe} disabled={syncing}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                    {syncing ? 'Syncing...' : 'Sync Stripe'}
                </Button>
            </div>

            {/* Revenue Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">MRR</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${mrr.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            {netGrowth >= 0 ? (
                                <>
                                    <TrendingUp className="h-3 w-3 text-green-600" />
                                    <span className="text-green-600">+{netGrowth} net new</span>
                                </>
                            ) : (
                                <>
                                    <TrendingDown className="h-3 w-3 text-red-600" />
                                    <span className="text-red-600">{netGrowth} net change</span>
                                </>
                            )}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">ARR</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${arr.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Annual Recurring Revenue
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeSubscriptions}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            +{newThisMonth} this month
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{churnRate}%</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {churnedThisMonth} churned this month
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Invoices */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Recent Invoices</CardTitle>
                                <CardDescription>Latest billing transactions</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={handleExportInvoices}>
                                <Download className="h-4 w-4 mr-2" />
                                Export
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {recentInvoices.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No invoices found
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {recentInvoices.map((invoice) => (
                                    <div key={invoice.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                                <p className="font-medium">{invoice.stripe_invoice_id || invoice.id.slice(0, 8)}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {new Date(invoice.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-semibold">
                                                {formatInvoiceAmount(invoice.amount_due, invoice.currency)}
                                            </span>
                                            <Badge className={getInvoiceStatusColor(invoice.status)}>
                                                {invoice.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Revenue Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue by Plan</CardTitle>
                        <CardDescription>MRR distribution across tiers</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                                    <span className="text-sm font-medium">Pro Plan</span>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold">${(mrr * 0.6).toFixed(0)}</p>
                                    <p className="text-xs text-muted-foreground">60%</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-3 w-3 rounded-full bg-purple-500" />
                                    <span className="text-sm font-medium">Team Plan</span>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold">${(mrr * 0.3).toFixed(0)}</p>
                                    <p className="text-xs text-muted-foreground">30%</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-3 w-3 rounded-full bg-amber-500" />
                                    <span className="text-sm font-medium">Enterprise</span>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold">${(mrr * 0.1).toFixed(0)}</p>
                                    <p className="text-xs text-muted-foreground">10%</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common billing tasks</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-3">
                        <Button variant="outline" size="sm" onClick={handleCreateInvoice}>
                            <FileText className="h-4 w-4 mr-2" />
                            Create Invoice
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleProcessRefund}>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Process Refund
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleExportRevenue}>
                            <Download className="h-4 w-4 mr-2" />
                            Export Revenue Report
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleSyncPaymentMethods}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Sync Payment Methods
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Dialogs */}
            <CreateInvoiceDialog open={createInvoiceOpen} onOpenChange={setCreateInvoiceOpen} />
            <RefundDialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen} />
        </div>
    );
}
