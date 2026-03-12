import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Plus } from 'lucide-react';
import { useCreateInvoice } from '@/hooks/useFinancials';
import { useProjectContext } from '@/contexts/ProjectContext';

const formSchema = z.object({
    invoice_number: z.string().min(1, 'Invoice number is required'),
    date: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['paid', 'sent', 'pending', 'cancelled']),
    milestone: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function AddInvoiceDialog({ children }: { children?: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const { settings } = useProjectContext();
    const createInvoice = useCreateInvoice();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            invoice_number: '',
            date: new Date().toISOString().split('T')[0],
            amount: 0,
            status: 'pending',
            milestone: '',
        },
    });

    const onSubmit = async (values: FormValues) => {
        if (!settings.id) return;

        try {
            await createInvoice.mutateAsync({
                project_id: settings.id,
                invoice_number: values.invoice_number,
                date: new Date(values.date).toISOString(),
                amount: values.amount,
                status: values.status,
                milestone: values.milestone,
            });
            setOpen(false);
            form.reset();
        } catch (error) {
            console.error('Failed to create invoice:', error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        New Invoice
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>New Invoice</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="invoice_number"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Invoice Number</FormLabel>
                                    <FormControl>
                                        <Input placeholder="INV-001" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Date</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Amount ($)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Status</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="sent">Sent</SelectItem>
                                                <SelectItem value="paid">Paid</SelectItem>
                                                <SelectItem value="cancelled">Cancelled</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="milestone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Milestone (Optional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Phase 1" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createInvoice.isPending}>
                                {createInvoice.isPending ? 'Creating...' : 'Create Invoice'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
