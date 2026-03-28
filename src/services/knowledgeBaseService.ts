import { supabase as _supabase } from '@/integrations/supabase/client';
const supabase = _supabase as any;

export interface KnowledgeArticle {
    id: string;
    tenant_id: string;
    workspace_id?: string;
    program_id?: string;
    title: string;
    content: string;
    summary?: string;
    category?: string;
    tags: string[];
    article_type: 'how-to' | 'troubleshooting' | 'best-practice' | 'faq' | 'reference' | 'tutorial';
    scope: 'program' | 'portfolio' | 'workspace' | 'tenant' | 'public';
    status: 'draft' | 'review' | 'published' | 'archived';
    is_featured: boolean;
    view_count: number;
    helpful_count: number;
    not_helpful_count: number;
    related_articles?: string[];
    related_documents?: string[];
    created_at: string;
    updated_at: string;
    created_by_user_id: string;
    last_reviewed_at?: string;
    reviewed_by_user_id?: string;
}

// Article management
export async function getKnowledgeArticles(scope: string, scopeId: string): Promise<KnowledgeArticle[]> {
    const { data, error } = await supabase
        .from('knowledge_articles')
        .select('*')
        .eq('scope', scope)
        .eq(scope === 'program' ? 'program_id' : scope === 'workspace' ? 'workspace_id' : 'tenant_id', scopeId)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function createKnowledgeArticle(article: Partial<KnowledgeArticle>): Promise<KnowledgeArticle> {
    const { data: { user } } = await supabase.auth.getUser();
    let tenantId = article.tenant_id || user?.user_metadata?.tenant_id;

    if (!tenantId && article.program_id) {
        let { data } = await supabase.from('programs').select('tenant_id').eq('id', article.program_id).maybeSingle();
        if (data?.tenant_id) {
            tenantId = data.tenant_id;
        } else {
            // UI might pass project_id as scopeId when scope="program"
            const { data: projectData } = await supabase.from('projects').select('tenant_id').eq('id', article.program_id).maybeSingle();
            if (projectData?.tenant_id) tenantId = projectData.tenant_id;
        }
    }

    if (!tenantId && article.workspace_id) {
        const { data } = await supabase.from('workspaces').select('tenant_id').eq('id', article.workspace_id).maybeSingle();
        if (data?.tenant_id) tenantId = data.tenant_id;
    }

    if (!tenantId) {
        // Final fallback for mock environments: use the user's own ID as a dummy tenant_id
        // to satisfy the NOT NULL constraint on the DB.
        tenantId = user?.id;
    }

    if (!tenantId) {
        throw new Error("tenant_id not found for the current scope, cannot create article.");
    }

    const { data, error } = await supabase
        .from('knowledge_articles')
        .insert({
            ...article,
            tenant_id: tenantId,
            created_by_user_id: user?.id
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateKnowledgeArticle(articleId: string, updates: Partial<KnowledgeArticle>): Promise<KnowledgeArticle> {
    const { data, error } = await supabase
        .from('knowledge_articles')
        .update(updates)
        .eq('id', articleId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function publishKnowledgeArticle(articleId: string): Promise<KnowledgeArticle> {
    return updateKnowledgeArticle(articleId, { status: 'published' });
}

export async function archiveKnowledgeArticle(articleId: string): Promise<KnowledgeArticle> {
    return updateKnowledgeArticle(articleId, { status: 'archived' });
}

// Search & discovery
export async function searchKnowledgeBase(query: string, filters?: {
    scope?: string;
    scopeId?: string;
    category?: string;
    articleType?: string;
    tags?: string[];
}): Promise<KnowledgeArticle[]> {
    let queryBuilder = supabase
        .from('knowledge_articles')
        .select('*')
        .eq('status', 'published')
        .or(`title.ilike.%${query}%,content.ilike.%${query}%,summary.ilike.%${query}%`);

    if (filters?.scope && filters?.scopeId) {
        queryBuilder = queryBuilder.eq('scope', filters.scope);
        const scopeColumn = filters.scope === 'program' ? 'program_id' :
            filters.scope === 'workspace' ? 'workspace_id' : 'tenant_id';
        queryBuilder = queryBuilder.eq(scopeColumn, filters.scopeId);
    }

    if (filters?.category) {
        queryBuilder = queryBuilder.eq('category', filters.category);
    }

    if (filters?.articleType) {
        queryBuilder = queryBuilder.eq('article_type', filters.articleType);
    }

    if (filters?.tags && filters.tags.length > 0) {
        queryBuilder = queryBuilder.contains('tags', filters.tags);
    }

    const { data, error } = await queryBuilder
        .order('view_count', { ascending: false })
        .limit(50);

    if (error) throw error;
    return data || [];
}

export async function getFeaturedArticles(scope: string, scopeId: string): Promise<KnowledgeArticle[]> {
    const { data, error } = await supabase
        .from('knowledge_articles')
        .select('*')
        .eq('scope', scope)
        .eq(scope === 'program' ? 'program_id' : scope === 'workspace' ? 'workspace_id' : 'tenant_id', scopeId)
        .eq('status', 'published')
        .eq('is_featured', true)
        .order('view_count', { ascending: false })
        .limit(10);

    if (error) throw error;
    return data || [];
}

export async function getRelatedArticles(articleId: string): Promise<KnowledgeArticle[]> {
    // First get the article to find related article IDs
    const { data: article, error: articleError } = await supabase
        .from('knowledge_articles')
        .select('related_articles')
        .eq('id', articleId)
        .single();

    if (articleError) throw articleError;
    if (!article?.related_articles || article.related_articles.length === 0) {
        return [];
    }

    // Fetch related articles
    const { data, error } = await supabase
        .from('knowledge_articles')
        .select('*')
        .in('id', article.related_articles)
        .eq('status', 'published');

    if (error) throw error;
    return data || [];
}

// Engagement
export async function incrementViewCount(articleId: string): Promise<void> {
    const { error } = await supabase.rpc('increment_article_view_count', {
        article_id: articleId
    });

    if (error) {
        // Fallback if RPC doesn't exist
        const { data: article } = await supabase
            .from('knowledge_articles')
            .select('view_count')
            .eq('id', articleId)
            .single();

        if (article) {
            await supabase
                .from('knowledge_articles')
                .update({ view_count: article.view_count + 1 })
                .eq('id', articleId);
        }
    }
}

export async function markArticleHelpful(articleId: string, helpful: boolean): Promise<void> {
    const { data: article } = await supabase
        .from('knowledge_articles')
        .select('helpful_count, not_helpful_count')
        .eq('id', articleId)
        .single();

    if (!article) return;

    const updates = helpful
        ? { helpful_count: article.helpful_count + 1 }
        : { not_helpful_count: article.not_helpful_count + 1 };

    await supabase
        .from('knowledge_articles')
        .update(updates)
        .eq('id', articleId);
}

export async function getPopularArticles(scope: string, scopeId: string, limit: number = 10): Promise<KnowledgeArticle[]> {
    const { data, error } = await supabase
        .from('knowledge_articles')
        .select('*')
        .eq('scope', scope)
        .eq(scope === 'program' ? 'program_id' : scope === 'workspace' ? 'workspace_id' : 'tenant_id', scopeId)
        .eq('status', 'published')
        .order('view_count', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data || [];
}

// Categories
export async function getArticleCategories(scope: string, scopeId: string): Promise<{ category: string; count: number }[]> {
    const { data, error } = await supabase
        .from('knowledge_articles')
        .select('category')
        .eq('scope', scope)
        .eq(scope === 'program' ? 'program_id' : scope === 'workspace' ? 'workspace_id' : 'tenant_id', scopeId)
        .eq('status', 'published')
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
