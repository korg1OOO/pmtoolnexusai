/**
 * Refund Dialog
 * Modal for processing refunds via Stripe
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
import { CreditCard, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface RefundDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    invoiceId?: string;
    invoiceAmount?: number;
    currency?: string;
}

export function RefundDialog({
    open,
    onOpenChange,
    invoiceId,
    invoiceAmount = 0,
    currency = 'usd',
}: RefundDialogProps) {
    const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
    const [amount, setAmount] = useState(invoiceAmount);
    const [reason, setReason] = useState<string>('requested_by_customer');
    const [notes, setNotes] = useState('');
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (refundType === 'partial' && amount <= 0) {
            toast.error('Refund amount must be greater than 0');
            return;
        }

        if (refundType === 'partial' && amount > invoiceAmount) {
            toast.error('Refund amount cannot exceed invoice amount');
            return;
        }

        setProcessing(true);
        try {
            // TODO: Call Stripe refund API
            await new Promise((resolve) => setTimeout(resolve, 1500));

            toast.success('Refund processed successfully');
            onOpenChange(false);

            // Reset form
            setRefundType('full');
            setAmount(invoiceAmount);
            setReason('requested_by_customer');
            setNotes('');
        } catch (error) {
            toast.error('Failed to process refund');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Process Refund
                    </DialogTitle>
                    <DialogDescription>
                        Issue a refund for this invoice via Stripe
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Warning Alert */}
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            This action cannot be undone. The refund will be processed immediately via Stripe.
                        </AlertDescription>
                    </Alert>

                    {/* Refund Type */}
                    <div className="space-y-2">
                        <Label htmlFor="refundType">Refund Type</Label>
                        <Select
                            value={refundType}
                            onValueChange={(value: 'full' | 'partial') => {
                                setRefundType(value);
                                if (value === 'full') {
                                    setAmount(invoiceAmount);
                                }
                            }}
                        >
                            <SelectTrigger id="refundType">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="full">Full Refund</SelectItem>
                                <SelectItem value="partial">Partial Refund</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Amount (for partial refunds) */}
                    {refundType === 'partial' && (
                        <div className="space-y-2">
                            <Label htmlFor="amount">Refund Amount</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground">
                                    {currency.toUpperCase()}
                                </span>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    value={amount / 100}
                                    onChange={(e) => setAmount(parseFloat(e.target.value) * 100 || 0)}
                                    className="pl-16"
                                    max={invoiceAmount / 100}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Maximum: {new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: currency.toUpperCase(),
                                }).format(invoiceAmount / 100)}
                            </p>
                        </div>
                    )}

                    {/* Reason */}
                    <div className="space-y-2">
                        <Label htmlFor="reason">Reason</Label>
                        <Select value={reason} onValueChange={setReason}>
                            <SelectTrigger id="reason">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="requested_by_customer">Requested by Customer</SelectItem>
                                <SelectItem value="duplicate">Duplicate Charge</SelectItem>
                                <SelectItem value="fraudulent">Fraudulent</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Textarea
                            id="notes"
                            placeholder="Add any additional notes about this refund..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                        />
                    </div>

                    {/* Refund Summary */}
                    <div className="p-4 bg-muted rounded-lg space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Invoice Amount:</span>
                            <span className="font-medium">
                                {new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: currency.toUpperCase(),
                                }).format(invoiceAmount / 100)}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Refund Amount:</span>
                            <span className="font-bold text-lg">
                                {new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: currency.toUpperCase(),
                                }).format((refundType === 'full' ? invoiceAmount : amount) / 100)}
                            </span>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="destructive" disabled={processing}>
                            {processing ? 'Processing...' : 'Process Refund'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
