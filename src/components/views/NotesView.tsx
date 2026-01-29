import React, { useState, useEffect, useCallback } from 'react';
import { NotebookSidebar, PageList, PageEditor, BacklinksSidebar, SpreadsheetEditor } from '@/components/notes';
import { useNotebooks, useSections, usePages, useAllPages, usePageLinks } from '@/hooks/useNotebooks';
import { useSpreadsheets } from '@/hooks/useSpreadsheets';
import { useProjectContext } from '@/contexts/ProjectContext';
import type { NotebookPage } from '@/hooks/useNotebooks';

type ViewMode = 'pages' | 'spreadsheet';

export function NotesView() {
  const { settings } = useProjectContext();
  const projectId = settings?.id;
  
  const [selectedNotebookId, setSelectedNotebookId] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedSpreadsheetId, setSelectedSpreadsheetId] = useState<string | null>(null);
  const [selectedPage, setSelectedPage] = useState<NotebookPage | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('pages');

  const { notebooks, loading: notebooksLoading, createNotebook, updateNotebook, deleteNotebook } = useNotebooks();
  const { sections, loading: sectionsLoading, createSection, updateSection, deleteSection } = useSections(selectedNotebookId);
  const { spreadsheets, loading: spreadsheetsLoading, createSpreadsheet, updateSpreadsheet, deleteSpreadsheet } = useSpreadsheets(selectedNotebookId);
  const { pages, loading: pagesLoading, createPage, updatePage, deletePage } = usePages(selectedSectionId);
  const { allPages, loading: allPagesLoading } = useAllPages(projectId);
  const { outgoingLinks, incomingLinks } = usePageLinks(selectedPage?.id || null);

  // Auto-select first notebook
  useEffect(() => {
    if (notebooks.length > 0 && !selectedNotebookId) {
      setSelectedNotebookId(notebooks[0].id);
    }
  }, [notebooks, selectedNotebookId]);

  // Auto-select first section when notebook changes
  useEffect(() => {
    if (sections.length > 0 && selectedNotebookId) {
      const firstSection = sections.find(s => s.notebook_id === selectedNotebookId);
      if (firstSection && !selectedSpreadsheetId) {
        setSelectedSectionId(firstSection.id);
        setViewMode('pages');
      }
    }
  }, [sections, selectedNotebookId]);

  // Auto-select first page when section changes
  useEffect(() => {
    if (pages.length > 0 && viewMode === 'pages') {
      setSelectedPage(pages[0]);
    } else if (viewMode === 'pages') {
      setSelectedPage(null);
    }
  }, [pages, viewMode]);

  const handleSelectNotebook = (id: string) => {
    setSelectedNotebookId(id);
    // Reset selections when notebook changes
    setSelectedSectionId(null);
    setSelectedSpreadsheetId(null);
    setSelectedPage(null);
  };

  const handleSelectSection = (id: string) => {
    setSelectedSectionId(id);
    setSelectedSpreadsheetId(null);
    setViewMode('pages');
  };

  const handleSelectSpreadsheet = (id: string) => {
    setSelectedSpreadsheetId(id);
    setSelectedSectionId(null);
    setSelectedPage(null);
    setViewMode('spreadsheet');
  };

  const handleSelectPage = (page: NotebookPage) => {
    setSelectedPage(page);
  };

  const handleCreatePage = async () => {
    const newPage = await createPage('Untitled');
    if (newPage) {
      setSelectedPage(newPage);
    }
  };

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
      {/* Notebook Sidebar */}
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

      {/* Content Area - either Page List + Editor or Spreadsheet Editor */}
      {viewMode === 'pages' ? (
        <>
          {/* Page List */}
          <PageList
            pages={pages}
            selectedPageId={selectedPage?.id || null}
            sectionName={currentSection?.name || 'Pages'}
            onSelectPage={handleSelectPage}
            onCreatePage={handleCreatePage}
            onUpdatePage={updatePage}
            onDeletePage={deletePage}
            loading={pagesLoading}
          />

          {/* Page Editor */}
          <PageEditor
            page={selectedPage}
            onUpdate={updatePage}
            allPages={allPages.map(p => ({ id: p.id, title: p.title }))}
            onNavigateToPage={handleNavigateToPage}
          />

          {/* Backlinks Sidebar */}
          <BacklinksSidebar
            currentPage={selectedPage}
            outgoingLinks={outgoingLinks}
            incomingLinks={incomingLinks}
            allPages={allPages.map(p => ({ id: p.id, title: p.title, tags: p.tags }))}
            onNavigateToPage={handleNavigateToPage}
          />
        </>
      ) : (
        /* Spreadsheet Editor */
        <SpreadsheetEditor spreadsheet={currentSpreadsheet || null} />
      )}
    </div>
  );
}
