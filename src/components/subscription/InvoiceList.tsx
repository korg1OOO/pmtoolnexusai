/**
 * Invoice List Component
 * Displays user's invoice history with download links
 */

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
import { Download, ExternalLink, FileText } from 'lucide-react';
import { useInvoices, formatInvoiceAmount, getInvoiceStatusColor } from '@/hooks/useInvoices';
// Skeleton removed - using inline loading state

export function InvoiceList() {
    const { data: invoices = [], isLoading } = useInvoices();

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Invoices</CardTitle>
                    <CardDescription>Loading your invoice history...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (invoices.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Invoices</CardTitle>
                    <CardDescription>Your invoice history will appear here</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No invoices yet</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Invoices</CardTitle>
                <CardDescription>
                    View and download your billing history
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Invoice #</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoices.map((invoice) => (
                            <TableRow key={invoice.id}>
                                <TableCell className="font-medium">
                                    {invoice.invoice_number || invoice.stripe_invoice_id.slice(-8)}
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
                                    <div className="flex items-center justify-end gap-2">
                                        {invoice.invoice_pdf && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => window.open(invoice.invoice_pdf, '_blank')}
                                            >
                                                <Download className="h-4 w-4 mr-1" />
                                                PDF
                                            </Button>
                                        )}
                                        {invoice.hosted_invoice_url && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => window.open(invoice.hosted_invoice_url, '_blank')}
                                            >
                                                <ExternalLink className="h-4 w-4 mr-1" />
                                                View
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
