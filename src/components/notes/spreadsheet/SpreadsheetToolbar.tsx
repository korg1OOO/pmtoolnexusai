import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Paintbrush,
  Type,
  ChevronDown,
  Undo,
  Redo,
  Copy,
  Clipboard,
  Scissors,
  Trash2,
} from 'lucide-react';
import type { CellFormat } from './types';
import { cn } from '@/lib/utils';

const COLORS = [
  { name: 'Default', value: '' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Gray', value: '#6b7280' },
];

const BG_COLORS = [
  { name: 'None', value: '' },
  { name: 'Light Red', value: '#fef2f2' },
  { name: 'Light Orange', value: '#fff7ed' },
  { name: 'Light Yellow', value: '#fefce8' },
  { name: 'Light Green', value: '#f0fdf4' },
  { name: 'Light Blue', value: '#eff6ff' },
  { name: 'Light Purple', value: '#faf5ff' },
  { name: 'Light Pink', value: '#fdf2f8' },
  { name: 'Light Gray', value: '#f9fafb' },
];

interface SpreadsheetToolbarProps {
  currentFormat: CellFormat;
  onFormatChange: (format: Partial<CellFormat>) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onClearContent: () => void;
  hasSelection: boolean;
}

export function SpreadsheetToolbar({
  currentFormat,
  onFormatChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onCopy,
  onCut,
  onPaste,
  onClearContent,
  hasSelection,
}: SpreadsheetToolbarProps) {
  return (
    <div className="flex items-center gap-1 px-2 py-1 border-b border-border bg-muted/30 flex-wrap">
      {/* Undo/Redo */}
      <div className="flex items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="iconSm" onClick={onUndo} disabled={!canUndo}>
              <Undo className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="iconSm" onClick={onRedo} disabled={!canRedo}>
              <Redo className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Clipboard */}
      <div className="flex items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="iconSm" onClick={onCut} disabled={!hasSelection}>
              <Scissors className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Cut (Ctrl+X)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="iconSm" onClick={onCopy} disabled={!hasSelection}>
              <Copy className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy (Ctrl+C)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="iconSm" onClick={onPaste}>
              <Clipboard className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Paste (Ctrl+V)</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Text Formatting */}
      <div className="flex items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="iconSm"
              className={cn(currentFormat.bold && 'bg-accent')}
              onClick={() => onFormatChange({ bold: !currentFormat.bold })}
            >
              <Bold className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Bold (Ctrl+B)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="iconSm"
              className={cn(currentFormat.italic && 'bg-accent')}
              onClick={() => onFormatChange({ italic: !currentFormat.italic })}
            >
              <Italic className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Italic (Ctrl+I)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="iconSm"
              className={cn(currentFormat.underline && 'bg-accent')}
              onClick={() => onFormatChange({ underline: !currentFormat.underline })}
            >
              <Underline className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Underline (Ctrl+U)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="iconSm"
              className={cn(currentFormat.strikethrough && 'bg-accent')}
              onClick={() => onFormatChange({ strikethrough: !currentFormat.strikethrough })}
            >
              <Strikethrough className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Strikethrough</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Colors */}
      <div className="flex items-center gap-0.5">
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 px-2">
                  <Type className="h-4 w-4" />
                  <div 
                    className="w-3 h-0.5 rounded-full" 
                    style={{ backgroundColor: currentFormat.textColor || '#000' }}
                  />
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>Text Color</TooltipContent>
          </Tooltip>
          <DropdownMenuContent>
            {COLORS.map(color => (
              <DropdownMenuItem
                key={color.value}
                onClick={() => onFormatChange({ textColor: color.value })}
                className="gap-2"
              >
                <div 
                  className="w-4 h-4 rounded border border-border"
                  style={{ backgroundColor: color.value || 'transparent' }}
                />
                {color.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 px-2">
                  <Paintbrush className="h-4 w-4" />
                  <div 
                    className="w-3 h-3 rounded border border-border" 
                    style={{ backgroundColor: currentFormat.bgColor || 'transparent' }}
                  />
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>Fill Color</TooltipContent>
          </Tooltip>
          <DropdownMenuContent>
            {BG_COLORS.map(color => (
              <DropdownMenuItem
                key={color.value}
                onClick={() => onFormatChange({ bgColor: color.value })}
                className="gap-2"
              >
                <div 
                  className="w-4 h-4 rounded border border-border"
                  style={{ backgroundColor: color.value || 'transparent' }}
                />
                {color.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Alignment */}
      <div className="flex items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="iconSm"
              className={cn(currentFormat.align === 'left' && 'bg-accent')}
              onClick={() => onFormatChange({ align: 'left' })}
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Align Left</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="iconSm"
              className={cn(currentFormat.align === 'center' && 'bg-accent')}
              onClick={() => onFormatChange({ align: 'center' })}
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Align Center</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="iconSm"
              className={cn(currentFormat.align === 'right' && 'bg-accent')}
              onClick={() => onFormatChange({ align: 'right' })}
            >
              <AlignRight className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Align Right</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Clear */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="iconSm" onClick={onClearContent} disabled={!hasSelection}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Clear Content (Delete)</TooltipContent>
      </Tooltip>
    </div>
  );
}
