/**
 * Rich Text Editor Component
 * WYSIWYG editor powered by TipTap for blog posts and documentation
 */

import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import {
    Bold,
    Italic,
    Strikethrough,
    Code,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Quote,
    Undo,
    Redo,
    Link as LinkIcon,
    Image as ImageIcon,
    Type
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
    className?: string;
}

export function RichTextEditor({ content, onChange, placeholder = 'Start writing...', className = '' }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Link.configure({
                openOnClick: false,
            }),
            Image,
            Placeholder.configure({
                placeholder,
            }),
        ],
        content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-slate max-w-none focus:outline-none min-h-[400px] px-4 py-3',
            },
        },
    });

    if (!editor) {
        return null;
    }

    const setLink = () => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);

        if (url === null) {
            return;
        }

        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    const addImage = () => {
        const url = window.prompt('Image URL');
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    };

    return (
        <div className={`border rounded-lg overflow-hidden ${className}`}>
            {/* Toolbar */}
            <div className="bg-slate-50 border-b p-2 flex flex-wrap gap-1">
                {/* Text Formatting */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    disabled={!editor.can().chain().focus().toggleBold().run()}
                    data-active={editor.isActive('bold')}
                >
                    <Bold className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    disabled={!editor.can().chain().focus().toggleItalic().run()}
                    data-active={editor.isActive('italic')}
                >
                    <Italic className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    disabled={!editor.can().chain().focus().toggleStrike().run()}
                    data-active={editor.isActive('strike')}
                >
                    <Strikethrough className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    disabled={!editor.can().chain().focus().toggleCode().run()}
                    data-active={editor.isActive('code')}
                >
                    <Code className="h-4 w-4" />
                </Button>

                <Separator orientation="vertical" className="h-8 mx-1" />

                {/* Headings */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    data-active={editor.isActive('heading', { level: 1 })}
                >
                    <Heading1 className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    data-active={editor.isActive('heading', { level: 2 })}
                >
                    <Heading2 className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    data-active={editor.isActive('heading', { level: 3 })}
                >
                    <Heading3 className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => editor.chain().focus().setParagraph().run()}
                    data-active={editor.isActive('paragraph')}
                >
                    <Type className="h-4 w-4" />
                </Button>

                <Separator orientation="vertical" className="h-8 mx-1" />

                {/* Lists */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    data-active={editor.isActive('bulletList')}
                >
                    <List className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    data-active={editor.isActive('orderedList')}
                >
                    <ListOrdered className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    data-active={editor.isActive('blockquote')}
                >
                    <Quote className="h-4 w-4" />
                </Button>

                <Separator orientation="vertical" className="h-8 mx-1" />

                {/* Media */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={setLink}
                    data-active={editor.isActive('link')}
                >
                    <LinkIcon className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={addImage}
                >
                    <ImageIcon className="h-4 w-4" />
                </Button>

                <Separator orientation="vertical" className="h-8 mx-1" />

                {/* History */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().chain().focus().undo().run()}
                >
                    <Undo className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().chain().focus().redo().run()}
                >
                    <Redo className="h-4 w-4" />
                </Button>
            </div>

            {/* Editor */}
            <EditorContent editor={editor} className="bg-white" />

            {/* Character Count */}
            <div className="bg-slate-50 border-t px-4 py-2 text-xs text-muted-foreground flex justify-between">
                <span>{editor.storage.characterCount?.characters() || 0} characters</span>
                <span>{editor.storage.characterCount?.words() || 0} words</span>
            </div>
        </div>
    );
}
