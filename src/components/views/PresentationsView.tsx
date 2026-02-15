import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Presentation,
  Plus,
  ChevronRight,
  ChevronLeft,
  Loader2,
  FolderPlus,
  Sparkles,
} from 'lucide-react';
import { useProjectContext } from '@/contexts/ProjectContext';
import { usePresentationFolders } from '@/hooks/usePresentationFolders';
import { usePresentations, Presentation as PresentationType } from '@/hooks/usePresentations';
import { useSlides } from '@/hooks/useSlides';
import { useEmbeddedComponents } from '@/hooks/useEmbeddedComponents';
import { useActivePresentation } from '@/hooks/useActivePresentation';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  PresentationSidebar,
  PresentationToolbar,
  SlideEditor,
  SlidePropertiesPanel,
  SpeakerNotesPanel,
  ComponentPicker,
  ShapeLibrary,
} from '@/components/presentations';
import type { Editor } from '@tiptap/react';
import type { SlideShape } from '@/hooks/useSlides';
import type { EmbeddableComponent } from '@/lib/embeddableComponents';
import type { EmbeddedComponentData } from '@/components/presentations/EmbeddedDashboardWidget';

export default function PresentationsView() {
  const { settings } = useProjectContext();
  const projectId = settings.id || undefined;

  // State
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedPresentationId, setSelectedPresentationId] = useState<string | null>(null);
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
  const [presentationMode, setPresentationMode] = useState(false);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [showNewPresentationDialog, setShowNewPresentationDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newPresentationTitle, setNewPresentationTitle] = useState('');
  const [showSpeakerNotes, setShowSpeakerNotes] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null);
  const [showComponentPicker, setShowComponentPicker] = useState(false);
  const [showAIGenerateDialog, setShowAIGenerateDialog] = useState(false);
  const [aiPrompt, setAIPrompt] = useState('');
  const [aiGenerating, setAIGenerating] = useState(false);
  const [showShapeLibrary, setShowShapeLibrary] = useState(false);
  const { toast } = useToast();

  // Hooks
  const { folders, loading: foldersLoading, buildFolderTree, createFolder, deleteFolder, renameFolder } = usePresentationFolders(projectId);
  const { presentations, loading: presentationsLoading, createPresentation, updatePresentation, deletePresentation, duplicatePresentation } = usePresentations(projectId);
  const {
    slides,
    loading: slidesLoading,
    createSlide,
    updateSlide,
    deleteSlide,
    duplicateSlide,
    reorderSlides,
    addShape,
    saveSlideDebounced,
    uploadImage,
  } = useSlides(selectedPresentationId || undefined);
  
  // Embedded components hooks
  const {
    addEmbeddedComponent,
    removeEmbeddedComponent,
    updateComponentLiveStatus,
    refreshComponent,
    refreshAllComponents,
  } = useEmbeddedComponents(selectedSlideId || undefined);
  
  const {
    activePresentation,
    setActivePresentationId,
    isPresentation: isActivePresentation,
  } = useActivePresentation();
  const presentationCounts = presentations.reduce((acc, p) => {
    if (p.folder_id) {
      acc[p.folder_id] = (acc[p.folder_id] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  const folderTree = buildFolderTree(presentationCounts);

  // Derived state
  const selectedPresentation = presentations.find(p => p.id === selectedPresentationId);
  const selectedSlide = slides.find(s => s.id === selectedSlideId);

  // Auto-select first presentation and slide
  useEffect(() => {
    if (!selectedPresentationId && presentations.length > 0) {
      setSelectedPresentationId(presentations[0].id);
    }
  }, [presentations, selectedPresentationId]);

  useEffect(() => {
    if (!selectedSlideId && slides.length > 0) {
      setSelectedSlideId(slides[0].id);
    } else if (selectedSlideId && slides.length > 0 && !slides.find(s => s.id === selectedSlideId)) {
      setSelectedSlideId(slides[0].id);
    }
  }, [slides, selectedSlideId]);

  // Handlers
  const handleCreateFolder = async (name: string, parentId: string | null) => {
    await createFolder(name, parentId);
    setNewFolderName('');
    setShowNewFolderDialog(false);
  };

  const handleCreatePresentation = async (title: string, folderId: string | null) => {
    const presentation = await createPresentation(title, 'custom', folderId);
    if (presentation) {
      setSelectedPresentationId(presentation.id);
    }
    setNewPresentationTitle('');
    setShowNewPresentationDialog(false);
  };

  const handleCreateSlide = async (templateId: string) => {
    const templateNames: Record<string, string> = {
      'title': 'Title Slide',
      'executive-summary': 'Executive Summary',
      'timeline': 'Timeline',
      'metrics': 'Metrics Dashboard',
      'risk-matrix': 'Risk Matrix',
      'comparison': 'Comparison',
      'blank': 'Blank Slide',
    };
    const slide = await createSlide(templateId, templateNames[templateId] || 'New Slide', { heading: templateNames[templateId] || 'New Slide' });
    if (slide) {
      setSelectedSlideId(slide.id);
    }
  };

  const handleSlideContentChange = useCallback((content: string) => {
    if (selectedSlideId) {
      setSaveStatus('saving');
      saveSlideDebounced(selectedSlideId, { html_content: content });
      // Simulate save completion after debounce
      setTimeout(() => setSaveStatus('saved'), 1500);
    }
  }, [selectedSlideId, saveSlideDebounced]);

  const handleEditorReady = useCallback((editor: Editor | null) => {
    setEditorInstance(editor);
  }, []);

  const handleSlideSelect = (slideId: string) => {
    setSelectedSlideId(slideId);
  };

  const handleSlideDelete = async (slideId: string) => {
    await deleteSlide(slideId);
  };

  const handleSlideDuplicate = async (slideId: string) => {
    const newSlide = await duplicateSlide(slideId);
    if (newSlide) {
      setSelectedSlideId(newSlide.id);
    }
  };

  const handlePresentationSelect = (presentationId: string) => {
    setSelectedPresentationId(presentationId);
    setSelectedSlideId(null);
  };

  const handleInsertShape = (shape: Omit<SlideShape, 'id'>) => {
    if (!selectedSlideId) return;
    addShape(selectedSlideId, shape);
  };

  const handleInsertImage = async () => {
    // Create file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && editorInstance) {
        const url = await uploadImage(file);
        if (url) {
          editorInstance.chain().focus().setImage({ src: url }).run();
        }
      }
    };
    input.click();
  };

  const handleNextSlide = () => {
    const idx = slides.findIndex(s => s.id === selectedSlideId);
    if (idx < slides.length - 1) {
      setSelectedSlideId(slides[idx + 1].id);
    }
  };

  const handlePrevSlide = () => {
    const idx = slides.findIndex(s => s.id === selectedSlideId);
    if (idx > 0) {
      setSelectedSlideId(slides[idx - 1].id);
    }
  };

  // Keyboard navigation for presentation mode
  useEffect(() => {
    if (!presentationMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPresentationMode(false);
      } else if (e.key === 'ArrowRight' || e.key === ' ') {
        handleNextSlide();
      } else if (e.key === 'ArrowLeft') {
        handlePrevSlide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [presentationMode, slides, selectedSlideId]);

  // AI Generate slide content handler
  const handleAIGenerate = async () => {
    if (!aiPrompt.trim() || !selectedSlideId || !editorInstance) return;

    setAIGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-orchestrator', {
        body: {
          agentType: 'document',
          context: {
            action: 'generate_slide_content',
            prompt: aiPrompt,
            slideTemplate: selectedSlide?.template || 'blank',
            presentationTitle: selectedPresentation?.title || 'Untitled',
          },
          userMessage: `Generate professional slide content for: ${aiPrompt}`,
        },
      });

      if (error) throw error;

      const content = data?.response || data?.message || '';
      if (content) {
        // Convert to HTML-friendly format
        const htmlContent = `<h1>${selectedSlide?.title || 'Slide Title'}</h1>\n${content.replace(/\n/g, '<br/>')}`;
        editorInstance.commands.setContent(htmlContent);
        handleSlideContentChange(htmlContent);
        toast({
          title: 'Content Generated',
          description: 'AI has generated content for your slide',
        });
      }
    } catch (error) {
      console.error('AI generation error:', error);
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate slide content',
        variant: 'destructive',
      });
    } finally {
      setAIGenerating(false);
      setShowAIGenerateDialog(false);
      setAIPrompt('');
    }
  };

  // Handle inserting embedded component
  const handleInsertComponent = async (component: EmbeddableComponent) => {
    if (!selectedSlideId) return;
    
    const position = {
      x: 50,
      y: 50,
      width: component.defaultSize.width,
      height: component.defaultSize.height,
    };
    
    await addEmbeddedComponent(component, position);
    setShowComponentPicker(false);
  };

  // Get embedded components for current slide
  const currentSlideComponents = (selectedSlide?.embedded_components as unknown as EmbeddedComponentData[]) || [];
  const hasEmbeddedComponents = currentSlideComponents.length > 0;
  const isPresentationActive = selectedPresentationId ? isActivePresentation(selectedPresentationId) : false;

  const isLoading = foldersLoading || presentationsLoading;

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Main Toolbar */}
      <PresentationToolbar
        editor={editorInstance}
        title={selectedPresentation?.title || ''}
        onTitleChange={(title) => {
          if (selectedPresentationId) {
            updatePresentation(selectedPresentationId, { title });
          }
        }}
        onPresent={() => setPresentationMode(true)}
        onExport={() => {
          toast({
            title: 'Export',
            description: 'PDF export feature coming soon',
          });
        }}
        onShare={() => {
          toast({
            title: 'Share',
            description: 'Sharing feature coming soon',
          });
        }}
        onInsertImage={handleInsertImage}
        onInsertShape={handleInsertShape}
        onInsertChart={() => {
          toast({
            title: 'Insert Chart',
            description: 'Chart insertion feature coming soon',
          });
        }}
        onInsertComponent={() => setShowComponentPicker(true)}
        onRefreshComponents={refreshAllComponents}
        onAIGenerate={() => setShowAIGenerateDialog(true)}
        saveStatus={saveStatus}
        hasEmbeddedComponents={hasEmbeddedComponents}
        isActivePresentation={isPresentationActive}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Folders, Presentations, Slides */}
        <PresentationSidebar
          folders={folderTree}
          presentations={presentations}
          slides={slides}
          selectedFolderId={selectedFolderId}
          selectedPresentationId={selectedPresentationId}
          selectedSlideId={selectedSlideId}
          onSelectFolder={setSelectedFolderId}
          onSelectPresentation={handlePresentationSelect}
          onSelectSlide={handleSlideSelect}
          onCreateFolder={(name, parentId) => createFolder(name, parentId)}
          onCreatePresentation={(title, folderId) => createPresentation(title, 'custom', folderId)}
          onCreateSlide={handleCreateSlide}
          onDeleteFolder={deleteFolder}
          onDeletePresentation={deletePresentation}
          onDeleteSlide={handleSlideDelete}
          onDuplicatePresentation={duplicatePresentation}
          onDuplicateSlide={handleSlideDuplicate}
          onRenameFolder={renameFolder}
        />

        {/* Main Canvas */}
        <div className="flex-1 flex flex-col bg-muted/30">
          {selectedSlide ? (
            <>
              {/* Slide Canvas */}
              <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
                <div className="w-full max-w-5xl aspect-video rounded-lg overflow-hidden shadow-overlay border border-border bg-card">
                  <SlideEditor
                    slide={selectedSlide}
                    onContentChange={handleSlideContentChange}
                    onEditorReady={handleEditorReady}
                    isEditable={true}
                    embeddedComponents={currentSlideComponents}
                    isActivePresentation={isPresentationActive}
                    onRefreshComponent={refreshComponent}
                    onToggleLive={updateComponentLiveStatus}
                    onRemoveComponent={removeEmbeddedComponent}
                  />
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-center gap-4 pb-6">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePrevSlide}
                  disabled={slides.findIndex(s => s.id === selectedSlideId) === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {slides.findIndex(s => s.id === selectedSlideId) + 1} / {slides.length}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNextSlide}
                  disabled={slides.findIndex(s => s.id === selectedSlideId) === slides.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Speaker Notes */}
              <SpeakerNotesPanel
                notes={selectedSlide.speaker_notes || ''}
                onChange={(notes) => {
                  if (selectedSlideId) {
                    updateSlide(selectedSlideId, { speaker_notes: notes });
                  }
                }}
                isOpen={showSpeakerNotes}
                onToggle={() => setShowSpeakerNotes(!showSpeakerNotes)}
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <Presentation className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No Slide Selected</p>
              <p className="text-sm mb-4">
                {presentations.length === 0 
                  ? 'Create a presentation to get started'
                  : 'Select a slide from the sidebar or add a new one'}
              </p>
              {presentations.length === 0 ? (
                <Button onClick={() => setShowNewPresentationDialog(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Presentation
                </Button>
              ) : slides.length === 0 ? (
                <Button onClick={() => handleCreateSlide('blank')} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Slide
                </Button>
              ) : null}
            </div>
          )}
        </div>

        {/* Right Panel - Properties */}
        {selectedSlide && (
          <SlidePropertiesPanel
            slide={selectedSlide}
            presentation={selectedPresentation || null}
            onSlideUpdate={(updates) => {
              if (selectedSlideId) {
                updateSlide(selectedSlideId, updates);
              }
            }}
            onPresentationUpdate={(updates) => {
              if (selectedPresentationId) {
                updatePresentation(selectedPresentationId, updates);
              }
            }}
            onOpenVersionHistory={() => setShowVersionHistory(true)}
            onOpenCollaborators={() => setShowCollaborators(true)}
          />
        )}
      </div>

      {/* New Folder Dialog */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus className="h-5 w-5" />
              Create New Folder
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Input
              placeholder="Folder name..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder(newFolderName, selectedFolderId)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => handleCreateFolder(newFolderName, selectedFolderId)} disabled={!newFolderName.trim()}>
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Presentation Dialog */}
      <Dialog open={showNewPresentationDialog} onOpenChange={setShowNewPresentationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Presentation className="h-5 w-5" />
              Create New Presentation
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Input
              placeholder="Presentation title..."
              value={newPresentationTitle}
              onChange={(e) => setNewPresentationTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreatePresentation(newPresentationTitle, selectedFolderId)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewPresentationDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => handleCreatePresentation(newPresentationTitle, selectedFolderId)} disabled={!newPresentationTitle.trim()}>
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Component Picker Dialog */}
      <ComponentPicker
        open={showComponentPicker}
        onOpenChange={setShowComponentPicker}
        onSelectComponent={handleInsertComponent}
      />

      {/* AI Generate Dialog */}
      <Dialog open={showAIGenerateDialog} onOpenChange={setShowAIGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Generate Slide Content
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="ai-prompt">What would you like to create?</Label>
              <Textarea
                id="ai-prompt"
                placeholder="E.g., 'Create an executive summary for Q4 project status' or 'Generate key milestones timeline'"
                value={aiPrompt}
                onChange={(e) => setAIPrompt(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAIGenerateDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAIGenerate} 
                disabled={!aiPrompt.trim() || aiGenerating}
                className="gap-2"
              >
                {aiGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Presentation Mode */}
      <AnimatePresence>
        {presentationMode && selectedSlide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background z-50"
          >
            <div className="h-full w-full">
              <SlideEditor
                slide={selectedSlide}
                onContentChange={() => {}}
                onEditorReady={() => {}}
                isEditable={false}
              />
            </div>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={handlePrevSlide}
                disabled={slides.findIndex(s => s.id === selectedSlideId) === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-foreground px-4 py-2 bg-card rounded-lg border">
                {slides.findIndex(s => s.id === selectedSlideId) + 1} / {slides.length}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleNextSlide}
                disabled={slides.findIndex(s => s.id === selectedSlideId) === slides.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4"
              onClick={() => setPresentationMode(false)}
            >
              Exit (Esc)
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
