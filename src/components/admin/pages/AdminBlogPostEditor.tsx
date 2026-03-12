/**
 * Admin Blog Post Editor
 * Comprehensive editor for blog posts with SEO and publishing controls
 */

import React, { useState, useEffect } from 'react';
import {
    Save,
    ArrowLeft,
    Eye,
    Image as ImageIcon,
    Globe,
    Settings,
    Clock,
    Check
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    useBlogPost,
    useCreateBlogPost,
    useUpdateBlogPost,
    useCategories,
    useBlogTags,
    BlogPost
} from '@/hooks/useContentManagement';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export function AdminBlogPostEditor() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isEditing = !!id && id !== 'new';

    const { data: categories = [] } = useCategories('blog');
    const { data: existingTags = [] } = useBlogTags();
    const { data: post, isLoading } = useBlogPost(id || '');

    const createPost = useCreateBlogPost();
    const updatePost = useUpdateBlogPost();

    const [formData, setFormData] = useState<Partial<BlogPost>>({
        title: '',
        slug: '',
        content: '',
        excerpt: '',
        status: 'draft',
        category_id: '',
        featured_image_url: '',
        meta_title: '',
        meta_description: '',
        meta_keywords: [],
        reading_time_minutes: 5
    });

    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [newTag, setNewTag] = useState('');

    useEffect(() => {
        if (post) {
            setFormData({
                ...post,
                meta_keywords: post.meta_keywords || []
            });
            setSelectedTags(post.tags || []);
        }
    }, [post]);

    const handleSave = async (statusOverride?: BlogPost['status']) => {
        if (!formData.title || !formData.content) {
            toast.error('Title and content are required');
            return;
        }

        const data = {
            ...formData,
            status: statusOverride || formData.status,
            tags: selectedTags
        };

        try {
            if (isEditing) {
                await updatePost.mutateAsync({ id: id!, updates: data });
            } else {
                const newPost = await createPost.mutateAsync(data);
                navigate(`/admin/blog/${newPost.id}/edit`);
            }
        } catch (error) {
            // Error handled by hook
        }
    };

    const handleTagAdd = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && newTag.trim()) {
            e.preventDefault();
            if (!selectedTags.includes(newTag.trim())) {
                setSelectedTags([...selectedTags, newTag.trim()]);
            }
            setNewTag('');
        }
    };

    const removeTag = (tag: string) => {
        setSelectedTags(selectedTags.filter(t => t !== tag));
    };

    if (isLoading && isEditing) {
        return <div className="p-8 text-center">Loading post...</div>;
    }

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            {/* Header Toolbar */}
            <div className="flex items-center justify-between sticky top-0 z-10 bg-background/80 backdrop-blur-sm py-4 border-b">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/admin/content')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">{isEditing ? 'Edit Post' : 'New Blog Post'}</h1>
                        <p className="text-sm text-muted-foreground">
                            {formData.status === 'published' ? 'Published' : 'Draft'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => handleSave('draft')}>
                        Save Draft
                    </Button>
                    <Button onClick={() => handleSave('published')}>
                        <Globe className="mr-2 h-4 w-4" />
                        {formData.status === 'published' ? 'Update & Sync' : 'Publish Post'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Content</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    className="text-lg font-bold"
                                    placeholder="Enter post title..."
                                    value={formData.title}
                                    onChange={(e) => {
                                        const title = e.target.value;
                                        setFormData({
                                            ...formData,
                                            title,
                                            slug: title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
                                        });
                                    }}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="slug">Slug</Label>
                                <div className="flex gap-2">
                                    <span className="text-muted-foreground self-center text-sm">/blog/</span>
                                    <Input
                                        id="slug"
                                        placeholder="url-slug"
                                        value={formData.slug}
                                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="excerpt">Excerpt / Summary</Label>
                                <Textarea
                                    id="excerpt"
                                    placeholder="A brief summary for previews..."
                                    rows={3}
                                    value={formData.excerpt}
                                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="content">Post Content</Label>
                                <RichTextEditor
                                    content={formData.content || ''}
                                    onChange={(content) => setFormData({ ...formData, content })}
                                    placeholder="Start writing your blog post..."
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Controls */}
                <div className="space-y-6">
                    {/* Publishing Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Publishing</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground flex items-center gap-1">
                                    <Settings className="h-3 w-3" /> Status
                                </span>
                                <Badge variant={formData.status === 'published' ? 'default' : 'secondary'} className={formData.status === 'published' ? 'bg-green-600' : ''}>
                                    {formData.status?.toUpperCase()}
                                </Badge>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Select
                                    value={formData.category_id}
                                    onValueChange={(val) => setFormData({ ...formData, category_id: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Tags</Label>
                                <div className="flex flex-wrap gap-1 mb-2">
                                    {selectedTags.map(tag => (
                                        <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                                            {tag}
                                            <Button variant="ghost" size="icon" className="h-3 w-3 p-0 hover:bg-transparent" onClick={() => removeTag(tag)}>
                                                <X className="h-2 w-2" />
                                            </Button>
                                        </Badge>
                                    ))}
                                </div>
                                <Input
                                    placeholder="Add tag and press enter..."
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    onKeyDown={handleTagAdd}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="reading-time">Reading Time (mins)</Label>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="reading-time"
                                        type="number"
                                        value={formData.reading_time_minutes}
                                        onChange={(e) => setFormData({ ...formData, reading_time_minutes: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Featured Image */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Featured Image</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {formData.featured_image_url ? (
                                <div className="relative aspect-video rounded-lg overflow-hidden border">
                                    <img src={formData.featured_image_url} alt="Featured" className="w-full h-full object-cover" />
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-1 right-1 h-6 w-6 rounded-full"
                                        onClick={() => setFormData({ ...formData, featured_image_url: '' })}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="aspect-video rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">Select from Library</span>
                                </div>
                            )}
                            <Input
                                placeholder="Or enter image URL..."
                                value={formData.featured_image_url}
                                onChange={(e) => setFormData({ ...formData, featured_image_url: e.target.value })}
                            />
                        </CardContent>
                    </Card>

                    {/* SEO Metadata */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">SEO Metadata</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1 group">
                                <Label htmlFor="meta-title" className="text-xs">Meta Title</Label>
                                <Input
                                    id="meta-title"
                                    placeholder="SEO Title..."
                                    className="text-sm"
                                    value={formData.meta_title}
                                    onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                                />
                                <div className="flex justify-between text-[10px] text-muted-foreground">
                                    <span>Chars: {formData.meta_title?.length || 0}/60</span>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="meta-desc" className="text-xs">Meta Description</Label>
                                <Textarea
                                    id="meta-desc"
                                    placeholder="Search engine summary..."
                                    className="text-sm resize-none"
                                    rows={3}
                                    value={formData.meta_description}
                                    onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                                />
                                <div className="flex justify-between text-[10px] text-muted-foreground">
                                    <span>Chars: {formData.meta_description?.length || 0}/160</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// Internal icons helper
const X = ({ className, ...props }: any) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...props}
    >
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
    </svg>
)
