import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Folder,
  FolderOpen,
  Presentation,
  Plus,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Trash2,
  Copy,
  Edit2,
  Layout,
  FileText,
  BarChart3,
  AlertTriangle,
  Layers,
  Calendar,
  Type,
  GripVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PresentationFolder, PresentationFolderTreeNode } from '@/hooks/usePresentationFolders';
import type { Presentation as PresentationType } from '@/hooks/usePresentations';
import type { PresentationSlide } from '@/hooks/useSlides';

interface PresentationSidebarProps {
  folders: PresentationFolderTreeNode[];
  presentations: PresentationType[];
  slides: PresentationSlide[];
  selectedFolderId: string | null;
  selectedPresentationId: string | null;
  selectedSlideId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onSelectPresentation: (presentationId: string) => void;
  onSelectSlide: (slideId: string) => void;
  onCreateFolder: (name: string, parentId: string | null) => void;
  onCreatePresentation: (title: string, folderId: string | null) => void;
  onCreateSlide: (template: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onDeletePresentation: (presentationId: string) => void;
  onDeleteSlide: (slideId: string) => void;
  onDuplicatePresentation: (presentationId: string) => void;
  onDuplicateSlide: (slideId: string) => void;
  onRenameFolder: (folderId: string, newName: string) => void;
}

const slideTemplates = [
  { id: 'title', name: 'Title Slide', icon: Type },
  { id: 'executive-summary', name: 'Executive Summary', icon: FileText },
  { id: 'timeline', name: 'Timeline', icon: Calendar },
  { id: 'metrics', name: 'Metrics Dashboard', icon: BarChart3 },
  { id: 'risk-matrix', name: 'Risk Matrix', icon: AlertTriangle },
  { id: 'comparison', name: 'Comparison', icon: Layers },
  { id: 'blank', name: 'Blank', icon: Layout },
];

function FolderTreeItem({
  folder,
  presentations,
  level = 0,
  selectedFolderId,
  selectedPresentationId,
  onSelectFolder,
  onSelectPresentation,
  onDeleteFolder,
  onDeletePresentation,
  onDuplicatePresentation,
  onRenameFolder,
}: {
  folder: PresentationFolderTreeNode;
  presentations: PresentationType[];
  level?: number;
  selectedFolderId: string | null;
  selectedPresentationId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onSelectPresentation: (presentationId: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onDeletePresentation: (presentationId: string) => void;
  onDuplicatePresentation: (presentationId: string) => void;
  onRenameFolder: (folderId: string, newName: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(folder.name);
  const folderPresentations = presentations.filter(p => p.folder_id === folder.id);
  const hasChildren = folder.children.length > 0 || folderPresentations.length > 0;

  return (
    <div>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
              <button
                className={cn(
                  'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors',
                  'hover:bg-muted/50',
                  selectedFolderId === folder.id && 'bg-muted'
                )}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
                onClick={(e) => {
                  e.preventDefault();
                  onSelectFolder(folder.id);
                }}
              >
                {hasChildren ? (
                  isOpen ? (
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  )
                ) : (
                  <span className="w-3" />
                )}
                {isOpen ? (
                  <FolderOpen className="h-4 w-4 text-primary" />
                ) : (
                  <Folder className="h-4 w-4 text-primary" />
                )}
                <span className="truncate flex-1 text-left">{folder.name}</span>
                {folderPresentations.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {folderPresentations.length}
                  </span>
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {/* Child Folders */}
              {folder.children.map((child) => (
                <FolderTreeItem
                  key={child.id}
                  folder={child}
                  presentations={presentations}
                  level={level + 1}
                  selectedFolderId={selectedFolderId}
                  selectedPresentationId={selectedPresentationId}
                  onSelectFolder={onSelectFolder}
                  onSelectPresentation={onSelectPresentation}
                  onDeleteFolder={onDeleteFolder}
                  onDeletePresentation={onDeletePresentation}
                  onDuplicatePresentation={onDuplicatePresentation}
                  onRenameFolder={onRenameFolder}
                />
              ))}
              {/* Presentations in this folder */}
              {folderPresentations.map((presentation) => (
                <ContextMenu key={presentation.id}>
                  <ContextMenuTrigger asChild>
                    <button
                      className={cn(
                        'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors',
                        'hover:bg-muted/50',
                        selectedPresentationId === presentation.id && 'bg-primary/10 text-primary'
                      )}
                      style={{ paddingLeft: `${(level + 1) * 12 + 8}px` }}
                      onClick={() => onSelectPresentation(presentation.id)}
                    >
                      <Presentation className="h-4 w-4" />
                      <span className="truncate flex-1 text-left">{presentation.title}</span>
                    </button>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onClick={() => onDuplicatePresentation(presentation.id)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      onClick={() => onDeletePresentation(presentation.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </ContextMenuTrigger>
        <ContextMenuContent>
          {isRenaming ? (
            <div className="p-2 flex gap-1">
              <Input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="h-7 text-xs flex-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && renameValue.trim()) {
                    onRenameFolder(folder.id, renameValue.trim());
                    setIsRenaming(false);
                  }
                  if (e.key === 'Escape') setIsRenaming(false);
                }}
              />
              <button
                className="text-xs text-primary hover:underline"
                onClick={() => {
                  if (renameValue.trim()) {
                    onRenameFolder(folder.id, renameValue.trim());
                    setIsRenaming(false);
                  }
                }}
              >OK</button>
            </div>
          ) : (
            <ContextMenuItem onClick={() => {
              setRenameValue(folder.name);
              setIsRenaming(true);
            }}>
              <Edit2 className="h-4 w-4 mr-2" />
              Rename
            </ContextMenuItem>
          )}
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={() => onDeleteFolder(folder.id)}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
}

export function PresentationSidebar({
  folders,
  presentations,
  slides,
  selectedFolderId,
  selectedPresentationId,
  selectedSlideId,
  onSelectFolder,
  onSelectPresentation,
  onSelectSlide,
  onCreateFolder,
  onCreatePresentation,
  onCreateSlide,
  onDeleteFolder,
  onDeletePresentation,
  onDeleteSlide,
  onDuplicatePresentation,
  onDuplicateSlide,
  onRenameFolder,
}: PresentationSidebarProps) {
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewPresentation, setShowNewPresentation] = useState(false);
  const [newPresentationTitle, setNewPresentationTitle] = useState('');
  const [showSlideTemplates, setShowSlideTemplates] = useState(false);

  const rootPresentations = presentations.filter(p => !p.folder_id);

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim(), null);
      setNewFolderName('');
      setShowNewFolder(false);
    }
  };

  const handleCreatePresentation = () => {
    if (newPresentationTitle.trim()) {
      onCreatePresentation(newPresentationTitle.trim(), selectedFolderId);
      setNewPresentationTitle('');
      setShowNewPresentation(false);
    }
  };

  const getSlidePreview = (slide: PresentationSlide) => {
    const Icon = slideTemplates.find(t => t.id === slide.template)?.icon || Layout;
    return (
      <div className="aspect-video bg-muted/50 rounded border border-border flex items-center justify-center">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  };

  return (
    <div className="w-64 border-r border-border bg-sidebar flex flex-col h-full">
      {/* Presentations & Folders Section */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-sm text-foreground flex items-center gap-2">
            <Presentation className="h-4 w-4 text-primary" />
            Presentations
          </h2>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="iconXs"
              onClick={() => setShowNewFolder(true)}
              title="New Folder"
            >
              <Folder className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="iconXs"
              onClick={() => setShowNewPresentation(true)}
              title="New Presentation"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {showNewFolder && (
          <div className="p-2 border-b border-border">
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name..."
              className="h-8 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFolder();
                if (e.key === 'Escape') setShowNewFolder(false);
              }}
              onBlur={() => {
                if (!newFolderName.trim()) setShowNewFolder(false);
              }}
            />
          </div>
        )}

        {showNewPresentation && (
          <div className="p-2 border-b border-border">
            <Input
              value={newPresentationTitle}
              onChange={(e) => setNewPresentationTitle(e.target.value)}
              placeholder="Presentation title..."
              className="h-8 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreatePresentation();
                if (e.key === 'Escape') setShowNewPresentation(false);
              }}
              onBlur={() => {
                if (!newPresentationTitle.trim()) setShowNewPresentation(false);
              }}
            />
          </div>
        )}

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {/* All Presentations */}
            <button
              className={cn(
                'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors',
                'hover:bg-muted/50',
                selectedFolderId === null && !selectedPresentationId && 'bg-muted'
              )}
              onClick={() => onSelectFolder(null)}
            >
              <Presentation className="h-4 w-4 text-muted-foreground" />
              <span>All Presentations</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {presentations.length}
              </span>
            </button>

            <Separator className="my-2" />

            {/* Folder Tree */}
            {folders.map((folder) => (
              <FolderTreeItem
                key={folder.id}
                folder={folder}
                presentations={presentations}
                selectedFolderId={selectedFolderId}
                selectedPresentationId={selectedPresentationId}
                onSelectFolder={onSelectFolder}
                onSelectPresentation={onSelectPresentation}
                onDeleteFolder={onDeleteFolder}
                onDeletePresentation={onDeletePresentation}
                onDuplicatePresentation={onDuplicatePresentation}
                onRenameFolder={onRenameFolder}
              />
            ))}

            {/* Root Presentations */}
            {rootPresentations.map((presentation) => (
              <ContextMenu key={presentation.id}>
                <ContextMenuTrigger asChild>
                  <button
                    className={cn(
                      'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors',
                      'hover:bg-muted/50',
                      selectedPresentationId === presentation.id && 'bg-primary/10 text-primary'
                    )}
                    onClick={() => onSelectPresentation(presentation.id)}
                  >
                    <Presentation className="h-4 w-4" />
                    <span className="truncate flex-1 text-left">{presentation.title}</span>
                  </button>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onClick={() => onDuplicatePresentation(presentation.id)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem
                    onClick={() => onDeletePresentation(presentation.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Slides Section */}
      {selectedPresentationId && (
        <div className="border-t border-border flex-1 flex flex-col min-h-0 max-h-[50%]">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <h3 className="font-medium text-sm text-foreground">Slides</h3>
            <Button
              variant="ghost"
              size="iconXs"
              onClick={() => setShowSlideTemplates(!showSlideTemplates)}
              title="Add Slide"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          <AnimatePresence>
            {showSlideTemplates && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-b border-border overflow-hidden"
              >
                <div className="p-2 grid grid-cols-2 gap-1">
                  {slideTemplates.map((template) => {
                    const Icon = template.icon;
                    return (
                      <button
                        key={template.id}
                        className="p-2 rounded border border-border hover:border-primary hover:bg-muted/50 transition-colors"
                        onClick={() => {
                          onCreateSlide(template.id);
                          setShowSlideTemplates(false);
                        }}
                      >
                        <Icon className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground block truncate">
                          {template.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {slides.map((slide, index) => (
                <ContextMenu key={slide.id}>
                  <ContextMenuTrigger asChild>
                    <button
                      className={cn(
                        'w-full text-left rounded-md border transition-all',
                        'hover:border-primary/50',
                        selectedSlideId === slide.id
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-border'
                      )}
                      onClick={() => onSelectSlide(slide.id)}
                    >
                      <div className="flex items-start gap-2 p-2">
                        <span className="text-xs text-muted-foreground mt-1 w-4 shrink-0">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          {getSlidePreview(slide)}
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {slide.title}
                          </p>
                        </div>
                        <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0 opacity-0 group-hover:opacity-100" />
                      </div>
                    </button>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onClick={() => onDuplicateSlide(slide.id)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      onClick={() => onDeleteSlide(slide.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
