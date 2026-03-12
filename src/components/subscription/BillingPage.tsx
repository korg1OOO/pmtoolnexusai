
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Download, ExternalLink, FileText, Loader2, CreditCard, Receipt } from 'lucide-react';
import { useMySubscription } from '@/hooks/useSubscriptions';
import { useSubscriptionInvoices, formatInvoiceAmount, getInvoiceStatusColor } from '@/hooks/useInvoices';
import { SubscriptionWidget } from './SubscriptionWidget';
import { useNavigate } from 'react-router-dom';

export function BillingPage() {
    const navigate = useNavigate();
    const { data: subscription, isLoading: subLoading } = useMySubscription();
    const { data: invoices = [], isLoading: invLoading } = useSubscriptionInvoices(subscription?.id || '');

    const isLoading = subLoading || (!!subscription?.id && invLoading);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8 max-w-[1200px] mx-auto">
            <div>
                <h1 className="text-3xl font-bold">Billing & Subscription</h1>
                <p className="text-muted-foreground mt-1">
                    Manage your plan, limits, and billing history
                </p>
            </div>

            <div className="grid gap-8 md:grid-cols-[1fr_300px] lg:grid-cols-[1fr_350px]">
                <div className="space-y-8">
                    {/* Current Plan & Usage */}
                    <section>
                        <h2 className="text-xl font-semibold mb-4">Current Plan</h2>
                        <SubscriptionWidget />
                    </section>

                    {/* Invoice History */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold">Invoice History</h2>
                        </div>

                        <Card>
                            <CardContent className="p-0">
                                {invoices.length === 0 ? (
                                    <div className="text-center py-12 px-4">
                                        <div className="bg-muted/30 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-4">
                                            <Receipt className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <h3 className="font-medium">No invoices yet</h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            You haven't been billed for anything yet.
                                        </p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Invoice</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Download</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {invoices.map((invoice) => (
                                                <TableRow key={invoice.id}>
                                                    <TableCell className="font-medium">
                                                        {invoice.invoice_number || invoice.stripe_invoice_id?.slice(-8)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {new Date(invoice.created_at).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell>
                                                        {formatInvoiceAmount(invoice.amount_paid, invoice.currency)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant="secondary"
                                                            className={getInvoiceStatusColor(invoice.status)}
                                                        >
                                                            {invoice.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {invoice.invoice_pdf && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => window.open(invoice.invoice_pdf, '_blank')}
                                                            >
                                                                <Download className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </section>
                </div>

                {/* Sidebar Actions */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Payment Method
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Manage your payment methods and billing details securely via Stripe.
                            </p>
                            <Button
                                variant="outline"
                                className="w-full justify-between"
                                onClick={async () => {
                                    const { openCustomerPortal } = await import('@/services/stripeService');
                                    openCustomerPortal();
                                }}
                            >
                                Manage in Stripe
                                <ExternalLink className="h-4 w-4 ml-2" />
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="bg-muted/20 border-none shadow-none">
                        <CardContent className="p-4">
                            <h4 className="font-semibold mb-2">Need help?</h4>
                            <p className="text-sm text-muted-foreground mb-3">
                                If you have questions about your bill or subscription, contact our support team.
                            </p>
                            <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/support')}>
                                Contact Support
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
