/**
 * Admin Blog Management
 * Blog post management with rich text editing and publishing workflow
 */

import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Calendar, Eye, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    useCategories,
    useBlogPosts,
    useDeleteBlogPost,
    BlogPost,
} from '@/hooks/useContentManagement';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export function AdminBlog() {
    const navigate = useNavigate();
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');

    // Fetch data
    const { data: categories = [] } = useCategories('blog');
    const { data: allPosts = [], isLoading } = useBlogPosts();
    const deleteBlogPost = useDeleteBlogPost();

    // Filter posts
    const filteredPosts = allPosts.filter((post) => {
        if (statusFilter !== 'all' && post.status !== statusFilter) return false;
        if (categoryFilter !== 'all' && post.category_id !== categoryFilter) return false;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                post.title.toLowerCase().includes(query) ||
                post.excerpt?.toLowerCase().includes(query)
            );
        }
        return true;
    });

    // Statistics
    const stats = {
        total: allPosts.length,
        published: allPosts.filter((p) => p.status === 'published').length,
        draft: allPosts.filter((p) => p.status === 'draft').length,
        review: allPosts.filter((p) => p.status === 'review').length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Blog Management</h1>
                    <p className="text-muted-foreground">
                        Manage blog posts and publishing workflow
                    </p>
                </div>
                <Button onClick={() => navigate('/admin/blog/new')}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Post
                </Button>
            </div>

            {/* Statistics */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Posts</CardDescription>
                        <CardTitle className="text-3xl">{stats.total}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Published</CardDescription>
                        <CardTitle className="text-3xl text-green-600">{stats.published}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>In Review</CardDescription>
                        <CardTitle className="text-3xl text-blue-600">{stats.review}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Drafts</CardDescription>
                        <CardTitle className="text-3xl text-yellow-600">{stats.draft}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Search & Filter</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search blog posts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Status</label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="review">In Review</SelectItem>
                                    <SelectItem value="published">Published</SelectItem>
                                    <SelectItem value="archived">Archived</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Category</label>
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Blog Posts List */}
            <div className="space-y-4">
                {isLoading ? (
                    <Card>
                        <CardContent className="py-8">
                            <p className="text-center text-muted-foreground">Loading posts...</p>
                        </CardContent>
                    </Card>
                ) : filteredPosts.length === 0 ? (
                    <Card>
                        <CardContent className="py-8">
                            <p className="text-center text-muted-foreground">
                                {searchQuery ? 'No posts match your search' : 'No blog posts yet'}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    filteredPosts.map((post) => (
                        <BlogPostCard
                            key={post.id}
                            post={post}
                            onEdit={() => navigate(`/admin/blog/${post.id}/edit`)}
                            onDelete={(id) => {
                                if (confirm('Are you sure you want to delete this post?')) {
                                    deleteBlogPost.mutate(id);
                                }
                            }}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

// Blog Post Card
interface BlogPostCardProps {
    post: BlogPost;
    onEdit: () => void;
    onDelete: (id: string) => void;
}

function BlogPostCard({ post, onEdit, onDelete }: BlogPostCardProps) {
    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: any; className?: string }> = {
            draft: { variant: 'secondary' },
            review: { variant: 'default', className: 'bg-blue-600' },
            published: { variant: 'default', className: 'bg-green-600' },
            archived: { variant: 'outline' },
        };
        return variants[status] || variants.draft;
    };

    return (
        <Card className="hover:border-primary transition-colors">
            <CardHeader>
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge {...getStatusBadge(post.status)}>
                                {post.status.toUpperCase()}
                            </Badge>
                            {post.category_name && (
                                <Badge variant="outline">{post.category_name}</Badge>
                            )}
                            {post.tags?.map((tag, i) => (
                                <Badge key={i} variant="secondary">
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                        <CardTitle className="text-xl cursor-pointer hover:text-primary" onClick={onEdit}>
                            {post.title}
                        </CardTitle>
                        {post.excerpt && (
                            <CardDescription>{post.excerpt}</CardDescription>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {post.published_at && (
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {format(new Date(post.published_at), 'MMM d, yyyy')}
                                </span>
                            )}
                            <span className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                {post.view_count} views
                            </span>
                            {post.reading_time_minutes && (
                                <span className="flex items-center gap-1">
                                    <FileText className="h-4 w-4" />
                                    {post.reading_time_minutes} min read
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={onEdit}>
                            <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(post.id)}
                        >
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
        </Card>
    );
}
