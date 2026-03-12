/**
 * Sitemap Generator
 * Generates XML sitemap for SEO
 */

import { BlogPost, FAQ, Documentation } from '@/hooks/useContentManagement';

interface SitemapUrl {
    loc: string;
    lastmod?: string;
    changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
    priority?: number;
}

export function generateSitemap(urls: SitemapUrl[]): string {
    const urlsXml = urls.map(url => `
  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority !== undefined ? `<priority>${url.priority}</priority>` : ''}
  </url>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</urlset>`;
}

export function generateSitemapFromContent(
    baseUrl: string,
    blogPosts: BlogPost[],
    faqs: FAQ[],
    docs: Documentation[]
): string {
    const urls: SitemapUrl[] = [
        // Static pages
        { loc: baseUrl, changefreq: 'daily', priority: 1.0 },
        { loc: `${baseUrl}/about`, changefreq: 'monthly', priority: 0.8 },
        { loc: `${baseUrl}/contact`, changefreq: 'monthly', priority: 0.7 },
        { loc: `${baseUrl}/privacy`, changefreq: 'yearly', priority: 0.5 },
        { loc: `${baseUrl}/faqs`, changefreq: 'weekly', priority: 0.9 },
        { loc: `${baseUrl}/blog`, changefreq: 'daily', priority: 0.9 },
        { loc: `${baseUrl}/docs`, changefreq: 'weekly', priority: 0.9 },

        // Blog posts
        ...blogPosts.map(post => ({
            loc: `${baseUrl}/blog/${post.slug}`,
            lastmod: new Date(post.updated_at).toISOString().split('T')[0],
            changefreq: 'weekly' as const,
            priority: 0.8
        })),

        // Documentation pages
        ...docs.map(doc => ({
            loc: `${baseUrl}/docs?id=${doc.id}`,
            lastmod: new Date(doc.updated_at).toISOString().split('T')[0],
            changefreq: 'weekly' as const,
            priority: 0.7
        }))
    ];

    return generateSitemap(urls);
}

/**
 * Downloads sitemap as XML file
 */
export function downloadSitemap(content: string, filename = 'sitemap.xml') {
    const blob = new Blob([content], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
