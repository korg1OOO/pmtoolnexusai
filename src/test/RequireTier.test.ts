/**
 * RequireTier Component Tests
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

import { RequireTier } from '@/components/subscription/RequireTier';

describe('RequireTier', () => {
    it('exports the component', () => {
        expect(RequireTier).toBeDefined();
    });
});
