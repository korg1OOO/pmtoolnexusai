/**
 * Tests for utils/sitemap (80 lines, 3 functions)
 * generateSitemap (pure XML generation), generateSitemapFromContent, downloadSitemap
 */
import { describe, it, expect, vi } from 'vitest';

// Mock the content management hook types
vi.mock('@/hooks/useContentManagement', () => ({
    // Just type exports, no actual values needed
}));

import { generateSitemap, generateSitemapFromContent, downloadSitemap } from '@/utils/sitemap';

// =================== generateSitemap ===================
describe('generateSitemap', () => {
    it('generates valid XML with empty URLs', () => {
        const xml = generateSitemap([]);
        expect(xml).toContain('<?xml version="1.0"');
        expect(xml).toContain('<urlset');
        expect(xml).toContain('</urlset>');
    });

    it('generates URL entries', () => {
        const xml = generateSitemap([{ loc: 'https://example.com', priority: 1.0, changefreq: 'daily' }]);
        expect(xml).toContain('<loc>https://example.com</loc>');
        expect(xml).toContain('<priority>1</priority>');
        expect(xml).toContain('<changefreq>daily</changefreq>');
    });

    it('omits optional fields when absent', () => {
        const xml = generateSitemap([{ loc: 'https://example.com' }]);
        expect(xml).toContain('<loc>https://example.com</loc>');
        expect(xml).not.toContain('<lastmod>');
    });

    it('includes lastmod when provided', () => {
        const xml = generateSitemap([{ loc: 'https://example.com', lastmod: '2024-01-01' }]);
        expect(xml).toContain('<lastmod>2024-01-01</lastmod>');
    });

    it('handles multiple URLs', () => {
        const xml = generateSitemap([
            { loc: 'https://example.com/a' },
            { loc: 'https://example.com/b' },
            { loc: 'https://example.com/c' },
        ]);
        expect(xml).toContain('https://example.com/a');
        expect(xml).toContain('https://example.com/b');
        expect(xml).toContain('https://example.com/c');
    });
});

// =================== generateSitemapFromContent ===================
describe('generateSitemapFromContent', () => {
    const baseUrl = 'https://app.example.com';

    it('includes static pages', () => {
        const xml = generateSitemapFromContent(baseUrl, [], [], []);
        expect(xml).toContain(`${baseUrl}`);
        expect(xml).toContain(`${baseUrl}/about`);
        expect(xml).toContain(`${baseUrl}/contact`);
        expect(xml).toContain(`${baseUrl}/privacy`);
        expect(xml).toContain(`${baseUrl}/faqs`);
        expect(xml).toContain(`${baseUrl}/blog`);
        expect(xml).toContain(`${baseUrl}/docs`);
    });

    it('includes blog posts', () => {
        const posts = [
            { id: '1', slug: 'hello-world', title: 'Hello', content: '', status: 'published', author_id: 'a1', created_at: '2024-01-01', updated_at: '2024-06-15', published_at: '2024-01-01' },
        ];
        const xml = generateSitemapFromContent(baseUrl, posts as any, [], []);
        expect(xml).toContain(`${baseUrl}/blog/hello-world`);
        expect(xml).toContain('2024-06-15');
    });

    it('includes docs', () => {
        const docs = [
            { id: 'doc1', title: 'Setup Guide', content: '', category: 'getting-started', order_index: 0, author_id: 'a1', created_at: '2024-01-01', updated_at: '2024-03-01' },
        ];
        const xml = generateSitemapFromContent(baseUrl, [], [], docs as any);
        expect(xml).toContain(`${baseUrl}/docs?id=doc1`);
    });
});

// =================== downloadSitemap ===================
describe('downloadSitemap', () => {
    it('creates and clicks download link', () => {
        const mockLink = { href: '', download: '', click: vi.fn() };
        vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
        vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
        vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);
        const origURL = globalThis.URL;
        globalThis.URL.createObjectURL = vi.fn(() => 'blob:test');
        globalThis.URL.revokeObjectURL = vi.fn();

        downloadSitemap('<xml>test</xml>');
        expect(mockLink.click).toHaveBeenCalled();
        expect(mockLink.download).toBe('sitemap.xml');
    });

    it('uses custom filename', () => {
        const mockLink = { href: '', download: '', click: vi.fn() };
        vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
        vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
        vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);
        globalThis.URL.createObjectURL = vi.fn(() => 'blob:test');
        globalThis.URL.revokeObjectURL = vi.fn();

        downloadSitemap('<xml>test</xml>', 'custom.xml');
        expect(mockLink.download).toBe('custom.xml');
    });
});
