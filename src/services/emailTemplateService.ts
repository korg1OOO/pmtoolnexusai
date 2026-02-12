/**
 * Email Template Service
 * Admin service for managing editable email templates
 */

import { supabase } from '@/integrations/supabase/client';

export interface EmailTemplate {
    id: string;
    template_key: string;
    name: string;
    description: string | null;
    subject_template: string;
    html_template: string;
    text_template: string | null;
    variables: TemplateVariable[];
    category: 'billing' | 'engagement' | 'system' | 'marketing';
    is_active: boolean;
    version: number;
    created_at: string;
    updated_at: string;
}

export interface TemplateVariable {
    key: string;
    description: string;
    example?: string;
}

export interface TemplateVersion {
    id: string;
    parent_template_id: string;
    version: number;
    subject_template: string;
    html_template: string;
    change_notes: string | null;
    created_at: string;
    created_by: string | null;
}

export const emailTemplateService = {
    // Get all templates
    async getAllTemplates(category?: string) {
        let query = supabase
            .from('email_templates_admin')
            .select('*')
            .order('category', { ascending: true })
            .order('name', { ascending: true });

        if (category) {
            query = query.eq('category', category);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as EmailTemplate[];
    },

    // Get single template
    async getTemplate(id: string) {
        const { data, error } = await supabase
            .from('email_templates_admin')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as EmailTemplate;
    },

    // Get template by key
    async getTemplateByKey(key: string) {
        const { data, error } = await supabase
            .from('email_templates_admin')
            .select('*')
            .eq('template_key', key)
            .single();

        if (error) throw error;
        return data as EmailTemplate;
    },

    // Create template
    async createTemplate(template: Partial<EmailTemplate>) {
        const { data: user } = await supabase.auth.getUser();

        const { data, error } = await supabase
            .from('email_templates_admin')
            .insert({
                ...template,
                created_by: user.user?.id,
                updated_by: user.user?.id,
            })
            .select()
            .single();

        if (error) throw error;
        return data as EmailTemplate;
    },

    // Update template
    async updateTemplate(id: string, updates: Partial<EmailTemplate>) {
        const { data: user } = await supabase.auth.getUser();

        const { data, error } = await supabase
            .from('email_templates_admin')
            .update({
                ...updates,
                updated_by: user.user?.id,
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as EmailTemplate;
    },

    // Delete template
    async deleteTemplate(id: string) {
        const { error } = await supabase
            .from('email_templates_admin')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Get version history
    async getVersionHistory(templateId: string) {
        const { data, error } = await supabase
            .from('email_template_versions')
            .select('*')
            .eq('parent_template_id', templateId)
            .order('version', { ascending: false });

        if (error) throw error;
        return data as TemplateVersion[];
    },

    // Rollback to version
    async rollbackToVersion(templateId: string, versionId: string) {
        const { data: version, error: versionError } = await supabase
            .from('email_template_versions')
            .select('*')
            .eq('id', versionId)
            .single();

        if (versionError) throw versionError;

        const { data: user } = await supabase.auth.getUser();

        const { data, error } = await supabase
            .from('email_templates_admin')
            .update({
                subject_template: version.subject_template,
                html_template: version.html_template,
                updated_by: user.user?.id,
            })
            .eq('id', templateId)
            .select()
            .single();

        if (error) throw error;
        return data as EmailTemplate;
    },

    // Test send email
    async testSendEmail(templateId: string, testEmail: string, testData: Record<string, any>) {
        const { data, error } = await supabase.functions.invoke('email-processor', {
            body: {
                action: 'test_send',
                template_id: templateId,
                test_email: testEmail,
                test_data: testData,
            },
        });

        if (error) throw error;
        return data;
    },

    // Validate template HTML
    validateTemplate(html: string): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Check for basic HTML structure
        if (!html.includes('<html') || !html.includes('</html>')) {
            errors.push('Missing HTML document structure');
        }

        // Check for unclosed tags (basic check)
        const openTags = (html.match(/<(?!\/)[a-z][^>]*>/gi) || []).length;
        const closeTags = (html.match(/<\/[a-z][^>]*>/gi) || []).length;
        if (openTags !== closeTags) {
            errors.push('Possible unclosed HTML tags detected');
        }

        // Check for dangerous scripts
        if (html.includes('<script')) {
            errors.push('Script tags are not allowed in email templates');
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    },

    // Replace variables in template
    replaceVariables(template: string, variables: Record<string, string>): string {
        let result = template;
        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
            result = result.replace(regex, value);
        }
        return result;
    },
};
