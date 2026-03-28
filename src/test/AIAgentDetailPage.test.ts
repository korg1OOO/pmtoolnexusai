/**
 * AIAgentDetailPage Component Tests
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

import AIAgentDetailPage from '@/components/admin/ai-agents/AIAgentDetailPage';

describe('AIAgentDetailPage', () => {
    it('exports AIAgentDetailPage', () => {
        expect(AIAgentDetailPage).toBeDefined();
    });
});
