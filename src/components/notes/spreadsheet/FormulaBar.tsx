import React from 'react';
import { Input } from '@/components/ui/input';
import { indexToColumn } from './formulaEngine';

interface FormulaBarProps {
  cellRef: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  disabled?: boolean;
}

export function FormulaBar({
  cellRef,
  value,
  onChange,
  onSubmit,
  onCancel,
  disabled,
}: FormulaBarProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSubmit();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="flex items-center gap-2 px-2 py-1 border-b border-border bg-background">
      <div className="w-16 h-7 flex items-center justify-center bg-muted rounded text-sm font-medium text-muted-foreground border border-border">
        {cellRef || '—'}
      </div>
      <span className="text-muted-foreground font-medium text-lg">fx</span>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="flex-1 h-7 font-mono text-sm"
        placeholder="Enter value or formula (e.g., =SUM(A1:A10))"
      />
    </div>
  );
}

export function getCellRefString(row: number, col: number): string {
  return `${indexToColumn(col)}${row + 1}`;
}
