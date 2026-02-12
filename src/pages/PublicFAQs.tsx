/**
 * Public FAQs Page
 * User-facing FAQ help center with category filtering and search
 */

import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, HelpCircle, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCategories, useFAQs } from '@/hooks/useContentManagement';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function PublicFAQs() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

    const { data: categories = [] } = useCategories('faq');
    const { data: faqs = [], isLoading } = useFAQs(
        selectedCategory === 'all' ? undefined : selectedCategory,
        true // publishedOnly
    );

    // Filter FAQs by search query
    const filteredFAQs = faqs.filter(faq => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            faq.question.toLowerCase().includes(query) ||
            faq.answer.toLowerCase().includes(query) ||
            faq.keywords?.some(k => k.toLowerCase().includes(query))
        );
    });

    const handleFeedback = async (faqId: string, isHelpful: boolean) => {
        try {
            const field = isHelpful ? 'helpful_count' : 'not_helpful_count';
            const { error } = await supabase.rpc('increment_faq_feedback', {
                faq_id: faqId,
                is_helpful: isHelpful
            });

            if (error) throw error;
            toast.success('Thank you for your feedback!');
        } catch (error) {
            console.error('Feedback error:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="flex items-center gap-3 mb-4 justify-center">
                        <HelpCircle className="h-12 w-12" />
                        <h1 className="text-4xl font-bold">Help Center</h1>
                    </div>
                    <p className="text-xl text-center text-blue-100 mb-8">
                        Find answers to common questions about ProjectOye
                    </p>

                    {/* Search Bar */}
                    <div className="relative max-w-2xl mx-auto">
                        <Search className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
                        <Input
                            placeholder="Search for answers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 h-14 text-lg bg-white/95 border-0 shadow-lg"
                        />
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="container mx-auto px-4 py-12 max-w-5xl">
                <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-8">
                    <TabsList className="bg-white shadow-sm p-1 border">
                        <TabsTrigger value="all" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                            All Topics
                        </TabsTrigger>
                        {categories.map(cat => (
                            <TabsTrigger
                                key={cat.id}
                                value={cat.id}
                                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                            >
                                {cat.name}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <TabsContent value={selectedCategory} className="space-y-4">
                        {isLoading ? (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <p className="text-muted-foreground">Loading FAQs...</p>
                                </CardContent>
                            </Card>
                        ) : filteredFAQs.length === 0 ? (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-lg font-medium mb-2">No FAQs found</p>
                                    <p className="text-muted-foreground">
                                        {searchQuery ? 'Try a different search term' : 'Check back soon for updates'}
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            filteredFAQs.map(faq => (
                                <FAQItem
                                    key={faq.id}
                                    faq={faq}
                                    isExpanded={expandedFAQ === faq.id}
                                    onToggle={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                                    onFeedback={handleFeedback}
                                />
                            ))
                        )}
                    </TabsContent>
                </Tabs>

                {/* Quick Stats */}
                {!isLoading && filteredFAQs.length > 0 && (
                    <div className="mt-12 text-center text-sm text-muted-foreground">
                        Showing {filteredFAQs.length} {filteredFAQs.length === 1 ? 'answer' : 'answers'}
                        {searchQuery && ` for "${searchQuery}"`}
                    </div>
                )}
            </div>
        </div>
    );
}

function FAQItem({ faq, isExpanded, onToggle, onFeedback }: any) {
    return (
        <Card className="overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader
                className="cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={onToggle}
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <CardTitle className="text-lg flex items-start gap-3">
                            <HelpCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <span>{faq.question}</span>
                        </CardTitle>
                        {faq.keywords && faq.keywords.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {faq.keywords.slice(0, 3).map((keyword: string, i: number) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                        {keyword}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                    <Button variant="ghost" size="icon" className="flex-shrink-0">
                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </Button>
                </div>
            </CardHeader>

            {isExpanded && (
                <CardContent className="border-t bg-slate-50/50 pt-6">
                    <div className="prose prose-slate max-w-none mb-6">
                        <p className="text-slate-700 whitespace-pre-wrap">{faq.answer}</p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground">Was this helpful?</span>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onFeedback(faq.id, true)}
                                    className="gap-2"
                                >
                                    <ThumbsUp className="h-4 w-4" />
                                    <span className="text-xs">{faq.helpful_count || 0}</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onFeedback(faq.id, false)}
                                    className="gap-2"
                                >
                                    <ThumbsDown className="h-4 w-4" />
                                    <span className="text-xs">{faq.not_helpful_count || 0}</span>
                                </Button>
                            </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                            {faq.view_count || 0} views
                        </span>
                    </div>
                </CardContent>
            )}
        </Card>
    );
}
