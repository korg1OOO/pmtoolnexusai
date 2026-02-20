/**
 * Admin Documentation Management
 * Hierarchical documentation management with versioning and markdown editor
 */

import React, { useState } from 'react';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Eye,
    EyeOff,
    ChevronRight,
    ChevronDown,
    FileText,
    Layers,
    Save,
    History,
    MoreVertical
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    useCategories,
    useDocumentation,
    useCreateDoc,
    useUpdateDoc,
    useDeleteDoc,
    Documentation,
} from '@/hooks/useContentManagement';
import { toast } from 'sonner';

export function AdminDocs() {
    const [selectedVersion, setSelectedVersion] = useState<string>('v1.0');
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [editingDoc, setEditingDoc] = useState<Documentation | null>(null);
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

    // Fetch data
    const { data: categories = [] } = useCategories('docs');
    // Fetch all docs (across all versions) to derive version list
    const { data: allDocs = [] } = useDocumentation('', false);   // empty string = no version filter
    const { data: docs = [], isLoading } = useDocumentation(selectedVersion, false);

    // Mutations
    const createDoc = useCreateDoc();
    const updateDoc = useUpdateDoc();
    const deleteDoc = useDeleteDoc();

    // Toggle expanded nodes
    const toggleExpand = (id: string) => {
        const newExpanded = new Set(expandedNodes);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedNodes(newExpanded);
    };

    // Organize docs into a tree
    const buildTree = (items: Documentation[]) => {
        const itemMap: Record<string, Documentation & { children: Documentation[] }> = {};
        const rootItems: any[] = [];

        items.forEach(item => {
            itemMap[item.id] = { ...item, children: [] };
        });

        items.forEach(item => {
            if (item.parent_id && itemMap[item.parent_id]) {
                itemMap[item.parent_id].children.push(itemMap[item.id]);
            } else {
                rootItems.push(itemMap[item.id]);
            }
        });

        return rootItems.sort((a, b) => a.order_index - b.order_index);
    };

    const docTree = buildTree(docs);

    // Versions list — derived dynamically from what exists in the DB
    const versions = Array.from(
        new Set(allDocs.map((d: any) => d.version).filter(Boolean))
    ).sort() as string[];
    // Always ensure the current selection is in the list (e.g. data still loading)
    const versionOptions = versions.length > 0 ? versions : [selectedVersion];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Documentation Management</h1>
                    <p className="text-muted-foreground">
                        Manage versioned documentation and manuals
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={selectedVersion} onValueChange={setSelectedVersion}>
                        <SelectTrigger className="w-[120px]">
                            <Layers className="mr-2 h-4 w-4" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {versionOptions.map(v => (
                                <SelectItem key={v} value={v}>{v}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Document
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Search & Tree Section */}
                <div className="md:col-span-1 space-y-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Search Docs</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Find document..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="min-h-[500px]">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Structure ({selectedVersion})</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {isLoading ? (
                                <div className="p-4 text-center text-muted-foreground">Loading...</div>
                            ) : docs.length === 0 ? (
                                <div className="p-4 text-center text-muted-foreground">No documents found</div>
                            ) : (
                                <div className="divide-y">
                                    {docTree.map(node => (
                                        <DocTreeNode
                                            key={node.id}
                                            node={node}
                                            expandedNodes={expandedNodes}
                                            toggleExpand={toggleExpand}
                                            onEdit={setEditingDoc}
                                            onDelete={(id) => {
                                                if (confirm('Delete this document? Children will be detached.')) {
                                                    deleteDoc.mutate(id);
                                                }
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Preview / Detail Section */}
                <div className="md:col-span-2">
                    {editingDoc ? (
                        <Card className="h-full min-h-[600px] flex flex-col">
                            <CardHeader className="border-b">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="flex items-center gap-2">
                                            <Edit2 className="h-5 w-5 text-primary" />
                                            Editing: {editingDoc.title}
                                        </CardTitle>
                                        <CardDescription>
                                            Path: {editingDoc.parent_title || 'Root'} / {editingDoc.slug}
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" onClick={() => setEditingDoc(null)}>
                                            Close
                                        </Button>
                                        <Button onClick={() => {
                                            // This logic would normally be handled by the editor component
                                            // For now we'll just show the dialog for full editing
                                        }}>
                                            <Save className="mr-2 h-4 w-4" />
                                            Save
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 p-0 overflow-hidden">
                                <div className="grid grid-cols-2 h-full divide-x">
                                    <div className="p-4 h-full flex flex-col gap-4">
                                        <Label>Content (Markdown)</Label>
                                        <Textarea
                                            className="flex-1 resize-none font-mono"
                                            value={editingDoc.content}
                                            onChange={(e) => setEditingDoc({ ...editingDoc, content: e.target.value })}
                                        />
                                    </div>
                                    <div className="p-4 h-full bg-slate-50 overflow-y-auto">
                                        <Label className="mb-4 block">Preview</Label>
                                        <div className="prose prose-slate max-w-none">
                                            {/* Simplified preview for now */}
                                            <h1 className="text-2xl font-bold mb-4">{editingDoc.title}</h1>
                                            <div className="whitespace-pre-wrap">{editingDoc.content}</div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="h-full flex items-center justify-center p-12 text-center bg-slate-50/50 border-dashed">
                            <div className="max-w-md space-y-4">
                                <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
                                    <FileText className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">No Document Selected</h3>
                                    <p className="text-muted-foreground">Select a document from the list to edit, or create a new one to start building your manual.</p>
                                </div>
                                <Button onClick={() => setIsCreateDialogOpen(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    New Document
                                </Button>
                            </div>
                        </Card>
                    )}
                </div>
            </div>

            {/* Create Doc Dialog */}
            <DocDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                onSave={(data) => {
                    createDoc.mutate({ ...data, version: selectedVersion }, {
                        onSuccess: () => setIsCreateDialogOpen(false)
                    });
                }}
                categories={categories}
                documents={docs}
            />
        </div>
    );
}

// Tree Node Component
function DocTreeNode({
    node,
    expandedNodes,
    toggleExpand,
    onEdit,
    onDelete
}: {
    node: any,
    expandedNodes: Set<string>,
    toggleExpand: (id: string) => void,
    onEdit: (doc: Documentation) => void,
    onDelete: (id: string) => void
}) {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children.length > 0;

    return (
        <div className="select-none">
            <div
                className={`flex items-center gap-2 p-2 px-3 hover:bg-slate-50 cursor-pointer group transition-colors ${!node.is_published ? 'bg-amber-50/30' : ''}`}
                onClick={() => onEdit(node)}
            >
                <div
                    className="p-0.5 hover:bg-slate-200 rounded"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (hasChildren) toggleExpand(node.id);
                    }}
                >
                    {hasChildren ? (
                        isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                    ) : (
                        <div className="w-4" />
                    )}
                </div>

                <FileText className={`h-4 w-4 ${node.is_published ? 'text-blue-500' : 'text-slate-400'}`} />

                <span className="flex-1 text-sm font-medium truncate">
                    {node.title}
                </span>

                {!node.is_published && (
                    <Badge variant="outline" className="text-[10px] h-4 py-0 bg-white">Draft</Badge>
                )}

                <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(node)}>
                            <Edit2 className="mr-2 h-4 w-4" /> Edit Content
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => onDelete(node.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {hasChildren && isExpanded && (
                <div className="ml-4 border-l">
                    {node.children.map((child: any) => (
                        <DocTreeNode
                            key={child.id}
                            node={child}
                            expandedNodes={expandedNodes}
                            toggleExpand={toggleExpand}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// Create Doc Dialog
function DocDialog({
    open,
    onOpenChange,
    onSave,
    categories,
    documents
}: {
    open: boolean,
    onOpenChange: (open: boolean) => void,
    onSave: (data: any) => void,
    categories: any[],
    documents: any[]
}) {
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        category_id: '',
        parent_id: '',
        is_published: false,
        order_index: 0
    });

    const handleSave = () => {
        if (!formData.title || !formData.slug) {
            toast.error('Title and slug are required');
            return;
        }
        onSave(formData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>New Document</DialogTitle>
                    <DialogDescription>
                        Create a new document section in the structure.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            placeholder="Getting Started"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="slug">Slug (URL)</Label>
                        <Input
                            id="slug"
                            placeholder="getting-started"
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="category">Category</Label>
                            <Select
                                value={formData.category_id}
                                onValueChange={(val) => setFormData({ ...formData, category_id: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="General" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="parent">Parent Document</Label>
                            <Select
                                value={formData.parent_id}
                                onValueChange={(val) => setFormData({ ...formData, parent_id: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Root" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None (Root)</SelectItem>
                                    {documents.map(d => (
                                        <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Switch
                            id="published"
                            checked={formData.is_published}
                            onCheckedChange={(val) => setFormData({ ...formData, is_published: val })}
                        />
                        <Label htmlFor="published">Publish immediately</Label>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Create Document</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
