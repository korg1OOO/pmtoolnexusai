/**
 * Refund Dialog
 * Modal for processing refunds via Stripe — wired to real processRefund()
 */

import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CreditCard, AlertCircle, Search } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useInvoices, formatInvoiceAmount, type Invoice } from '@/hooks/useInvoices';
import { useProcessRefund } from '@/hooks/useBillingActions';

interface RefundDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Pre-select a specific invoice */
    invoiceId?: string;
    invoiceAmount?: number;
    currency?: string;
}

export function RefundDialog({
    open,
    onOpenChange,
    invoiceId: preselectedInvoiceId,
}: RefundDialogProps) {
    const { data: allInvoices = [] } = useInvoices();
    const processRefund = useProcessRefund();

    const [search, setSearch] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
    const [partialAmount, setPartialAmount] = useState(0);
    const [reason, setReason] = useState<'duplicate' | 'fraudulent' | 'requested_by_customer'>('requested_by_customer');
    const [notes, setNotes] = useState('');

    // Auto-select pre-picked invoice
    React.useEffect(() => {
        if (preselectedInvoiceId && allInvoices.length) {
            const found = allInvoices.find((inv) => inv.id === preselectedInvoiceId);
            if (found) setSelectedInvoice(found);
        }
    }, [preselectedInvoiceId, allInvoices]);

    // Refundable invoices: paid ones with a stripe_payment_intent_id equivalent
    // We search on stripe_invoice_id or id, filtering by status = paid
    const refundableInvoices = allInvoices.filter(
        (inv) => inv.status === 'paid'
    );

    const filtered = search.trim()
        ? refundableInvoices.filter(
            (inv) =>
                inv.stripe_invoice_id?.toLowerCase().includes(search.toLowerCase()) ||
                inv.id.toLowerCase().includes(search.toLowerCase())
        )
        : refundableInvoices.slice(0, 8);

    const invoiceAmountCents = selectedInvoice?.amount_paid ?? 0;
    const currency = selectedInvoice?.currency ?? 'usd';
    const refundAmountCents = refundType === 'full' ? invoiceAmountCents : partialAmount;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedInvoice) {
            return;
        }

        if (refundType === 'partial' && partialAmount <= 0) {
            return;
        }

        if (refundType === 'partial' && partialAmount > invoiceAmountCents) {
            return;
        }

        // stripe_invoice_id is used as the payment intent reference here.
        // If the invoices table stores stripe_payment_intent_id separately, use that.
        const paymentIntentId =
            (selectedInvoice as any).stripe_payment_intent_id ??
            selectedInvoice.stripe_invoice_id ??
            '';

        if (!paymentIntentId) {
            return;
        }

        await processRefund.mutateAsync({
            paymentIntentId,
            amount: refundType === 'partial' ? partialAmount : undefined,
            reason,
            notes,
        });

        // Reset and close on success
        setSearch('');
        setSelectedInvoice(null);
        setRefundType('full');
        setPartialAmount(0);
        setReason('requested_by_customer');
        setNotes('');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Process Refund
                    </DialogTitle>
                    <DialogDescription>
                        Issue a refund for a paid invoice via Stripe
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Warning */}
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            This action cannot be undone. The refund will be processed immediately via Stripe.
                        </AlertDescription>
                    </Alert>

                    {/* Invoice Search */}
                    <div className="space-y-2">
                        <Label>Select Invoice</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by invoice ID..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        {!selectedInvoice && (
                            <div className="max-h-40 overflow-y-auto border rounded-md divide-y">
                                {filtered.length === 0 ? (
                                    <p className="p-3 text-sm text-muted-foreground text-center">
                                        No paid invoices found
                                    </p>
                                ) : (
                                    filtered.map((inv) => (
                                        <button
                                            key={inv.id}
                                            type="button"
                                            className="w-full flex items-center justify-between p-3 text-sm hover:bg-muted transition-colors text-left"
                                            onClick={() => {
                                                setSelectedInvoice(inv);
                                                setPartialAmount(inv.amount_paid);
                                                setSearch('');
                                            }}
                                        >
                                            <span className="font-mono text-xs text-muted-foreground truncate max-w-[160px]">
                                                {inv.stripe_invoice_id ?? inv.id.slice(0, 12)}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">
                                                    {formatInvoiceAmount(inv.amount_paid, inv.currency)}
                                                </span>
                                                <Badge variant="secondary" className="text-xs">paid</Badge>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}

                        {selectedInvoice && (
                            <div className="flex items-center justify-between p-3 border rounded-md bg-muted/40">
                                <div>
                                    <p className="text-sm font-medium font-mono">
                                        {selectedInvoice.stripe_invoice_id ?? selectedInvoice.id.slice(0, 12)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Paid {formatInvoiceAmount(selectedInvoice.amount_paid, selectedInvoice.currency)}
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedInvoice(null)}
                                >
                                    Change
                                </Button>
                            </div>
                        )}
                    </div>

                    {selectedInvoice && (
                        <>
                            {/* Refund Type */}
                            <div className="space-y-2">
                                <Label>Refund Type</Label>
                                <Select
                                    value={refundType}
                                    onValueChange={(value: 'full' | 'partial') => {
                                        setRefundType(value);
                                        if (value === 'full') setPartialAmount(invoiceAmountCents);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="full">Full Refund</SelectItem>
                                        <SelectItem value="partial">Partial Refund</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {refundType === 'partial' && (
                                <div className="space-y-2">
                                    <Label>Refund Amount ({currency.toUpperCase()})</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">
                                            {currency.toUpperCase()}
                                        </span>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={partialAmount / 100}
                                            onChange={(e) => setPartialAmount(parseFloat(e.target.value) * 100 || 0)}
                                            className="pl-14"
                                            max={invoiceAmountCents / 100}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Max: {formatInvoiceAmount(invoiceAmountCents, currency)}
                                    </p>
                                </div>
                            )}

                            {/* Reason */}
                            <div className="space-y-2">
                                <Label>Reason</Label>
                                <Select value={reason} onValueChange={(v: any) => setReason(v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="requested_by_customer">Requested by Customer</SelectItem>
                                        <SelectItem value="duplicate">Duplicate Charge</SelectItem>
                                        <SelectItem value="fraudulent">Fraudulent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                                <Label>Notes (Optional)</Label>
                                <Textarea
                                    placeholder="Add any additional notes..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={2}
                                />
                            </div>

                            {/* Summary */}
                            <div className="p-3 bg-muted rounded-lg flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Refund Amount:</span>
                                <span className="font-bold text-lg">
                                    {formatInvoiceAmount(refundAmountCents, currency)}
                                </span>
                            </div>
                        </>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="destructive"
                            disabled={!selectedInvoice || processRefund.isPending}
                        >
                            {processRefund.isPending ? 'Processing...' : 'Process Refund'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
