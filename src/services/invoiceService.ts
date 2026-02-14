/**
 * Invoice Service
 * Manages invoice data and Stripe synchronization
 */

import { supabase } from '@/integrations/supabase/client';

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
    updated_at: string;
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
 * Sync invoices from Stripe
 * This would call Stripe API to fetch latest invoices
 */
export async function syncStripeInvoices() {
    // TODO: Implement Stripe API integration
    // For now, this is a placeholder
    console.log('Syncing invoices from Stripe...');

    // In production, this would:
    // 1. Call Stripe API to list invoices
    // 2. Upsert invoices into database
    // 3. Return sync results

    return { synced: 0, errors: 0 };
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
        paid: data.filter(i => i.status === 'paid').length,
        open: data.filter(i => i.status === 'open').length,
        overdue: data.filter(i => i.status === 'open' && i.due_date && new Date(i.due_date) < new Date()).length,
        totalRevenue: data.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount_paid, 0),
    };

    return stats;
}
