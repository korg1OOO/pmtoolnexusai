import { supabase as _supabase } from '@/integrations/supabase/client';
const supabase = _supabase as any;
import { KnowledgeArticle } from './knowledgeBaseService';

export interface DocumentTemplate {
    id: string;
    tenant_id: string;
    workspace_id?: string;
    program_id?: string;
    name: string;
    description?: string;
    template_type: string;
    content: string;
    placeholders: any[];
    scope: 'program' | 'portfolio' | 'workspace' | 'tenant';
    category?: string;
    tags: string[];
    usage_count: number;
    created_at: string;
    updated_at: string;
    created_by_user_id?: string;
    is_active: boolean;
}

export interface ProgramDocument {
    id: string;
    project_id?: string;
    program_id?: string;
    name: string;
    file_type?: string;
    file_url?: string;
    sharing_scope: string;
    document_type: string;
    category?: string;
    tags: string[];
    created_at: string;
    updated_at: string;
}

export interface LibraryStats {
    total_documents: number;
    total_articles: number;
    total_templates: number;
    recent_documents: ProgramDocument[];
    popular_articles: KnowledgeArticle[];
}

// Library management
export async function getProgramDocuments(programId: string): Promise<ProgramDocument[]> {
    const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('program_id', programId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function getProgramKnowledgeArticles(programId: string): Promise<KnowledgeArticle[]> {
    const { data, error } = await supabase
        .from('knowledge_articles')
        .select('*')
        .eq('program_id', programId)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function getProgramTemplates(programId: string): Promise<DocumentTemplate[]> {
    const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .eq('program_id', programId)
        .eq('is_active', true)
        .order('usage_count', { ascending: false });

    if (error) throw error;
    return data || [];
}

// Organization
export async function getDocumentsByCategory(programId: string, category: string): Promise<ProgramDocument[]> {
    const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('program_id', programId)
        .eq('category', category)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function getDocumentsByTag(programId: string, tag: string): Promise<ProgramDocument[]> {
    const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('program_id', programId)
        .contains('tags', [tag])
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

// Statistics
export async function getLibraryStats(programId: string): Promise<LibraryStats> {
    // Get total documents count
    const { count: docsCount } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('program_id', programId);

    // Get total articles count
    const { count: articlesCount } = await supabase
        .from('knowledge_articles')
        .select('*', { count: 'exact', head: true })
        .eq('program_id', programId)
        .eq('status', 'published');

    // Get total templates count
    const { count: templatesCount } = await supabase
        .from('document_templates')
        .select('*', { count: 'exact', head: true })
        .eq('program_id', programId)
        .eq('is_active', true);

    // Get recent documents
    const { data: recentDocs } = await supabase
        .from('documents')
        .select('*')
        .eq('program_id', programId)
        .order('created_at', { ascending: false })
        .limit(5);

    // Get popular articles
    const { data: popularArticles } = await supabase
        .from('knowledge_articles')
        .select('*')
        .eq('program_id', programId)
        .eq('status', 'published')
        .order('view_count', { ascending: false })
        .limit(5);

    return {
        total_documents: docsCount || 0,
        total_articles: articlesCount || 0,
        total_templates: templatesCount || 0,
        recent_documents: recentDocs || [],
        popular_articles: popularArticles || []
    };
}

// Template management
export async function createDocumentTemplate(template: Partial<DocumentTemplate>): Promise<DocumentTemplate> {
    const { data, error } = await supabase
        .from('document_templates')
        .insert(template)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function createDocumentFromTemplate(
    templateId: string,
    documentData: {
        name: string;
        project_id?: string;
        program_id?: string;
        placeholderValues?: Record<string, string>;
    }
): Promise<ProgramDocument> {
    // Get template
    const { data: template, error: templateError } = await supabase
        .from('document_templates')
        .select('*')
        .eq('id', templateId)
        .single();

    if (templateError) throw templateError;

    // Replace placeholders in content
    let content = template.content;
    if (documentData.placeholderValues) {
        Object.entries(documentData.placeholderValues).forEach(([key, value]) => {
            content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
        });
    }

    // Create document
    const { data: document, error: docError } = await supabase
        .from('documents')
        .insert({
            name: documentData.name,
            project_id: documentData.project_id,
            program_id: documentData.program_id,
            parent_document_id: templateId,
            is_template: false,
            document_type: template.template_type,
            category: template.category,
            tags: template.tags
        })
        .select()
        .single();

    if (docError) throw docError;

    return document;
}

// Search
export async function searchProgramDocuments(
    programId: string,
    query: string,
    filters?: {
        category?: string;
        documentType?: string;
        tags?: string[];
    }
): Promise<ProgramDocument[]> {
    let queryBuilder = supabase
        .from('documents')
        .select('*')
        .eq('program_id', programId)
        .ilike('name', `%${query}%`);

    if (filters?.category) {
        queryBuilder = queryBuilder.eq('category', filters.category);
    }

    if (filters?.documentType) {
        queryBuilder = queryBuilder.eq('document_type', filters.documentType);
    }

    if (filters?.tags && filters.tags.length > 0) {
        queryBuilder = queryBuilder.contains('tags', filters.tags);
    }

    const { data, error } = await queryBuilder
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) throw error;
    return data || [];
}

// Categories
export async function getDocumentCategories(programId: string): Promise<{ category: string; count: number }[]> {
    const { data, error } = await supabase
        .from('documents')
        .select('category')
        .eq('program_id', programId)
        .not('category', 'is', null);

    if (error) throw error;

    // Count categories
    const categoryCounts: Record<string, number> = {};
    data?.forEach(item => {
        if (item.category) {
            categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
        }
    });

    return Object.entries(categoryCounts).map(([category, count]) => ({
        category,
        count
    })).sort((a, b) => b.count - a.count);
}
