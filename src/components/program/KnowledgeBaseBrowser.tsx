import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    BookOpen,
    Search,
    Star,
    TrendingUp,
    ThumbsUp,
    ThumbsDown,
    Eye,
    Tag,
    Folder,
    Plus,
    Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    getKnowledgeArticles,
    getFeaturedArticles,
    getPopularArticles,
    getArticleCategories,
    incrementViewCount,
    markArticleHelpful
} from '@/services/knowledgeBaseService';

interface KnowledgeBaseBrowserProps {
    scope: string;
    scopeId: string;
}

export function KnowledgeBaseBrowser({ scope, scopeId }: KnowledgeBaseBrowserProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedType, setSelectedType] = useState<string>('all');

    // Fetch data
    const { data: articles = [], isLoading } = useQuery({
        queryKey: ['knowledge-articles', scope, scopeId],
        queryFn: () => getKnowledgeArticles(scope, scopeId)
    });

    const { data: featured = [] } = useQuery({
        queryKey: ['featured-articles', scope, scopeId],
        queryFn: () => getFeaturedArticles(scope, scopeId)
    });

    const { data: popular = [] } = useQuery({
        queryKey: ['popular-articles', scope, scopeId],
        queryFn: () => getPopularArticles(scope, scopeId, 5)
    });

    const { data: categories = [] } = useQuery({
        queryKey: ['article-categories', scope, scopeId],
        queryFn: () => getArticleCategories(scope, scopeId)
    });

    // Filter articles
    const filteredArticles = articles.filter(article => {
        const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            article.summary?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
        const matchesType = selectedType === 'all' || article.article_type === selectedType;
        return matchesSearch && matchesCategory && matchesType;
    });

    const handleArticleClick = async (articleId: string) => {
        await incrementViewCount(articleId);
    };

    const handleHelpful = async (articleId: string, helpful: boolean) => {
        await markArticleHelpful(articleId, helpful);
    };

    const articleTypes = [
        { value: 'how-to', label: 'How-To Guides' },
        { value: 'troubleshooting', label: 'Troubleshooting' },
        { value: 'best-practice', label: 'Best Practices' },
        { value: 'faq', label: 'FAQ' },
        { value: 'reference', label: 'Reference' },
        { value: 'tutorial', label: 'Tutorial' }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Knowledge Base</h2>
                    <p className="text-muted-foreground">
                        Searchable knowledge articles and best practices
                    </p>
                </div>
                <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Article
                </Button>
            </div>

            {/* Featured Articles */}
            {featured.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-500" />
                        <h3 className="font-semibold">Featured Articles</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {featured.slice(0, 4).map(article => (
                            <motion.div
                                key={article.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                                onClick={() => handleArticleClick(article.id)}
                            >
                                <div className="flex items-start gap-3">
                                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium line-clamp-1">{article.title}</h4>
                                        {article.summary && (
                                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                                {article.summary}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Eye className="w-3 h-3" />
                                                {article.view_count}
                                            </span>
                                            <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded">
                                                {article.article_type}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Search and Filters */}
            <div className="flex gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search knowledge base..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-48">
                        <Folder className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map(cat => (
                            <SelectItem key={cat.category} value={cat.category}>
                                {cat.category} ({cat.count})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-48">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {articleTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                                {type.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {articleTypes.map(type => {
                    const count = articles.filter(a => a.article_type === type.value).length;
                    return (
                        <motion.button
                            key={type.value}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedType(type.value)}
                            className={`p-3 rounded-lg border text-left transition-colors ${selectedType === type.value
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'bg-card hover:bg-accent'
                                }`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <BookOpen className="w-4 h-4" />
                                <span className="font-medium text-sm">{type.label}</span>
                            </div>
                            <p className="text-xs opacity-70">{count} articles</p>
                        </motion.button>
                    );
                })}
            </div>

            {/* Articles List */}
            <div className="space-y-3">
                {isLoading ? (
                    <div className="text-center py-12 text-muted-foreground">
                        Loading articles...
                    </div>
                ) : filteredArticles.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No articles found</p>
                    </div>
                ) : (
                    filteredArticles.map(article => (
                        <motion.div
                            key={article.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => handleArticleClick(article.id)}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <BookOpen className="w-5 h-5 text-green-500 flex-shrink-0" />
                                        <h3 className="font-medium line-clamp-1">{article.title}</h3>
                                        {article.is_featured && (
                                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                                        )}
                                    </div>
                                    {article.summary && (
                                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                            {article.summary}
                                        </p>
                                    )}
                                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs">
                                            {article.article_type}
                                        </span>
                                        {article.category && (
                                            <span className="flex items-center gap-1">
                                                <Folder className="w-3 h-3" />
                                                {article.category}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <Eye className="w-3 h-3" />
                                            {article.view_count} views
                                        </span>
                                        {article.helpful_count > 0 && (
                                            <span className="flex items-center gap-1">
                                                <ThumbsUp className="w-3 h-3" />
                                                {article.helpful_count}
                                            </span>
                                        )}
                                        {article.tags && article.tags.length > 0 && (
                                            <span className="flex items-center gap-1">
                                                <Tag className="w-3 h-3" />
                                                {article.tags.slice(0, 2).join(', ')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleHelpful(article.id, true);
                                        }}
                                    >
                                        <ThumbsUp className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleHelpful(article.id, false);
                                        }}
                                    >
                                        <ThumbsDown className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Popular Articles Sidebar */}
            {popular.length > 0 && (
                <div className="bg-card border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-5 h-5 text-blue-500" />
                        <h3 className="font-semibold">Popular Articles</h3>
                    </div>
                    <div className="space-y-2">
                        {popular.map((article, index) => (
                            <div
                                key={article.id}
                                className="flex items-start gap-2 p-2 rounded hover:bg-accent cursor-pointer transition-colors"
                                onClick={() => handleArticleClick(article.id)}
                            >
                                <span className="text-lg font-bold text-muted-foreground">
                                    {index + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium line-clamp-2">{article.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {article.view_count} views
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
