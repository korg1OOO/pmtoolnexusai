import React, { useState } from 'react';
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
} from 'lucide-react';
import { mockProject, mockRisks, mockDecisions, kpiData } from '@/data/mockData';
import type { Slide, Presentation as PresentationType } from '@/types/project';

const slideTemplates = [
  { id: 'title', name: 'Title Slide', icon: Type },
  { id: 'executive-summary', name: 'Executive Summary', icon: FileText },
  { id: 'timeline', name: 'Timeline', icon: Calendar },
  { id: 'metrics', name: 'Metrics Dashboard', icon: BarChart3 },
  { id: 'risk-matrix', name: 'Risk Matrix', icon: AlertTriangle },
  { id: 'comparison', name: 'Comparison', icon: Layers },
  { id: 'blank', name: 'Blank', icon: Layout },
];

const presentationTemplates = [
  { id: 'executive-status', name: 'Executive Status', slides: 8, color: 'primary' },
  { id: 'steering-committee', name: 'Steering Committee', slides: 12, color: 'info' },
  { id: 'client-update', name: 'Client Update', slides: 6, color: 'success' },
  { id: 'risk-review', name: 'Risk Review', slides: 5, color: 'warning' },
];

const mockSlides: Slide[] = [
  {
    id: 'SL-001',
    title: 'Project Status Update',
    template: 'title',
    order: 0,
    content: {
      heading: mockProject.name,
      subheading: 'Weekly Status Update - Week 33',
      body: 'Prepared for Steering Committee',
    },
  },
  {
    id: 'SL-002',
    title: 'Executive Summary',
    template: 'executive-summary',
    order: 1,
    content: {
      heading: 'Executive Summary',
      bullets: [
        'Project is 45% complete, tracking to plan',
        'Budget variance: +3.2% (favorable)',
        'Sprint 12 nearing completion with 34 velocity',
        'Key decision: AWS selected as cloud provider',
        '2 critical risks being actively mitigated',
      ],
    },
  },
  {
    id: 'SL-003',
    title: 'Key Metrics',
    template: 'metrics',
    order: 2,
    content: {
      heading: 'Project Health Dashboard',
      linkedArtifacts: [
        { type: 'task', id: 'T-001', title: 'Phase 1 Progress' },
      ],
    },
  },
  {
    id: 'SL-004',
    title: 'Risk Overview',
    template: 'risk-matrix',
    order: 3,
    content: {
      heading: 'Active Risks',
      linkedArtifacts: mockRisks.slice(0, 3).map(r => ({
        type: 'risk' as const,
        id: r.id,
        title: r.title,
      })),
    },
  },
  {
    id: 'SL-005',
    title: 'Key Decisions',
    template: 'comparison',
    order: 4,
    content: {
      heading: 'Decisions Made',
      linkedArtifacts: mockDecisions.slice(0, 2).map(d => ({
        type: 'decision' as const,
        id: d.id,
        title: d.title,
      })),
    },
  },
];

