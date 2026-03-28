/**
 * Lighthouse CI Configuration
 * 
 * Run: npx @lhci/cli@latest autorun
 * 
 * Measures: Performance, Accessibility, Best Practices, SEO
 */
module.exports = {
    ci: {
        collect: {
            url: [
                'http://localhost:8080/',
                'http://localhost:8080/auth',
                'http://localhost:8080/pricing',
            ],
            startServerCommand: 'npm run preview',
            startServerReadyPattern: 'Local:',
            numberOfRuns: 3,
        },
        assert: {
            assertions: {
                'categories:performance': ['warn', { minScore: 0.7 }],
                'categories:accessibility': ['error', { minScore: 0.9 }],
                'categories:best-practices': ['warn', { minScore: 0.8 }],
                'categories:seo': ['warn', { minScore: 0.8 }],
                'first-contentful-paint': ['warn', { maxNumericValue: 3000 }],
                'interactive': ['warn', { maxNumericValue: 5000 }],
                'largest-contentful-paint': ['warn', { maxNumericValue: 4000 }],
                'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
            },
        },
        upload: {
            target: 'filesystem',
            outputDir: './lighthouse-reports',
        },
    },
};
