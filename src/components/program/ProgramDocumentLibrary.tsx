import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    FileText,
    BookOpen,
    File,
    Search,
    Filter,
    Upload,
    Plus,
    Tag,
    Folder,
    Clock,
    TrendingUp,
    Star
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
    getProgramDocuments,
    getProgramKnowledgeArticles,
    getProgramTemplates,
    getLibraryStats,
    getDocumentCategories
} from '@/services/programDocumentLibraryService';

interface ProgramDocumentLibraryProps {
    programId: string;
}

export function ProgramDocumentLibrary({ programId }: ProgramDocumentLibraryProps) {
    const [activeTab, setActiveTab] = useState<'documents' | 'knowledge' | 'templates'>('documents');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    // Fetch data
    const { data: documents = [], isLoading: docsLoading } = useQuery({
        queryKey: ['program-documents', programId],
        queryFn: () => getProgramDocuments(programId)
    });

    const { data: articles = [], isLoading: articlesLoading } = useQuery({
        queryKey: ['program-articles', programId],
        queryFn: () => getProgramKnowledgeArticles(programId)
    });

    const { data: templates = [], isLoading: templatesLoading } = useQuery({
        queryKey: ['program-templates', programId],
        queryFn: () => getProgramTemplates(programId)
    });

    const { data: stats } = useQuery({
        queryKey: ['library-stats', programId],
        queryFn: () => getLibraryStats(programId)
    });

    const { data: categories = [] } = useQuery({
        queryKey: ['document-categories', programId],
        queryFn: () => getDocumentCategories(programId)
    });

    // Filter data based on search and category
    const filteredDocuments = documents.filter(doc => {
        const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const filteredArticles = articles.filter(article => {
        const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const filteredTemplates = templates.filter(template => {
        const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Document Library</h2>
                    <p className="text-muted-foreground">
                        Centralized repository for program documents, knowledge, and templates
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                    </Button>
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Create
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-card border rounded-lg p-4"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Documents</p>
                                <p className="text-2xl font-bold">{stats.total_documents}</p>
                            </div>
                            <FileText className="w-8 h-8 text-blue-500" />
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-card border rounded-lg p-4"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Knowledge Articles</p>
                                <p className="text-2xl font-bold">{stats.total_articles}</p>
                            </div>
                            <BookOpen className="w-8 h-8 text-green-500" />
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-card border rounded-lg p-4"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Templates</p>
                                <p className="text-2xl font-bold">{stats.total_templates}</p>
                            </div>
                            <File className="w-8 h-8 text-purple-500" />
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex items-center gap-4 border-b">
                <button
                    onClick={() => setActiveTab('documents')}
                    className={`pb-3 px-4 font-medium transition-colors relative ${activeTab === 'documents'
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <FileText className="w-4 h-4 inline mr-2" />
                    Documents
                    {activeTab === 'documents' && (
                        <motion.div
                            layoutId="activeTab"
                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                        />
                    )}
                </button>

                <button
                    onClick={() => setActiveTab('knowledge')}
                    className={`pb-3 px-4 font-medium transition-colors relative ${activeTab === 'knowledge'
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <BookOpen className="w-4 h-4 inline mr-2" />
                    Knowledge Base
                    {activeTab === 'knowledge' && (
                        <motion.div
                            layoutId="activeTab"
                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                        />
                    )}
                </button>

                <button
                    onClick={() => setActiveTab('templates')}
                    className={`pb-3 px-4 font-medium transition-colors relative ${activeTab === 'templates'
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <File className="w-4 h-4 inline mr-2" />
                    Templates
                    {activeTab === 'templates' && (
                        <motion.div
                            layoutId="activeTab"
                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                        />
                    )}
                </button>
            </div>

            {/* Search and Filter */}
            <div className="flex gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-48">
                        <Filter className="w-4 h-4 mr-2" />
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
            </div>

            {/* Content */}
            <div className="space-y-3">
                {activeTab === 'documents' && (
                    <>
                        {docsLoading ? (
                            <div className="text-center py-12 text-muted-foreground">
                                Loading documents...
                            </div>
                        ) : filteredDocuments.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>No documents found</p>
                            </div>
                        ) : (
                            filteredDocuments.map(doc => (
                                <motion.div
                                    key={doc.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-5 h-5 text-blue-500" />
                                                <h3 className="font-medium">{doc.name}</h3>
                                                {doc.sharing_scope !== 'project' && (
                                                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                                                        Shared - {doc.sharing_scope}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                                {doc.category && (
                                                    <span className="flex items-center gap-1">
                                                        <Folder className="w-3 h-3" />
                                                        {doc.category}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(doc.created_at).toLocaleDateString()}
                                                </span>
                                                {doc.tags && doc.tags.length > 0 && (
                                                    <span className="flex items-center gap-1">
                                                        <Tag className="w-3 h-3" />
                                                        {doc.tags.slice(0, 2).join(', ')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </>
                )}

                {activeTab === 'knowledge' && (
                    <>
                        {articlesLoading ? (
                            <div className="text-center py-12 text-muted-foreground">
                                Loading articles...
                            </div>
                        ) : filteredArticles.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>No knowledge articles found</p>
                            </div>
                        ) : (
                            filteredArticles.map(article => (
                                <motion.div
                                    key={article.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <BookOpen className="w-5 h-5 text-green-500" />
                                                <h3 className="font-medium">{article.title}</h3>
                                                {article.is_featured && (
                                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                )}
                                            </div>
                                            {article.summary && (
                                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                                    {article.summary}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                                                    {article.article_type}
                                                </span>
                                                {article.category && (
                                                    <span className="flex items-center gap-1">
                                                        <Folder className="w-3 h-3" />
                                                        {article.category}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <TrendingUp className="w-3 h-3" />
                                                    {article.view_count} views
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </>
                )}

                {activeTab === 'templates' && (
                    <>
                        {templatesLoading ? (
                            <div className="text-center py-12 text-muted-foreground">
                                Loading templates...
                            </div>
                        ) : filteredTemplates.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <File className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>No templates found</p>
                            </div>
                        ) : (
                            filteredTemplates.map(template => (
                                <motion.div
                                    key={template.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <File className="w-5 h-5 text-purple-500" />
                                                <h3 className="font-medium">{template.name}</h3>
                                            </div>
                                            {template.description && (
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {template.description}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                                {template.category && (
                                                    <span className="flex items-center gap-1">
                                                        <Folder className="w-3 h-3" />
                                                        {template.category}
                                                    </span>
                                                )}
                                                <span>Used {template.usage_count} times</span>
                                            </div>
                                        </div>
                                        <Button size="sm" variant="outline">
                                            Use Template
                                        </Button>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
