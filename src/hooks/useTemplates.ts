
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProjectTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    methodology: string;
    complexity: string;
    icon: string;
    color: string;
    content: any;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    usage_count: number;
    tags: string[];
    // Flattened properties from content
    phases: any[];
    roles: any[];
    risks: any[];
    [key: string]: any;
}

export function useTemplates() {
    return useQuery({
        queryKey: ['project-templates'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('project_templates')
                .select('*')
                .eq('is_active', true)
                .order('category', { ascending: true })
                .order('name', { ascending: true });

            if (error) throw error;

            // Map content to top-level properties
            return data.map((t: any) => ({
                ...t,
                ...t.content, // Spread content (phases, roles, etc.)
                id: t.id, // Ensure ID is preserved
                isActive: t.is_active, // Map to existing UI expectations
                usageCount: t.usage_count,
                createdAt: t.created_at,
                updatedAt: t.updated_at,
            })) as ProjectTemplate[];
        },
    });
}

export function useTemplate(id: string | null) {
    return useQuery({
        queryKey: ['project-template', id],
        queryFn: async () => {
            if (!id) return null;
            const { data, error } = await supabase
                .from('project_templates')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            const t = data as any;
            return {
                ...t,
                ...t.content,
                id: t.id,
                isActive: t.is_active,
                usageCount: t.usage_count,
                createdAt: t.created_at,
                updatedAt: t.updated_at,
            } as ProjectTemplate;
        },
        enabled: !!id,
    });
}

interface CreateProjectFromTemplateInput {
    templateId: string;
    name: string;
    description: string;
    ownerId: string;
    organizationId?: string;
    startDate: Date;
}

export function useCreateProjectFromTemplate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            templateId,
            name,
            description,
            ownerId,
            organizationId,
            startDate,
        }: CreateProjectFromTemplateInput) => {
            const { data, error } = await supabase.rpc('create_project_from_template', {
                p_template_id: templateId,
                p_name: name,
                p_description: description,
                p_owner_id: ownerId,
                p_organization_id: organizationId,
                p_start_date: startDate.toISOString().split('T')[0],
            });

            if (error) throw error;
            return data;
        },
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            // We don't toast here to allow custom handling in UI if needed, but it is fine to toast too.
        },
        onError: (error) => {
            console.error('Failed to create project from template:', error);
            toast.error('Failed to create project from template');
        },
    });
}
