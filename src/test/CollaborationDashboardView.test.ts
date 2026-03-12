/**
 * CollaborationDashboardView Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn(() => vi.fn()),
    useParams: vi.fn(() => ({})),
    useLocation: vi.fn(() => ({ pathname: '/' })),
    useSearchParams: vi.fn(() => [new URLSearchParams(), vi.fn()]),
    Link: (p) => p.children,
}));

import CollaborationDashboardView from '@/components/views/CollaborationDashboardView';

describe('CollaborationDashboardView', () => {
    it('exports CollaborationDashboardView', () => {
        expect(CollaborationDashboardView).toBeDefined();
    });
});
