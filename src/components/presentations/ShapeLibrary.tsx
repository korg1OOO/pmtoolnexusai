import React, { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Square,
  Circle,
  Triangle,
  ArrowRight,
  Minus,
  Star,
  MessageSquare,
  RectangleHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SlideShape } from '@/hooks/useSlides';

interface ShapeLibraryProps {
  trigger: React.ReactNode;
  onInsertShape: (shape: Omit<SlideShape, 'id'>) => void;
}

const shapes = [
  { type: 'rectangle', name: 'Rectangle', icon: Square },
  { type: 'circle', name: 'Circle', icon: Circle },
  { type: 'triangle', name: 'Triangle', icon: Triangle },
  { type: 'arrow', name: 'Arrow', icon: ArrowRight },
  { type: 'line', name: 'Line', icon: Minus },
  { type: 'star', name: 'Star', icon: Star },
  { type: 'callout', name: 'Callout', icon: MessageSquare },
] as const;

const SHAPE_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  'transparent',
];

const STROKE_COLORS = [
  '#000000', '#374151', '#6B7280', '#3b82f6', '#10b981',
  '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', 'transparent',
];

export function ShapeLibrary({ trigger, onInsertShape }: ShapeLibraryProps) {
  const [selectedType, setSelectedType] = useState<SlideShape['type']>('rectangle');
  const [fillColor, setFillColor] = useState('#3b82f6');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [isOpen, setIsOpen] = useState(false);

  const handleInsert = () => {
    onInsertShape({
      type: selectedType,
      x: 100,
      y: 100,
      width: selectedType === 'line' ? 200 : 100,
      height: selectedType === 'line' ? 4 : 100,
      rotation: 0,
      fill: fillColor,
      stroke: strokeColor,
      strokeWidth,
      zIndex: 1,
    });
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {trigger}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Shape</Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {shapes.map((shape) => {
                const Icon = shape.icon;
                return (
                  <button
                    key={shape.type}
                    className={cn(
                      'p-3 rounded-lg border transition-all flex flex-col items-center gap-1',
                      selectedType === shape.type
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    )}
                    onClick={() => setSelectedType(shape.type)}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-[10px] text-muted-foreground">{shape.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Fill Color</Label>
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {SHAPE_COLORS.map((color) => (
                <button
                  key={color}
                  className={cn(
                    'h-6 w-6 rounded border-2 transition-transform hover:scale-110',
                    fillColor === color ? 'border-foreground' : 'border-border',
                    color === 'transparent' && 'bg-[url("data:image/svg+xml,%3Csvg%20width%3D%228%22%20height%3D%228%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpattern%20id%3D%22checker%22%20x%3D%220%22%20y%3D%220%22%20width%3D%228%22%20height%3D%228%22%20patternUnits%3D%22userSpaceOnUse%22%3E%3Crect%20x%3D%220%22%20y%3D%220%22%20width%3D%224%22%20height%3D%224%22%20fill%3D%22%23ccc%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%224%22%20width%3D%224%22%20height%3D%224%22%20fill%3D%22%23ccc%22%2F%3E%3C%2Fpattern%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22url(%23checker)%22%2F%3E%3C%2Fsvg%3E")]'
                  )}
                  style={{ backgroundColor: color !== 'transparent' ? color : undefined }}
                  onClick={() => setFillColor(color)}
                />
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Stroke Color</Label>
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {STROKE_COLORS.map((color) => (
                <button
                  key={color}
                  className={cn(
                    'h-6 w-6 rounded border-2 transition-transform hover:scale-110',
                    strokeColor === color ? 'border-foreground' : 'border-border',
                    color === 'transparent' && 'bg-[url("data:image/svg+xml,%3Csvg%20width%3D%228%22%20height%3D%228%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpattern%20id%3D%22checker%22%20x%3D%220%22%20y%3D%220%22%20width%3D%228%22%20height%3D%228%22%20patternUnits%3D%22userSpaceOnUse%22%3E%3Crect%20x%3D%220%22%20y%3D%220%22%20width%3D%224%22%20height%3D%224%22%20fill%3D%22%23ccc%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%224%22%20width%3D%224%22%20height%3D%224%22%20fill%3D%22%23ccc%22%2F%3E%3C%2Fpattern%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22url(%23checker)%22%2F%3E%3C%2Fsvg%3E")]'
                  )}
                  style={{ backgroundColor: color !== 'transparent' ? color : undefined }}
                  onClick={() => setStrokeColor(color)}
                />
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Stroke Width: {strokeWidth}px</Label>
            <Slider
              value={[strokeWidth]}
              onValueChange={([value]) => setStrokeWidth(value)}
              min={0}
              max={10}
              step={1}
              className="mt-2"
            />
          </div>

          <Button className="w-full" onClick={handleInsert}>
            Insert Shape
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
