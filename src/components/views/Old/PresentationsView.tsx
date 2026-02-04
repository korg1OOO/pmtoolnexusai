import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Presentation,
  Plus,
  Play,
  Download,
  Share2,
  MoreHorizontal,
  Layout,
  Image,
  Type,
  BarChart3,
  Table2,
  Shapes,
  Palette,
  Layers,
  ChevronRight,
  ChevronLeft,
  Maximize2,
  Copy,
  Trash2,
  GripVertical,
  Sparkles,
  FileText,
  Target,
  AlertTriangle,
  DollarSign,
  Calendar,
  Users,
  TrendingUp,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { usePresentations, useSlides } from '@/hooks/usePresentations';
import { useProjectContext } from '@/contexts/ProjectContext';
import { useRisks } from '@/hooks/useRisks';
import type { Slide } from '@shared/schema';

// Keep templates definitions
const slideTemplates = [
  { id: 'title', name: 'Title Slide', icon: Type },
  { id: 'executive-summary', name: 'Executive Summary', icon: FileText },
  { id: 'metrics', name: 'Metrics Dashboard', icon: BarChart3 },
  { id: 'timeline', name: 'Timeline', icon: Calendar },
  { id: 'risk-matrix', name: 'Risk Matrix', icon: AlertTriangle },
  // { id: 'comparison', name: 'Comparison', icon: Layers }, // Removed temporarily if not implemented
  { id: 'blank', name: 'Blank', icon: Layout },
];

const presentationTemplates = [
  { id: 'executive-status', name: 'Executive Status', slides: 8, color: 'primary' },
  { id: 'steering-committee', name: 'Steering Committee', slides: 12, color: 'info' },
  { id: 'client-update', name: 'Client Update', slides: 6, color: 'success' },
  { id: 'risk-review', name: 'Risk Review', slides: 5, color: 'warning' },
];

