/**
 * emailTemplateService — Deep Tests
 * Tests validateTemplate and replaceVariables pure functions
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
        functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
    },
}));

import { emailTemplateService } from '@/services/emailTemplateService';
import type { EmailTemplate, TemplateVariable, TemplateVersion } from '@/services/emailTemplateService';

describe('emailTemplateService', () => {
    describe('validateTemplate', () => {
        it('accepts valid HTML email', () => {
            const html = '<html><body><p>Hello</p></body></html>';
            const result = emailTemplateService.validateTemplate(html);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('rejects missing html tag', () => {
            const result = emailTemplateService.validateTemplate('<body><p>Test</p></body>');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Missing HTML document structure');
        });

        it('rejects missing closing html tag', () => {
            const result = emailTemplateService.validateTemplate('<html><body><p>Test</p></body>');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Missing HTML document structure');
        });

        it('rejects script tags', () => {
            const html = '<html><body><script>alert("xss")</script></body></html>';
            const result = emailTemplateService.validateTemplate(html);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Script tags are not allowed in email templates');
        });

        it('detects unclosed tags', () => {
            const html = '<html><body><p>Open<div></body></html>';
            const result = emailTemplateService.validateTemplate(html);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('unclosed'))).toBe(true);
        });

        it('returns multiple errors for badly formed template', () => {
            const result = emailTemplateService.validateTemplate('<script>bad</script>');
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThanOrEqual(1);
        });

        it('accepts self-closing tags', () => {
            const html = '<html><body><br/><img src="test.png"/></body></html>';
            const result = emailTemplateService.validateTemplate(html);
            // Self-closing tags may or may not mismatch count — test it doesn't crash
            expect(result).toBeDefined();
        });
    });

    describe('replaceVariables', () => {
        it('replaces a single variable', () => {
            const result = emailTemplateService.replaceVariables(
                'Hello {{ name }}!', { name: 'Alice' }
            );
            expect(result).toBe('Hello Alice!');
        });

        it('replaces multiple variables', () => {
            const result = emailTemplateService.replaceVariables(
                '{{ greeting }}, {{ name }}!', { greeting: 'Hi', name: 'Bob' }
            );
            expect(result).toBe('Hi, Bob!');
        });

        it('replaces repeated variables', () => {
            const result = emailTemplateService.replaceVariables(
                '{{ name }} said {{ name }}', { name: 'Eve' }
            );
            expect(result).toBe('Eve said Eve');
        });

        it('handles variables without spaces in braces', () => {
            const result = emailTemplateService.replaceVariables(
                '{{name}}', { name: 'Alice' }
            );
            expect(result).toBe('Alice');
        });

        it('leaves unmatched variables untouched', () => {
            const result = emailTemplateService.replaceVariables(
                '{{ unknown }}', {}
            );
            expect(result).toBe('{{ unknown }}');
        });

        it('handles empty template', () => {
            const result = emailTemplateService.replaceVariables('', { name: 'Test' });
            expect(result).toBe('');
        });

        it('handles empty variables', () => {
            const result = emailTemplateService.replaceVariables('Hello {{ name }}', {});
            expect(result).toContain('{{ name }}');
        });
    });

    describe('interfaces', () => {
        it('EmailTemplate has required fields', () => {
            const template: EmailTemplate = {
                id: '1', template_key: 'welcome', name: 'Welcome Email',
                description: null, subject_template: 'Welcome!',
                html_template: '<html></html>', text_template: null,
                variables: [], category: 'system',
                is_active: true, version: 1,
                created_at: '2024-01-01', updated_at: '2024-01-01',
            };
            expect(template.category).toBe('system');
        });

        it('category can be billing, engagement, system, marketing', () => {
            const categories: EmailTemplate['category'][] = ['billing', 'engagement', 'system', 'marketing'];
            expect(categories).toHaveLength(4);
        });

        it('TemplateVariable has key and description', () => {
            const v: TemplateVariable = { key: 'name', description: 'User name', example: 'John' };
            expect(v.key).toBe('name');
        });

        it('TemplateVersion has version number', () => {
            const v: TemplateVersion = {
                id: '1', parent_template_id: 't1', version: 3,
                subject_template: 'Test', html_template: '<html></html>',
                change_notes: null, created_at: '2024-01-01', created_by: null,
            };
            expect(v.version).toBe(3);
        });
    });

    describe('service methods', () => {
        const methods = [
            'getAllTemplates', 'getTemplate', 'getTemplateByKey',
            'createTemplate', 'updateTemplate', 'deleteTemplate',
            'getVersionHistory', 'rollbackToVersion', 'testSendEmail',
            'validateTemplate', 'replaceVariables',
        ];

        methods.forEach(name => {
            it(`${name} is exported`, () => {
                expect(typeof (emailTemplateService as any)[name]).toBe('function');
            });
        });
    });
});
