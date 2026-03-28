/**
 * Public Blog Listing
 * User-facing blog homepage with category filtering and search
 */

import React, { useState } from 'react';
import { Search, Calendar, Eye, Clock, ArrowRight, Tag } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCategories, usePublishedBlogPosts } from '@/hooks/useContentManagement';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

export default function PublicBlog() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const { data: categories = [] } = useCategories('blog');
    const { data: posts = [], isLoading } = usePublishedBlogPosts(50);

    // Filter posts
    const filteredPosts = posts.filter(post => {
        if (selectedCategory !== 'all' && post.category_id !== selectedCategory) return false;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                post.title.toLowerCase().includes(query) ||
                post.excerpt?.toLowerCase().includes(query) ||
                post.tags?.some(t => t.toLowerCase().includes(query))
            );
        }
        return true;
    });

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white py-16">
                <div className="container mx-auto px-4 max-w-5xl">
                    <div className="text-center mb-8">
                        <h1 className="text-5xl font-bold mb-4">Kiroxys Blog</h1>
                        <p className="text-xl text-purple-100">
                            Insights, tutorials, and updates from the team
                        </p>
                    </div>

                    {/* Search Bar */}
                    <div className="relative max-w-2xl mx-auto">
                        <Search className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
                        <Input
                            placeholder="Search articles..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 h-14 text-lg bg-white/95 border-0 shadow-lg"
                        />
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="container mx-auto px-4 py-12 max-w-6xl">
                <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-8">
                    <TabsList className="bg-white shadow-sm p-1 border">
                        <TabsTrigger value="all" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                            All Posts
                        </TabsTrigger>
                        {categories.map(cat => (
                            <TabsTrigger
                                key={cat.id}
                                value={cat.id}
                                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                            >
                                {cat.name}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <TabsContent value={selectedCategory}>
                        {isLoading ? (
                            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <Card key={i} className="animate-pulse">
                                        <CardHeader>
                                            <div className="h-48 bg-slate-200 rounded-lg mb-4" />
                                            <div className="h-6 bg-slate-200 rounded w-3/4 mb-2" />
                                            <div className="h-4 bg-slate-200 rounded w-full" />
                                        </CardHeader>
                                    </Card>
                                ))}
                            </div>
                        ) : filteredPosts.length === 0 ? (
                            <Card>
                                <CardContent className="py-16 text-center">
                                    <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                        <Search className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">No posts found</h3>
                                    <p className="text-muted-foreground">
                                        {searchQuery ? 'Try a different search term' : 'Check back soon for new articles'}
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                                {filteredPosts.map(post => (
                                    <BlogPostCard
                                        key={post.id}
                                        post={post}
                                        onClick={() => navigate(`/blog/${post.slug}`)}
                                    />
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                {/* Results Count */}
                {!isLoading && filteredPosts.length > 0 && (
                    <div className="mt-12 text-center text-sm text-muted-foreground">
                        Showing {filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'}
                        {searchQuery && ` for "${searchQuery}"`}
                    </div>
                )}
            </div>
        </div>
    );
}

function BlogPostCard({ post, onClick }: any) {
    return (
        <Card className="overflow-hidden hover:shadow-xl transition-all cursor-pointer group" onClick={onClick}>
            {/* Featured Image */}
            {post.featured_image_url && (
                <div className="aspect-video overflow-hidden bg-slate-100">
                    <img
                        src={post.featured_image_url}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                </div>
            )}

            <CardHeader>
                {/* Category & Tags */}
                <div className="flex flex-wrap gap-2 mb-2">
                    {post.category_name && (
                        <Badge variant="default" className="bg-purple-600">
                            {post.category_name}
                        </Badge>
                    )}
                    {post.tags?.slice(0, 2).map((tag: string, i: number) => (
                        <Badge key={i} variant="secondary">
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                        </Badge>
                    ))}
                </div>

                <CardTitle className="text-xl group-hover:text-purple-600 transition-colors line-clamp-2">
                    {post.title}
                </CardTitle>

                {post.excerpt && (
                    <CardDescription className="line-clamp-3 mt-2">
                        {post.excerpt}
                    </CardDescription>
                )}
            </CardHeader>

            <CardFooter className="border-t pt-4 flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                    {post.published_at && (
                        <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(post.published_at), 'MMM d, yyyy')}
                        </span>
                    )}
                    {post.reading_time_minutes && (
                        <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {post.reading_time_minutes} min
                        </span>
                    )}
                </div>
                <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {post.view_count || 0}
                </span>
            </CardFooter>
        </Card>
    );
}
