/**
 * Email Template Hooks
 * React Query hooks for email template management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { emailTemplateService, EmailTemplate } from '@/services/emailTemplateService';
import { toast } from 'sonner';

export function useEmailTemplates(category?: string) {
    return useQuery({
        queryKey: ['email-templates', category],
        queryFn: () => emailTemplateService.getAllTemplates(category),
    });
}

export function useEmailTemplate(id: string) {
    return useQuery({
        queryKey: ['email-template', id],
        queryFn: () => emailTemplateService.getTemplate(id),
        enabled: !!id,
    });
}

export function useTemplateVersionHistory(templateId: string) {
    return useQuery({
        queryKey: ['template-versions', templateId],
        queryFn: () => emailTemplateService.getVersionHistory(templateId),
        enabled: !!templateId,
    });
}

export function useCreateTemplate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (template: Partial<EmailTemplate>) =>
            emailTemplateService.createTemplate(template),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['email-templates'] });
            toast.success('Template created successfully');
        },
        onError: (error: Error) => {
            toast.error(`Failed to create template: ${error.message}`);
        },
    });
}

export function useUpdateTemplate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<EmailTemplate> }) =>
            emailTemplateService.updateTemplate(id, updates),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['email-templates'] });
            queryClient.invalidateQueries({ queryKey: ['email-template', data.id] });
            toast.success('Template updated successfully');
        },
        onError: (error: Error) => {
            toast.error(`Failed to update template: ${error.message}`);
        },
    });
}

export function useDeleteTemplate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => emailTemplateService.deleteTemplate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['email-templates'] });
            toast.success('Template deleted successfully');
        },
        onError: (error: Error) => {
            toast.error(`Failed to delete template: ${error.message}`);
        },
    });
}

export function useRollbackTemplate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ templateId, versionId }: { templateId: string; versionId: string }) =>
            emailTemplateService.rollbackToVersion(templateId, versionId),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['email-templates'] });
            queryClient.invalidateQueries({ queryKey: ['email-template', data.id] });
            queryClient.invalidateQueries({ queryKey: ['template-versions', data.id] });
            toast.success('Template rolled back successfully');
        },
        onError: (error: Error) => {
            toast.error(`Failed to rollback template: ${error.message}`);
        },
    });
}

export function useTestSendEmail() {
    return useMutation({
        mutationFn: ({
            templateId,
            testEmail,
            testData,
        }: {
            templateId: string;
            testEmail: string;
            testData: Record<string, any>;
        }) => emailTemplateService.testSendEmail(templateId, testEmail, testData),
        onSuccess: () => {
            toast.success('Test email sent successfully');
        },
        onError: (error: Error) => {
            toast.error(`Failed to send test email: ${error.message}`);
        },
    });
}
