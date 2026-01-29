import React, { useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ShapeLibrary } from './ShapeLibrary';
import type { SlideShape } from '@/hooks/useSlides';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Link,
  Image,
  Table,
  Undo,
  Redo,
  Play,
  Download,
  Share2,
  Heading1,
  Heading2,
  Heading3,
  ChevronDown,
  Shapes,
  BarChart3,
  Sparkles,
  Check,
  Cloud,
  Loader2,
  Type,
  Palette,
  Highlighter,
  LayoutDashboard,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PresentationToolbarProps {
  editor: Editor | null;
  title: string;
  onTitleChange: (title: string) => void;
  onPresent: () => void;
  onExport: () => void;
  onShare: () => void;
  onInsertImage: () => void;
  onInsertShape: (shape: Omit<SlideShape, 'id'>) => void;
  onInsertChart: () => void;
  onInsertComponent?: () => void;
  onRefreshComponents?: () => void;
  onAIGenerate: () => void;
  saveStatus: 'saved' | 'saving' | 'unsaved';
  hasEmbeddedComponents?: boolean;
  isActivePresentation?: boolean;
}

const COLORS = [
  '#000000', '#374151', '#6B7280', '#9CA3AF', '#D1D5DB', '#F3F4F6', '#FFFFFF',
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E', '#10B981',
  '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7',
  '#D946EF', '#EC4899', '#F43F5E',
];

export function PresentationToolbar({
  editor,
  title,
  onTitleChange,
  onPresent,
  onExport,
  onShare,
  onInsertImage,
  onInsertShape,
  onInsertChart,
  onInsertComponent,
  onRefreshComponents,
  onAIGenerate,
  saveStatus,
  hasEmbeddedComponents,
  isActivePresentation,
}: PresentationToolbarProps) {
  const setLink = useCallback(() => {
    if (!editor) return;
    
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const insertTable = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="flex items-center justify-between p-2 border-b border-border bg-card">
      {/* Left Section - Title and Save Status */}
      <div className="flex items-center gap-3">
        <Input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="w-64 h-8 bg-muted/50 border-transparent focus:border-primary"
          placeholder="Presentation title..."
        />
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {saveStatus === 'saving' && (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Saving...</span>
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <Cloud className="h-3 w-3 text-success" />
              <span>Saved</span>
            </>
          )}
          {saveStatus === 'unsaved' && (
            <>
              <Check className="h-3 w-3" />
              <span>Unsaved changes</span>
            </>
          )}
        </div>
      </div>

      {/* Center Section - Formatting */}
      <div className="flex items-center gap-1">
        {/* Text Formatting */}
        <Button
          variant="ghost"
          size="iconSm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(editor.isActive('bold') && 'bg-muted')}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="iconSm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(editor.isActive('italic') && 'bg-muted')}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="iconSm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={cn(editor.isActive('underline') && 'bg-muted')}
        >
          <Underline className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="iconSm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={cn(editor.isActive('strike') && 'bg-muted')}
        >
          <Strikethrough className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Headings */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1 h-8">
              <Type className="h-4 w-4" />
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
              <Heading1 className="h-4 w-4 mr-2" />
              Heading 1
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
              <Heading2 className="h-4 w-4 mr-2" />
              Heading 2
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
              <Heading3 className="h-4 w-4 mr-2" />
              Heading 3
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setParagraph().run()}>
              <Type className="h-4 w-4 mr-2" />
              Paragraph
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Alignment */}
        <Button
          variant="ghost"
          size="iconSm"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={cn(editor.isActive({ textAlign: 'left' }) && 'bg-muted')}
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="iconSm"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={cn(editor.isActive({ textAlign: 'center' }) && 'bg-muted')}
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="iconSm"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={cn(editor.isActive({ textAlign: 'right' }) && 'bg-muted')}
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="iconSm"
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={cn(editor.isActive({ textAlign: 'justify' }) && 'bg-muted')}
        >
          <AlignJustify className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Lists */}
        <Button
          variant="ghost"
          size="iconSm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(editor.isActive('bulletList') && 'bg-muted')}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="iconSm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(editor.isActive('orderedList') && 'bg-muted')}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Colors */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="iconSm">
              <Palette className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2">
            <div className="text-xs font-medium mb-2">Text Color</div>
            <div className="grid grid-cols-7 gap-1">
              {COLORS.map((color) => (
                <button
                  key={color}
                  className="h-6 w-6 rounded border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => editor.chain().focus().setColor(color).run()}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="iconSm">
              <Highlighter className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2">
            <div className="text-xs font-medium mb-2">Highlight Color</div>
            <div className="grid grid-cols-7 gap-1">
              {COLORS.map((color) => (
                <button
                  key={color}
                  className="h-6 w-6 rounded border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => editor.chain().focus().toggleHighlight({ color }).run()}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Insert */}
        <Button variant="ghost" size="iconSm" onClick={setLink}>
          <Link className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="iconSm" onClick={onInsertImage}>
          <Image className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="iconSm" onClick={insertTable}>
          <Table className="h-4 w-4" />
        </Button>
        <ShapeLibrary 
          trigger={
            <Button variant="ghost" size="iconSm">
              <Shapes className="h-4 w-4" />
            </Button>
          }
          onInsertShape={onInsertShape}
        />
        <Button variant="ghost" size="iconSm" onClick={onInsertChart}>
          <BarChart3 className="h-4 w-4" />
        </Button>
        {onInsertComponent && (
          <Button variant="ghost" size="iconSm" onClick={onInsertComponent} title="Insert Dashboard Component">
            <LayoutDashboard className="h-4 w-4" />
          </Button>
        )}

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Refresh Components */}
        {hasEmbeddedComponents && onRefreshComponents && (
          <>
            <Button 
              variant="ghost" 
              size="iconSm" 
              onClick={onRefreshComponents}
              title={isActivePresentation ? "Refresh all live components" : "Activate presentation to refresh"}
              className={cn(!isActivePresentation && 'opacity-50')}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6 mx-1" />
          </>
        )}

        {/* History */}
        <Button
          variant="ghost"
          size="iconSm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="iconSm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="gap-2" onClick={onAIGenerate}>
          <Sparkles className="h-4 w-4 text-primary" />
          AI Generate
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <Button variant="outline" size="sm" className="gap-2" onClick={onExport}>
          <Download className="h-4 w-4" />
          Export
        </Button>
        <Button variant="outline" size="sm" className="gap-2" onClick={onShare}>
          <Share2 className="h-4 w-4" />
          Share
        </Button>
        <Button variant="default" size="sm" className="gap-2" onClick={onPresent}>
          <Play className="h-4 w-4" />
          Present
        </Button>
      </div>
    </div>
  );
}
