/**
 * Admin Content Management Hub
 * Main container for FAQ, Blog, Documentation, and Media management
 */

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HelpCircle, Newspaper, BookOpen, Image as ImageIcon } from 'lucide-react';
import { AdminFAQs } from './AdminFAQs';
import { AdminBlog } from './AdminBlog';
import { AdminDocs } from './AdminDocs';
import { AdminMedia } from './AdminMedia';

export function AdminContentManagement() {
    return (
        <div className="p-6 h-full flex flex-col gap-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight">Content Management</h1>
                <p className="text-muted-foreground text-lg">
                    Manage all public-facing content including FAQ, Blog, Documentation, and Media.
                </p>
            </div>

            <Tabs defaultValue="faqs" className="flex-1 flex flex-col gap-4">
                <TabsList className="bg-slate-100 p-1 w-fit">
                    <TabsTrigger value="faqs" className="flex items-center gap-2">
                        <HelpCircle className="h-4 w-4" />
                        FAQs
                    </TabsTrigger>
                    <TabsTrigger value="blog" className="flex items-center gap-2">
                        <Newspaper className="h-4 w-4" />
                        Blog
                    </TabsTrigger>
                    <TabsTrigger value="docs" className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Documentation
                    </TabsTrigger>
                    <TabsTrigger value="media" className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Media Library
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="faqs" className="flex-1 mt-0">
                    <AdminFAQs />
                </TabsContent>
                <TabsContent value="blog" className="flex-1 mt-0">
                    <AdminBlog />
                </TabsContent>
                <TabsContent value="docs" className="flex-1 mt-0">
                    <AdminDocs />
                </TabsContent>
                <TabsContent value="media" className="flex-1 mt-0">
                    <AdminMedia />
                </TabsContent>
            </Tabs>
        </div>
    );
}
