import React, { useState, useEffect, useCallback } from 'react';
import { NotebookSidebar, PageList, PageEditor, BacklinksSidebar } from '@/components/notes';
import { useNotebooks, useSections, usePages, useAllPages, usePageLinks } from '@/hooks/useNotebooks';
import { useProjectContext } from '@/contexts/ProjectContext';
import type { NotebookPage } from '@/hooks/useNotebooks';

export function NotesView() {
  const { settings } = useProjectContext();
  const projectId = settings?.id;
  
  const [selectedNotebookId, setSelectedNotebookId] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedPage, setSelectedPage] = useState<NotebookPage | null>(null);

  const { notebooks, loading: notebooksLoading, createNotebook, updateNotebook, deleteNotebook } = useNotebooks();
  const { sections, loading: sectionsLoading, createSection, updateSection, deleteSection } = useSections(selectedNotebookId);
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
      if (firstSection) {
        setSelectedSectionId(firstSection.id);
      }
    }
  }, [sections, selectedNotebookId]);

  // Auto-select first page when section changes
  useEffect(() => {
    if (pages.length > 0) {
      setSelectedPage(pages[0]);
    } else {
      setSelectedPage(null);
    }
  }, [pages]);

  const handleSelectNotebook = (id: string) => {
    setSelectedNotebookId(id);
    // Reset section selection when notebook changes
    const notebookSections = sections.filter(s => s.notebook_id === id);
    if (notebookSections.length > 0) {
      setSelectedSectionId(notebookSections[0].id);
    } else {
      setSelectedSectionId(null);
    }
  };

  const handleSelectSection = (id: string) => {
    setSelectedSectionId(id);
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
        // Set the page directly since pages might not be loaded yet
        setSelectedPage(page as NotebookPage);
      }
    }
  }, [allPages, sections]);

  const currentSection = sections.find(s => s.id === selectedSectionId);
  const totalPages = allPages.length;

  // Get all pages for the current notebook (for section view)
  const allNotebookSections = sections.filter(s => 
    notebooks.find(n => n.id === selectedNotebookId)?.id === s.notebook_id || 
    s.notebook_id === selectedNotebookId
  );

  return (
    <div className="h-full flex overflow-hidden">
      {/* Notebook Sidebar */}
      <NotebookSidebar
        notebooks={notebooks}
        sections={allNotebookSections}
        selectedNotebookId={selectedNotebookId}
        selectedSectionId={selectedSectionId}
        onSelectNotebook={handleSelectNotebook}
        onSelectSection={handleSelectSection}
        onCreateNotebook={createNotebook}
        onUpdateNotebook={updateNotebook}
        onDeleteNotebook={deleteNotebook}
        onCreateSection={createSection}
        onUpdateSection={updateSection}
        onDeleteSection={deleteSection}
        totalPages={totalPages}
      />

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
    </div>
  );
}
