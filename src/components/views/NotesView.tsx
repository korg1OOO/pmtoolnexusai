import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { NotebookSidebar, PageList, PageEditor, BacklinksSidebar, SpreadsheetEditor } from '@/components/notes';
import { useNotebooks, useSections, usePages, useAllPages, usePageLinks } from '@/hooks/useNotebooks';
import { useSpreadsheets } from '@/hooks/useSpreadsheets';
import { useProjectContext } from '@/contexts/ProjectContext';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Notebook, NotebookSection, NotebookPage } from '@/hooks/useNotebooks';

type ViewMode = 'pages' | 'spreadsheet';

const STORAGE_KEY = 'notes-view-state';

interface NotesViewState {
  selectedNotebookId: string | null;
  selectedSectionId: string | null;
  selectedSpreadsheetId: string | null;
  selectedPageId: string | null;
  viewMode: ViewMode;
  notebookSidebarCollapsed: boolean;
  pageListCollapsed: boolean;
  backlinksSidebarCollapsed: boolean;
}

function loadState(): Partial<NotesViewState> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function saveState(state: Partial<NotesViewState>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

interface NotesViewProps {
  demo?: boolean;
}

export default function NotesView({ demo = false }: NotesViewProps) {
  const { settings } = useProjectContext();
  const projectId = settings?.id;

  const savedState = loadState();

  const [selectedNotebookId, setSelectedNotebookId] = useState<string | null>(savedState.selectedNotebookId || null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(savedState.selectedSectionId || null);
  const [selectedSpreadsheetId, setSelectedSpreadsheetId] = useState<string | null>(savedState.selectedSpreadsheetId || null);
  const [selectedPage, setSelectedPage] = useState<NotebookPage | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(savedState.selectedPageId || null);
  const [viewMode, setViewMode] = useState<ViewMode>(savedState.viewMode || 'pages');

  // Panel collapse states
  const [notebookSidebarCollapsed, setNotebookSidebarCollapsed] = useState(savedState.notebookSidebarCollapsed || false);
  const [pageListCollapsed, setPageListCollapsed] = useState(savedState.pageListCollapsed || false);
  const [backlinksSidebarCollapsed, setBacklinksSidebarCollapsed] = useState(savedState.backlinksSidebarCollapsed || false);

  const {
    notebooks: realNotebooks,
    loading: notebooksLoading,
    createNotebook,
    updateNotebook,
    deleteNotebook,
  } = useNotebooks();
  const { sections: realSections, loading: sectionsLoading } = useSections(selectedNotebookId);
  const { pages: realPages, loading: pagesLoading } = usePages(selectedSectionId);
  // Demo mode disabled - always use real data
  const notebooks = realNotebooks;
  const sections = realSections;
  const pages = realPages;
  const allPages: any[] = [];

  const {
    createSection,
    updateSection,
    deleteSection
  } = useSections(selectedNotebookId);

  const {
    createPage,
    updatePage,
    deletePage
  } = usePages(selectedSectionId);

  const {
    spreadsheets,
    createSpreadsheet,
    updateSpreadsheet,
    deleteSpreadsheet,
    moveSpreadsheet,
    loading: spreadsheetsLoading,
  } = useSpreadsheets(selectedNotebookId);


  const { outgoingLinks, incomingLinks } = usePageLinks(selectedPage?.id || null);

  // Save state when selections change
  useEffect(() => {
    saveState({
      selectedNotebookId,
      selectedSectionId,
      selectedSpreadsheetId,
      selectedPageId: selectedPage?.id || selectedPageId,
      viewMode,
      notebookSidebarCollapsed,
      pageListCollapsed,
      backlinksSidebarCollapsed,
    });
  }, [selectedNotebookId, selectedSectionId, selectedSpreadsheetId, selectedPage, selectedPageId, viewMode, notebookSidebarCollapsed, pageListCollapsed, backlinksSidebarCollapsed]);

  // Restore selected notebook on initial load
  useEffect(() => {
    if (notebooks.length > 0 && !selectedNotebookId) {
      // If no saved state, select first notebook
      setSelectedNotebookId(notebooks[0].id);
    } else if (notebooks.length > 0 && selectedNotebookId) {
      // Validate saved notebook still exists
      const exists = notebooks.some(n => n.id === selectedNotebookId);
      if (!exists) {
        setSelectedNotebookId(notebooks[0].id);
      }
    }
  }, [notebooks, selectedNotebookId, setSelectedNotebookId]);

  // Restore selected section when sections load
  useEffect(() => {
    if (sections.length > 0 && selectedNotebookId) {
      if (selectedSectionId) {
        // Validate saved section still exists
        const exists = sections.some(s => s.id === selectedSectionId);
        if (!exists && !selectedSpreadsheetId) {
          const firstSection = sections.find(s => s.notebook_id === selectedNotebookId);
          if (firstSection) {
            setSelectedSectionId(firstSection.id);
            setViewMode('pages');
          }
        }
      } else if (!selectedSpreadsheetId) {
        // Auto-select first section
        const firstSection = sections.find(s => s.notebook_id === selectedNotebookId);
        if (firstSection) {
          setSelectedSectionId(firstSection.id);
          setViewMode('pages');
        }
      }
    }
  }, [sections, selectedNotebookId, selectedSectionId, selectedSpreadsheetId, setSelectedSectionId, setViewMode]);

  // Restore selected page when pages load
  useEffect(() => {
    if (pages.length > 0 && viewMode === 'pages') {
      if (selectedPageId) {
        // Try to restore saved page
        const savedPage = pages.find(p => p.id === selectedPageId);
        if (savedPage) {
          setSelectedPage(savedPage);
          return;
        }
      }
      // Fallback to first page
      setSelectedPage(pages[0]);
    } else if (viewMode === 'pages' && pages.length === 0) {
      setSelectedPage(null);
    }
  }, [pages, viewMode, selectedPageId, setSelectedPage]);

  const handleSelectNotebook = useCallback((id: string) => {
    setSelectedNotebookId(id);
    // Reset selections when notebook changes
    setSelectedSectionId(null);
    setSelectedSpreadsheetId(null);
    setSelectedPage(null);
    setSelectedPageId(null);
  }, []);

  const handleSelectSection = useCallback((id: string) => {
    setSelectedSectionId(id);
    setSelectedSpreadsheetId(null);
    setViewMode('pages');
  }, []);

  const handleSelectSpreadsheet = useCallback((id: string) => {
    setSelectedSpreadsheetId(id);
    setSelectedSectionId(null);
    setSelectedPage(null);
    setSelectedPageId(null);
    setViewMode('spreadsheet');
  }, []);

  const handleSelectPage = useCallback((page: NotebookPage) => {
    setSelectedPage(page);
    setSelectedPageId(page.id);
  }, []);

  const handleCreatePage = useCallback(async () => {
    // If there's no section yet, auto-create one first
    let targetSectionId = selectedSectionId;
    if (!targetSectionId && selectedNotebookId) {
      const newSection = await createSection('General');
      if (newSection) {
        targetSectionId = newSection.id;
        setSelectedSectionId(newSection.id);
        setViewMode('pages');
      }
    }
    if (!targetSectionId) return;

    // createPage uses the hook's sectionId which may not have updated yet,
    // so we do a direct insert if the section was just created
    if (targetSectionId !== selectedSectionId) {
      // Direct insert since the hook's sectionId hasn't updated yet
      const { data, error } = await (await import('@/integrations/supabase/client')).supabase
        .from('notebook_pages')
        .insert({ section_id: targetSectionId, title: 'Untitled', content: '', sort_order: 0 })
        .select()
        .single();
      if (!error && data) {
        setSelectedPage(data as NotebookPage);
        setSelectedPageId(data.id);
      }
    } else {
      const newPage = await createPage('Untitled');
      if (newPage) {
        setSelectedPage(newPage as NotebookPage);
        setSelectedPageId(newPage.id);
      }
    }
  }, [createPage, createSection, selectedSectionId, selectedNotebookId]);

  const handleCreateSpreadsheet = useCallback(async () => {
    const newSpreadsheet = await createSpreadsheet('Untitled Spreadsheet');
    if (newSpreadsheet) {
      setSelectedSpreadsheetId(newSpreadsheet.id);
      setViewMode('spreadsheet');
    }
  }, [createSpreadsheet]);


  const handleNavigateToPage = useCallback((pageId: string) => {
    // Find the page and navigate to it
    const page = allPages.find(p => p.id === pageId);
    if (page) {
      // Find which section this page is in
      const section = sections.find(s => s.id === page.section_id);
      if (section) {
        setSelectedNotebookId(section.notebook_id);
        setSelectedSectionId(section.id);
        setSelectedSpreadsheetId(null);
        setViewMode('pages');
        // Set the page directly since pages might not be loaded yet
        setSelectedPage(page as NotebookPage);
        setSelectedPageId(page.id);
      }
    }
  }, [allPages, sections]);

  const currentSection = sections.find(s => s.id === selectedSectionId);
  const currentSpreadsheet = spreadsheets.find(s => s.id === selectedSpreadsheetId);
  const totalPages = allPages.length;

  // Get all sections for the current notebook
  const allNotebookSections = sections.filter(s => s.notebook_id === selectedNotebookId);
  const allNotebookSpreadsheets = spreadsheets.filter(s => s.notebook_id === selectedNotebookId);

  return (
    <div className="h-full flex overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Notebook Sidebar */}
        <ResizablePanel
          defaultSize={notebookSidebarCollapsed ? 0 : 18}
          minSize={0}
          maxSize={30}
          collapsible
          collapsedSize={0}
          onCollapse={() => setNotebookSidebarCollapsed(true)}
          onExpand={() => setNotebookSidebarCollapsed(false)}
          className={cn(notebookSidebarCollapsed && "min-w-0")}
        >
          {!notebookSidebarCollapsed && (
            <NotebookSidebar
              notebooks={notebooks}
              sections={allNotebookSections}
              spreadsheets={allNotebookSpreadsheets}
              selectedNotebookId={selectedNotebookId}
              selectedSectionId={selectedSectionId}
              selectedSpreadsheetId={selectedSpreadsheetId}
              onSelectNotebook={handleSelectNotebook}
              onSelectSection={handleSelectSection}
              onSelectSpreadsheet={handleSelectSpreadsheet}
              onCreateNotebook={createNotebook}
              onUpdateNotebook={updateNotebook}
              onDeleteNotebook={deleteNotebook}
              onCreateSection={createSection}
              onUpdateSection={updateSection}
              onDeleteSection={deleteSection}
              onCreateSpreadsheet={createSpreadsheet}
              onUpdateSpreadsheet={updateSpreadsheet}
              onDeleteSpreadsheet={deleteSpreadsheet}
              totalPages={totalPages}
            />
          )}
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Content Area */}
        {viewMode === 'pages' ? (
          <>
            {/* Page List */}
            <ResizablePanel
              defaultSize={pageListCollapsed ? 0 : 22}
              minSize={0}
              maxSize={35}
              collapsible
              collapsedSize={0}
              onCollapse={() => setPageListCollapsed(true)}
              onExpand={() => setPageListCollapsed(false)}
              className={cn(pageListCollapsed && "min-w-0")}
            >
              {!pageListCollapsed && (
                <PageList
                  pages={pages}
                  selectedPageId={selectedPage?.id || null}
                  sectionName={currentSection?.name || 'Pages'}
                  onSelectPage={handleSelectPage}
                  onCreatePage={handleCreatePage}
                  onCreateSpreadsheet={handleCreateSpreadsheet}
                  onUpdatePage={updatePage}
                  onDeletePage={deletePage}
                  loading={pagesLoading}
                />
              )}
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Page Editor - Main content area */}
            <ResizablePanel defaultSize={backlinksSidebarCollapsed ? 60 : 40} minSize={30}>
              <div className="h-full flex flex-col relative">
                {/* Collapse toggle buttons */}
                <div className="absolute top-2 left-2 z-10 flex gap-1">
                  {notebookSidebarCollapsed && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="iconSm"
                          onClick={() => setNotebookSidebarCollapsed(false)}
                          className="bg-background/80 backdrop-blur-sm"
                        >
                          <PanelLeftOpen className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Show Notebooks</TooltipContent>
                    </Tooltip>
                  )}
                  {!notebookSidebarCollapsed && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="iconSm"
                          onClick={() => setNotebookSidebarCollapsed(true)}
                          className="bg-background/80 backdrop-blur-sm"
                        >
                          <PanelLeftClose className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Hide Notebooks</TooltipContent>
                    </Tooltip>
                  )}
                  {pageListCollapsed && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="iconSm"
                          onClick={() => setPageListCollapsed(false)}
                          className="bg-background/80 backdrop-blur-sm"
                        >
                          <PanelLeftOpen className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Show Pages</TooltipContent>
                    </Tooltip>
                  )}
                  {!pageListCollapsed && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="iconSm"
                          onClick={() => setPageListCollapsed(true)}
                          className="bg-background/80 backdrop-blur-sm"
                        >
                          <PanelLeftClose className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Hide Pages</TooltipContent>
                    </Tooltip>
                  )}
                </div>

                <div className="absolute top-2 right-2 z-10 flex gap-1">
                  {backlinksSidebarCollapsed && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="iconSm"
                          onClick={() => setBacklinksSidebarCollapsed(false)}
                          className="bg-background/80 backdrop-blur-sm"
                        >
                          <PanelRightOpen className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Show Links & AI</TooltipContent>
                    </Tooltip>
                  )}
                  {!backlinksSidebarCollapsed && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="iconSm"
                          onClick={() => setBacklinksSidebarCollapsed(true)}
                          className="bg-background/80 backdrop-blur-sm"
                        >
                          <PanelRightClose className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Hide Links & AI</TooltipContent>
                    </Tooltip>
                  )}
                </div>

                <PageEditor
                  page={selectedPage}
                  onUpdate={updatePage}
                  allPages={allPages.map(p => ({ id: p.id, title: p.title }))}
                  onNavigateToPage={handleNavigateToPage}
                />
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Backlinks Sidebar */}
            <ResizablePanel
              defaultSize={backlinksSidebarCollapsed ? 0 : 20}
              minSize={0}
              maxSize={30}
              collapsible
              collapsedSize={0}
              onCollapse={() => setBacklinksSidebarCollapsed(true)}
              onExpand={() => setBacklinksSidebarCollapsed(false)}
              className={cn(backlinksSidebarCollapsed && "min-w-0")}
            >
              {!backlinksSidebarCollapsed && (
                <BacklinksSidebar
                  currentPage={selectedPage}
                  outgoingLinks={outgoingLinks}
                  incomingLinks={incomingLinks}
                  allPages={allPages.map(p => ({ id: p.id, title: p.title, tags: p.tags }))}
                  onNavigateToPage={handleNavigateToPage}
                />
              )}
            </ResizablePanel>
          </>
        ) : (
          /* Spreadsheet Editor - takes full remaining space */
          <ResizablePanel defaultSize={82} minSize={50}>
            <div className="h-full flex flex-col relative">
              {/* Collapse toggle buttons */}
              <div className="absolute top-2 left-2 z-10 flex gap-1">
                {notebookSidebarCollapsed && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="iconSm"
                        onClick={() => setNotebookSidebarCollapsed(false)}
                        className="bg-background/80 backdrop-blur-sm"
                      >
                        <PanelLeftOpen className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Show Notebooks</TooltipContent>
                  </Tooltip>
                )}
                {!notebookSidebarCollapsed && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="iconSm"
                        onClick={() => setNotebookSidebarCollapsed(true)}
                        className="bg-background/80 backdrop-blur-sm"
                      >
                        <PanelLeftClose className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Hide Notebooks</TooltipContent>
                  </Tooltip>
                )}
              </div>
              <SpreadsheetEditor spreadsheet={currentSpreadsheet || null} />
            </div>
          </ResizablePanel>
        )}
      </ResizablePanelGroup>
    </div>
  );
}
