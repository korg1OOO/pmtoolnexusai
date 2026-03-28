/**
 * Invoice Service
 * Manages invoice data and Stripe synchronization
 */

import { supabase as _supabase } from '@/integrations/supabase/client';
const supabase = _supabase as any;

export interface Invoice {
    id: string;
    user_id: string;
    subscription_id?: string;
    stripe_invoice_id?: string;
    amount_due: number;
    amount_paid: number;
    currency: string;
    status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
    invoice_pdf?: string;
    hosted_invoice_url?: string;
    due_date?: string;
    paid_at?: string;
    created_at: string;
    updated_at?: string;
}

export interface InvoiceFilters {
    status?: string;
    user_id?: string;
    limit?: number;
    offset?: number;
}

/**
 * Get invoices with optional filtering
 */
export async function getInvoices(filters: InvoiceFilters = {}) {
    let query = supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

    if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
    }

    if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
    }

    if (filters.limit) {
        query = query.limit(filters.limit);
    }

    if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as Invoice[];
}

/**
 * Get single invoice by ID
 */
export async function getInvoiceById(id: string) {
    const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data as Invoice;
}

/**
 * Create new invoice
 */
export async function createInvoice(invoice: Partial<Invoice>) {
    const { data, error } = await supabase
        .from('invoices')
        .insert(invoice)
        .select()
        .single();

    if (error) throw error;
    return data as Invoice;
}

/**
 * Update invoice
 */
export async function updateInvoice(id: string, updates: Partial<Invoice>) {
    const { data, error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as Invoice;
}

/**
 * Sync invoices from Stripe via Edge Function
 */
export async function syncStripeInvoices() {
    try {
        const { data, error } = await supabase.functions.invoke('sync-stripe-invoices', {
            body: {},
        });

        if (error) {
            // Edge Function not deployed yet — fall back gracefully
            console.warn('sync-stripe-invoices Edge Function not available:', error.message);
            return {
                synced: 0,
                errors: 0,
                message: 'Stripe sync Edge Function not deployed. Add VITE_STRIPE_SECRET_KEY and deploy sync-stripe-invoices.',
            };
        }

        return {
            synced: data?.synced ?? 0,
            errors: data?.errors ?? 0,
            message: data?.message ?? 'Sync complete',
        };
    } catch (error) {
        console.error('Stripe sync error:', error);
        return { synced: 0, errors: 1, message: 'Stripe not configured' };
    }
}

/**
 * Export invoices as a downloadable CSV file
 */
export function exportInvoicesCSV(invoices: Invoice[]): void {
    const headers = [
        'Invoice ID',
        'Stripe Invoice ID',
        'User ID',
        'Amount Due',
        'Amount Paid',
        'Currency',
        'Status',
        'Due Date',
        'Paid At',
        'Created At',
    ];

    const fmt = (amount: number, currency: string) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(
            amount / 100
        );

    const rows = invoices.map((inv) => [
        inv.id,
        inv.stripe_invoice_id ?? '',
        inv.user_id,
        fmt(inv.amount_due, inv.currency),
        fmt(inv.amount_paid, inv.currency),
        inv.currency.toUpperCase(),
        inv.status,
        inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '',
        inv.paid_at ? new Date(inv.paid_at).toLocaleDateString() : '',
        new Date(inv.created_at).toLocaleDateString(),
    ]);

    const csvContent = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `invoices-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export interface RevenueReportMetrics {
    mrr: number;
    arr: number;
    activeSubscriptions: number;
    planBreakdown: { tier: string; mrr: number; count: number; pct: number }[];
}

/**
 * Export revenue report as a PDF using jsPDF (dynamically imported)
 */
export async function exportRevenueReportPDF(metrics: RevenueReportMetrics): Promise<void> {
    // Dynamic import to avoid bundling jsPDF unless needed
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    const fmt = (n: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

    const today = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
    });

    // Header
    doc.setFontSize(20);
    doc.setTextColor(30, 30, 30);
    doc.text('Revenue Report', 20, 24);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${today}`, 20, 32);

    // KPI metrics
    doc.setFontSize(12);
    doc.setTextColor(30, 30, 30);
    doc.text('Key Metrics', 20, 48);

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(`Monthly Recurring Revenue (MRR)`, 20, 58);
    doc.setFontSize(14);
    doc.setTextColor(30, 30, 30);
    doc.text(fmt(metrics.mrr), 20, 66);

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(`Annual Recurring Revenue (ARR)`, 100, 58);
    doc.setFontSize(14);
    doc.setTextColor(30, 30, 30);
    doc.text(fmt(metrics.arr), 100, 66);

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(`Active Subscriptions`, 20, 80);
    doc.setFontSize(14);
    doc.setTextColor(30, 30, 30);
    doc.text(String(metrics.activeSubscriptions), 20, 88);

    // Plan breakdown table
    doc.setFontSize(12);
    doc.setTextColor(30, 30, 30);
    doc.text('Revenue by Plan', 20, 104);

    const tableHeaders = ['Plan', 'Subscriptions', 'MRR', '% of Revenue'];
    const colX = [20, 70, 120, 165];

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    tableHeaders.forEach((h, i) => doc.text(h, colX[i], 112));

    doc.setDrawColor(200, 200, 200);
    doc.line(20, 114, 190, 114);

    doc.setTextColor(30, 30, 30);
    metrics.planBreakdown.forEach((row, idx) => {
        const y = 122 + idx * 10;
        doc.text(row.tier, colX[0], y);
        doc.text(String(row.count), colX[1], y);
        doc.text(fmt(row.mrr), colX[2], y);
        doc.text(`${row.pct.toFixed(1)}%`, colX[3], y);
    });

    // Footer
    const lastY = 122 + metrics.planBreakdown.length * 10 + 10;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('This report is confidential and generated automatically by Kiroxys.', 20, lastY);

    doc.save(`revenue-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * Sync payment methods from Stripe via Edge Function
 */
export async function syncPaymentMethods() {
    try {
        const { data, error } = await supabase.functions.invoke('sync-payment-methods', {
            body: {},
        });

        if (error) {
            console.warn('sync-payment-methods Edge Function not available:', error.message);
            return {
                synced: 0,
                message: 'Payment methods sync Edge Function not deployed.',
            };
        }

        return {
            synced: data?.synced ?? 0,
            message: data?.message ?? 'Payment methods synced',
        };
    } catch (error) {
        console.error('Payment methods sync error:', error);
        return { synced: 0, message: 'Sync failed' };
    }
}

/**
 * Get invoice statistics
 */
export async function getInvoiceStats() {
    const { data, error } = await supabase
        .from('invoices')
        .select('status, amount_due, amount_paid');

    if (error) throw error;

    const stats = {
        total: data.length,
        paid: data.filter((i: any) => i.status === 'paid').length,
        open: data.filter((i: any) => i.status === 'open').length,
        overdue: data.filter((i: any) => i.status === 'open' && i.due_date && new Date(i.due_date) < new Date()).length,
        totalRevenue: data.filter((i: any) => i.status === 'paid').reduce((sum: number, i: any) => sum + i.amount_paid, 0),
    };

    return stats;
}
