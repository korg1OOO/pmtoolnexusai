import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, StickyNote } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpeakerNotesPanelProps {
  notes: string;
  onChange: (notes: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function SpeakerNotesPanel({
  notes,
  onChange,
  isOpen,
  onToggle,
}: SpeakerNotesPanelProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
      Placeholder.configure({
        placeholder: 'Add speaker notes here... (only visible to you during presentation)',
      }),
    ],
    content: notes || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[100px] p-4',
          'prose-p:text-foreground prose-p:text-sm prose-p:my-1'
        ),
      },
    },
  });

  React.useEffect(() => {
    if (editor && notes !== undefined) {
      const currentContent = editor.getHTML();
      if (currentContent !== notes) {
        editor.commands.setContent(notes || '');
      }
    }
  }, [editor, notes]);

  return (
    <div className="border-t border-border bg-card">
      <button
        className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <StickyNote className="h-4 w-4 text-muted-foreground" />
          Speaker Notes
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      
      {isOpen && (
        <div className="border-t border-border">
          <EditorContent editor={editor} />
        </div>
      )}
    </div>
  );
}
