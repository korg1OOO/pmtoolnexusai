import { useState, useCallback, useRef } from 'react';
import { DbTask, DbDependency } from './useTasks';

export type HistoryActionType = 
  | 'task-move' 
  | 'task-resize' 
  | 'dependency-create' 
  | 'dependency-delete'
  | 'dependency-update'
  | 'task-update';

export interface HistoryAction {
  type: HistoryActionType;
  timestamp: number;
  data: {
    taskId?: string;
    dependencyId?: string;
    before: Partial<DbTask | DbDependency> | null;
    after: Partial<DbTask | DbDependency> | null;
  };
}

interface UseGanttHistoryOptions {
  maxStackSize?: number;
}

/**
 * Hook for managing undo/redo history for Gantt operations
 */
export function useGanttHistory(options: UseGanttHistoryOptions = {}) {
  const { maxStackSize = 50 } = options;
  
  const [undoStack, setUndoStack] = useState<HistoryAction[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryAction[]>([]);
  const isUndoingRef = useRef(false);

  /**
   * Push a new action to the history stack
   */
  const pushAction = useCallback((action: Omit<HistoryAction, 'timestamp'>) => {
    // Don't record if we're undoing/redoing
    if (isUndoingRef.current) return;
    
    const newAction: HistoryAction = {
      ...action,
      timestamp: Date.now(),
    };
    
    setUndoStack(prev => {
      const newStack = [...prev, newAction];
      // Trim to max size
      if (newStack.length > maxStackSize) {
        return newStack.slice(-maxStackSize);
      }
      return newStack;
    });
    
    // Clear redo stack when new action is performed
    setRedoStack([]);
  }, [maxStackSize]);

  /**
   * Record a task move operation
   */
  const recordTaskMove = useCallback((
    taskId: string,
    before: { start_date: string; end_date: string },
    after: { start_date: string; end_date: string }
  ) => {
    pushAction({
      type: 'task-move',
      data: { taskId, before, after },
    });
  }, [pushAction]);

  /**
   * Record a task resize operation
   */
  const recordTaskResize = useCallback((
    taskId: string,
    before: { start_date: string; end_date: string; duration: number },
    after: { start_date: string; end_date: string; duration: number }
  ) => {
    pushAction({
      type: 'task-resize',
      data: { taskId, before, after },
    });
  }, [pushAction]);

  /**
   * Record a dependency creation
   */
  const recordDependencyCreate = useCallback((
    dependencyId: string,
    dependency: Partial<DbDependency>
  ) => {
    pushAction({
      type: 'dependency-create',
      data: { dependencyId, before: null, after: dependency },
    });
  }, [pushAction]);

  /**
   * Record a dependency deletion
   */
  const recordDependencyDelete = useCallback((
    dependencyId: string,
    dependency: Partial<DbDependency>
  ) => {
    pushAction({
      type: 'dependency-delete',
      data: { dependencyId, before: dependency, after: null },
    });
  }, [pushAction]);

  /**
   * Record a dependency update (type or lag change)
   */
  const recordDependencyUpdate = useCallback((
    dependencyId: string,
    before: Partial<DbDependency>,
    after: Partial<DbDependency>
  ) => {
    pushAction({
      type: 'dependency-update',
      data: { dependencyId, before, after },
    });
  }, [pushAction]);

  /**
   * Get the action to undo
   */
  const getUndoAction = useCallback((): HistoryAction | null => {
    if (undoStack.length === 0) return null;
    return undoStack[undoStack.length - 1];
  }, [undoStack]);

  /**
   * Get the action to redo
   */
  const getRedoAction = useCallback((): HistoryAction | null => {
    if (redoStack.length === 0) return null;
    return redoStack[redoStack.length - 1];
  }, [redoStack]);

  /**
   * Pop an action for undo and move to redo stack
   */
  const popUndo = useCallback((): HistoryAction | null => {
    if (undoStack.length === 0) return null;
    
    const action = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, action]);
    
    return action;
  }, [undoStack]);

  /**
   * Pop an action for redo and move to undo stack
   */
  const popRedo = useCallback((): HistoryAction | null => {
    if (redoStack.length === 0) return null;
    
    const action = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, action]);
    
    return action;
  }, [redoStack]);

  /**
   * Set the undoing ref to prevent recording during undo/redo
   */
  const setIsUndoing = useCallback((value: boolean) => {
    isUndoingRef.current = value;
  }, []);

  /**
   * Clear all history
   */
  const clearHistory = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  return {
    // State
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    undoStackSize: undoStack.length,
    redoStackSize: redoStack.length,
    
    // Record actions
    recordTaskMove,
    recordTaskResize,
    recordDependencyCreate,
    recordDependencyDelete,
    recordDependencyUpdate,
    
    // Undo/redo operations
    getUndoAction,
    getRedoAction,
    popUndo,
    popRedo,
    setIsUndoing,
    
    // Utility
    clearHistory,
  };
}
