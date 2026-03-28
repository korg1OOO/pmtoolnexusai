/**
 * MLAnalyticsHub Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn(() => vi.fn()),
    useParams: vi.fn(() => ({})),
    useLocation: vi.fn(() => ({ pathname: '/' })),
    useSearchParams: vi.fn(() => [new URLSearchParams(), vi.fn()]),
    Link: (p) => p.children,
}));

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }));

import MLAnalyticsHub from '@/components/views/MLAnalyticsHub';

describe('MLAnalyticsHub', () => {
    it('exports MLAnalyticsHub', () => {
        expect(MLAnalyticsHub).toBeDefined();
    });
});
