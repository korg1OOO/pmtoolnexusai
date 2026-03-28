/**
 * PricingPage Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn(() => vi.fn()),
    useParams: vi.fn(() => ({})),
    useLocation: vi.fn(() => ({ pathname: '/', search: '', hash: '', state: null })),
    useSearchParams: vi.fn(() => [new URLSearchParams(), vi.fn()]),
    Link: ({ children, to }) => React.createElement('a', { href: to }, children),
    NavLink: ({ children, to }) => React.createElement('a', { href: to }, children),
    Outlet: () => null,
}));

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn(), loading: vi.fn() }) }));

import { PricingPage } from '@/components/pricing/PricingPage';

describe('PricingPage', () => {
    it('exports the component', () => {
        expect(PricingPage).toBeDefined();
    });
});
