/**
 * Service tests batch 16: knowledgeBaseService (269 lines, 12 functions)
 * Article CRUD, search, featured, popular, categories, engagement
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { ms, ch } = vi.hoisted(() => {
    const s = { data: null as any, error: null as any };
    const c: any = {};
    ['from', 'select', 'insert', 'update', 'upsert', 'delete', 'eq', 'neq', 'in', 'like', 'ilike', 'or', 'order', 'limit', 'range', 'single', 'maybeSingle', 'filter', 'match', 'gte', 'lte', 'gt', 'lt', 'not', 'is', 'contains', 'overlaps', 'textSearch']
        .forEach(m => { c[m] = vi.fn(() => c); });
    c.then = (res: any, rej?: any) => Promise.resolve({ data: s.data, error: s.error }).then(res, rej);
    return { ms: s, ch: c };
});

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        ...ch, from: vi.fn(() => ch),
        rpc: vi.fn(() => Promise.resolve({ data: ms.data, error: ms.error })),
        auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'u1' } }, error: null })) },
        channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() })),
        removeChannel: vi.fn(),
    },
}));

import * as kbService from '@/services/knowledgeBaseService';

beforeEach(() => {
    ms.data = null; ms.error = null;
    vi.clearAllMocks();
    ['from', 'select', 'insert', 'update', 'upsert', 'delete', 'eq', 'neq', 'in', 'like', 'ilike', 'or', 'order', 'limit', 'range', 'single', 'maybeSingle', 'filter', 'match', 'gte', 'lte', 'gt', 'lt', 'not', 'is', 'contains', 'overlaps', 'textSearch']
        .forEach(m => { ch[m].mockImplementation(() => ch); });
});

const sampleArticle = { id: 'a1', tenant_id: 't1', title: 'Getting Started', content: 'Hello', tags: ['intro'], status: 'published', article_type: 'guide', created_at: '2024-01-01', updated_at: '2024-01-01', created_by_user_id: 'u1', view_count: 10, helpful_count: 5, not_helpful_count: 1 };

describe('knowledgeBaseService', () => {
    // === Article CRUD ===
    it('getKnowledgeArticles', async () => {
        ms.data = [sampleArticle];
        const r = await kbService.getKnowledgeArticles('tenant', 't1');
        expect(ch.eq).toHaveBeenCalled();
    });

    it('createKnowledgeArticle', async () => {
        ms.data = sampleArticle;
        const r = await kbService.createKnowledgeArticle({ title: 'New', content: 'Body', tenant_id: 't1' } as any);
        expect(ch.insert).toHaveBeenCalled();
    });

    it('createKnowledgeArticle throws on error', async () => {
        ms.error = { message: 'err' };
        await expect(kbService.createKnowledgeArticle({ title: 'X' } as any)).rejects.toBeDefined();
    });

    it('updateKnowledgeArticle', async () => {
        ms.data = { ...sampleArticle, title: 'Updated' };
        const r = await kbService.updateKnowledgeArticle('a1', { title: 'Updated' });
        expect(ch.update).toHaveBeenCalled();
    });

    it('publishKnowledgeArticle', async () => {
        ms.data = { ...sampleArticle, status: 'published' };
        const r = await kbService.publishKnowledgeArticle('a1');
        expect(r).toBeDefined();
    });

    it('archiveKnowledgeArticle', async () => {
        ms.data = { ...sampleArticle, status: 'archived' };
        const r = await kbService.archiveKnowledgeArticle('a1');
        expect(r).toBeDefined();
    });

    // === Search & Discovery ===
    it('searchKnowledgeBase', async () => {
        ms.data = [sampleArticle];
        const r = await kbService.searchKnowledgeBase('getting started');
        expect(r).toBeDefined();
    });

    it('getFeaturedArticles', async () => {
        ms.data = [sampleArticle];
        const r = await kbService.getFeaturedArticles('tenant', 't1');
        expect(ch.eq).toHaveBeenCalled();
    });

    it('getPopularArticles', async () => {
        ms.data = [sampleArticle];
        const r = await kbService.getPopularArticles('tenant', 't1', 5);
        expect(ch.order).toHaveBeenCalled();
    });

    // === Engagement ===
    it('markArticleHelpful', async () => {
        ms.error = null; ms.data = { helpful_count: 6 };
        await kbService.markArticleHelpful('a1', true);
        expect(ch.eq).toHaveBeenCalled();
    });

    // === Categories ===
    it('getArticleCategories', async () => {
        ms.data = [{ category: 'intro' }];
        const r = await kbService.getArticleCategories('tenant', 't1');
        expect(r).toBeDefined();
    });

    // === Related ===
    it('getRelatedArticles', async () => {
        ms.data = [sampleArticle];
        const r = await kbService.getRelatedArticles('a1');
        expect(r).toBeDefined();
    });
});
