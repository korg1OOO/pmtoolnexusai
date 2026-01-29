import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Table2,
  Save,
  Clock,
  ChevronDown,
  Copy,
  Clipboard,
  Scissors,
  ArrowUp,
  ArrowDown,
  Lock,
} from 'lucide-react';
import type { SpreadsheetSheet, NotebookSpreadsheet } from '@/hooks/useSpreadsheets';
import { useSheets } from '@/hooks/useSpreadsheets';
import { useLinkedSpreadsheet } from '@/hooks/useLinkedSpreadsheet';
import { formatDistanceToNow } from 'date-fns';
import {
  SpreadsheetToolbar,
  FormulaBar,
  getCellRefString,
  getCellDisplayValue,
  indexToColumn,
  ConvertToProjectPlanDialog,
  SyncStatusIndicator,
} from './spreadsheet';
import type { CellFormat, Selection, CellData } from './spreadsheet/types';
import { isInSelection, getSelectionRange, createEmptySelection } from './spreadsheet/types';

interface SpreadsheetEditorProps {
  spreadsheet: NotebookSpreadsheet | null;
}

interface CellFormats {
  [key: string]: CellFormat; // key is "row-col"
}

interface HistoryEntry {
  data: any[][];
  formats: CellFormats;
}

export function SpreadsheetEditor({ spreadsheet }: SpreadsheetEditorProps) {
  const { sheets, loading, createSheet, updateSheet, deleteSheet } = useSheets(spreadsheet?.id || null);
  const { 
    linkInfo, 
    isLinked, 
    isSyncing, 
    convertToProjectPlan, 
    syncToProjectPlan, 
    syncToSpreadsheet, 
    unlinkFromProjectPlan,
    debouncedSync,
  } = useLinkedSpreadsheet(spreadsheet?.id || null);
  
  const [activeSheetId, setActiveSheetId] = useState<string | null>(null);
  const [editingSheetName, setEditingSheetName] = useState<string | null>(null);
  const [newSheetName, setNewSheetName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  
  // Selection state
  const [selection, setSelection] = useState<Selection | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState('');
  
  // Cell formats (stored separately from data)
  const [cellFormats, setCellFormats] = useState<CellFormats>({});
  
  // Local data state for immediate updates
  const [localData, setLocalData] = useState<any[][] | null>(null);
  
  // History for undo/redo
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Clipboard
  const [clipboard, setClipboard] = useState<{ data: any[][]; formats: CellFormats } | null>(null);
  const [clipboardSelection, setClipboardSelection] = useState<Selection | null>(null);
  
  // Column widths
  const [columnWidths, setColumnWidths] = useState<Record<number, number>>({});
  const [resizingCol, setResizingCol] = useState<number | null>(null);
  const resizeStartX = useRef<number>(0);
  const resizeStartWidth = useRef<number>(0);
  
  const gridRef = useRef<HTMLDivElement>(null);
  const DEFAULT_COL_WIDTH = 100;
  const MIN_COL_WIDTH = 40;
  const ROW_HEIGHT = 28;
  const HEADER_HEIGHT = 32;
  const ROW_HEADER_WIDTH = 48;

  // Select first sheet when sheets load
  useEffect(() => {
    if (sheets.length > 0 && !activeSheetId) {
      setActiveSheetId(sheets[0].id);
    }
  }, [sheets, activeSheetId]);

  // Reset when spreadsheet changes
  useEffect(() => {
    setActiveSheetId(null);
    setSelection(null);
    setEditingCell(null);
    setLocalData(null);
    setCellFormats({});
    setHistory([]);
    setHistoryIndex(-1);
  }, [spreadsheet?.id]);

  const activeSheet = sheets.find(s => s.id === activeSheetId);
  
  // Sync local data with active sheet
  useEffect(() => {
    if (activeSheet) {
      const data = ensureGridSize(activeSheet.data || [], 100, 26);
      setLocalData(data);
      // Initialize history
      setHistory([{ data: JSON.parse(JSON.stringify(data)), formats: {} }]);
      setHistoryIndex(0);
    }
  }, [activeSheet?.id]);
  
  // Ensure minimum grid size
  const ensureGridSize = (data: any[][], minRows: number, minCols: number): any[][] => {
    const newData = [...data];
    while (newData.length < minRows) {
      newData.push(Array(minCols).fill(''));
    }
    return newData.map(row => {
      const newRow = [...(row || [])];
      while (newRow.length < minCols) {
        newRow.push('');
      }
      return newRow;
    });
  };

  // Save to database with debounce
  const saveData = useCallback((data: any[][]) => {
    if (!activeSheet) return;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      await updateSheet(activeSheet.id, { data });
      setIsSaving(false);
      setLastSaved(new Date());
    }, 1000);
  }, [activeSheet, updateSheet]);

  // Push to history
  const pushHistory = useCallback((data: any[][], formats: CellFormats) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ data: JSON.parse(JSON.stringify(data)), formats: { ...formats } });
      return newHistory.slice(-50); // Keep last 50 states
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

  // Update cell value
  const updateCell = useCallback((row: number, col: number, value: string) => {
    if (!localData) return;
    
    const newData = localData.map((r, ri) => 
      ri === row ? r.map((c, ci) => ci === col ? value : c) : [...r]
    );
    
    setLocalData(newData);
    pushHistory(newData, cellFormats);
    saveData(newData);
  }, [localData, cellFormats, pushHistory, saveData]);

  // Handle cell editing
  const startEditing = useCallback((row: number, col: number, initialValue?: string) => {
    setEditingCell({ row, col });
    const currentValue = localData?.[row]?.[col] ?? '';
    setEditValue(initialValue !== undefined ? initialValue : String(currentValue));
  }, [localData]);

  const commitEdit = useCallback(() => {
    if (editingCell && localData) {
      updateCell(editingCell.row, editingCell.col, editValue);
    }
    setEditingCell(null);
  }, [editingCell, editValue, updateCell, localData]);

  const cancelEdit = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
  }, []);

  // Keyboard navigation
  const moveSelection = useCallback((dRow: number, dCol: number, extend: boolean = false) => {
    if (!selection || !localData) return;
    
    const newRow = Math.max(0, Math.min(localData.length - 1, selection.end.row + dRow));
    const newCol = Math.max(0, Math.min((localData[0]?.length || 26) - 1, selection.end.col + dCol));
    
    if (extend) {
      setSelection(prev => prev ? { ...prev, end: { row: newRow, col: newCol } } : null);
    } else {
      setSelection(createEmptySelection(newRow, newCol));
    }
  }, [selection, localData]);

  // Handle keyboard events
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (editingCell) {
      if (e.key === 'Enter') {
        e.preventDefault();
        commitEdit();
        moveSelection(1, 0);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        commitEdit();
        moveSelection(0, e.shiftKey ? -1 : 1);
      } else if (e.key === 'Escape') {
        cancelEdit();
      }
      return;
    }
    
    if (!selection) return;

    const ctrlKey = e.ctrlKey || e.metaKey;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        moveSelection(-1, 0, e.shiftKey);
        break;
      case 'ArrowDown':
        e.preventDefault();
        moveSelection(1, 0, e.shiftKey);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        moveSelection(0, -1, e.shiftKey);
        break;
      case 'ArrowRight':
        e.preventDefault();
        moveSelection(0, 1, e.shiftKey);
        break;
      case 'Tab':
        e.preventDefault();
        moveSelection(0, e.shiftKey ? -1 : 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (!e.shiftKey) {
          startEditing(selection.start.row, selection.start.col);
        }
        break;
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        handleClearContent();
        break;
      case 'c':
        if (ctrlKey) {
          e.preventDefault();
          handleCopy();
        }
        break;
      case 'x':
        if (ctrlKey) {
          e.preventDefault();
          handleCut();
        }
        break;
      case 'v':
        if (ctrlKey) {
          e.preventDefault();
          handlePaste();
        }
        break;
      case 'z':
        if (ctrlKey) {
          e.preventDefault();
          e.shiftKey ? handleRedo() : handleUndo();
        }
        break;
      case 'y':
        if (ctrlKey) {
          e.preventDefault();
          handleRedo();
        }
        break;
      case 'b':
        if (ctrlKey) {
          e.preventDefault();
          handleFormatChange({ bold: !getCurrentFormat().bold });
        }
        break;
      case 'i':
        if (ctrlKey) {
          e.preventDefault();
          handleFormatChange({ italic: !getCurrentFormat().italic });
        }
        break;
      case 'u':
        if (ctrlKey) {
          e.preventDefault();
          handleFormatChange({ underline: !getCurrentFormat().underline });
        }
        break;
      default:
        // Start editing on any printable character
        if (e.key.length === 1 && !ctrlKey) {
          e.preventDefault();
          startEditing(selection.start.row, selection.start.col, e.key);
        }
    }
  }, [editingCell, selection, commitEdit, cancelEdit, moveSelection, startEditing]);

  // Cell click handlers
  const handleCellMouseDown = useCallback((row: number, col: number, e: React.MouseEvent) => {
    if (e.shiftKey && selection) {
      setSelection(prev => prev ? { ...prev, end: { row, col } } : createEmptySelection(row, col));
    } else {
      setSelection(createEmptySelection(row, col));
      setIsSelecting(true);
    }
  }, [selection]);

  const handleCellMouseEnter = useCallback((row: number, col: number) => {
    if (isSelecting) {
      setSelection(prev => prev ? { ...prev, end: { row, col } } : null);
    }
  }, [isSelecting]);

  const handleMouseUp = useCallback(() => {
    setIsSelecting(false);
  }, []);

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseUp]);

  // Format helpers
  const getFormatKey = (row: number, col: number) => `${row}-${col}`;
  
  const getCurrentFormat = useCallback((): CellFormat => {
    if (!selection) return {};
    const key = getFormatKey(selection.start.row, selection.start.col);
    return cellFormats[key] || {};
  }, [selection, cellFormats]);

  const handleFormatChange = useCallback((format: Partial<CellFormat>) => {
    if (!selection) return;
    
    const { minRow, maxRow, minCol, maxCol } = getSelectionRange(selection);
    const newFormats = { ...cellFormats };
    
    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const key = getFormatKey(row, col);
        newFormats[key] = { ...newFormats[key], ...format };
      }
    }
    
    setCellFormats(newFormats);
    pushHistory(localData || [], newFormats);
  }, [selection, cellFormats, localData, pushHistory]);

  // Clipboard operations
  const handleCopy = useCallback(() => {
    if (!selection || !localData) return;
    
    const { minRow, maxRow, minCol, maxCol } = getSelectionRange(selection);
    const data: any[][] = [];
    const formats: CellFormats = {};
    
    for (let row = minRow; row <= maxRow; row++) {
      const rowData: any[] = [];
      for (let col = minCol; col <= maxCol; col++) {
        rowData.push(localData[row]?.[col] ?? '');
        const key = getFormatKey(row, col);
        const newKey = getFormatKey(row - minRow, col - minCol);
        if (cellFormats[key]) {
          formats[newKey] = { ...cellFormats[key] };
        }
      }
      data.push(rowData);
    }
    
    setClipboard({ data, formats });
    setClipboardSelection(selection);
  }, [selection, localData, cellFormats]);

  const handleCut = useCallback(() => {
    handleCopy();
    handleClearContent();
  }, [handleCopy]);

  const handlePaste = useCallback(() => {
    if (!clipboard || !selection || !localData) return;
    
    const startRow = selection.start.row;
    const startCol = selection.start.col;
    
    const newData = localData.map(row => [...row]);
    const newFormats = { ...cellFormats };
    
    clipboard.data.forEach((row, ri) => {
      row.forEach((cell, ci) => {
        const targetRow = startRow + ri;
        const targetCol = startCol + ci;
        if (targetRow < newData.length && targetCol < (newData[0]?.length || 0)) {
          newData[targetRow][targetCol] = cell;
          
          const sourceKey = getFormatKey(ri, ci);
          const targetKey = getFormatKey(targetRow, targetCol);
          if (clipboard.formats[sourceKey]) {
            newFormats[targetKey] = { ...clipboard.formats[sourceKey] };
          }
        }
      });
    });
    
    setLocalData(newData);
    setCellFormats(newFormats);
    pushHistory(newData, newFormats);
    saveData(newData);
  }, [clipboard, selection, localData, cellFormats, pushHistory, saveData]);

  const handleClearContent = useCallback(() => {
    if (!selection || !localData) return;
    
    const { minRow, maxRow, minCol, maxCol } = getSelectionRange(selection);
    const newData = localData.map((row, ri) => 
      row.map((cell, ci) => {
        if (ri >= minRow && ri <= maxRow && ci >= minCol && ci <= maxCol) {
          return '';
        }
        return cell;
      })
    );
    
    setLocalData(newData);
    pushHistory(newData, cellFormats);
    saveData(newData);
  }, [selection, localData, cellFormats, pushHistory, saveData]);

  // Undo/Redo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const entry = history[newIndex];
      setLocalData(JSON.parse(JSON.stringify(entry.data)));
      setCellFormats({ ...entry.formats });
      setHistoryIndex(newIndex);
      saveData(entry.data);
    }
  }, [history, historyIndex, saveData]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const entry = history[newIndex];
      setLocalData(JSON.parse(JSON.stringify(entry.data)));
      setCellFormats({ ...entry.formats });
      setHistoryIndex(newIndex);
      saveData(entry.data);
    }
  }, [history, historyIndex, saveData]);

  // Column resize handlers
  const handleResizeStart = useCallback((col: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingCol(col);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = columnWidths[col] ?? DEFAULT_COL_WIDTH;
  }, [columnWidths]);

  useEffect(() => {
    if (resizingCol === null) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - resizeStartX.current;
      const newWidth = Math.max(MIN_COL_WIDTH, resizeStartWidth.current + delta);
      setColumnWidths(prev => ({ ...prev, [resizingCol]: newWidth }));
    };
    
    const handleMouseUp = () => {
      setResizingCol(null);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingCol]);

  // Sheet management
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

  // Formula bar handlers
  const formulaBarValue = useMemo(() => {
    if (!selection || !localData) return '';
    const { row, col } = selection.start;
    return String(localData[row]?.[col] ?? '');
  }, [selection, localData]);

  const handleFormulaBarChange = useCallback((value: string) => {
    setEditValue(value);
    if (selection && !editingCell) {
      startEditing(selection.start.row, selection.start.col, value);
    }
  }, [selection, editingCell, startEditing]);

  const handleFormulaBarSubmit = useCallback(() => {
    if (selection && editValue !== undefined) {
      updateCell(selection.start.row, selection.start.col, editValue);
    }
    setEditingCell(null);
  }, [selection, editValue, updateCell]);

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

  if (loading || !localData) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading sheets...</div>
      </div>
    );
  }

  const cellRefString = selection ? getCellRefString(selection.start.row, selection.start.col) : '';

  return (
    <div 
      className="flex-1 flex flex-col bg-background min-w-0 h-full"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between p-2 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          {isLinked ? (
            <div className="relative">
              <Table2 className="h-5 w-5 text-blue-500" />
              <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-blue-500 border-2 border-background" />
            </div>
          ) : (
            <Table2 className="h-5 w-5 text-primary" />
          )}
          <span className="font-medium">{spreadsheet.name}</span>
          {isLinked && (
            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
              Linked
            </span>
          )}
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

      {/* Toolbar */}
      <SpreadsheetToolbar
        currentFormat={getCurrentFormat()}
        onFormatChange={handleFormatChange}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onCopy={handleCopy}
        onCut={handleCut}
        onPaste={handlePaste}
        onClearContent={handleClearContent}
        hasSelection={selection !== null}
        isLinked={isLinked}
        onConvertToProjectPlan={() => setShowConvertDialog(true)}
        syncStatusComponent={
          linkInfo ? (
            <SyncStatusIndicator
              linkInfo={linkInfo}
              isSyncing={isSyncing}
              onSyncToProject={() => activeSheet && syncToProjectPlan(activeSheet.id, localData || [])}
              onSyncToSpreadsheet={() => activeSheet && syncToSpreadsheet(activeSheet.id)}
              onUnlink={unlinkFromProjectPlan}
            />
          ) : null
        }
      />

      {/* Formula Bar */}
      <FormulaBar
        cellRef={cellRefString}
        value={editingCell ? editValue : formulaBarValue}
        onChange={handleFormulaBarChange}
        onSubmit={handleFormulaBarSubmit}
        onCancel={cancelEdit}
        disabled={!selection}
      />

      {/* Spreadsheet Grid */}
      <div className="flex-1 overflow-hidden" ref={gridRef}>
        <ScrollArea className="h-full">
          <div className="min-w-max select-none">
            {/* Header Row */}
            <div className="flex sticky top-0 z-20 bg-muted">
              {/* Corner cell */}
              <div 
                className="sticky left-0 z-30 bg-muted border-b border-r border-border flex items-center justify-center"
                style={{ width: ROW_HEADER_WIDTH, height: HEADER_HEIGHT }}
              />
              {/* Column headers */}
              {localData[0]?.map((_, colIndex) => (
                <div
                  key={colIndex}
                  className="relative border-b border-r border-border flex items-center justify-center text-xs font-medium text-muted-foreground bg-muted group"
                  style={{ width: columnWidths[colIndex] ?? DEFAULT_COL_WIDTH, height: HEADER_HEIGHT }}
                >
                  {indexToColumn(colIndex)}
                  {/* Resize handle */}
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 group-hover:bg-border"
                    onMouseDown={(e) => handleResizeStart(colIndex, e)}
                  />
                </div>
              ))}
            </div>

            {/* Data Rows */}
            {localData.map((row, rowIndex) => (
              <div key={rowIndex} className="flex">
                {/* Row header */}
                <div 
                  className="sticky left-0 z-10 bg-muted border-b border-r border-border flex items-center justify-center text-xs text-muted-foreground"
                  style={{ width: ROW_HEADER_WIDTH, height: ROW_HEIGHT }}
                >
                  {rowIndex + 1}
                </div>
                {/* Cells */}
                {row.map((cell, colIndex) => {
                  const isEditing = editingCell?.row === rowIndex && editingCell?.col === colIndex;
                  const isSelected = isInSelection(rowIndex, colIndex, selection);
                  const isActiveCell = selection?.start.row === rowIndex && selection?.start.col === colIndex;
                  const format = cellFormats[getFormatKey(rowIndex, colIndex)] || {};
                  const displayValue = getCellDisplayValue(cell, localData);
                  
                  return (
                    <ContextMenu key={`${rowIndex}-${colIndex}`}>
                      <ContextMenuTrigger asChild>
                        <div
                          className={cn(
                            'border-b border-r border-border relative',
                            isSelected && !isLinked && 'bg-primary/10',
                            isSelected && isLinked && 'bg-blue-200/50 dark:bg-blue-900/30',
                            isActiveCell && 'ring-2 ring-primary ring-inset z-10',
                            // Blue tint for linked spreadsheets (only data rows, not header row)
                            isLinked && rowIndex > 0 && !isSelected && 'bg-blue-50/50 dark:bg-blue-950/20'
                          )}
                          style={{ 
                            width: columnWidths[colIndex] ?? DEFAULT_COL_WIDTH, 
                            height: ROW_HEIGHT,
                            backgroundColor: !isLinked && format.bgColor ? format.bgColor : undefined,
                          }}
                          onMouseDown={(e) => handleCellMouseDown(rowIndex, colIndex, e)}
                          onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
                          onDoubleClick={() => startEditing(rowIndex, colIndex)}
                        >
                          {isEditing ? (
                            <input
                              autoFocus
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={commitEdit}
                              className="absolute inset-0 w-full h-full px-1 text-sm bg-background border-2 border-primary outline-none font-mono"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  commitEdit();
                                  moveSelection(1, 0);
                                } else if (e.key === 'Tab') {
                                  e.preventDefault();
                                  commitEdit();
                                  moveSelection(0, e.shiftKey ? -1 : 1);
                                } else if (e.key === 'Escape') {
                                  cancelEdit();
                                }
                                e.stopPropagation();
                              }}
                            />
                          ) : (
                            <div 
                              className={cn(
                                'w-full h-full px-1 text-sm flex items-center truncate',
                                format.bold && 'font-bold',
                                format.italic && 'italic',
                                format.underline && 'underline',
                                format.strikethrough && 'line-through',
                                format.align === 'center' && 'justify-center',
                                format.align === 'right' && 'justify-end',
                              )}
                              style={{ color: format.textColor || undefined }}
                            >
                              {displayValue}
                            </div>
                          )}
                        </div>
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem onClick={handleCut}>
                          <Scissors className="h-4 w-4 mr-2" />
                          Cut
                        </ContextMenuItem>
                        <ContextMenuItem onClick={handleCopy}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </ContextMenuItem>
                        <ContextMenuItem onClick={handlePaste}>
                          <Clipboard className="h-4 w-4 mr-2" />
                          Paste
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem onClick={() => {/* Insert row above */}}>
                          <ArrowUp className="h-4 w-4 mr-2" />
                          Insert Row Above
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => {/* Insert row below */}}>
                          <ArrowDown className="h-4 w-4 mr-2" />
                          Insert Row Below
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem onClick={handleClearContent}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Clear Contents
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  );
                })}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Sheet Tabs */}
      <div className="flex items-center gap-1 p-2 border-t border-border bg-muted/50 overflow-x-auto shrink-0">
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
                      disabled={sheets.length <= 1 || isLinked}
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
        
        {/* Disable add sheet for linked spreadsheets */}
        {!isLinked && (
          <Button
            variant="ghost"
            size="iconSm"
            className="h-7 w-7"
            onClick={handleAddSheet}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
        {isLinked && (
          <div className="flex items-center gap-1 px-2 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            <span>Sheets locked</span>
          </div>
        )}
      </div>

      {/* Convert to Project Plan Dialog */}
      <ConvertToProjectPlanDialog
        open={showConvertDialog}
        onOpenChange={setShowConvertDialog}
        spreadsheetName={spreadsheet?.name || 'Spreadsheet'}
        sheetData={localData || []}
        onConvert={async (projectId) => {
          if (activeSheet) {
            return await convertToProjectPlan(projectId, activeSheet.id, localData || []);
          }
          return false;
        }}
      />
    </div>
  );
}
