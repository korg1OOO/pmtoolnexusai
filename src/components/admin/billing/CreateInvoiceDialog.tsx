/**
 * Create Invoice Dialog
 * Modal for creating new invoices with line items
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
import { Plus, Trash2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateInvoice } from '@/hooks/useInvoices';

interface LineItem {
    id: string;
    description: string;
    amount: number;
    quantity: number;
}

interface CreateInvoiceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateInvoiceDialog({ open, onOpenChange }: CreateInvoiceDialogProps) {
    const createInvoice = useCreateInvoice();
    const [userId, setUserId] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [currency, setCurrency] = useState('usd');
    const [lineItems, setLineItems] = useState<LineItem[]>([
        { id: '1', description: '', amount: 0, quantity: 1 },
    ]);

    const addLineItem = () => {
        setLineItems([
            ...lineItems,
            { id: Date.now().toString(), description: '', amount: 0, quantity: 1 },
        ]);
    };

    const removeLineItem = (id: string) => {
        if (lineItems.length > 1) {
            setLineItems(lineItems.filter((item) => item.id !== id));
        }
    };

    const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
        setLineItems(
            lineItems.map((item) =>
                item.id === id ? { ...item, [field]: value } : item
            )
        );
    };

    const calculateTotal = () => {
        return lineItems.reduce((sum, item) => sum + item.amount * item.quantity, 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!userId) {
            toast.error('Please enter a user ID');
            return;
        }

        const total = calculateTotal();
        if (total === 0) {
            toast.error('Invoice total must be greater than 0');
            return;
        }

        try {
            await createInvoice.mutateAsync({
                user_id: userId,
                amount_due: total,
                amount_paid: 0,
                currency,
                status: 'draft',
                due_date: dueDate || undefined,
            });

            // Reset form
            setUserId('');
            setDueDate('');
            setCurrency('usd');
            setLineItems([{ id: '1', description: '', amount: 0, quantity: 1 }]);
            onOpenChange(false);
        } catch (error) {
            // Error handled by mutation
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Create Invoice
                    </DialogTitle>
                    <DialogDescription>
                        Create a new invoice for a customer
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Customer & Currency */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="userId">User ID *</Label>
                            <Input
                                id="userId"
                                placeholder="Enter user UUID"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="currency">Currency</Label>
                            <Select value={currency} onValueChange={setCurrency}>
                                <SelectTrigger id="currency">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="usd">USD</SelectItem>
                                    <SelectItem value="eur">EUR</SelectItem>
                                    <SelectItem value="gbp">GBP</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Due Date */}
                    <div className="space-y-2">
                        <Label htmlFor="dueDate">Due Date</Label>
                        <Input
                            id="dueDate"
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                        />
                    </div>

                    {/* Line Items */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label>Line Items</Label>
                            <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Item
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {lineItems.map((item, index) => (
                                <div key={item.id} className="flex gap-2 items-start">
                                    <div className="flex-1 space-y-2">
                                        <Input
                                            placeholder="Description"
                                            value={item.description}
                                            onChange={(e) =>
                                                updateLineItem(item.id, 'description', e.target.value)
                                            }
                                        />
                                    </div>
                                    <div className="w-24 space-y-2">
                                        <Input
                                            type="number"
                                            placeholder="Amount"
                                            value={item.amount || ''}
                                            onChange={(e) =>
                                                updateLineItem(item.id, 'amount', parseFloat(e.target.value) || 0)
                                            }
                                        />
                                    </div>
                                    <div className="w-20 space-y-2">
                                        <Input
                                            type="number"
                                            placeholder="Qty"
                                            value={item.quantity || ''}
                                            onChange={(e) =>
                                                updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 1)
                                            }
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeLineItem(item.id)}
                                        disabled={lineItems.length === 1}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Total */}
                    <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                        <span className="font-semibold">Total:</span>
                        <span className="text-2xl font-bold">
                            {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: currency.toUpperCase(),
                            }).format(calculateTotal() / 100)}
                        </span>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={createInvoice.isPending}>
                            {createInvoice.isPending ? 'Creating...' : 'Create Invoice'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
