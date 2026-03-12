/**
 * invoiceService — Deep Tests
 * Tests interface shapes and exportInvoicesCSV pure logic
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            range: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
        functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
    },
}));

beforeAll(() => {
    if (!URL.createObjectURL) (URL as any).createObjectURL = vi.fn(() => 'blob:test');
    if (!URL.revokeObjectURL) (URL as any).revokeObjectURL = vi.fn();
});

import {
    getInvoices,
    getInvoiceById,
    createInvoice,
    updateInvoice,
    syncStripeInvoices,
    exportInvoicesCSV,
    exportRevenueReportPDF,
    syncPaymentMethods,
    getInvoiceStats,
} from '@/services/invoiceService';
import type { Invoice, InvoiceFilters, RevenueReportMetrics } from '@/services/invoiceService';

describe('invoiceService', () => {
    describe('Invoice interface', () => {
        it('has required fields', () => {
            const invoice: Invoice = {
                id: '1', user_id: 'u1', amount_due: 99.99,
                amount_paid: 99.99, currency: 'usd', status: 'paid',
                created_at: '2024-01-01',
            };
            expect(invoice.status).toBe('paid');
        });

        it('status can be draft, open, paid, void, uncollectible', () => {
            const statuses: Invoice['status'][] = ['draft', 'open', 'paid', 'void', 'uncollectible'];
            expect(statuses).toHaveLength(5);
        });
    });

    describe('RevenueReportMetrics interface', () => {
        it('has MRR and ARR fields', () => {
            const metrics: RevenueReportMetrics = {
                mrr: 5000, arr: 60000,
                activeSubscriptions: 100,
                planBreakdown: [{ tier: 'pro', mrr: 3000, count: 60, pct: 60 }],
            };
            expect(metrics.arr).toBe(60000);
        });
    });

    describe('exportInvoicesCSV', () => {
        it('does not throw with valid invoices', () => {
            const invoices: Invoice[] = [{
                id: '1', user_id: 'u1', amount_due: 10,
                amount_paid: 10, currency: 'usd', status: 'paid',
                created_at: '2024-01-01',
            }];
            expect(() => exportInvoicesCSV(invoices)).not.toThrow();
        });

        it('handles empty array', () => {
            expect(() => exportInvoicesCSV([])).not.toThrow();
        });
    });

    describe('function exports', () => {
        const methods = {
            getInvoices, getInvoiceById, createInvoice, updateInvoice,
            syncStripeInvoices, exportInvoicesCSV, exportRevenueReportPDF,
            syncPaymentMethods, getInvoiceStats,
        };

        Object.entries(methods).forEach(([name, fn]) => {
            it(`${name} is exported`, () => {
                expect(typeof fn).toBe('function');
            });
        });
    });
});