export function PresentationsView() {
  const [slides, setSlides] = useState<Slide[]>(mockSlides);
  const [selectedSlide, setSelectedSlide] = useState<Slide>(mockSlides[0]);
  const [presentationMode, setPresentationMode] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const renderSlidePreview = (slide: Slide, isActive: boolean = false) => {
    const baseClasses = cn(
      'aspect-video rounded-lg border overflow-hidden transition-all',
      isActive ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/50'
    );

    switch (slide.template) {
      case 'title':
        return (
          <div className={cn(baseClasses, 'bg-gradient-to-br from-primary/20 to-primary/5 flex flex-col items-center justify-center p-4')}>
            <h3 className="text-sm font-bold text-foreground text-center truncate w-full">{slide.content.heading}</h3>
            <p className="text-xs text-muted-foreground mt-1 text-center truncate w-full">{slide.content.subheading}</p>
          </div>
        );
      case 'executive-summary':
        return (
          <div className={cn(baseClasses, 'bg-card p-3')}>
            <h4 className="text-xs font-medium text-foreground mb-2 truncate">{slide.content.heading}</h4>
            <div className="space-y-1">
              {slide.content.bullets?.slice(0, 3).map((bullet, idx) => (
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
            <h4 className="text-xs font-medium text-foreground mb-2 truncate">{slide.content.heading}</h4>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: 'Progress', value: '45%', color: 'primary' },
                { label: 'Budget', value: '+3.2%', color: 'success' },
                { label: 'Velocity', value: '34', color: 'info' },
                { label: 'Risks', value: '5', color: 'warning' },
              ].map((kpi, idx) => (
                <div key={idx} className="bg-muted/50 rounded p-1.5">
                  <p className="text-[7px] text-muted-foreground">{kpi.label}</p>
                  <p className="text-xs font-bold text-foreground">{kpi.value}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'risk-matrix':
        return (
          <div className={cn(baseClasses, 'bg-card p-3')}>
            <h4 className="text-xs font-medium text-foreground mb-2 truncate">{slide.content.heading}</h4>
            <div className="grid grid-cols-3 grid-rows-3 gap-0.5 h-12">
              {Array.from({ length: 9 }).map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'rounded-sm',
                    idx < 3 ? 'bg-success/30' : idx < 6 ? 'bg-warning/30' : 'bg-destructive/30'
                  )}
                />
              ))}
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
    switch (slide.template) {
      case 'title':
        return (
          <div className="h-full bg-gradient-to-br from-primary/10 via-background to-primary/5 flex flex-col items-center justify-center p-12">
            <Badge variant="outline" className="mb-6">{mockProject.code}</Badge>
            <h1 className="text-5xl font-bold text-foreground text-center mb-4">{slide.content.heading}</h1>
            <p className="text-xl text-muted-foreground text-center mb-8">{slide.content.subheading}</p>
            <p className="text-sm text-muted-foreground">{slide.content.body}</p>
            <div className="absolute bottom-8 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {new Date().toLocaleDateString()}
              </span>
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {mockProject.owner}
              </span>
            </div>
          </div>
        );
      case 'executive-summary':
        return (
          <div className="h-full bg-card p-12">
            <h2 className="text-3xl font-bold text-foreground mb-8">{slide.content.heading}</h2>
            <div className="space-y-4">
              {slide.content.bullets?.map((bullet, idx) => (
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
      case 'metrics':
        return (
          <div className="h-full bg-card p-12">
            <h2 className="text-3xl font-bold text-foreground mb-8">{slide.content.heading}</h2>
            <div className="grid grid-cols-3 gap-6">
              <Card className="bg-muted/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-muted-foreground">Overall Progress</p>
                    <TrendingUp className="h-5 w-5 text-success" />
                  </div>
                  <p className="text-4xl font-bold text-foreground">{mockProject.progress}%</p>
                  <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${mockProject.progress}%` }} />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-muted/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-muted-foreground">Budget Variance</p>
                    <DollarSign className="h-5 w-5 text-success" />
                  </div>
                  <p className="text-4xl font-bold text-success">+{kpiData.costVariance}%</p>
                  <p className="text-sm text-muted-foreground mt-2">Under budget</p>
                </CardContent>
              </Card>
              <Card className="bg-muted/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-muted-foreground">Sprint Velocity</p>
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-4xl font-bold text-foreground">{kpiData.sprintVelocity}</p>
                  <p className="text-sm text-muted-foreground mt-2">Avg: {kpiData.avgVelocity}</p>
                </CardContent>
              </Card>
              <Card className="bg-muted/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-muted-foreground">Open Risks</p>
                    <AlertTriangle className="h-5 w-5 text-warning" />
                  </div>
                  <p className="text-4xl font-bold text-foreground">{kpiData.openRisks}</p>
                  <p className="text-sm text-destructive mt-2">{kpiData.criticalRisks} critical</p>
                </CardContent>
              </Card>
              <Card className="bg-muted/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-muted-foreground">Team Utilization</p>
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-4xl font-bold text-foreground">{kpiData.teamUtilization}%</p>
                  <p className="text-sm text-muted-foreground mt-2">Optimal range</p>
                </CardContent>
              </Card>
              <Card className="bg-muted/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-muted-foreground">Projected End</p>
                    <Calendar className="h-5 w-5 text-info" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{kpiData.projectedCompletion}</p>
                  <p className="text-sm text-success mt-2">On schedule</p>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      case 'risk-matrix':
        return (
          <div className="h-full bg-card p-12">
            <h2 className="text-3xl font-bold text-foreground mb-8">{slide.content.heading}</h2>
            <div className="grid grid-cols-2 gap-8">
              {/* Risk Matrix */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-4">Probability vs Impact</h3>
                <div className="grid grid-cols-4 gap-1 aspect-square">
                  <div className="col-span-1 row-span-4 flex flex-col justify-between items-center py-2">
                    <span className="text-xs text-muted-foreground rotate-180 writing-vertical">Critical</span>
                    <span className="text-xs text-muted-foreground rotate-180 writing-vertical">High</span>
                    <span className="text-xs text-muted-foreground rotate-180 writing-vertical">Medium</span>
                    <span className="text-xs text-muted-foreground rotate-180 writing-vertical">Low</span>
                  </div>
                  {Array.from({ length: 16 }).map((_, idx) => {
                    const row = Math.floor(idx / 4);
                    const col = idx % 4;
                    const severity = row + col;
                    return (
                      <div
                        key={idx}
                        className={cn(
                          'rounded-lg flex items-center justify-center',
                          severity <= 2 ? 'bg-success/30' :
                          severity <= 4 ? 'bg-warning/30' : 'bg-destructive/30'
                        )}
                      >
                        {mockRisks.filter((r, i) => 
                          (r.probability === 'high' && row === 0) ||
                          (r.probability === 'medium' && row === 2)
                        ).slice(0, 1).map(r => (
                          <div key={r.id} className="h-3 w-3 rounded-full bg-foreground" />
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Risk List */}
              <div className="space-y-4">
                {mockRisks.slice(0, 4).map((risk, idx) => (
                  <Card key={risk.id} className="bg-muted/30">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge
                            variant={risk.impact === 'critical' ? 'destructive' : risk.impact === 'high' ? 'warning' : 'secondary'}
                            className="mb-2"
                          >
                            {risk.impact.toUpperCase()}
                          </Badge>
                          <h4 className="font-medium text-foreground">{risk.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{risk.owner}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="h-full bg-card flex items-center justify-center">
            <p className="text-muted-foreground">Blank slide</p>
          </div>
        );
    }
  };

  return (
    <div className="h-full flex">
      {/* Slide List - Left Panel */}
      <div className="w-64 border-r border-border bg-sidebar flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Presentation className="h-4 w-4 text-primary" />
            Slides
          </h2>
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
                      <p className="text-xs text-muted-foreground mt-1 truncate">{slide.title}</p>
                    </div>
                  </div>
                </button>
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="iconSm" className="h-5 w-5">
                    <GripVertical className="h-3 w-3" />
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
              value={selectedSlide?.title || ''}
              className="w-64 bg-muted/50"
              placeholder="Slide title..."
            />
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Generate
            </Button>
            <div className="w-px h-6 bg-border" />
            <Button variant="ghost" size="iconSm">
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="iconSm">
              <Trash2 className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-border" />
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button variant="default" size="sm" className="gap-2" onClick={() => setPresentationMode(true)}>
              <Play className="h-4 w-4" />
              Present
            </Button>
          </div>
        </div>

        {/* Slide Canvas */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-5xl aspect-video rounded-lg overflow-hidden shadow-overlay border border-border">
            {selectedSlide && renderFullSlide(selectedSlide)}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-4 pb-6">
          <Button
            variant="outline"
            size="iconSm"
            onClick={() => {
              const idx = slides.findIndex(s => s.id === selectedSlide?.id);
              if (idx > 0) setSelectedSlide(slides[idx - 1]);
            }}
            disabled={slides.findIndex(s => s.id === selectedSlide?.id) === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {slides.findIndex(s => s.id === selectedSlide?.id) + 1} / {slides.length}
          </span>
          <Button
            variant="outline"
            size="iconSm"
            onClick={() => {
              const idx = slides.findIndex(s => s.id === selectedSlide?.id);
              if (idx < slides.length - 1) setSelectedSlide(slides[idx + 1]);
            }}
            disabled={slides.findIndex(s => s.id === selectedSlide?.id) === slides.length - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Right Panel - Properties */}
      <div className="w-72 border-l border-border bg-sidebar flex flex-col">
        <div className="p-4 border-b border-border">
          <h3 className="font-medium text-foreground">Slide Properties</h3>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            {/* Template */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">Template</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {slideTemplates.slice(0, 4).map(template => {
                  const Icon = template.icon;
                  return (
                    <button
                      key={template.id}
                      className={cn(
                        'p-3 rounded-lg border text-center transition-all',
                        selectedSlide?.template === template.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <Icon className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{template.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Linked Artifacts */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">Linked Data</label>
              <div className="mt-2 space-y-2">
                {selectedSlide?.content.linkedArtifacts?.map(artifact => (
                  <div
                    key={artifact.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border"
                  >
                    {artifact.type === 'risk' && <AlertTriangle className="h-4 w-4 text-warning" />}
                    {artifact.type === 'decision' && <Target className="h-4 w-4 text-primary" />}
                    {artifact.type === 'task' && <CheckCircle2 className="h-4 w-4 text-success" />}
                    <span className="text-sm text-foreground truncate flex-1">{artifact.title}</span>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <Plus className="h-3 w-3" />
                  Link Artifact
                </Button>
              </div>
            </div>

            {/* Theme */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">Theme Colors</label>
              <div className="flex gap-2 mt-2">
                {['bg-primary', 'bg-success', 'bg-warning', 'bg-info', 'bg-destructive'].map(color => (
                  <button
                    key={color}
                    className={cn('h-8 w-8 rounded-lg', color, 'border-2 border-transparent hover:border-foreground/50')}
                  />
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Insert Elements */}
        <div className="p-4 border-t border-border">
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Insert</label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: Type, label: 'Text' },
              { icon: Image, label: 'Image' },
              { icon: BarChart3, label: 'Chart' },
              { icon: Table2, label: 'Table' },
              { icon: Shapes, label: 'Shape' },
              { icon: Layout, label: 'Layout' },
              { icon: Palette, label: 'Style' },
              { icon: Layers, label: 'Layer' },
            ].map(item => (
              <Button key={item.label} variant="ghost" size="sm" className="h-12 flex-col gap-1">
                <item.icon className="h-4 w-4" />
                <span className="text-[10px]">{item.label}</span>
              </Button>
            ))}
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
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Slide Templates</h4>
                  <div className="grid grid-cols-4 gap-3">
                    {slideTemplates.map(template => {
                      const Icon = template.icon;
                      return (
                        <button
                          key={template.id}
                          className="p-4 rounded-lg border border-border hover:border-primary bg-muted/30 hover:bg-muted/50 transition-all"
                          onClick={() => {
                            const newSlide: Slide = {
                              id: `SL-${Date.now()}`,
                              title: template.name,
                              template: template.id as any,
                              order: slides.length,
                              content: { heading: template.name },
                            };
                            setSlides([...slides, newSlide]);
                            setSelectedSlide(newSlide);
                            setShowTemplates(false);
                          }}
                        >
                          <Icon className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                          <span className="text-xs text-foreground">{template.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Presentation Templates</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {presentationTemplates.map(template => (
                      <button
                        key={template.id}
                        className="p-4 rounded-lg border border-border hover:border-primary bg-muted/30 hover:bg-muted/50 transition-all text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', `bg-${template.color}/10`)}>
                            <Presentation className={cn('h-5 w-5', `text-${template.color}`)} />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{template.name}</p>
                            <p className="text-xs text-muted-foreground">{template.slides} slides</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
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
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const idx = slides.findIndex(s => s.id === selectedSlide.id);
                  if (idx > 0) setSelectedSlide(slides[idx - 1]);
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-foreground px-4 py-2 bg-card rounded-lg">
                {slides.findIndex(s => s.id === selectedSlide.id) + 1} / {slides.length}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const idx = slides.findIndex(s => s.id === selectedSlide.id);
                  if (idx < slides.length - 1) setSelectedSlide(slides[idx + 1]);
                }}
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
              Exit
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
