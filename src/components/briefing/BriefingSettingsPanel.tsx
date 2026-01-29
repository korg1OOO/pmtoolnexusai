import React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Settings, RotateCcw, Save, Sparkles, GripVertical } from 'lucide-react';
import { BRIEFING_SECTIONS, BriefingSectionId } from './types';

interface BriefingSettingsPanelProps {
  enabledSections: BriefingSectionId[];
  sectionOrder: BriefingSectionId[];
  onToggleSection: (sectionId: BriefingSectionId) => void;
  onReorderSections: (newOrder: BriefingSectionId[]) => void;
  onSave: () => void;
  onReset: () => void;
  saving?: boolean;
}

export function BriefingSettingsPanel({
  enabledSections,
  sectionOrder,
  onToggleSection,
  onReorderSections,
  onSave,
  onReset,
  saving = false,
}: BriefingSettingsPanelProps) {
  const [open, setOpen] = React.useState(false);
  const [draggedItem, setDraggedItem] = React.useState<BriefingSectionId | null>(null);

  const handleDragStart = (e: React.DragEvent, sectionId: BriefingSectionId) => {
    setDraggedItem(sectionId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetId: BriefingSectionId) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetId) return;

    const newOrder = [...sectionOrder];
    const draggedIndex = newOrder.indexOf(draggedItem);
    const targetIndex = newOrder.indexOf(targetId);

    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedItem);

    onReorderSections(newOrder);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleSaveAndClose = () => {
    onSave();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Customize
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Customize Briefing</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-8 gap-1 text-xs"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </Button>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              Toggle sections on/off
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {BRIEFING_SECTIONS.map(section => (
                <div
                  key={section.id}
                  className="flex items-center gap-2 rounded-md border px-2 py-1.5 hover:bg-muted/50"
                >
                  <Checkbox
                    id={section.id}
                    checked={enabledSections.includes(section.id)}
                    onCheckedChange={() => onToggleSection(section.id)}
                  />
                  <Label
                    htmlFor={section.id}
                    className="flex-1 text-xs cursor-pointer truncate"
                  >
                    {section.title}
                  </Label>
                  {section.isAIPowered && (
                    <Sparkles className="h-3 w-3 text-primary shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              Drag to reorder sections
            </Label>
            <ScrollArea className="h-48 rounded-md border">
              <div className="p-2 space-y-1">
                {sectionOrder.map(sectionId => {
                  const section = BRIEFING_SECTIONS.find(s => s.id === sectionId);
                  if (!section) return null;
                  const isEnabled = enabledSections.includes(sectionId);

                  return (
                    <div
                      key={sectionId}
                      draggable
                      onDragStart={e => handleDragStart(e, sectionId)}
                      onDragOver={e => handleDragOver(e, sectionId)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm cursor-move transition-colors ${
                        draggedItem === sectionId
                          ? 'bg-primary/20'
                          : isEnabled
                          ? 'bg-muted/50 hover:bg-muted'
                          : 'opacity-50'
                      }`}
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="flex-1 truncate">{section.title}</span>
                      {!isEnabled && (
                        <Badge variant="outline" className="text-xs">
                          Off
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveAndClose} disabled={saving}>
              {saving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
