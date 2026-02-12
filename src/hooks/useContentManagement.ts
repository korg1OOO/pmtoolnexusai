/**
 * Content Management Hooks
 * React Query hooks for FAQ, blog, documentation, and media management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ==============================================
// TYPES
// ==============================================

export interface ContentCategory {
    id: string;
    name: string;
    slug: string;
    type: 'faq' | 'blog' | 'docs';
    description?: string;
    icon?: string;
    display_order: number;
    created_at: string;
    updated_at: string;
}

export interface FAQ {
    id: string;
    category_id?: string;
    question: string;
    answer: string;
    keywords?: string[];
    display_order: number;
    is_published: boolean;
    view_count: number;
    helpful_count: number;
    not_helpful_count: number;
    created_by?: string;
    updated_by?: string;
    created_at: string;
    updated_at: string;
    // Joined fields
    category_name?: string;
    category_slug?: string;
}

export interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt?: string;
    content: string;
    featured_image_url?: string;
    category_id?: string;
    author_id?: string;
    status: 'draft' | 'review' | 'published' | 'archived';
    view_count: number;
    likes_count: number;
    reading_time_minutes?: number;
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string[];
    published_at?: string;
    scheduled_for?: string;
    created_at: string;
    updated_at: string;
    // Joined fields
    category_name?: string;
    author_email?: string;
    tags?: string[];
}

export interface BlogTag {
    id: string;
    name: string;
    slug: string;
    usage_count: number;
    created_at: string;
}

export interface Documentation {
    id: string;
    title: string;
    slug: string;
    content: string;
    category_id?: string;
    version: string;
    order_index: number;
    parent_id?: string;
    is_published: boolean;
    view_count: number;
    meta_description?: string;
    created_by?: string;
    updated_by?: string;
    created_at: string;
    updated_at: string;
    // Joined fields
    category_name?: string;
    parent_title?: string;
    parent_slug?: string;
}

export interface MediaFile {
    id: string;
    filename: string;
    original_filename: string;
    storage_path: string;
    public_url: string;
    file_type: string;
    file_size: number;
    mime_type?: string;
    width?: number;
    height?: number;
    duration?: number;
    alt_text?: string;
    caption?: string;
    folder: string;
    tags?: string[];
    uploaded_by?: string;
    created_at: string;
    updated_at: string;
}

// ==============================================
// CATEGORY HOOKS
// ==============================================

export function useCategories(type?: 'faq' | 'blog' | 'docs') {
    return useQuery({
        queryKey: ['content-categories', type],
        queryFn: async () => {
            let query = supabase
                .from('content_categories')
                .select('*')
                .order('display_order');

            if (type) {
                query = query.eq('type', type);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data as ContentCategory[];
        },
    });
}

export function useCreateCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (category: Omit<ContentCategory, 'id' | 'created_at' | 'updated_at'>) => {
            const { data, error } = await supabase
                .from('content_categories')
                .insert(category)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['content-categories'] });
            toast.success('Category created successfully');
        },
        onError: (error) => {
            toast.error(`Failed to create category: ${error.message}`);
        },
    });
}

// ==============================================
// FAQ HOOKS
// ==============================================

export function useFAQs(categoryId?: string, publishedOnly = false) {
    return useQuery({
        queryKey: ['faqs', categoryId, publishedOnly],
        queryFn: async () => {
            const viewName = publishedOnly ? 'published_faqs' : 'faqs';
            let query = supabase.from(viewName).select('*');

            if (categoryId) {
                query = query.eq('category_id', categoryId);
            }

            if (!publishedOnly) {
                query = query.is('deleted_at', null);
            }

            query = query.order('display_order').order('created_at', { ascending: false });

            const { data, error } = await query;

            if (error) throw error;
            return data as FAQ[];
        },
    });
}

export function useCreateFAQ() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (faq: Partial<FAQ>) => {
            const { data: user } = await supabase.auth.getUser();

            const { data, error } = await supabase
                .from('faqs')
                .insert({
                    ...faq,
                    created_by: user.user?.id,
                    updated_by: user.user?.id,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['faqs'] });
            toast.success('FAQ created successfully');
        },
        onError: (error) => {
            toast.error(`Failed to create FAQ: ${error.message}`);
        },
    });
}

export function useUpdateFAQ() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<FAQ> }) => {
            const { data: user } = await supabase.auth.getUser();

            const { data, error } = await supabase
                .from('faqs')
                .update({
                    ...updates,
                    updated_by: user.user?.id,
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['faqs'] });
            toast.success('FAQ updated successfully');
        },
        onError: (error) => {
            toast.error(`Failed to update FAQ: ${error.message}`);
        },
    });
}

export function useDeleteFAQ() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('faqs')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['faqs'] });
            toast.success('FAQ deleted successfully');
        },
        onError: (error) => {
            toast.error(`Failed to delete FAQ: ${error.message}`);
        },
    });
}

export function useToggleFAQPublish() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
            const { error } = await supabase
                .from('faqs')
                .update({ is_published })
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['faqs'] });
            toast.success(`FAQ ${variables.is_published ? 'published' : 'unpublished'}`);
        },
        onError: (error) => {
            toast.error(`Failed to update FAQ: ${error.message}`);
        },
    });
}

// ==============================================
// BLOG HOOKS
// ==============================================

export function useBlogPosts(filters?: { status?: string; categoryId?: string }) {
    return useQuery({
        queryKey: ['blog-posts', filters],
        queryFn: async () => {
            let query = supabase
                .from('blog_posts')
                .select('*')
                .is('deleted_at', null);

            if (filters?.status) {
                query = query.eq('status', filters.status);
            }

            if (filters?.categoryId) {
                query = query.eq('category_id', filters.categoryId);
            }

            query = query.order('created_at', { ascending: false });

            const { data, error } = await query;

            if (error) throw error;
            return data as BlogPost[];
        },
    });
}

export function usePublishedBlogPosts(limit = 20) {
    return useQuery({
        queryKey: ['published-blog-posts', limit],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('published_blog_posts')
                .select('*')
                .limit(limit);

            if (error) throw error;
            return data as BlogPost[];
        },
    });
}

export function useBlogPost(slug: string) {
    return useQuery({
        queryKey: ['blog-post', slug],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('blog_posts')
                .select('*')
                .eq('slug', slug)
                .single();

            if (error) throw error;

            // Increment view count
            await supabase.rpc('increment_content_views', {
                content_type: 'blog',
                content_id: data.id,
            });

            return data as BlogPost;
        },
        enabled: !!slug,
    });
}

export function useCreateBlogPost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (post: Partial<BlogPost>) => {
            const { data: user } = await supabase.auth.getUser();

            const { data, error } = await supabase
                .from('blog_posts')
                .insert({
                    ...post,
                    author_id: user.user?.id,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
            toast.success('Blog post created successfully');
        },
        onError: (error) => {
            toast.error(`Failed to create blog post: ${error.message}`);
        },
    });
}

export function useUpdateBlogPost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<BlogPost> }) => {
            const { data, error } = await supabase
                .from('blog_posts')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
            queryClient.invalidateQueries({ queryKey: ['published-blog-posts'] });
            toast.success('Blog post updated successfully');
        },
        onError: (error) => {
            toast.error(`Failed to update blog post: ${error.message}`);
        },
    });
}

export function useDeleteBlogPost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('blog_posts')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
            toast.success('Blog post deleted successfully');
        },
        onError: (error) => {
            toast.error(`Failed to delete blog post: ${error.message}`);
        },
    });
}

export function usePublishBlogPost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, status }: { id: string; status: 'draft' | 'review' | 'published' | 'archived' }) => {
            const updates: any = { status };

            if (status === 'published') {
                updates.published_at = new Date().toISOString();
            }

            const { error } = await supabase
                .from('blog_posts')
                .update(updates)
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
            queryClient.invalidateQueries({ queryKey: ['published-blog-posts'] });
            toast.success(`Blog post ${variables.status}`);
        },
        onError: (error) => {
            toast.error(`Failed to update blog post: ${error.message}`);
        },
    });
}

// ==============================================
// BLOG TAG HOOKS
// ==============================================

export function useBlogTags() {
    return useQuery({
        queryKey: ['blog-tags'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('blog_tags')
                .select('*')
                .order('usage_count', { ascending: false });

            if (error) throw error;
            return data as BlogTag[];
        },
    });
}

// ==============================================
// DOCUMENTATION HOOKS
// ==============================================

export function useDocumentation(version = 'v1.0', publishedOnly = false) {
    return useQuery({
        queryKey: ['documentation', version, publishedOnly],
        queryFn: async () => {
            const viewName = publishedOnly ? 'published_documentation' : 'documentation';
            const { data, error } = await supabase
                .from(viewName)
                .select('*')
                .eq('version', version);

            if (!publishedOnly) {
                const query = supabase
                    .from('documentation')
                    .select('*')
                    .eq('version', version)
                    .is('deleted_at', null);

                const result = await query;
                if (result.error) throw result.error;
                return result.data as Documentation[];
            }

            if (error) throw error;
            return data as Documentation[];
        },
    });
}

export function useDocBySlug(slug: string, version: string) {
    return useQuery({
        queryKey: ['doc', slug, version],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('documentation')
                .select('*')
                .eq('slug', slug)
                .eq('version', version)
                .single();

            if (error) throw error;

            // Increment view count
            await supabase.rpc('increment_content_views', {
                content_type: 'docs',
                content_id: data.id,
            });

            return data as Documentation;
        },
        enabled: !!slug && !!version,
    });
}

export function useCreateDoc() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (doc: Partial<Documentation>) => {
            const { data: user } = await supabase.auth.getUser();

            const { data, error } = await supabase
                .from('documentation')
                .insert({
                    ...doc,
                    created_by: user.user?.id,
                    updated_by: user.user?.id,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documentation'] });
            toast.success('Documentation created successfully');
        },
        onError: (error) => {
            toast.error(`Failed to create documentation: ${error.message}`);
        },
    });
}

export function useUpdateDoc() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Documentation> }) => {
            const { data: user } = await supabase.auth.getUser();

            const { data, error } = await supabase
                .from('documentation')
                .update({
                    ...updates,
                    updated_by: user.user?.id,
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documentation'] });
            toast.success('Documentation updated successfully');
        },
        onError: (error) => {
            toast.error(`Failed to update documentation: ${error.message}`);
        },
    });
}

export function useDeleteDoc() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('documentation')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documentation'] });
            toast.success('Documentation deleted successfully');
        },
        onError: (error) => {
            toast.error(`Failed to delete documentation: ${error.message}`);
        },
    });
}

// ==============================================
// MEDIA LIBRARY HOOKS
// ==============================================

export function useMediaLibrary(folder?: string) {
    return useQuery({
        queryKey: ['media-library', folder],
        queryFn: async () => {
            let query = supabase
                .from('media_library')
                .select('*')
                .is('deleted_at', null)
                .order('created_at', { ascending: false });

            if (folder) {
                query = query.eq('folder', folder);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data as MediaFile[];
        },
    });
}

export function useUploadMedia() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (file: File) => {
            const { data: user } = await supabase.auth.getUser();

            // Upload to Supabase Storage
            const filename = `${Date.now()}-${file.name}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('media')
                .upload(filename, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('media')
                .getPublicUrl(filename);

            // Insert metadata
            const { data, error } = await supabase
                .from('media_library')
                .insert({
                    filename,
                    original_filename: file.name,
                    storage_path: uploadData.path,
                    public_url: urlData.publicUrl,
                    file_type: file.type.split('/')[0],
                    file_size: file.size,
                    mime_type: file.type,
                    uploaded_by: user.user?.id,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['media-library'] });
            toast.success('File uploaded successfully');
        },
        onError: (error) => {
            toast.error(`Failed to upload file: ${error.message}`);
        },
    });
}

export function useUpdateMedia() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<MediaFile> }) => {
            const { data, error } = await supabase
                .from('media_library')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['media-library'] });
            toast.success('Media updated successfully');
        },
        onError: (error) => {
            toast.error(`Failed to update media: ${error.message}`);
        },
    });
}

export function useDeleteMedia() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            // Get media file info
            const { data: media } = await supabase
                .from('media_library')
                .select('storage_path')
                .eq('id', id)
                .single();

            if (media) {
                // Delete from storage
                await supabase.storage
                    .from('media')
                    .remove([media.storage_path]);
            }

            // Soft delete from database
            const { error } = await supabase
                .from('media_library')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['media-library'] });
            toast.success('Media deleted successfully');
        },
        onError: (error) => {
            toast.error(`Failed to delete media: ${error.message}`);
        },
    });
}
