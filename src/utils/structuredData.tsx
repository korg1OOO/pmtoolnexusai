/**
 * Structured Data (JSON-LD) Generator
 * Creates schema.org structured data for better SEO
 */

interface BlogPostStructuredData {
    title: string;
    description: string;
    author: string;
    publishedDate: string;
    modifiedDate?: string;
    image?: string;
    url: string;
    tags?: string[];
}

interface FAQStructuredData {
    question: string;
    answer: string;
}

interface OrganizationStructuredData {
    name: string;
    url: string;
    logo: string;
    description: string;
    sameAs?: string[];
}

export function generateBlogPostSchema(data: BlogPostStructuredData) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: data.title,
        description: data.description,
        image: data.image,
        author: {
            '@type': 'Person',
            name: data.author,
        },
        publisher: {
            '@type': 'Organization',
            name: 'ProjectOye',
            logo: {
                '@type': 'ImageObject',
                url: 'https://projectoye.com/logo.png',
            },
        },
        datePublished: data.publishedDate,
        dateModified: data.modifiedDate || data.publishedDate,
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': data.url,
        },
        keywords: data.tags?.join(', '),
    };
}

export function generateFAQSchema(faqs: FAQStructuredData[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map(faq => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
            },
        })),
    };
}

export function generateOrganizationSchema(data: OrganizationStructuredData) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: data.name,
        url: data.url,
        logo: data.logo,
        description: data.description,
        sameAs: data.sameAs || [],
    };
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url,
        })),
    };
}

/**
 * Component to inject structured data into page
 */
interface StructuredDataProps {
    data: object;
}

export function StructuredData({ data }: StructuredDataProps) {
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
    );
}
