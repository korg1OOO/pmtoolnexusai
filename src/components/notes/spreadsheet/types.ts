// Spreadsheet types

export interface CellFormat {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  textColor?: string;
  bgColor?: string;
  align?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  fontSize?: number;
  fontFamily?: string;
  numberFormat?: string;
  wrapText?: boolean;
}

export interface MergedCellRange {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export interface CellData {
  value: string | number;
  format?: CellFormat;
}

export interface Selection {
  start: { row: number; col: number };
  end: { row: number; col: number };
}

export interface CellPosition {
  row: number;
  col: number;
}

export function createEmptySelection(row: number, col: number): Selection {
  return {
    start: { row, col },
    end: { row, col },
  };
}

export function isInSelection(row: number, col: number, selection: Selection | null): boolean {
  if (!selection) return false;
  const minRow = Math.min(selection.start.row, selection.end.row);
  const maxRow = Math.max(selection.start.row, selection.end.row);
  const minCol = Math.min(selection.start.col, selection.end.col);
  const maxCol = Math.max(selection.start.col, selection.end.col);
  return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol;
}

export function getSelectionRange(selection: Selection): { minRow: number; maxRow: number; minCol: number; maxCol: number } {
  return {
    minRow: Math.min(selection.start.row, selection.end.row),
    maxRow: Math.max(selection.start.row, selection.end.row),
    minCol: Math.min(selection.start.col, selection.end.col),
    maxCol: Math.max(selection.start.col, selection.end.col),
  };
}
