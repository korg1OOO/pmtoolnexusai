import React from 'react';
import { cn } from '@/lib/utils';
import {
  Upload,
  FolderPlus,
  Trash2,
  Download,
  Share2,
  Copy,
  Move,
  Grid3X3,
  List,
  LayoutList,
  SortAsc,
  Star,
  Clock,
  Users,
  PanelRightClose,
  PanelRight,
  RotateCcw,
  Edit2,
  Search,
  Filter,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type ViewMode = 'grid' | 'list' | 'details';
export type SortField = 'name' | 'date' | 'size' | 'type';
export type FilterView = 'all' | 'starred' | 'shared' | 'recent' | 'trash';

interface DocumentToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortBy: SortField;
  onSortChange: (field: SortField) => void;
  filterView: FilterView;
  onFilterViewChange: (view: FilterView) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showDetailsPanel: boolean;
  onToggleDetailsPanel: () => void;
  selectedCount: number;
  onUpload: () => void;
  onNewFolder: () => void;
  onDelete: () => void;
  onDownload: () => void;
  onShare: () => void;
  onCopy: () => void;
  onMove: () => void;
  onRename: () => void;
}

export function DocumentToolbar({
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange,
  filterView,
  onFilterViewChange,
  searchQuery,
  onSearchChange,
  showDetailsPanel,
  onToggleDetailsPanel,
  selectedCount,
  onUpload,
  onNewFolder,
  onDelete,
  onDownload,
  onShare,
  onCopy,
  onMove,
  onRename,
}: DocumentToolbarProps) {
  const hasSelection = selectedCount > 0;

  return (
    <TooltipProvider>
      <div className="flex items-center justify-between p-3 border-b bg-card gap-2">
        {/* Left Section - Actions */}
        <div className="flex items-center gap-1">
          {/* Primary Actions */}
          <Button onClick={onUpload} size="sm" className="gap-1">
            <Upload className="h-4 w-4" />
            Upload
          </Button>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={onNewFolder} variant="outline" size="sm" className="gap-1">
                <FolderPlus className="h-4 w-4" />
                <span className="hidden sm:inline">New Folder</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>New Folder</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Selection Actions - Only show when items selected */}
          {hasSelection && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={onDownload} variant="ghost" size="iconSm">
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Download</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={onShare} variant="ghost" size="iconSm">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Share</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={onCopy} variant="ghost" size="iconSm">
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={onMove} variant="ghost" size="iconSm">
                    <Move className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Move</TooltipContent>
              </Tooltip>

              {selectedCount === 1 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={onRename} variant="ghost" size="iconSm">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Rename</TooltipContent>
                </Tooltip>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={onDelete} variant="ghost" size="iconSm" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete</TooltipContent>
              </Tooltip>

              <Separator orientation="vertical" className="h-6 mx-1" />

              <span className="text-sm text-muted-foreground">
                {selectedCount} selected
              </span>
            </>
          )}
        </div>

        {/* Center Section - Search */}
        <div className="flex-1 max-w-md mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 pr-8 h-9"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="iconXs"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => onSearchChange('')}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Right Section - View Controls */}
        <div className="flex items-center gap-1">
          {/* Filter View */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1">
                <Filter className="h-4 w-4" />
                <span className="hidden md:inline capitalize">{filterView === 'all' ? 'All Files' : filterView}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onFilterViewChange('all')}>
                <Grid3X3 className="h-4 w-4 mr-2" />
                All Files
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onFilterViewChange('starred')}>
                <Star className="h-4 w-4 mr-2" />
                Starred
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onFilterViewChange('shared')}>
                <Users className="h-4 w-4 mr-2" />
                Shared
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onFilterViewChange('recent')}>
                <Clock className="h-4 w-4 mr-2" />
                Recent
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onFilterViewChange('trash')}>
                <Trash2 className="h-4 w-4 mr-2" />
                Trash
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="iconSm">
                <SortAsc className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onSortChange('name')}>
                Sort by Name {sortBy === 'name' && '✓'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSortChange('date')}>
                Sort by Date {sortBy === 'date' && '✓'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSortChange('size')}>
                Sort by Size {sortBy === 'size' && '✓'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSortChange('type')}>
                Sort by Type {sortBy === 'type' && '✓'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* View Mode */}
          <div className="flex items-center border rounded-md">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="iconSm"
                  onClick={() => onViewModeChange('grid')}
                  className={cn(
                    'rounded-r-none',
                    viewMode === 'grid' && 'bg-muted'
                  )}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Grid View</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="iconSm"
                  onClick={() => onViewModeChange('list')}
                  className={cn(
                    'rounded-none border-x',
                    viewMode === 'list' && 'bg-muted'
                  )}
                >
                  <List className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>List View</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="iconSm"
                  onClick={() => onViewModeChange('details')}
                  className={cn(
                    'rounded-l-none',
                    viewMode === 'details' && 'bg-muted'
                  )}
                >
                  <LayoutList className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Details View</TooltipContent>
            </Tooltip>
          </div>

          {/* Details Panel Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="iconSm"
                onClick={onToggleDetailsPanel}
                className={cn(showDetailsPanel && 'bg-muted')}
              >
                {showDetailsPanel ? (
                  <PanelRightClose className="h-4 w-4" />
                ) : (
                  <PanelRight className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {showDetailsPanel ? 'Hide Details' : 'Show Details'}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
