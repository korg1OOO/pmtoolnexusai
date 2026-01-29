import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  FolderOpen,
  Star,
  Users,
  Clock,
  Trash2,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderPlus,
  MoreHorizontal,
  Edit2,
  Palette,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { type FolderTreeNode, type DocumentFolder } from '@/hooks/useDocumentFolders';
import { type FilterView } from './DocumentToolbar';

interface DocumentSidebarProps {
  folders: FolderTreeNode[];
  currentFolderId: string | null;
  filterView: FilterView;
  onFolderSelect: (folderId: string | null) => void;
  onFilterViewChange: (view: FilterView) => void;
  onNewFolder: (parentId?: string | null) => void;
  onRenameFolder: (folder: DocumentFolder) => void;
  onDeleteFolder: (folderId: string) => void;
  documentCounts: {
    all: number;
    starred: number;
    shared: number;
    recent: number;
    trash: number;
  };
}

function FolderTreeItem({
  folder,
  level = 0,
  isSelected,
  onSelect,
  onNewSubfolder,
  onRename,
  onDelete,
}: {
  folder: FolderTreeNode;
  level?: number;
  isSelected: boolean;
  onSelect: (folderId: string) => void;
  onNewSubfolder: (parentId: string) => void;
  onRename: (folder: DocumentFolder) => void;
  onDelete: (folderId: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = folder.children.length > 0;

  return (
    <div>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div
          className={cn(
            'group flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-muted/50 cursor-pointer transition-colors',
            isSelected && 'bg-primary/10 text-primary'
          )}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
        >
          {hasChildren ? (
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="iconXs"
                className="shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                {isOpen ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </Button>
            </CollapsibleTrigger>
          ) : (
            <div className="w-6" />
          )}

          <button
            className="flex-1 flex items-center gap-2 text-left min-w-0"
            onClick={() => onSelect(folder.id)}
          >
            <Folder
              className="h-4 w-4 shrink-0"
              style={{ color: folder.color }}
            />
            <span className="text-sm truncate">{folder.name}</span>
            {folder.documentCount > 0 && (
              <Badge variant="secondary" className="text-[10px] ml-auto">
                {folder.documentCount}
              </Badge>
            )}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="iconXs"
                className="opacity-0 group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onNewSubfolder(folder.id)}>
                <FolderPlus className="h-4 w-4 mr-2" />
                New Subfolder
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRename(folder)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(folder.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {hasChildren && (
          <CollapsibleContent>
            {folder.children.map((child) => (
              <FolderTreeItem
                key={child.id}
                folder={child}
                level={level + 1}
                isSelected={isSelected}
                onSelect={onSelect}
                onNewSubfolder={onNewSubfolder}
                onRename={onRename}
                onDelete={onDelete}
              />
            ))}
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  );
}

export function DocumentSidebar({
  folders,
  currentFolderId,
  filterView,
  onFolderSelect,
  onFilterViewChange,
  onNewFolder,
  onRenameFolder,
  onDeleteFolder,
  documentCounts,
}: DocumentSidebarProps) {
  const quickAccessItems = [
    { id: 'all', label: 'All Files', icon: FolderOpen, count: documentCounts.all },
    { id: 'starred', label: 'Starred', icon: Star, count: documentCounts.starred },
    { id: 'shared', label: 'Shared', icon: Users, count: documentCounts.shared },
    { id: 'recent', label: 'Recent', icon: Clock, count: documentCounts.recent },
  ];

  return (
    <div className="w-60 border-r flex flex-col bg-card/50">
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Quick Access */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground px-2 mb-2">
              QUICK ACCESS
            </h3>
            <div className="space-y-0.5">
              {quickAccessItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onFilterViewChange(item.id as FilterView);
                    onFolderSelect(null);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors text-left',
                    filterView === item.id && currentFolderId === null && 'bg-primary/10 text-primary'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <item.icon className="h-4 w-4" />
                    <span className="text-sm">{item.label}</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    {item.count}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          {/* Trash */}
          <div>
            <button
              onClick={() => {
                onFilterViewChange('trash');
                onFolderSelect(null);
              }}
              className={cn(
                'w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors text-left',
                filterView === 'trash' && 'bg-primary/10 text-primary'
              )}
            >
              <div className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                <span className="text-sm">Trash</span>
              </div>
              <Badge variant="secondary" className="text-[10px]">
                {documentCounts.trash}
              </Badge>
            </button>
          </div>

          {/* Folders */}
          <div>
            <div className="flex items-center justify-between px-2 mb-2">
              <h3 className="text-xs font-semibold text-muted-foreground">
                FOLDERS
              </h3>
              <Button
                variant="ghost"
                size="iconXs"
                onClick={() => onNewFolder(null)}
              >
                <FolderPlus className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-0.5">
              {folders.length === 0 ? (
                <p className="text-xs text-muted-foreground px-2 py-4 text-center">
                  No folders yet
                </p>
              ) : (
                folders.map((folder) => (
                  <FolderTreeItem
                    key={folder.id}
                    folder={folder}
                    isSelected={currentFolderId === folder.id}
                    onSelect={onFolderSelect}
                    onNewSubfolder={onNewFolder}
                    onRename={onRenameFolder}
                    onDelete={onDeleteFolder}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
