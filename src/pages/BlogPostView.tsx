/**
 * Blog Post Detail View
 * Beautiful reading experience for individual blog posts
 */

import React, { useEffect } from 'react';
import { ArrowLeft, Calendar, Clock, Eye, Tag, Heart, Share2 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useBlogPost } from '@/hooks/useContentManagement';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { SEOMeta } from '@/components/seo/SEOMeta';
import { generateBlogPostSchema, StructuredData } from '@/utils/structuredData';

export default function BlogPostView() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { data: post, isLoading, error } = useBlogPost(slug || '');

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: post?.title,
                text: post?.excerpt,
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success('Link copied to clipboard!');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
                <div className="container mx-auto px-4 py-12 max-w-4xl">
                    <div className="animate-pulse space-y-6">
                        <div className="h-96 bg-slate-200 rounded-lg" />
                        <div className="h-12 bg-slate-200 rounded w-3/4" />
                        <div className="h-6 bg-slate-200 rounded w-1/2" />
                        <div className="space-y-3">
                            <div className="h-4 bg-slate-200 rounded" />
                            <div className="h-4 bg-slate-200 rounded" />
                            <div className="h-4 bg-slate-200 rounded w-5/6" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
                <Card className="max-w-md">
                    <CardContent className="p-12 text-center">
                        <h2 className="text-2xl font-bold mb-2">Post not found</h2>
                        <p className="text-muted-foreground mb-6">
                            The blog post you're looking for doesn't exist or has been removed.
                        </p>
                        <Button onClick={() => navigate('/blog')}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Blog
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Hero Section with Featured Image */}
            {post.featured_image_url && (
                <div className="relative h-96 bg-slate-900 overflow-hidden">
                    <img
                        src={post.featured_image_url}
                        alt={post.title}
                        className="w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                </div>
            )}

            {/* Content */}
            <div className="container mx-auto px-4 -mt-32 relative z-10 max-w-4xl">
                <article className="bg-white rounded-lg shadow-xl overflow-hidden">
                    {/* Header */}
                    <CardHeader className="p-8 md:p-12">
                        <div className="space-y-6">
                            {/* Back Button */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate('/blog')}
                                className="mb-4"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Blog
                            </Button>

                            {/* Category & Tags */}
                            <div className="flex flex-wrap gap-2">
                                {post.category_name && (
                                    <Badge className="bg-purple-600">
                                        {post.category_name}
                                    </Badge>
                                )}
                                {post.tags?.map((tag, i) => (
                                    <Badge key={i} variant="secondary">
                                        <Tag className="h-3 w-3 mr-1" />
                                        {tag}
                                    </Badge>
                                ))}
                            </div>

                            {/* Title */}
                            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                                {post.title}
                            </h1>

                            {/* Excerpt */}
                            {post.excerpt && (
                                <p className="text-xl text-muted-foreground leading-relaxed">
                                    {post.excerpt}
                                </p>
                            )}

                            {/* Meta Info */}
                            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground pt-4">
                                {post.published_at && (
                                    <span className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        {format(new Date(post.published_at), 'MMMM d, yyyy')}
                                    </span>
                                )}
                                {post.reading_time_minutes && (
                                    <span className="flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        {post.reading_time_minutes} min read
                                    </span>
                                )}
                                <span className="flex items-center gap-2">
                                    <Eye className="h-4 w-4" />
                                    {post.view_count || 0} views
                                </span>
                            </div>

                            <Separator />
                        </div>
                    </CardHeader>

                    {/* Article Content */}
                    <CardContent className="p-8 md:p-12 pt-0">
                        <div className="prose prose-slate prose-lg max-w-none">
                            {/* Simple markdown rendering - in production, use a proper markdown parser */}
                            <div className="whitespace-pre-wrap leading-relaxed">
                                {post.content}
                            </div>
                        </div>
                    </CardContent>

                    {/* Footer Actions */}
                    <CardFooter className="p-8 md:p-12 border-t bg-slate-50 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Button variant="outline" size="sm">
                                <Heart className="h-4 w-4 mr-2" />
                                Like ({post.likes_count || 0})
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleShare}>
                                <Share2 className="h-4 w-4 mr-2" />
                                Share
                            </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Last updated {format(new Date(post.updated_at), 'MMM d, yyyy')}
                        </p>
                    </CardFooter>
                </article>

                {/* Related/More Posts CTA */}
                <div className="text-center py-12">
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={() => navigate('/blog')}
                    >
                        Read More Articles
                    </Button>
                </div>
            </div>
        </div>
    );
}
