/**
 * Admin FAQ Management
 * Comprehensive FAQ management with categories, search, and inline editing
 */

import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, EyeOff, GripVertical, Save, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
    useCategories,
    useFAQs,
    useCreateFAQ,
    useUpdateFAQ,
    useDeleteFAQ,
    useToggleFAQPublish,
    FAQ,
} from '@/hooks/useContentManagement';
import { toast } from 'sonner';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';

export function AdminFAQs() {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);

    // Fetch data
    const { data: categories = [] } = useCategories('faq');
    const { data: faqs = [], isLoading } = useFAQs(
        selectedCategory === 'all' ? undefined : selectedCategory,
        false
    );

    // Mutations
    const createFAQ = useCreateFAQ();
    const updateFAQ = useUpdateFAQ();
    const deleteFAQ = useDeleteFAQ();
    const togglePublish = useToggleFAQPublish();
    const { confirm, ConfirmDialog } = useConfirmDialog();

    const handleDeleteFAQ = async (id: string) => {
        if (await confirm('Are you sure you want to delete this FAQ?', { confirmLabel: 'Delete', variant: 'destructive' })) {
            deleteFAQ.mutate(id);
        }
    };

    // Filter FAQs by search
    const filteredFAQs = faqs.filter((faq) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            faq.question.toLowerCase().includes(query) ||
            faq.answer.toLowerCase().includes(query) ||
            (faq.keywords && faq.keywords.some((k) => k.toLowerCase().includes(query)))
        );
    });

    // Statistics
    const stats = {
        total: faqs.length,
        published: faqs.filter((f) => f.is_published).length,
        draft: faqs.filter((f) => !f.is_published).length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">FAQ Management</h1>
                    <p className="text-muted-foreground">
                        Manage frequently asked questions and categories
                    </p>
                </div>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add FAQ
                </Button>
            </div>

            {/* Statistics */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total FAQs</CardDescription>
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
                        <CardDescription>Draft</CardDescription>
                        <CardTitle className="text-3xl text-yellow-600">{stats.draft}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Search and Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Search & Filter</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search FAQs by question, answer, or keywords..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Category Tabs */}
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                <TabsList>
                    <TabsTrigger value="all">All Categories</TabsTrigger>
                    {categories.map((cat) => (
                        <TabsTrigger key={cat.id} value={cat.id}>
                            {cat.name}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value={selectedCategory} className="space-y-4">
                    {isLoading ? (
                        <Card>
                            <CardContent className="py-8">
                                <p className="text-center text-muted-foreground">Loading FAQs...</p>
                            </CardContent>
                        </Card>
                    ) : filteredFAQs.length === 0 ? (
                        <Card>
                            <CardContent className="py-8">
                                <p className="text-center text-muted-foreground">
                                    {searchQuery
                                        ? 'No FAQs match your search'
                                        : 'No FAQs in this category yet'}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {filteredFAQs.map((faq) => (
                                <FAQCard
                                    key={faq.id}
                                    faq={faq}
                                    onEdit={setEditingFAQ}
                                    onDelete={handleDeleteFAQ}
                                    onTogglePublish={(id, published) => {
                                        togglePublish.mutate({ id, is_published: published });
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Create/Edit Dialog */}
            <FAQDialog
                faq={editingFAQ || undefined}
                open={isCreateDialogOpen || !!editingFAQ}
                onOpenChange={(open) => {
                    if (!open) {
                        setIsCreateDialogOpen(false);
                        setEditingFAQ(null);
                    }
                }}
                onSave={(data) => {
                    if (editingFAQ) {
                        updateFAQ.mutate(
                            { id: editingFAQ.id, updates: data },
                            {
                                onSuccess: () => {
                                    setEditingFAQ(null);
                                },
                            }
                        );
                    } else {
                        createFAQ.mutate(data, {
                            onSuccess: () => {
                                setIsCreateDialogOpen(false);
                            },
                        });
                    }
                }}
                categories={categories}
            />
            <ConfirmDialog />
        </div>
    );
}

// FAQ Card Component
interface FAQCardProps {
    faq: FAQ;
    onEdit: (faq: FAQ) => void;
    onDelete: (id: string) => void;
    onTogglePublish: (id: string, published: boolean) => void;
}

function FAQCard({ faq, onEdit, onDelete, onTogglePublish }: FAQCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                            {faq.category_name && (
                                <Badge variant="outline">{faq.category_name}</Badge>
                            )}
                            {faq.is_published ? (
                                <Badge variant="default" className="bg-green-600">
                                    <Eye className="mr-1 h-3 w-3" />
                                    Published
                                </Badge>
                            ) : (
                                <Badge variant="secondary">
                                    <EyeOff className="mr-1 h-3 w-3" />
                                    Draft
                                </Badge>
                            )}
                        </div>
                        <CardTitle className="text-lg cursor-pointer hover:text-primary" onClick={() => setIsExpanded(!isExpanded)}>
                            {faq.question}
                        </CardTitle>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span>👁️ {faq.view_count} views</span>
                            <span>👍 {faq.helpful_count} helpful</span>
                            <span>👎 {faq.not_helpful_count} not helpful</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Switch
                            checked={faq.is_published}
                            onCheckedChange={(checked) => onTogglePublish(faq.id, checked)}
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(faq)}
                        >
                            <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(faq.id)}
                        >
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            {isExpanded && (
                <CardContent>
                    <div className="prose prose-sm max-w-none">
                        <p className="whitespace-pre-wrap">{faq.answer}</p>
                    </div>
                    {faq.keywords && faq.keywords.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            <span className="text-sm font-medium">Keywords:</span>
                            {faq.keywords.map((keyword, i) => (
                                <Badge key={i} variant="outline">
                                    {keyword}
                                </Badge>
                            ))}
                        </div>
                    )}
                </CardContent>
            )}
        </Card>
    );
}

// FAQ Edit Dialog
interface FAQDialogProps {
    faq?: FAQ;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (data: Partial<FAQ>) => void;
    categories: any[];
}

function FAQDialog({ faq, open, onOpenChange, onSave, categories }: FAQDialogProps) {
    const [formData, setFormData] = useState({
        question: faq?.question || '',
        answer: faq?.answer || '',
        category_id: faq?.category_id || '',
        keywords: faq?.keywords?.join(', ') || '',
        is_published: faq?.is_published ?? false,
        display_order: faq?.display_order ?? 0,
    });

    React.useEffect(() => {
        if (faq) {
            setFormData({
                question: faq.question,
                answer: faq.answer,
                category_id: faq.category_id || '',
                keywords: faq.keywords?.join(', ') || '',
                is_published: faq.is_published,
                display_order: faq.display_order,
            });
        } else {
            setFormData({
                question: '',
                answer: '',
                category_id: '',
                keywords: '',
                is_published: false,
                display_order: 0,
            });
        }
    }, [faq, open]);

    const handleSave = () => {
        if (!formData.question || !formData.answer) {
            toast.error('Please fill in question and answer');
            return;
        }

        const keywords = formData.keywords
            ? formData.keywords.split(',').map((k) => k.trim()).filter(Boolean)
            : [];

        onSave({
            ...formData,
            category_id: formData.category_id || null,
            keywords,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{faq ? 'Edit FAQ' : 'Create FAQ'}</DialogTitle>
                    <DialogDescription>
                        {faq ? 'Update the FAQ details below' : 'Add a new FAQ to your knowledge base'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                            value={formData.category_id}
                            onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="question">Question *</Label>
                        <Input
                            id="question"
                            value={formData.question}
                            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                            placeholder="What is your question?"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="answer">Answer *</Label>
                        <Textarea
                            id="answer"
                            value={formData.answer}
                            onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                            placeholder="Provide a detailed answer..."
                            rows={6}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                        <Input
                            id="keywords"
                            value={formData.keywords}
                            onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                            placeholder="keyword1, keyword2, keyword3"
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Switch
                            id="published"
                            checked={formData.is_published}
                            onCheckedChange={(checked) =>
                                setFormData({ ...formData, is_published: checked })
                            }
                        />
                        <Label htmlFor="published">Publish immediately</Label>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="order">Display Order</Label>
                        <Input
                            id="order"
                            type="number"
                            value={formData.display_order}
                            onChange={(e) =>
                                setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })
                            }
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>
                        <Save className="mr-2 h-4 w-4" />
                        {faq ? 'Update FAQ' : 'Create FAQ'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
