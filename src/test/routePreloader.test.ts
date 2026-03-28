/**
 * RoutePreloader Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn(() => vi.fn()),
    useParams: vi.fn(() => ({})),
    useLocation: vi.fn(() => ({ pathname: '/' })),
    useSearchParams: vi.fn(() => [new URLSearchParams(), vi.fn()]),
    Link: (p) => p.children,
}));

import { RoutePreloader } from '@/components/routing/RoutePreloader';

describe('RoutePreloader', () => {
    it('exports RoutePreloader', () => {
        expect(RoutePreloader).toBeDefined();
    });
});
