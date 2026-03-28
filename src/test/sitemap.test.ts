/**
 * Sitemap Generator — Deep Tests
 * Tests generateSitemap and generateSitemapFromContent pure functions
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/hooks/useContentManagement', () => ({}));

import { generateSitemap, generateSitemapFromContent } from '@/utils/sitemap';

describe('sitemap', () => {
    describe('generateSitemap', () => {
        it('generates valid XML header', () => {
            const result = generateSitemap([]);
            expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
        });

        it('generates urlset wrapper', () => {
            const result = generateSitemap([]);
            expect(result).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
            expect(result).toContain('</urlset>');
        });

        it('includes url loc', () => {
            const result = generateSitemap([{ loc: 'https://example.com' }]);
            expect(result).toContain('<loc>https://example.com</loc>');
        });

        it('includes lastmod when provided', () => {
            const result = generateSitemap([{ loc: 'https://example.com', lastmod: '2024-01-01' }]);
            expect(result).toContain('<lastmod>2024-01-01</lastmod>');
        });

        it('omits lastmod when not provided', () => {
            const result = generateSitemap([{ loc: 'https://example.com' }]);
            expect(result).not.toContain('<lastmod>');
        });

        it('includes changefreq when provided', () => {
            const result = generateSitemap([{ loc: 'https://example.com', changefreq: 'daily' }]);
            expect(result).toContain('<changefreq>daily</changefreq>');
        });

        it('includes priority when provided', () => {
            const result = generateSitemap([{ loc: 'https://example.com', priority: 0.8 }]);
            expect(result).toContain('<priority>0.8</priority>');
        });

        it('handles multiple URLs', () => {
            const result = generateSitemap([
                { loc: 'https://example.com/a' },
                { loc: 'https://example.com/b' },
            ]);
            expect(result).toContain('<loc>https://example.com/a</loc>');
            expect(result).toContain('<loc>https://example.com/b</loc>');
        });

        it('handles empty array', () => {
            const result = generateSitemap([]);
            expect(result).toContain('<urlset');
            expect(result).toContain('</urlset>');
        });
    });

    describe('generateSitemapFromContent', () => {
        it('includes static pages', () => {
            const result = generateSitemapFromContent('https://app.com', [], [], []);
            expect(result).toContain('<loc>https://app.com</loc>');
            expect(result).toContain('<loc>https://app.com/about</loc>');
            expect(result).toContain('<loc>https://app.com/contact</loc>');
            expect(result).toContain('<loc>https://app.com/privacy</loc>');
            expect(result).toContain('<loc>https://app.com/faqs</loc>');
            expect(result).toContain('<loc>https://app.com/blog</loc>');
            expect(result).toContain('<loc>https://app.com/docs</loc>');
        });

        it('includes blog posts with slugs', () => {
            const posts = [{ slug: 'hello-world', updated_at: '2024-01-01T00:00:00Z' }];
            const result = generateSitemapFromContent('https://app.com', posts as any, [], []);
            expect(result).toContain('<loc>https://app.com/blog/hello-world</loc>');
        });

        it('includes documentation pages', () => {
            const docs = [{ id: 'doc-1', updated_at: '2024-06-01T00:00:00Z' }];
            const result = generateSitemapFromContent('https://app.com', [], [], docs as any);
            expect(result).toContain('<loc>https://app.com/docs?id=doc-1</loc>');
        });

        it('sets correct priorities for static pages', () => {
            const result = generateSitemapFromContent('https://app.com', [], [], []);
            expect(result).toContain('<priority>1</priority>'); // home
            expect(result).toContain('<priority>0.8</priority>'); // about
        });

        it('sets lastmod for blog posts', () => {
            const posts = [{ slug: 'test', updated_at: '2024-03-15T12:00:00Z' }];
            const result = generateSitemapFromContent('https://app.com', posts as any, [], []);
            expect(result).toContain('<lastmod>2024-03-15</lastmod>');
        });
    });
});
