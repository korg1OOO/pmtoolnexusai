/**
 * Email Template Manager
 * Admin interface for managing editable email templates
 */

import React, { useState, useMemo } from 'react';
import { Search, Plus, Edit2, Eye, History, Send, Save, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
    useEmailTemplates,
    useUpdateTemplate,
    useTemplateVersionHistory,
    useRollbackTemplate,
    useTestSendEmail
} from '@/hooks/useEmailTemplates';
import { emailTemplateService, EmailTemplate } from '@/services/emailTemplateService';

export function EmailTemplateManager() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
    const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedSubject, setEditedSubject] = useState('');
    const [editedHtml, setEditedHtml] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [showVersionHistory, setShowVersionHistory] = useState(false);
    const [showTestEmail, setShowTestEmail] = useState(false);
    const [testEmail, setTestEmail] = useState('');

    const { data: templates, isLoading } = useEmailTemplates(selectedCategory);
    const updateTemplate = useUpdateTemplate();
    const { data: versionHistory } = useTemplateVersionHistory(selectedTemplate?.id || '');
    const rollbackTemplate = useRollbackTemplate();
    const testSendEmail = useTestSendEmail();

    const filteredTemplates = useMemo(() => {
        if (!templates) return [];
        return templates.filter(t =>
            t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.template_key.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [templates, searchQuery]);

    const categories = [
        { value: 'billing', label: 'Billing', color: 'bg-blue-500' },
        { value: 'engagement', label: 'Engagement', color: 'bg-purple-500' },
        { value: 'system', label: 'System', color: 'bg-gray-500' },
        { value: 'marketing', label: 'Marketing', color: 'bg-green-500' },
    ];

    const handleEdit = (template: EmailTemplate) => {
        setSelectedTemplate(template);
        setEditedSubject(template.subject_template);
        setEditedHtml(template.html_template);
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!selectedTemplate) return;

        // Validate
        const validation = emailTemplateService.validateTemplate(editedHtml);
        if (!validation.valid) {
            toast.error(`Validation failed: ${validation.errors.join(', ')}`);
            return;
        }

        await updateTemplate.mutateAsync({
            id: selectedTemplate.id,
            updates: {
                subject_template: editedSubject,
                html_template: editedHtml,
            },
        });

        setIsEditing(false);
        setSelectedTemplate(null);
    };

    const handleRollback = async (versionId: string) => {
        if (!selectedTemplate) return;

        await rollbackTemplate.mutateAsync({
            templateId: selectedTemplate.id,
            versionId,
        });

        setShowVersionHistory(false);
    };

    const handleTestSend = async () => {
        if (!selectedTemplate || !testEmail) return;

        // Create sample data based on variables
        const testData: Record<string, any> = {};
        selectedTemplate.variables.forEach(v => {
            testData[v.key] = v.example || `[${v.key}]`;
        });

        await testSendEmail.mutateAsync({
            templateId: selectedTemplate.id,
            testEmail,
            testData,
        });

        setShowTestEmail(false);
        setTestEmail('');
    };

    // Generate preview with sample data
    const getPreviewHtml = () => {
        if (!selectedTemplate) return '';

        const sampleData: Record<string, string> = {};
        selectedTemplate.variables.forEach(v => {
            sampleData[v.key] = v.example || `[${v.key}]`;
        });

        return emailTemplateService.replaceVariables(
            isEditing ? editedHtml : selectedTemplate.html_template,
            sampleData
        );
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Email Templates</h1>
                    <p className="text-muted-foreground">Manage and customize email templates</p>
                </div>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Template
                </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search templates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={!selectedCategory ? 'default' : 'outline'}
                        onClick={() => setSelectedCategory(undefined)}
                        size="sm"
                    >
                        All
                    </Button>
                    {categories.map(cat => (
                        <Button
                            key={cat.value}
                            variant={selectedCategory === cat.value ? 'default' : 'outline'}
                            onClick={() => setSelectedCategory(cat.value)}
                            size="sm"
                        >
                            {cat.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Template List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoading ? (
                    <div className="col-span-3 text-center py-12 text-muted-foreground">
                        Loading templates...
                    </div>
                ) : filteredTemplates.length === 0 ? (
                    <div className="col-span-3 text-center py-12 text-muted-foreground">
                        No templates found
                    </div>
                ) : (
                    filteredTemplates.map(template => (
                        <Card key={template.id} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-base">{template.name}</CardTitle>
                                        <CardDescription className="text-xs mt-1">
                                            {template.template_key}
                                        </CardDescription>
                                    </div>
                                    <Badge variant="secondary" className="text-xs">
                                        v{template.version}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                    {template.description}
                                </p>

                                <div className="flex items-center gap-2">
                                    <Badge className={categories.find(c => c.value === template.category)?.color}>
                                        {template.category}
                                    </Badge>
                                    {template.is_active ? (
                                        <Badge variant="outline" className="text-green-600">
                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                            Active
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-gray-500">
                                            Inactive
                                        </Badge>
                                    )}
                                </div>

                                <div className="text-xs text-muted-foreground">
                                    {template.variables.length} variables
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => {
                                            setSelectedTemplate(template);
                                            setShowPreview(true);
                                        }}
                                    >
                                        <Eye className="h-3 w-3 mr-1" />
                                        Preview
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => handleEdit(template)}
                                    >
                                        <Edit2 className="h-3 w-3 mr-1" />
                                        Edit
                                    </Button>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="flex-1 text-xs"
                                        onClick={() => {
                                            setSelectedTemplate(template);
                                            setShowVersionHistory(true);
                                        }}
                                    >
                                        <History className="h-3 w-3 mr-1" />
                                        History
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="flex-1 text-xs"
                                        onClick={() => {
                                            setSelectedTemplate(template);
                                            setShowTestEmail(true);
                                        }}
                                    >
                                        <Send className="h-3 w-3 mr-1" />
                                        Test
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditing} onOpenChange={(open) => !open && setIsEditing(false)}>
                <DialogContent className="max-w-6xl h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>Edit Template: {selectedTemplate?.name}</DialogTitle>
                    </DialogHeader>

                    <Tabs defaultValue="edit" className="flex-1 flex flex-col overflow-hidden">
                        <TabsList>
                            <TabsTrigger value="edit">Edit</TabsTrigger>
                            <TabsTrigger value="preview">Preview</TabsTrigger>
                            <TabsTrigger value="variables">Variables</TabsTrigger>
                        </TabsList>

                        <TabsContent value="edit" className="flex-1 flex flex-col space-y-4 overflow-hidden">
                            <div>
                                <Label>Subject Line</Label>
                                <Input
                                    value={editedSubject}
                                    onChange={(e) => setEditedSubject(e.target.value)}
                                    placeholder="Email subject with {{variables}}"
                                />
                            </div>

                            <div className="flex-1 flex flex-col overflow-hidden">
                                <Label className="mb-2">HTML Template</Label>
                                <Textarea
                                    value={editedHtml}
                                    onChange={(e) => setEditedHtml(e.target.value)}
                                    className="flex-1 font-mono text-sm"
                                    placeholder="HTML content..."
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="preview" className="flex-1 overflow-auto">
                            <div className="border rounded-lg p-4 bg-gray-50">
                                <iframe
                                    srcDoc={getPreviewHtml()}
                                    className="w-full h-[600px] border rounded bg-white"
                                    title="Template Preview"
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="variables" className="flex-1 overflow-auto">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Available Variables</CardTitle>
                                    <CardDescription>Use these placeholders in your template</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {selectedTemplate?.variables.map(v => (
                                            <div key={v.key} className="p-3 border rounded-lg">
                                                <div className="flex items-center justify-between mb-1">
                                                    <code className="text-sm font-mono text-primary">
                                                        {`{{${v.key}}}`}
                                                    </code>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(`{{${v.key}}}`);
                                                            toast.success('Copied to clipboard');
                                                        }}
                                                    >
                                                        Copy
                                                    </Button>
                                                </div>
                                                <p className="text-sm text-muted-foreground">{v.description}</p>
                                                {v.example && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Example: {v.example}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={updateTemplate.isPending}>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Preview Dialog */}
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogContent className="max-w-4xl h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>Preview: {selectedTemplate?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-auto">
                        <iframe
                            srcDoc={getPreviewHtml()}
                            className="w-full h-full border rounded"
                            title="Template Preview"
                        />
                    </div>
                </DialogContent>
            </Dialog>

            {/* Version History Dialog */}
            <Dialog open={showVersionHistory} onOpenChange={setShowVersionHistory}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Version History</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 max-h-[500px] overflow-auto">
                        {versionHistory?.map(version => (
                            <Card key={version.id}>
                                <CardHeader className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-sm">Version {version.version}</CardTitle>
                                            <CardDescription className="text-xs">
                                                {new Date(version.created_at).toLocaleString()}
                                            </CardDescription>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleRollback(version.id)}
                                        >
                                            Restore
                                        </Button>
                                    </div>
                                    {version.change_notes && (
                                        <p className="text-sm text-muted-foreground mt-2">{version.change_notes}</p>
                                    )}
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Test Email Dialog */}
            <Dialog open={showTestEmail} onOpenChange={setShowTestEmail}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Send Test Email</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Email Address</Label>
                            <Input
                                type="email"
                                placeholder="test@example.com"
                                value={testEmail}
                                onChange={(e) => setTestEmail(e.target.value)}
                            />
                        </div>
                        <div className="text-sm text-muted-foreground">
                            <AlertCircle className="h-4 w-4 inline mr-1" />
                            Sample data will be used for all variables
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowTestEmail(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleTestSend} disabled={!testEmail || testSendEmail.isPending}>
                            <Send className="h-4 w-4 mr-2" />
                            Send Test
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