export function PresentationsView() {
  const { currentProject } = useProjectContext();
  const { presentations, isLoading: isLoadingPresentations, createPresentation } = usePresentations();

  const [activePresentationId, setActivePresentationId] = useState<string | null>(null);
  const [selectedSlide, setSelectedSlide] = useState<Slide | null>(null);
  const [presentationMode, setPresentationMode] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  // Auto-select first presentation
  useEffect(() => {
    if (presentations.length > 0 && !activePresentationId) {
      setActivePresentationId(presentations[0].id);
    }
  }, [presentations, activePresentationId]);

  const { slides, isLoading: isLoadingSlides, createSlide, updateSlide, deleteSlide } = useSlides(activePresentationId || undefined);

  // Real data for renderer
  const { risks } = useRisks();

  // Reset selected slide when slides change
  useEffect(() => {
    if (slides.length > 0 && !selectedSlide) {
      setSelectedSlide(slides[0]);
    } else if (slides.length > 0 && selectedSlide) {
      // Ensure selected slide still exists
      const exists = slides.find(s => s.id === selectedSlide.id);
      if (!exists) setSelectedSlide(slides[0]);
      else setSelectedSlide(exists); // Update reference
    } else if (slides.length === 0) {
      setSelectedSlide(null);
    }
  }, [slides]);

  const getSlideTitle = (slide: Slide) => {
    const content = slide.content as any;
    return content?.heading || 'Untitled Slide';
  };

  const handleCreatePresentation = (templateId: string) => {
    createPresentation.mutate({
      title: "New Presentation",
      // template: templateId, // template is on presentation schema? Yes.
      projectId: currentProject?.id
    });
  };

  const handleCreateSlide = (template: typeof slideTemplates[0]) => {
    if (!activePresentationId) return;

    const newSlideContent: any = { heading: template.name };
    // Default content based on template
    if (template.id === 'executive-summary') {
      newSlideContent.bullets = ['Point 1', 'Point 2', 'Point 3'];
    }

    createSlide.mutate({
      presentationId: activePresentationId,
      type: template.id,
      orderIndex: slides.length, // Schema calls it orderIndex, not order
      content: newSlideContent
    });
    setShowTemplates(false);
  };

  const handleDeleteSlide = (id: string) => {
    if (confirm('Are you sure you want to delete this slide?')) {
      deleteSlide.mutate(id);
    }
  };

  const renderSlidePreview = (slide: Slide, isActive: boolean = false) => {
    const baseClasses = cn(
      'aspect-video rounded-lg border overflow-hidden transition-all',
      isActive ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/50'
    );

    // Safety check for content
    const content = slide.content as any || {};
    const title = getSlideTitle(slide);

    switch (slide.type) {
      case 'title':
        return (
          <div className={cn(baseClasses, 'bg-gradient-to-br from-primary/20 to-primary/5 flex flex-col items-center justify-center p-4')}>
            <h3 className="text-sm font-bold text-foreground text-center truncate w-full">{title}</h3>
            <p className="text-xs text-muted-foreground mt-1 text-center truncate w-full">{content.subheading}</p>
          </div>
        );
      case 'executive-summary':
        return (
          <div className={cn(baseClasses, 'bg-card p-3')}>
            <h4 className="text-xs font-medium text-foreground mb-2 truncate">{title}</h4>
            <div className="space-y-1">
              {content.bullets?.slice(0, 3).map((bullet: string, idx: number) => (
                <div key={idx} className="flex items-start gap-1">
                  <CheckCircle2 className="h-2 w-2 text-success shrink-0 mt-0.5" />
                  <p className="text-[8px] text-muted-foreground line-clamp-1">{bullet}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'metrics':
        return (
          <div className={cn(baseClasses, 'bg-card p-3')}>
            <h4 className="text-xs font-medium text-foreground mb-2 truncate">{title}</h4>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="bg-muted/50 rounded p-1.5">
                <p className="text-[7px] text-muted-foreground">Progress</p>
                <p className="text-xs font-bold text-foreground">45%</p>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className={cn(baseClasses, 'bg-card flex items-center justify-center')}>
            <Layout className="h-6 w-6 text-muted-foreground/50" />
          </div>
        );
    }
  };

  const renderFullSlide = (slide: Slide) => {
    const content = slide.content as any || {};
    const title = getSlideTitle(slide);

    switch (slide.type) {
      case 'title':
        return (
          <div className="h-full bg-gradient-to-br from-primary/10 via-background to-primary/5 flex flex-col items-center justify-center p-12">
            <Badge variant="outline" className="mb-6">{currentProject?.key}</Badge>
            <h1 className="text-5xl font-bold text-foreground text-center mb-4">{title}</h1>
            <p className="text-xl text-muted-foreground text-center mb-8">{content.subheading || 'Subtitle Placeholer'}</p>
            <p className="text-sm text-muted-foreground">{content.body}</p>
            <div className="absolute bottom-8 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
        );
      case 'executive-summary':
        return (
          <div className="h-full bg-card p-12">
            <h2 className="text-3xl font-bold text-foreground mb-8">{title}</h2>
            <div className="space-y-4">
              {content.bullets?.map((bullet: string, idx: number) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-lg text-foreground pt-1">{bullet}</p>
                </motion.div>
              ))}
            </div>
          </div>
        );
      case 'risk-matrix':
        return (
          <div className="h-full bg-card p-12">
            <h2 className="text-3xl font-bold text-foreground mb-8">{content.heading || 'Risk Overview'}</h2>
            {/* Simplified Risk Matrix Visualization using Live Data */}
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="font-medium">Top Risks</h3>
                {risks.slice(0, 5).map(risk => (
                  <Card key={risk.id}><CardContent className="p-3">
                    <div className="flex justify-between">
                      <span>{risk.title}</span>
                      <Badge variant={risk.impact === 'critical' ? 'destructive' : 'secondary'}>{risk.impact}</Badge>
                    </div>
                  </CardContent></Card>
                ))}
                {risks.length === 0 && <p className="text-muted-foreground">No risks found.</p>}
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="h-full bg-card flex items-center justify-center">
            <p className="text-muted-foreground">Template not fully implemented or blank.</p>
          </div>
        );
    }
  };

  if (isLoadingPresentations) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  // Empty State - if no presentations AND not loading
  if (presentations.length === 0 && !isLoadingPresentations) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
        <Presentation className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">No Presentations</h2>
        <p className="text-muted-foreground max-w-sm">Create a new presentation to start building your slidedeck.</p>
        <div className="flex gap-4">
          {presentationTemplates.map(t => (
            <Button key={t.id} variant="outline" onClick={() => handleCreatePresentation(t.id)}>
              {t.name}
            </Button>
          ))}
          <Button variant="outline" onClick={() => handleCreatePresentation('default')}>
            Blank Presentation
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Slide List - Left Panel */}
      <div className="w-64 border-r border-border bg-sidebar flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Presentation className="h-4 w-4 text-primary" />
            Slides
          </h2>
          {/* Dropdown for presentation switching could go here */}
        </div>

        <ScrollArea className="flex-1">
          <div className="p-3 space-y-3">
            {slides.map((slide, index) => (
              <motion.div
                key={slide.id}
                layoutId={slide.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative group"
              >
                <button
                  onClick={() => setSelectedSlide(slide)}
                  className="w-full text-left"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-muted-foreground mt-1 w-4">{index + 1}</span>
                    <div className="flex-1">
                      {renderSlidePreview(slide, selectedSlide?.id === slide.id)}
                      <p className="text-xs text-muted-foreground mt-1 truncate">{getSlideTitle(slide)}</p>
                    </div>
                  </div>
                </button>
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="iconSm" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); handleDeleteSlide(slide.id); }}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-3 border-t border-border space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2"
            onClick={() => setShowTemplates(true)}
          >
            <Plus className="h-4 w-4" />
            Add Slide
          </Button>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col bg-muted/30">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <Input
              value={selectedSlide ? getSlideTitle(selectedSlide) : ''}
              className="w-64 bg-muted/50"
              placeholder="Slide title..."
              disabled={!selectedSlide}
              onChange={(e) => {
                if (selectedSlide) {
                  const newHeading = e.target.value;
                  const content = { ...(selectedSlide.content as any), heading: newHeading };
                  updateSlide.mutate({ id: selectedSlide.id, data: { content } });
                }
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setPresentationMode(true)} disabled={!selectedSlide}>
              <Play className="h-4 w-4" />
              Present
            </Button>
          </div>
        </div>

        {/* Slide Canvas */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-5xl aspect-video rounded-lg overflow-hidden shadow-overlay border border-border">
            {selectedSlide ? renderFullSlide(selectedSlide) : (
              <div className="h-full flex items-center justify-center bg-card text-muted-foreground">Select a slide to edit</div>
            )}
          </div>
        </div>
      </div>

      {/* Template Selector Modal */}
      <AnimatePresence>
        {showTemplates && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={() => setShowTemplates(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-card border border-border rounded-xl shadow-overlay p-6 w-[600px] max-h-[80vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-foreground mb-4">Add New Slide</h3>
              <div className="grid grid-cols-4 gap-3">
                {slideTemplates.map(template => {
                  const Icon = template.icon;
                  return (
                    <button
                      key={template.id}
                      className="p-4 rounded-lg border border-border hover:border-primary bg-muted/30 hover:bg-muted/50 transition-all text-center"
                      onClick={() => handleCreateSlide(template)}
                    >
                      <Icon className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                      <span className="text-xs text-foreground">{template.name}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Presentation Mode */}
      <AnimatePresence>
        {presentationMode && selectedSlide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background z-50"
          >
            <div className="h-full">
              {renderFullSlide(selectedSlide)}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4"
              onClick={() => setPresentationMode(false)}
            >
              Exit
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
