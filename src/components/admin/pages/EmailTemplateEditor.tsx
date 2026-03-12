/**
 * Email Template Editor
 * Rich text editor for email templates with variable insertion
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {
    Save,
    ArrowLeft,
    Eye,
    Mail,
    Plus,
    X,
    Bold,
    Italic,
    List,
    ListOrdered,
    Code
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    useEmailTemplate,
    useCreateEmailTemplate,
    useUpdateEmailTemplate,
    useSendTestEmail
} from '@/hooks/useEmailAutomation';

export function EmailTemplateEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const { data: template } = useEmailTemplate(id || '');
    const createTemplate = useCreateEmailTemplate();
    const updateTemplate = useUpdateEmailTemplate();
    const sendTest = useSendTestEmail();

    const [name, setName] = useState('');
    const [subject, setSubject] = useState('');
    const [templateType, setTemplateType] = useState<'transactional' | 'marketing' | 'onboarding'>('marketing');
    const [variables, setVariables] = useState<string[]>([]);
    const [newVariable, setNewVariable] = useState('');
    const [testEmail, setTestEmail] = useState('');
    const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: 'Start typing your email content...'
            })
        ],
        content: '',
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none min-h-[400px] p-4 focus:outline-none'
            }
        }
    });

    // Load template data in edit mode
    useEffect(() => {
        if (template) {
            setName(template.name);
            setSubject(template.subject);
            setTemplateType(template.template_type);
            setVariables(template.variables || []);
            editor?.commands.setContent(template.html_content);
        }
    }, [template, editor]);

    const handleSave = async () => {
        const htmlContent = editor?.getHTML() || '';

        const templateData = {
            name,
            subject,
            html_content: htmlContent,
            template_type: templateType,
            variables
        };

        if (isEditMode && id) {
            await updateTemplate.mutateAsync({ id, updates: templateData });
        } else {
            const newTemplate = await createTemplate.mutateAsync(templateData);
            navigate(`/admin/email/templates/${newTemplate.id}`);
        }
    };

    const handleAddVariable = () => {
        if (newVariable && !variables.includes(newVariable)) {
            setVariables([...variables, newVariable]);
            setNewVariable('');
        }
    };

    const handleRemoveVariable = (variable: string) => {
        setVariables(variables.filter(v => v !== variable));
    };

    const handleInsertVariable = (variable: string) => {
        editor?.commands.insertContent(`{{${variable}}}`);
    };

    const handleSendTest = async () => {
        if (testEmail && id) {
            await sendTest.mutateAsync({ templateId: id, testEmail });
            setIsTestDialogOpen(false);
            setTestEmail('');
        }
    };

    if (!editor) return null;

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/admin/email')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">
                            {isEditMode ? 'Edit Template' : 'Create Template'}
                        </h1>
                        <p className="text-muted-foreground">
                            Design your email template with rich text
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {isEditMode && (
                        <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline">
                                    <Mail className="mr-2 h-4 w-4" />
                                    Send Test
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Send Test Email</DialogTitle>
                                    <DialogDescription>
                                        Send a test email to verify the template
                                    </DialogDescription>
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
                                    <Button onClick={handleSendTest} className="w-full">
                                        Send Test Email
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                    <Button onClick={handleSave} disabled={!name || !subject}>
                        <Save className="mr-2 h-4 w-4" />
                        Save Template
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Editor */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Template Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Template Name</Label>
                                <Input
                                    placeholder="Welcome Email"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>

                            <div>
                                <Label>Subject Line</Label>
                                <Input
                                    placeholder="Welcome to our platform!"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                />
                            </div>

                            <div>
                                <Label>Template Type</Label>
                                <Select value={templateType} onValueChange={(val: any) => setTemplateType(val)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="transactional">Transactional</SelectItem>
                                        <SelectItem value="marketing">Marketing</SelectItem>
                                        <SelectItem value="onboarding">Onboarding</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Rich Text Editor */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Email Content</CardTitle>
                                <div className="flex gap-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => editor.chain().focus().toggleBold().run()}
                                        className={editor.isActive('bold') ? 'bg-muted' : ''}
                                    >
                                        <Bold className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => editor.chain().focus().toggleItalic().run()}
                                        className={editor.isActive('italic') ? 'bg-muted' : ''}
                                    >
                                        <Italic className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                                        className={editor.isActive('bulletList') ? 'bg-muted' : ''}
                                    >
                                        <List className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                                        className={editor.isActive('orderedList') ? 'bg-muted' : ''}
                                    >
                                        <ListOrdered className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                                        className={editor.isActive('codeBlock') ? 'bg-muted' : ''}
                                    >
                                        <Code className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg">
                                <EditorContent editor={editor} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Variables */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Template Variables</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="variable_name"
                                    value={newVariable}
                                    onChange={(e) => setNewVariable(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddVariable();
                                        }
                                    }}
                                />
                                <Button size="icon" onClick={handleAddVariable}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="space-y-2">
                                {variables.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        No variables added yet
                                    </p>
                                ) : (
                                    variables.map((variable) => (
                                        <div key={variable} className="flex items-center justify-between">
                                            <Badge
                                                variant="outline"
                                                className="cursor-pointer hover:bg-muted"
                                                onClick={() => handleInsertVariable(variable)}
                                            >
                                                {`{{${variable}}}`}
                                            </Badge>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemoveVariable(variable)}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>

                            <p className="text-xs text-muted-foreground">
                                Click a variable to insert it into the editor
                            </p>
                        </CardContent>
                    </Card>

                    {/* Preview */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                Preview
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg p-4 bg-muted/20">
                                <div className="font-semibold mb-2">Subject: {subject || '(No subject)'}</div>
                                <div
                                    className="prose prose-sm max-w-none"
                                    dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
