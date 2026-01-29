import React, { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { FolderOpen, ChevronRight, Home, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useProjectContext } from '@/contexts/ProjectContext';
import { useDocuments, type Document } from '@/hooks/useDocuments';
import { useDocumentFolders, type DocumentFolder } from '@/hooks/useDocumentFolders';
import { useDocumentSharing } from '@/hooks/useDocumentSharing';
import {
  DocumentToolbar,
  type ViewMode,
  type SortField,
  type FilterView,
} from '@/components/documents/DocumentToolbar';
import { DocumentSidebar } from '@/components/documents/DocumentSidebar';
import { DocumentGrid } from '@/components/documents/DocumentGrid';
import { DocumentList } from '@/components/documents/DocumentList';
import { DocumentDetailsPanel } from '@/components/documents/DocumentDetailsPanel';
import { DocumentUploadDialog } from '@/components/documents/DocumentUploadDialog';
import { FolderCreateDialog } from '@/components/documents/FolderCreateDialog';
import { DocumentShareDialog } from '@/components/documents/DocumentShareDialog';
import { DocumentMoveDialog } from '@/components/documents/DocumentMoveDialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function DocumentCenterView() {
  const { settings } = useProjectContext();
  const { toast } = useToast();
  const projectId = settings?.id || undefined;

  // Data hooks
  const {
    documents,
    loading: documentsLoading,
    uploadDocument,
    uploadNewVersion,
    deleteDocument,
    restoreDocument,
    toggleStar,
    moveDocument,
    copyDocument,
    renameDocument,
  } = useDocuments(projectId);

  const {
    folders,
    loading: foldersLoading,
    buildFolderTree,
    createFolder,
    deleteFolder,
    renameFolder,
    getFolderPath,
  } = useDocumentFolders(projectId);

  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterView, setFilterView] = useState<FilterView>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  // Dialogs
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showNewVersionDialog, setShowNewVersionDialog] = useState(false);
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameTarget, setRenameTarget] = useState<{ type: 'document' | 'folder'; id: string } | null>(null);

  // Sharing hook for selected document
  const {
    shares,
    shareWithEmail,
    generateShareLink,
    removeShare,
    updateSharePermission,
    copyShareLink,
  } = useDocumentSharing(selectedDocument?.id);

  // Computed values
  const folderTree = useMemo(() => {
    const counts: Record<string, number> = {};
    documents.forEach((doc) => {
      if (doc.folder_id) {
        counts[doc.folder_id] = (counts[doc.folder_id] || 0) + 1;
      }
    });
    return buildFolderTree(counts);
  }, [folders, documents, buildFolderTree]);

  const documentCounts = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      all: documents.filter((d) => !d.is_deleted).length,
      starred: documents.filter((d) => d.is_starred && !d.is_deleted).length,
      shared: 0, // Would need shares data
      recent: documents.filter((d) => !d.is_deleted && new Date(d.updated_at) > weekAgo).length,
      trash: documents.filter((d) => d.is_deleted).length,
    };
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    let result = [...documents];

    // Filter by view
    switch (filterView) {
      case 'starred':
        result = result.filter((d) => d.is_starred && !d.is_deleted);
        break;
      case 'recent':
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        result = result.filter((d) => !d.is_deleted && new Date(d.updated_at) > weekAgo);
        break;
      case 'trash':
        result = result.filter((d) => d.is_deleted);
        break;
      default:
        result = result.filter((d) => !d.is_deleted);
    }

    // Filter by folder
    if (currentFolderId && filterView === 'all') {
      result = result.filter((d) => d.folder_id === currentFolderId);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((d) => d.name.toLowerCase().includes(query));
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
          break;
        case 'size':
          comparison = b.file_size - a.file_size;
          break;
        case 'type':
          comparison = a.file_type.localeCompare(b.file_type);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [documents, filterView, currentFolderId, searchQuery, sortBy, sortDirection]);

  const currentFolderPath = useMemo(() => {
    if (!currentFolderId) return [];
    return getFolderPath(currentFolderId).map((f) => f.name);
  }, [currentFolderId, getFolderPath]);

  // Handlers
  const handleUpload = async (files: File[], folderId: string | null) => {
    for (const file of files) {
      await uploadDocument(file, folderId);
    }
  };

  const handleUploadNewVersion = async (files: File[], _: string | null, changeNotes?: string) => {
    if (selectedDocument && files.length > 0) {
      await uploadNewVersion(selectedDocument.id, files[0], changeNotes);
    }
    setShowNewVersionDialog(false);
  };

  const handleDelete = async () => {
    for (const id of selectedIds) {
      await deleteDocument(id, filterView === 'trash');
    }
    setSelectedIds([]);
    setShowDeleteConfirm(false);
  };

  const handleRestore = async () => {
    for (const id of selectedIds) {
      await restoreDocument(id);
    }
    setSelectedIds([]);
  };

  const handleRename = async () => {
    if (!renameTarget || !renameValue.trim()) return;

    if (renameTarget.type === 'document') {
      await renameDocument(renameTarget.id, renameValue.trim());
    } else {
      await renameFolder(renameTarget.id, renameValue.trim());
    }
    setShowRenameDialog(false);
    setRenameTarget(null);
    setRenameValue('');
  };

  const handleMove = async (targetFolderId: string | null) => {
    for (const id of selectedIds) {
      await moveDocument(id, targetFolderId);
    }
    setSelectedIds([]);
  };

  const handleCopy = async (targetFolderId: string | null) => {
    for (const id of selectedIds) {
      await copyDocument(id, targetFolderId);
    }
    setSelectedIds([]);
  };

  const handleCreateFolder = async (name: string, parentId: string | null, color: string) => {
    await createFolder(name, parentId, color);
  };

  const handleDocumentClick = (doc: Document) => {
    setSelectedDocument(doc);
    setShowDetailsPanel(true);
  };

  const handleDocumentDoubleClick = (doc: Document) => {
    // Open file in new tab
    window.open(doc.file_url, '_blank');
  };

  const openRenameDialog = (doc: Document) => {
    setRenameTarget({ type: 'document', id: doc.id });
    setRenameValue(doc.name);
    setShowRenameDialog(true);
  };

  const openFolderRenameDialog = (folder: DocumentFolder) => {
    setRenameTarget({ type: 'folder', id: folder.id });
    setRenameValue(folder.name);
    setShowRenameDialog(true);
  };

  const handleSortChange = (field: SortField) => {
    if (sortBy === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
  };

  const loading = documentsLoading || foldersLoading;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b bg-card">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/20">
            <FolderOpen className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Document Center</h1>
            <p className="text-muted-foreground">Manage project documents and files</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <DocumentToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        filterView={filterView}
        onFilterViewChange={(view) => {
          setFilterView(view);
          if (view !== 'all') setCurrentFolderId(null);
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showDetailsPanel={showDetailsPanel}
        onToggleDetailsPanel={() => setShowDetailsPanel(!showDetailsPanel)}
        selectedCount={selectedIds.length}
        onUpload={() => setShowUploadDialog(true)}
        onNewFolder={() => {
          setNewFolderParentId(currentFolderId);
          setShowFolderDialog(true);
        }}
        onDelete={() => setShowDeleteConfirm(true)}
        onDownload={() => {
          const doc = documents.find((d) => d.id === selectedIds[0]);
          if (doc) window.open(doc.file_url, '_blank');
        }}
        onShare={() => {
          const doc = documents.find((d) => d.id === selectedIds[0]);
          if (doc) {
            setSelectedDocument(doc);
            setShowShareDialog(true);
          }
        }}
        onCopy={() => setShowMoveDialog(true)}
        onMove={() => setShowMoveDialog(true)}
        onRename={() => {
          const doc = documents.find((d) => d.id === selectedIds[0]);
          if (doc) openRenameDialog(doc);
        }}
      />

      {/* Breadcrumb */}
      {currentFolderId && filterView === 'all' && (
        <div className="px-4 py-2 border-b flex items-center gap-1 text-sm bg-muted/30">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentFolderId(null)}
            className="h-7 px-2"
          >
            <Home className="h-4 w-4 mr-1" />
            Documents
          </Button>
          {currentFolderPath.map((name, index) => (
            <React.Fragment key={index}>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <span className={cn(
                'px-2',
                index === currentFolderPath.length - 1 && 'font-medium'
              )}>
                {name}
              </span>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Trash banner */}
      {filterView === 'trash' && documentCounts.trash > 0 && (
        <div className="px-4 py-2 bg-warning/10 border-b flex items-center justify-between">
          <span className="text-sm text-warning">
            {documentCounts.trash} item{documentCounts.trash !== 1 ? 's' : ''} in trash
          </span>
          <Button variant="outline" size="sm" onClick={handleRestore} disabled={selectedIds.length === 0}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Restore Selected
          </Button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <DocumentSidebar
          folders={folderTree}
          currentFolderId={currentFolderId}
          filterView={filterView}
          onFolderSelect={(id) => {
            setCurrentFolderId(id);
            setFilterView('all');
          }}
          onFilterViewChange={setFilterView}
          onNewFolder={(parentId) => {
            setNewFolderParentId(parentId ?? null);
            setShowFolderDialog(true);
          }}
          onRenameFolder={openFolderRenameDialog}
          onDeleteFolder={deleteFolder}
          documentCounts={documentCounts}
        />

        {/* Document Area */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading documents...</p>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <DocumentGrid
              documents={filteredDocuments}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              onDocumentClick={handleDocumentClick}
              onDocumentDoubleClick={handleDocumentDoubleClick}
              onToggleStar={toggleStar}
              onDelete={(id) => {
                setSelectedIds([id]);
                setShowDeleteConfirm(true);
              }}
              onDownload={(doc) => window.open(doc.file_url, '_blank')}
              onShare={(doc) => {
                setSelectedDocument(doc);
                setShowShareDialog(true);
              }}
              onRename={openRenameDialog}
              onViewHistory={handleDocumentClick}
              onCopy={(doc) => {
                setSelectedIds([doc.id]);
                setShowMoveDialog(true);
              }}
              onMove={(doc) => {
                setSelectedIds([doc.id]);
                setShowMoveDialog(true);
              }}
            />
          ) : (
            <DocumentList
              documents={filteredDocuments}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              onDocumentClick={handleDocumentClick}
              onDocumentDoubleClick={handleDocumentDoubleClick}
              onToggleStar={toggleStar}
              onDelete={(id) => {
                setSelectedIds([id]);
                setShowDeleteConfirm(true);
              }}
              onDownload={(doc) => window.open(doc.file_url, '_blank')}
              onShare={(doc) => {
                setSelectedDocument(doc);
                setShowShareDialog(true);
              }}
              onRename={openRenameDialog}
              onViewHistory={handleDocumentClick}
              onCopy={(doc) => {
                setSelectedIds([doc.id]);
                setShowMoveDialog(true);
              }}
              onMove={(doc) => {
                setSelectedIds([doc.id]);
                setShowMoveDialog(true);
              }}
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSortChange={handleSortChange}
              showDetails={viewMode === 'details'}
            />
          )}
        </div>

        {/* Details Panel */}
        {showDetailsPanel && (
          <DocumentDetailsPanel
            document={selectedDocument}
            folderPath={selectedDocument?.folder_id ? getFolderPath(selectedDocument.folder_id).map(f => f.name) : []}
            onClose={() => setShowDetailsPanel(false)}
            onDownload={() => selectedDocument && window.open(selectedDocument.file_url, '_blank')}
            onShare={() => setShowShareDialog(true)}
            onDelete={() => {
              if (selectedDocument) {
                setSelectedIds([selectedDocument.id]);
                setShowDeleteConfirm(true);
              }
            }}
            onRename={() => selectedDocument && openRenameDialog(selectedDocument)}
            onToggleLock={async () => {
              // Lock/unlock functionality would go here
              toast({ title: 'Lock feature', description: 'Coming soon' });
            }}
            onUploadNewVersion={() => setShowNewVersionDialog(true)}
          />
        )}
      </div>

      {/* Dialogs */}
      <DocumentUploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        folders={folders}
        currentFolderId={currentFolderId}
        onUpload={handleUpload}
      />

      <DocumentUploadDialog
        open={showNewVersionDialog}
        onOpenChange={setShowNewVersionDialog}
        folders={folders}
        currentFolderId={currentFolderId}
        onUpload={handleUploadNewVersion}
        isNewVersion
        documentName={selectedDocument?.name}
      />

      <FolderCreateDialog
        open={showFolderDialog}
        onOpenChange={setShowFolderDialog}
        folders={folders}
        parentFolderId={newFolderParentId}
        onCreateFolder={handleCreateFolder}
      />

      {selectedDocument && (
        <DocumentShareDialog
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
          documentName={selectedDocument.name}
          shares={shares}
          onShareWithEmail={shareWithEmail}
          onGenerateLink={generateShareLink}
          onRemoveShare={removeShare}
          onUpdatePermission={updateSharePermission}
          onCopyLink={copyShareLink}
        />
      )}

      <DocumentMoveDialog
        open={showMoveDialog}
        onOpenChange={setShowMoveDialog}
        documentNames={selectedIds.map((id) => documents.find((d) => d.id === id)?.name || '')}
        folders={folderTree}
        currentFolderId={currentFolderId}
        onMove={handleMove}
        onCopy={handleCopy}
      />

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename</DialogTitle>
            <DialogDescription>
              Enter a new name for this {renameTarget?.type}
            </DialogDescription>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder="Enter new name"
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={!renameValue.trim()}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {filterView === 'trash' ? 'Delete Permanently?' : 'Move to Trash?'}
            </DialogTitle>
            <DialogDescription>
              {filterView === 'trash'
                ? `This will permanently delete ${selectedIds.length} item${selectedIds.length !== 1 ? 's' : ''}. This action cannot be undone.`
                : `${selectedIds.length} item${selectedIds.length !== 1 ? 's' : ''} will be moved to trash. You can restore them later.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {filterView === 'trash' ? 'Delete Permanently' : 'Move to Trash'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
