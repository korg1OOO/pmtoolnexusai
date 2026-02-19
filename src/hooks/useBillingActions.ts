/**
 * Billing Action Hooks
 * React Query mutations for billing operations: sync, refunds, exports
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    syncStripeInvoices,
    exportInvoicesCSV,
    exportRevenueReportPDF,
    syncPaymentMethods,
    type Invoice,
    type RevenueReportMetrics,
} from '@/services/invoiceService';
import { processRefund } from '@/services/stripeIntegrationService';

// ─── Stripe Invoice Sync ───────────────────────────────────────────────────

export function useSyncStripe() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => syncStripeInvoices(),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            if (result.synced > 0) {
                toast.success(`Synced ${result.synced} invoice${result.synced > 1 ? 's' : ''} from Stripe`);
            } else {
                toast.info(result.message || 'No new invoices to sync');
            }
        },
        onError: () => {
            toast.error('Failed to sync Stripe data');
        },
    });
}

// ─── Process Refund ────────────────────────────────────────────────────────

export interface RefundParams {
    paymentIntentId: string;
    amount?: number; // in cents; undefined = full refund
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
    notes?: string;
}

export function useProcessRefund() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ paymentIntentId, amount, reason }: RefundParams) =>
            processRefund(paymentIntentId, amount, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            toast.success('Refund processed successfully');
        },
        onError: (error: Error) => {
            toast.error(`Refund failed: ${error.message}`);
        },
    });
}

// ─── Export Invoices CSV ───────────────────────────────────────────────────

export function useExportInvoices() {
    return useMutation({
        mutationFn: async (invoices: Invoice[]) => {
            if (invoices.length === 0) throw new Error('No invoices to export');
            exportInvoicesCSV(invoices);
        },
        onSuccess: () => {
            toast.success('Invoices exported as CSV');
        },
        onError: (error: Error) => {
            toast.error(`Export failed: ${error.message}`);
        },
    });
}

// ─── Export Revenue Report PDF ─────────────────────────────────────────────

export function useExportRevenuePDF() {
    return useMutation({
        mutationFn: (metrics: RevenueReportMetrics) => exportRevenueReportPDF(metrics),
        onSuccess: () => {
            toast.success('Revenue report downloaded');
        },
        onError: (error: Error) => {
            toast.error(`PDF export failed: ${error.message}`);
        },
    });
}

// ─── Sync Payment Methods ──────────────────────────────────────────────────

export function useSyncPaymentMethods() {
    return useMutation({
        mutationFn: () => syncPaymentMethods(),
        onSuccess: (result) => {
            if (result.synced > 0) {
                toast.success(`Synced ${result.synced} payment method${result.synced > 1 ? 's' : ''}`);
            } else {
                toast.info(result.message || 'Payment methods up to date');
            }
        },
        onError: () => {
            toast.error('Failed to sync payment methods');
        },
    });
}
