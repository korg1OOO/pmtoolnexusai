import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronDown,
  ChevronRight,
  Layout,
  Palette,
  Play,
  Clock,
  Link2,
  History,
  Users,
  Plus,
  Type,
  FileText,
  Calendar,
  BarChart3,
  AlertTriangle,
  Layers,
  Image,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PresentationSlide } from '@/hooks/useSlides';
import type { Presentation } from '@/hooks/usePresentations';

interface SlidePropertiesPanelProps {
  slide: PresentationSlide | null;
  presentation: Presentation | null;
  onSlideUpdate: (updates: Partial<PresentationSlide>) => void;
  onPresentationUpdate: (updates: Partial<Presentation>) => void;
  onOpenVersionHistory: () => void;
  onOpenCollaborators: () => void;
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

const transitionTypes = [
  { id: 'none', name: 'None' },
  { id: 'fade', name: 'Fade' },
  { id: 'slide', name: 'Slide' },
  { id: 'zoom', name: 'Zoom' },
  { id: 'flip', name: 'Flip' },
];

const THEME_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
];

const BACKGROUND_COLORS = [
  '#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1',
  '#1e293b', '#0f172a', '#020617', '#fef3c7', '#dbeafe',
];

export function SlidePropertiesPanel({
  slide,
  presentation,
  onSlideUpdate,
  onPresentationUpdate,
  onOpenVersionHistory,
  onOpenCollaborators,
}: SlidePropertiesPanelProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    template: true,
    theme: true,
    background: true,
    transition: false,
    linkedData: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (!slide || !presentation) {
    return (
      <div className="w-72 border-l border-border bg-sidebar flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Select a slide to view properties</p>
      </div>
    );
  }

  return (
    <div className="w-72 border-l border-border bg-sidebar flex flex-col">
      <div className="p-4 border-b border-border">
        <h3 className="font-medium text-foreground">Slide Properties</h3>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Template Section */}
          <Collapsible open={openSections.template} onOpenChange={() => toggleSection('template')}>
            <CollapsibleTrigger className="flex items-center gap-2 w-full text-sm font-medium text-foreground hover:text-primary transition-colors">
              {openSections.template ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <Layout className="h-4 w-4" />
              Template
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <div className="grid grid-cols-2 gap-2">
                {slideTemplates.map(template => {
                  const Icon = template.icon;
                  return (
                    <button
                      key={template.id}
                      className={cn(
                        'p-2 rounded-lg border text-center transition-all',
                        slide.template === template.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      )}
                      onClick={() => onSlideUpdate({ template: template.id })}
                    >
                      <Icon className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground block truncate">
                        {template.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Theme Section */}
          <Collapsible open={openSections.theme} onOpenChange={() => toggleSection('theme')}>
            <CollapsibleTrigger className="flex items-center gap-2 w-full text-sm font-medium text-foreground hover:text-primary transition-colors">
              {openSections.theme ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <Palette className="h-4 w-4" />
              Theme Colors
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Primary Color</Label>
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {THEME_COLORS.map(color => (
                    <button
                      key={color}
                      className={cn(
                        'h-6 w-6 rounded border-2 transition-transform hover:scale-110',
                        presentation.theme.primaryColor === color
                          ? 'border-foreground'
                          : 'border-transparent'
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => onPresentationUpdate({
                        theme: { ...presentation.theme, primaryColor: color }
                      })}
                    />
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Accent Color</Label>
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {THEME_COLORS.map(color => (
                    <button
                      key={color}
                      className={cn(
                        'h-6 w-6 rounded border-2 transition-transform hover:scale-110',
                        presentation.theme.accentColor === color
                          ? 'border-foreground'
                          : 'border-transparent'
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => onPresentationUpdate({
                        theme: { ...presentation.theme, accentColor: color }
                      })}
                    />
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Background Section */}
          <Collapsible open={openSections.background} onOpenChange={() => toggleSection('background')}>
            <CollapsibleTrigger className="flex items-center gap-2 w-full text-sm font-medium text-foreground hover:text-primary transition-colors">
              {openSections.background ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <Image className="h-4 w-4" />
              Background
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Background Type</Label>
                <Select
                  value={slide.background?.type || 'solid'}
                  onValueChange={(value: 'solid' | 'gradient' | 'image') =>
                    onSlideUpdate({ background: { ...slide.background, type: value } })
                  }
                >
                  <SelectTrigger className="mt-1.5 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solid">Solid Color</SelectItem>
                    <SelectItem value="gradient">Gradient</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {slide.background?.type === 'solid' && (
                <div>
                  <Label className="text-xs text-muted-foreground">Color</Label>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {BACKGROUND_COLORS.map(color => (
                      <button
                        key={color}
                        className={cn(
                          'h-6 w-6 rounded border-2 transition-transform hover:scale-110',
                          slide.background?.color === color
                            ? 'border-primary'
                            : 'border-border'
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => onSlideUpdate({
                          background: { ...slide.background, type: 'solid', color }
                        })}
                      />
                    ))}
                  </div>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Transition Section */}
          <Collapsible open={openSections.transition} onOpenChange={() => toggleSection('transition')}>
            <CollapsibleTrigger className="flex items-center gap-2 w-full text-sm font-medium text-foreground hover:text-primary transition-colors">
              {openSections.transition ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <Play className="h-4 w-4" />
              Transition
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Type</Label>
                <Select
                  value={slide.transition?.type || 'fade'}
                  onValueChange={(value) =>
                    onSlideUpdate({ transition: { ...slide.transition, type: value } })
                  }
                >
                  <SelectTrigger className="mt-1.5 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {transitionTypes.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Duration</Label>
                <Select
                  value={String(slide.transition?.duration || 0.5)}
                  onValueChange={(value) =>
                    onSlideUpdate({ transition: { ...slide.transition, duration: parseFloat(value) } })
                  }
                >
                  <SelectTrigger className="mt-1.5 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.3">Fast (0.3s)</SelectItem>
                    <SelectItem value="0.5">Medium (0.5s)</SelectItem>
                    <SelectItem value="1">Slow (1s)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Linked Data Section */}
          <Collapsible open={openSections.linkedData} onOpenChange={() => toggleSection('linkedData')}>
            <CollapsibleTrigger className="flex items-center gap-2 w-full text-sm font-medium text-foreground hover:text-primary transition-colors">
              {openSections.linkedData ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <Link2 className="h-4 w-4" />
              Linked Data
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <Button variant="outline" size="sm" className="w-full gap-2">
                <Plus className="h-3 w-3" />
                Link Artifact
              </Button>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>

      {/* Quick Actions */}
      <div className="p-4 border-t border-border space-y-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={onOpenVersionHistory}
        >
          <History className="h-4 w-4" />
          Version History
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={onOpenCollaborators}
        >
          <Users className="h-4 w-4" />
          Collaborators
        </Button>
      </div>
    </div>
  );
}
