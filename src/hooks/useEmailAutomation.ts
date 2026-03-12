/**
 * Email Automation Hooks
 * React Query hooks for email templates, campaigns, and analytics
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase as _supabase } from '@/integrations/supabase/client';
const supabase = _supabase as any;
import { toast } from 'sonner';

// Types
export interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    html_content: string;
    template_type: 'transactional' | 'marketing' | 'onboarding';
    variables: string[];
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface EmailCampaign {
    id: string;
    name: string;
    template_id?: string;
    subject: string;
    status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
    target_audience?: any;
    scheduled_at?: string;
    sent_at?: string;
    sent_count: number;
    open_count: number;
    click_count: number;
    created_by: string;
    created_at: string;
    updated_at: string;
    // Joined fields
    template_name?: string;
    created_by_email?: string;
}

export interface EmailAnalytics {
    id: string;
    name: string;
    status: string;
    sent_count: number;
    open_count: number;
    click_count: number;
    open_rate: number;
    click_rate: number;
    click_through_rate: number;
    created_at: string;
    sent_at?: string;
    created_by_email?: string;
}

export interface CreateTemplateData {
    name: string;
    subject: string;
    html_content: string;
    template_type: EmailTemplate['template_type'];
    variables?: string[];
}

export interface CreateCampaignData {
    name: string;
    template_id?: string;
    subject: string;
    target_audience?: any;
    scheduled_at?: string;
}

// ============ EMAIL TEMPLATES ============

export function useEmailTemplates(type?: string) {
    return useQuery({
        queryKey: ['email-templates', type],
        queryFn: async () => {
            let query = supabase
                .from('email_templates')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (type) {
                query = query.eq('template_type', type);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data as EmailTemplate[];
        }
    });
}

export function useEmailTemplate(id: string) {
    return useQuery({
        queryKey: ['email-template', id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('email_templates')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data as EmailTemplate;
        },
        enabled: !!id
    });
}

export function useCreateEmailTemplate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (templateData: CreateTemplateData) => {
            const { data, error } = await supabase
                .from('email_templates')
                .insert(templateData)
                .select()
                .single();

            if (error) throw error;
            return data as EmailTemplate;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['email-templates'] });
            toast.success('Email template created successfully');
        },
        onError: (error: any) => {
            toast.error(`Failed to create template: ${error.message}`);
        }
    });
}

export function useUpdateEmailTemplate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<CreateTemplateData> }) => {
            const { data, error } = await supabase
                .from('email_templates')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as EmailTemplate;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['email-templates'] });
            queryClient.invalidateQueries({ queryKey: ['email-template', variables.id] });
            toast.success('Template updated successfully');
        },
        onError: (error: any) => {
            toast.error(`Failed to update template: ${error.message}`);
        }
    });
}

export function useDeleteEmailTemplate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            // Soft delete by setting is_active to false
            const { error } = await supabase
                .from('email_templates')
                .update({ is_active: false })
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['email-templates'] });
            toast.success('Template deleted successfully');
        },
        onError: (error: any) => {
            toast.error(`Failed to delete template: ${error.message}`);
        }
    });
}

// ============ EMAIL CAMPAIGNS ============

export function useEmailCampaigns(status?: string) {
    return useQuery({
        queryKey: ['email-campaigns', status],
        queryFn: async () => {
            let query = supabase
                .from('email_campaigns')
                .select(`
                    *,
                    template:email_templates(name),
                    creator:auth.users!created_by(email)
                `)
                .order('created_at', { ascending: false });

            if (status) {
                query = query.eq('status', status);
            }

            const { data, error } = await query;
            if (error) throw error;

            return (data || []).map((campaign: any) => ({
                ...campaign,
                template_name: campaign.template?.name,
                created_by_email: campaign.creator?.email
            })) as EmailCampaign[];
        }
    });
}

export function useEmailCampaign(id: string) {
    return useQuery({
        queryKey: ['email-campaign', id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('email_campaigns')
                .select(`
                    *,
                    template:email_templates(name, subject, html_content),
                    creator:auth.users!created_by(email)
                `)
                .eq('id', id)
                .single();

            if (error) throw error;

            return {
                ...data,
                template_name: data.template?.name,
                created_by_email: data.creator?.email
            } as EmailCampaign;
        },
        enabled: !!id
    });
}

export function useCreateEmailCampaign() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (campaignData: CreateCampaignData) => {
            const { data: { user } } = await supabase.auth.getUser();

            const { data, error } = await supabase
                .from('email_campaigns')
                .insert({
                    ...campaignData,
                    created_by: user?.id,
                    status: 'draft'
                })
                .select()
                .single();

            if (error) throw error;
            return data as EmailCampaign;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
            toast.success('Campaign created successfully');
        },
        onError: (error: any) => {
            toast.error(`Failed to create campaign: ${error.message}`);
        }
    });
}

export function useUpdateEmailCampaign() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<CreateCampaignData> }) => {
            const { data, error } = await supabase
                .from('email_campaigns')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as EmailCampaign;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
            queryClient.invalidateQueries({ queryKey: ['email-campaign', variables.id] });
            toast.success('Campaign updated successfully');
        },
        onError: (error: any) => {
            toast.error(`Failed to update campaign: ${error.message}`);
        }
    });
}

export function useScheduleCampaign() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, scheduledAt }: { id: string; scheduledAt: string }) => {
            const { data, error } = await supabase
                .from('email_campaigns')
                .update({
                    scheduled_at: scheduledAt,
                    status: 'scheduled'
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as EmailCampaign;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
            toast.success('Campaign scheduled successfully');
        },
        onError: (error: any) => {
            toast.error(`Failed to schedule campaign: ${error.message}`);
        }
    });
}

export function useCancelCampaign() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { data, error } = await supabase
                .from('email_campaigns')
                .update({ status: 'cancelled' })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as EmailCampaign;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
            toast.success('Campaign cancelled');
        },
        onError: (error: any) => {
            toast.error(`Failed to cancel campaign: ${error.message}`);
        }
    });
}

// ============ ANALYTICS ============

export function useEmailAnalytics() {
    return useQuery({
        queryKey: ['email-analytics'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('email_analytics')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as EmailAnalytics[];
        }
    });
}

export function useTemplatePerformance() {
    return useQuery({
        queryKey: ['template-performance'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('template_performance')
                .select('*')
                .order('avg_open_rate', { ascending: false });

            if (error) throw error;
            return data;
        }
    });
}

// ============ TEST SEND ============

export function useSendTestEmail() {
    return useMutation({
        mutationFn: async ({ templateId, testEmail }: { templateId: string; testEmail: string }) => {
            // This would integrate with your send-email Edge Function
            const response = await fetch(`${supabase.supabaseUrl}/functions/v1/send-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
                },
                body: JSON.stringify({
                    templateId,
                    to: testEmail,
                    isTest: true
                })
            });

            if (!response.ok) {
                throw new Error('Failed to send test email');
            }

            return response.json();
        },
        onSuccess: () => {
            toast.success('Test email sent successfully');
        },
        onError: (error: any) => {
            toast.error(`Failed to send test email: ${error.message}`);
        }
    });
}
