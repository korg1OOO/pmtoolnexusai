import React, { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  X,
  MoreHorizontal,
  Pencil,
  Trash2,
  Table2,
  Save,
  Clock,
  ChevronDown,
} from 'lucide-react';
import type { SpreadsheetSheet, NotebookSpreadsheet } from '@/hooks/useSpreadsheets';
import { useSheets } from '@/hooks/useSpreadsheets';
import { formatDistanceToNow } from 'date-fns';

interface SpreadsheetEditorProps {
  spreadsheet: NotebookSpreadsheet | null;
}

export function SpreadsheetEditor({ spreadsheet }: SpreadsheetEditorProps) {
  const { sheets, loading, createSheet, updateSheet, deleteSheet } = useSheets(spreadsheet?.id || null);
  const [activeSheetId, setActiveSheetId] = useState<string | null>(null);
  const [editingSheetName, setEditingSheetName] = useState<string | null>(null);
  const [newSheetName, setNewSheetName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Select first sheet when sheets load
  useEffect(() => {
    if (sheets.length > 0 && !activeSheetId) {
      setActiveSheetId(sheets[0].id);
    }
  }, [sheets, activeSheetId]);

  // Reset when spreadsheet changes
  useEffect(() => {
    setActiveSheetId(null);
  }, [spreadsheet?.id]);

  const activeSheet = sheets.find(s => s.id === activeSheetId);

  const handleCellChange = useCallback((rowIndex: number, colIndex: number, value: string) => {
    if (!activeSheet) return;

    const newData = [...activeSheet.data];
    if (!newData[rowIndex]) {
      newData[rowIndex] = [];
    }
    newData[rowIndex][colIndex] = value;

    // Update local state immediately
    const updatedSheet = { ...activeSheet, data: newData };
    
    // Debounced save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      await updateSheet(activeSheet.id, { data: newData });
      setIsSaving(false);
      setLastSaved(new Date());
    }, 1000);
  }, [activeSheet, updateSheet]);

  const handleAddSheet = async () => {
    const sheet = await createSheet(`Sheet ${sheets.length + 1}`);
    if (sheet) {
      setActiveSheetId(sheet.id);
    }
  };

  const handleRenameSheet = async (sheetId: string, name: string) => {
    await updateSheet(sheetId, { name });
    setEditingSheetName(null);
    setNewSheetName('');
  };

  const handleDeleteSheet = async (sheetId: string) => {
    await deleteSheet(sheetId);
    if (activeSheetId === sheetId && sheets.length > 1) {
      const remainingSheets = sheets.filter(s => s.id !== sheetId);
      setActiveSheetId(remainingSheets[0]?.id || null);
    }
  };

  // Add more rows/columns if needed
  const ensureGridSize = (data: any[][], minRows: number, minCols: number): any[][] => {
    const newData = [...data];
    while (newData.length < minRows) {
      newData.push(Array(minCols).fill(''));
    }
    return newData.map(row => {
      const newRow = [...row];
      while (newRow.length < minCols) {
        newRow.push('');
      }
      return newRow;
    });
  };

  const getColumnLabel = (index: number): string => {
    let label = '';
    let n = index;
    while (n >= 0) {
      label = String.fromCharCode(65 + (n % 26)) + label;
      n = Math.floor(n / 26) - 1;
    }
    return label;
  };

  if (!spreadsheet) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center text-muted-foreground">
          <Table2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Select a spreadsheet</h3>
          <p className="text-sm">Or create a new spreadsheet to get started</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading sheets...</div>
      </div>
    );
  }

  const gridData = activeSheet ? ensureGridSize(activeSheet.data || [], 50, 26) : [];

  return (
    <div className="flex-1 flex flex-col bg-background min-w-0 h-full">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Table2 className="h-5 w-5 text-primary" />
          <span className="font-medium">{spreadsheet.name}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {isSaving ? (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Save className="h-3 w-3 animate-pulse" />
              Saving...
            </span>
          ) : lastSaved && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Saved {formatDistanceToNow(lastSaved, { addSuffix: true })}
            </span>
          )}
        </div>
      </div>

      {/* Spreadsheet Grid */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="min-w-max">
            {/* Header Row */}
            <div className="flex sticky top-0 bg-muted z-10">
              <div className="w-12 h-8 border-b border-r border-border flex items-center justify-center text-xs text-muted-foreground bg-muted sticky left-0 z-20" />
              {gridData[0]?.map((_, colIndex) => (
                <div
                  key={colIndex}
                  className="w-24 h-8 border-b border-r border-border flex items-center justify-center text-xs font-medium text-muted-foreground bg-muted"
                >
                  {getColumnLabel(colIndex)}
                </div>
              ))}
            </div>

            {/* Data Rows */}
            {gridData.map((row, rowIndex) => (
              <div key={rowIndex} className="flex">
                <div className="w-12 h-7 border-b border-r border-border flex items-center justify-center text-xs text-muted-foreground bg-muted sticky left-0 z-10">
                  {rowIndex + 1}
                </div>
                {row.map((cell, colIndex) => (
                  <SpreadsheetCell
                    key={`${rowIndex}-${colIndex}`}
                    value={cell}
                    onChange={(value) => handleCellChange(rowIndex, colIndex, value)}
                  />
                ))}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Sheet Tabs */}
      <div className="flex items-center gap-1 p-2 border-t border-border bg-muted/50 overflow-x-auto">
        {sheets.map(sheet => (
          <div
            key={sheet.id}
            className={cn(
              'flex items-center gap-1 px-3 py-1.5 rounded-md text-sm cursor-pointer group',
              activeSheetId === sheet.id
                ? 'bg-background border border-border shadow-sm'
                : 'hover:bg-background/50'
            )}
            onClick={() => setActiveSheetId(sheet.id)}
          >
            {editingSheetName === sheet.id ? (
              <Input
                value={newSheetName}
                onChange={(e) => setNewSheetName(e.target.value)}
                onBlur={() => handleRenameSheet(sheet.id, newSheetName)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSheet(sheet.id, newSheetName);
                  if (e.key === 'Escape') setEditingSheetName(null);
                }}
                className="h-5 w-20 text-xs px-1"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <>
                <span>{sheet.name}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="iconSm"
                      className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      setEditingSheetName(sheet.id);
                      setNewSheetName(sheet.name);
                    }}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSheet(sheet.id);
                      }}
                      disabled={sheets.length <= 1}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        ))}
        
        <Button
          variant="ghost"
          size="iconSm"
          className="h-7 w-7"
          onClick={handleAddSheet}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Individual cell component for performance
interface SpreadsheetCellProps {
  value: string;
  onChange: (value: string) => void;
}

function SpreadsheetCell({ value, onChange }: SpreadsheetCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleBlur = () => {
    setIsEditing(false);
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  const handleDoubleClick = () => {
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div
      className="w-24 h-7 border-b border-r border-border"
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Tab') {
              handleBlur();
            }
            if (e.key === 'Escape') {
              setLocalValue(value);
              setIsEditing(false);
            }
          }}
          className="w-full h-full px-1 text-sm bg-background border-2 border-primary outline-none"
        />
      ) : (
        <div className="w-full h-full px-1 text-sm flex items-center truncate bg-background">
          {localValue}
        </div>
      )}
    </div>
  );
}
