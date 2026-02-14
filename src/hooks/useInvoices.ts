/**
 * Invoice Hooks
 * React Query hooks for fetching and managing invoices
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase as _supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
const supabase = _supabase as any;

export interface Invoice {
    id: string;
    user_id: string;
    subscription_id: string;
    stripe_invoice_id: string;
    stripe_customer_id: string;
    amount_due: number;
    amount_paid: number;
    currency: string;
    status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
    invoice_pdf?: string;
    hosted_invoice_url?: string;
    invoice_number?: string;
    billing_reason?: string;
    due_date?: string;
    paid_at?: string;
    created_at: string;
}

export interface InvoiceLineItem {
    id: string;
    invoice_id: string;
    description?: string;
    amount: number;
    quantity: number;
    unit_amount?: number;
    period_start?: string;
    period_end?: string;
}

/**
 * Fetch user's invoices
 */
export function useInvoices() {
    return useQuery({
        queryKey: ['invoices'],
        queryFn: async (): Promise<Invoice[]> => {
            const { data, error } = await supabase
                .from('invoices')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        },
    });
}

/**
 * Fetch specific invoice with line items
 */
export function useInvoice(invoiceId: string) {
    return useQuery({
        queryKey: ['invoice', invoiceId],
        queryFn: async (): Promise<Invoice & { line_items: InvoiceLineItem[] }> => {
            const { data: invoice, error: invoiceError } = await supabase
                .from('invoices')
                .select('*')
                .eq('id', invoiceId)
                .single();

            if (invoiceError) throw invoiceError;

            const { data: lineItems, error: itemsError } = await supabase
                .from('invoice_line_items')
                .select('*')
                .eq('invoice_id', invoiceId);

            if (itemsError) throw itemsError;

            return {
                ...invoice,
                line_items: lineItems || [],
            };
        },
        enabled: !!invoiceId,
    });
}

/**
 * Get invoices for a specific subscription
 */
export function useSubscriptionInvoices(subscriptionId: string) {
    return useQuery({
        queryKey: ['subscription-invoices', subscriptionId],
        queryFn: async (): Promise<Invoice[]> => {
            const { data, error } = await supabase
                .from('invoices')
                .select('*')
                .eq('subscription_id', subscriptionId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        },
        enabled: !!subscriptionId,
    });
}

/**
 * Format currency amount
 */
export function formatInvoiceAmount(amount: number, currency: string = 'usd'): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase(),
    }).format(amount / 100); // Convert from cents
}

/**
 * Get status badge color
 */
export function getInvoiceStatusColor(status: Invoice['status']): string {
    const colors = {
        paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        open: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
        void: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        uncollectible: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    };
    return colors[status] || colors.draft;
}

/**
 * Create invoice mutation
 */
export function useCreateInvoice() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (invoice: Partial<Invoice>) => {
            const { data, error } = await supabase
                .from('invoices')
                .insert(invoice)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            toast.success('Invoice created successfully');
        },
        onError: (error: Error) => {
            toast.error(`Failed to create invoice: ${error.message}`);
        },
    });
}
