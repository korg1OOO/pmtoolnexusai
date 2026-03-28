/**
 * Public Documentation Browser
 * User-facing documentation with sidebar navigation and version selector
 */

import React, { useState, useMemo } from 'react';
import { BookOpen, Search, ChevronRight, ChevronDown, FileText, Layers, Home } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useDocumentation, Documentation } from '@/hooks/useContentManagement';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function PublicDocs() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [selectedVersion, setSelectedVersion] = useState(searchParams.get('version') || 'v1.0');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [selectedDoc, setSelectedDoc] = useState<Documentation | null>(null);

    const { data: docs = [], isLoading } = useDocumentation(selectedVersion, true);

    // Build tree structure
    const docTree = useMemo(() => {
        const itemMap: Record<string, Documentation & { children: Documentation[] }> = {};
        const rootItems: any[] = [];

        docs.forEach(item => {
            itemMap[item.id] = { ...item, children: [] };
        });

        docs.forEach(item => {
            if (item.parent_id && itemMap[item.parent_id]) {
                itemMap[item.parent_id].children.push(itemMap[item.id]);
            } else {
                rootItems.push(itemMap[item.id]);
            }
        });

        return rootItems.sort((a, b) => a.order_index - b.order_index);
    }, [docs]);

    // Filter docs by search
    const filteredDocs = useMemo(() => {
        if (!searchQuery) return docs;
        const query = searchQuery.toLowerCase();
        return docs.filter(doc =>
            doc.title.toLowerCase().includes(query) ||
            doc.content.toLowerCase().includes(query)
        );
    }, [docs, searchQuery]);

    const toggleNode = (id: string) => {
        const newExpanded = new Set(expandedNodes);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedNodes(newExpanded);
    };

    const versions = ['v1.0', 'v1.1', 'v2.0'];

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-700 text-white py-12 shadow-lg">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="flex items-center gap-3 mb-4">
                        <BookOpen className="h-10 w-10" />
                        <h1 className="text-4xl font-bold">Documentation</h1>
                    </div>
                    <p className="text-xl text-indigo-100">
                        Comprehensive guides and API references for Kiroxys
                    </p>
                </div>
            </div>

            {/* Content Grid */}
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-4">
                        <Card>
                            <CardContent className="p-4 space-y-4">
                                {/* Version Selector */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Version</label>
                                    <Select value={selectedVersion} onValueChange={setSelectedVersion}>
                                        <SelectTrigger>
                                            <Layers className="mr-2 h-4 w-4" />
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {versions.map(v => (
                                                <SelectItem key={v} value={v}>{v}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Separator />

                                {/* Search */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search docs..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>

                                <Separator />

                                {/* Navigation Tree */}
                                {isLoading ? (
                                    <div className="p-4 text-center text-sm text-muted-foreground">
                                        Loading...
                                    </div>
                                ) : searchQuery ? (
                                    <div className="space-y-1">
                                        {filteredDocs.map(doc => (
                                            <Button
                                                key={doc.id}
                                                variant={selectedDoc?.id === doc.id ? 'secondary' : 'ghost'}
                                                className="w-full justify-start text-sm"
                                                onClick={() => setSelectedDoc(doc)}
                                            >
                                                <FileText className="mr-2 h-4 w-4" />
                                                {doc.title}
                                            </Button>
                                        ))}
                                    </div>
                                ) : (
                                    <nav className="space-y-1">
                                        {docTree.map(node => (
                                            <DocTreeNode
                                                key={node.id}
                                                node={node}
                                                expandedNodes={expandedNodes}
                                                toggleNode={toggleNode}
                                                selectedDoc={selectedDoc}
                                                onSelect={setSelectedDoc}
                                            />
                                        ))}
                                    </nav>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3">
                        {selectedDoc ? (
                            <Card className="min-h-[600px]">
                                <CardContent className="p-8 md:p-12">
                                    <article className="prose prose-slate prose-lg max-w-none">
                                        <h1 className="text-4xl font-bold mb-6">{selectedDoc.title}</h1>
                                        {selectedDoc.meta_description && (
                                            <p className="text-xl text-muted-foreground mb-8">
                                                {selectedDoc.meta_description}
                                            </p>
                                        )}
                                        <Separator className="my-8" />
                                        <div className="whitespace-pre-wrap leading-relaxed">
                                            {selectedDoc.content}
                                        </div>
                                    </article>

                                    <Separator className="my-8" />

                                    <div className="text-sm text-muted-foreground">
                                        {selectedDoc.view_count || 0} views • Last updated {new Date(selectedDoc.updated_at).toLocaleDateString()}
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="min-h-[600px] flex items-center justify-center">
                                <CardContent className="text-center p-12">
                                    <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                                        <BookOpen className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <h2 className="text-2xl font-bold mb-2">Welcome to the Docs</h2>
                                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                        Select a topic from the sidebar to start exploring our documentation.
                                    </p>
                                    <Button onClick={() => docTree.length > 0 && setSelectedDoc(docTree[0])}>
                                        <Home className="mr-2 h-4 w-4" />
                                        Get Started
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function DocTreeNode({ node, expandedNodes, toggleNode, selectedDoc, onSelect }: any) {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children.length > 0;
    const isSelected = selectedDoc?.id === node.id;

    return (
        <div>
            <Button
                variant={isSelected ? 'secondary' : 'ghost'}
                className="w-full justify-start text-sm"
                onClick={() => onSelect(node)}
            >
                <div
                    className="p-0.5 hover:bg-slate-200 rounded mr-1"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (hasChildren) toggleNode(node.id);
                    }}
                >
                    {hasChildren ? (
                        isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />
                    ) : (
                        <div className="w-3" />
                    )}
                </div>
                <FileText className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate">{node.title}</span>
            </Button>

            {hasChildren && isExpanded && (
                <div className="ml-4 mt-1 space-y-1 border-l pl-2">
                    {node.children.map((child: any) => (
                        <DocTreeNode
                            key={child.id}
                            node={child}
                            expandedNodes={expandedNodes}
                            toggleNode={toggleNode}
                            selectedDoc={selectedDoc}
                            onSelect={onSelect}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
