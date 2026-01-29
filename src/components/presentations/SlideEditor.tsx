import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import type { PresentationSlide } from '@/hooks/useSlides';
import { cn } from '@/lib/utils';
import { EmbeddedDashboardWidget, EmbeddedComponentData } from './EmbeddedDashboardWidget';

interface SlideEditorProps {
  slide: PresentationSlide | null;
  onContentChange: (content: string) => void;
  onEditorReady: (editor: ReturnType<typeof useEditor>) => void;
  isEditable?: boolean;
  embeddedComponents?: EmbeddedComponentData[];
  isActivePresentation?: boolean;
  onRefreshComponent?: (componentId: string) => void;
  onToggleLive?: (componentId: string, isLive: boolean) => void;
  onRemoveComponent?: (componentId: string) => void;
}

export function SlideEditor({
  slide,
  onContentChange,
  onEditorReady,
  isEditable = true,
  embeddedComponents = [],
  isActivePresentation = false,
  onRefreshComponent,
  onToggleLive,
  onRemoveComponent,
}: SlideEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
        },
      }),
      Placeholder.configure({
        placeholder: 'Click to start editing your slide...',
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full',
        },
      }),
      TableRow,
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-border p-2',
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-border p-2 bg-muted font-semibold',
        },
      }),
    ],
    content: slide?.html_content || '',
    editable: isEditable,
    onUpdate: ({ editor }) => {
      onContentChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[400px] p-8',
          'prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground',
          'prose-h1:text-5xl prose-h1:font-bold prose-h1:mb-6',
          'prose-h2:text-3xl prose-h2:font-semibold prose-h2:mb-4',
          'prose-h3:text-2xl prose-h3:font-medium prose-h3:mb-3',
          'prose-ul:list-disc prose-ol:list-decimal',
          'prose-li:text-foreground prose-li:my-1',
          'prose-a:text-primary prose-a:no-underline hover:prose-a:underline'
        ),
      },
    },
  });

  useEffect(() => {
    if (editor) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  useEffect(() => {
    if (editor && slide?.html_content !== undefined) {
      const currentContent = editor.getHTML();
      if (currentContent !== slide.html_content) {
        editor.commands.setContent(slide.html_content || '');
      }
    }
  }, [editor, slide?.id]); // Only update when slide changes

  const getBackgroundStyle = () => {
    if (!slide?.background) return {};

    switch (slide.background.type) {
      case 'solid':
        return { backgroundColor: slide.background.color || '#ffffff' };
      case 'gradient':
        return { background: slide.background.gradient };
      case 'image':
        return {
          backgroundImage: `url(${slide.background.imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        };
      default:
        return {};
    }
  };

  if (!slide) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/30">
        <p className="text-muted-foreground">Select a slide to edit</p>
      </div>
    );
  }

  return (
    <div
      className="h-full overflow-auto bg-card rounded-lg shadow-lg border border-border relative"
      style={getBackgroundStyle()}
    >
      <EditorContent editor={editor} className="h-full" />
      
      {/* Embedded Dashboard Components Layer */}
      {embeddedComponents.length > 0 && (
        <div className="absolute inset-0 pointer-events-none p-4">
          <div className="flex flex-wrap gap-4 pointer-events-auto">
            {embeddedComponents.map((component) => (
              <EmbeddedDashboardWidget
                key={component.id}
                data={component}
                isActive={isActivePresentation}
                isEditable={isEditable}
                onRefresh={onRefreshComponent || (() => {})}
                onToggleLive={onToggleLive || (() => {})}
                onRemove={onRemoveComponent || (() => {})}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Shapes Layer */}
      {slide.shapes && slide.shapes.length > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          {slide.shapes.map((shape) => (
            <div
              key={shape.id}
              className="absolute pointer-events-auto cursor-move"
              style={{
                left: shape.x,
                top: shape.y,
                width: shape.width,
                height: shape.height,
                transform: `rotate(${shape.rotation}deg)`,
                zIndex: shape.zIndex,
              }}
            >
              <svg width="100%" height="100%">
                {shape.type === 'rectangle' && (
                  <rect
                    width="100%"
                    height="100%"
                    fill={shape.fill}
                    stroke={shape.stroke}
                    strokeWidth={shape.strokeWidth}
                    rx="4"
                  />
                )}
                {shape.type === 'circle' && (
                  <ellipse
                    cx="50%"
                    cy="50%"
                    rx="50%"
                    ry="50%"
                    fill={shape.fill}
                    stroke={shape.stroke}
                    strokeWidth={shape.strokeWidth}
                  />
                )}
                {shape.type === 'triangle' && (
                  <polygon
                    points={`${shape.width / 2},0 ${shape.width},${shape.height} 0,${shape.height}`}
                    fill={shape.fill}
                    stroke={shape.stroke}
                    strokeWidth={shape.strokeWidth}
                  />
                )}
              </svg>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
