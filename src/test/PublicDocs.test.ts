/**
 * PublicDocs Tests
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn(() => vi.fn()),
    useParams: vi.fn(() => ({})),
    useLocation: vi.fn(() => ({ pathname: '/', search: '', hash: '', state: null })),
    useSearchParams: vi.fn(() => [new URLSearchParams(), vi.fn()]),
    Link: (p) => p.children,
    NavLink: (p) => p.children,
    Outlet: () => null,
    Route: () => null,
    Routes: () => null,
    Navigate: () => null,
    BrowserRouter: ({ children }) => children,
    createBrowserRouter: vi.fn(),
}));

import PublicDocs from '@/pages/PublicDocs';

describe('PublicDocs', () => {
    it('exports PublicDocs', () => {
        expect(PublicDocs).toBeDefined();
    });
});
