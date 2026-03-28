/**
 * useBillingActions Hook Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { createWrapper } from './testUtils';

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn(), loading: vi.fn() }) }));

import { useSyncStripe, useProcessRefund, useExportInvoices, useExportRevenuePDF, useSyncPaymentMethods } from '@/hooks/useBillingActions';

describe('useBillingActions', () => {
    describe('exports', () => {
        it('exports all expected items', () => {
            expect(useSyncStripe).toBeDefined();
            expect(useProcessRefund).toBeDefined();
            expect(useExportInvoices).toBeDefined();
            expect(useExportRevenuePDF).toBeDefined();
            expect(useSyncPaymentMethods).toBeDefined();
        });
    });

    describe('useSyncStripe', () => {
        it('can be rendered without crashing', () => {
            const { result } = renderHook(() => useSyncStripe(), { wrapper: createWrapper() });
            expect(result.current).toBeDefined();
        });
    });
});
