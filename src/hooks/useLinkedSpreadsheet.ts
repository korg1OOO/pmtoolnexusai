import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { NotebookSpreadsheet, SpreadsheetSheet } from '@/hooks/useSpreadsheets';

// Project plan column mapping
export const PROJECT_PLAN_COLUMNS = [
  { col: 0, header: 'WBS', field: 'wbs' },
  { col: 1, header: 'Task Name', field: 'name' },
  { col: 2, header: 'Type', field: 'type' },
  { col: 3, header: 'Status', field: 'status' },
  { col: 4, header: 'Priority', field: 'priority' },
  { col: 5, header: 'Start Date', field: 'start_date' },
  { col: 6, header: 'End Date', field: 'end_date' },
  { col: 7, header: 'Duration', field: 'duration' },
  { col: 8, header: 'Progress', field: 'progress' },
  { col: 9, header: 'Assignee', field: 'assignee_id' },
  { col: 10, header: 'Critical', field: 'is_critical' },
  { col: 11, header: 'Notes', field: 'notes' },
] as const;

export interface TaskMapping {
  id: string;
  spreadsheet_id: string;
  sheet_id: string;
  task_id: string;
  row_index: number;
  created_at: string;
}

export interface LinkedSpreadsheetInfo {
  linked_project_id: string | null;
  linked_at: string | null;
  last_synced_at: string | null;
  sync_status: 'synced' | 'syncing' | 'error';
  sync_direction: 'spreadsheet' | 'project' | 'both';
}

export function useLinkedSpreadsheet(spreadsheetId: string | null) {
  const [linkInfo, setLinkInfo] = useState<LinkedSpreadsheetInfo | null>(null);
  const [mappings, setMappings] = useState<TaskMapping[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();
  const debounceRef = useRef<NodeJS.Timeout>();

  // Fetch link information
  const fetchLinkInfo = useCallback(async () => {
    if (!spreadsheetId) {
      setLinkInfo(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notebook_spreadsheets')
        .select('linked_project_id, linked_at, last_synced_at, sync_status, sync_direction')
        .eq('id', spreadsheetId)
        .single();

      if (error) throw error;
      
      setLinkInfo({
        linked_project_id: data.linked_project_id,
        linked_at: data.linked_at,
        last_synced_at: data.last_synced_at,
        sync_status: (data.sync_status as LinkedSpreadsheetInfo['sync_status']) || 'synced',
        sync_direction: (data.sync_direction as LinkedSpreadsheetInfo['sync_direction']) || 'both',
      });
    } catch (error) {
      console.error('Error fetching link info:', error);
    }
  }, [spreadsheetId]);

  // Fetch task mappings
  const fetchMappings = useCallback(async () => {
    if (!spreadsheetId) {
      setMappings([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('spreadsheet_task_mappings')
        .select('*')
        .eq('spreadsheet_id', spreadsheetId)
        .order('row_index', { ascending: true });

      if (error) throw error;
      setMappings(data || []);
    } catch (error) {
      console.error('Error fetching mappings:', error);
    }
  }, [spreadsheetId]);

  // Convert spreadsheet to project plan
  const convertToProjectPlan = useCallback(async (
    projectId: string,
    sheetId: string,
    sheetData: any[][]
  ) => {
    if (!spreadsheetId) return false;

    try {
      setIsSyncing(true);

      // Update spreadsheet with link info
      await supabase
        .from('notebook_spreadsheets')
        .update({
          linked_project_id: projectId,
          linked_at: new Date().toISOString(),
          sync_status: 'syncing',
          sync_direction: 'both',
        })
        .eq('id', spreadsheetId);

      // Create header row if not present
      const headerRow = PROJECT_PLAN_COLUMNS.map(c => c.header);
      const newData = [...sheetData];
      
      // Check if first row is headers
      const firstRowHasHeaders = sheetData[0]?.some((cell: any) => 
        PROJECT_PLAN_COLUMNS.some(c => 
          String(cell).toLowerCase() === c.header.toLowerCase()
        )
      );

      if (!firstRowHasHeaders) {
        newData[0] = headerRow;
      }

      // Parse existing rows and create tasks
      const tasksToCreate: any[] = [];
      const mappingsToCreate: any[] = [];

      for (let rowIdx = 1; rowIdx < newData.length; rowIdx++) {
        const row = newData[rowIdx];
        const taskName = row?.[1]; // Column B = Task Name

        if (taskName && String(taskName).trim()) {
          const task = {
            project_id: projectId,
            wbs: String(row?.[0] || `${rowIdx}`),
            name: String(taskName),
            type: parseType(row?.[2]),
            status: parseStatus(row?.[3]),
            priority: parsePriority(row?.[4]),
            start_date: parseDate(row?.[5]) || new Date().toISOString().split('T')[0],
            end_date: parseDate(row?.[6]) || new Date().toISOString().split('T')[0],
            duration: parseInt(String(row?.[7] || '1'), 10) || 1,
            progress: Math.min(100, Math.max(0, parseInt(String(row?.[8] || '0'), 10) || 0)),
            is_critical: String(row?.[10]).toLowerCase() === 'yes',
            notes: String(row?.[11] || ''),
            sort_order: rowIdx,
            level: 0,
          };
          tasksToCreate.push({ task, rowIdx });
        }
      }

      // Insert tasks
      if (tasksToCreate.length > 0) {
        const { data: createdTasks, error: taskError } = await supabase
          .from('tasks')
          .insert(tasksToCreate.map(t => t.task))
          .select();

        if (taskError) throw taskError;

        // Create mappings
        createdTasks?.forEach((task, idx) => {
          mappingsToCreate.push({
            spreadsheet_id: spreadsheetId,
            sheet_id: sheetId,
            task_id: task.id,
            row_index: tasksToCreate[idx].rowIdx,
          });
        });

        if (mappingsToCreate.length > 0) {
          await supabase
            .from('spreadsheet_task_mappings')
            .insert(mappingsToCreate);
        }
      }

      // Update sheet data with headers
      await supabase
        .from('spreadsheet_sheets')
        .update({ data: newData })
        .eq('id', sheetId);

      // Mark as synced
      await supabase
        .from('notebook_spreadsheets')
        .update({
          sync_status: 'synced',
          last_synced_at: new Date().toISOString(),
        })
        .eq('id', spreadsheetId);

      toast({ title: 'Success', description: 'Spreadsheet linked to project plan' });
      await fetchLinkInfo();
      await fetchMappings();
      return true;
    } catch (error) {
      console.error('Error converting to project plan:', error);
      
      await supabase
        .from('notebook_spreadsheets')
        .update({ sync_status: 'error' })
        .eq('id', spreadsheetId);

      toast({ title: 'Error', description: 'Failed to convert spreadsheet', variant: 'destructive' });
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [spreadsheetId, toast, fetchLinkInfo, fetchMappings]);

  // Sync from spreadsheet to project plan
  const syncToProjectPlan = useCallback(async (sheetId: string, sheetData: any[][]) => {
    if (!spreadsheetId || !linkInfo?.linked_project_id) return false;

    try {
      setIsSyncing(true);

      await supabase
        .from('notebook_spreadsheets')
        .update({ sync_status: 'syncing' })
        .eq('id', spreadsheetId);

      // Update existing tasks and create new ones
      for (let rowIdx = 1; rowIdx < sheetData.length; rowIdx++) {
        const row = sheetData[rowIdx];
        const taskName = row?.[1];

        if (!taskName || !String(taskName).trim()) continue;

        const existingMapping = mappings.find(m => m.row_index === rowIdx);
        
        const taskData = {
          wbs: String(row?.[0] || `${rowIdx}`),
          name: String(taskName),
          type: parseType(row?.[2]),
          status: parseStatus(row?.[3]),
          priority: parsePriority(row?.[4]),
          start_date: parseDate(row?.[5]) || new Date().toISOString().split('T')[0],
          end_date: parseDate(row?.[6]) || new Date().toISOString().split('T')[0],
          duration: parseInt(String(row?.[7] || '1'), 10) || 1,
          progress: Math.min(100, Math.max(0, parseInt(String(row?.[8] || '0'), 10) || 0)),
          is_critical: String(row?.[10]).toLowerCase() === 'yes',
          notes: String(row?.[11] || ''),
        };

        if (existingMapping) {
          // Update existing task
          await supabase
            .from('tasks')
            .update(taskData)
            .eq('id', existingMapping.task_id);
        } else {
          // Create new task
          const { data: newTask, error } = await supabase
            .from('tasks')
            .insert({
              ...taskData,
              project_id: linkInfo.linked_project_id,
              sort_order: rowIdx,
              level: 0,
            })
            .select()
            .single();

          if (!error && newTask) {
            await supabase
              .from('spreadsheet_task_mappings')
              .insert({
                spreadsheet_id: spreadsheetId,
                sheet_id: sheetId,
                task_id: newTask.id,
                row_index: rowIdx,
              });
          }
        }
      }

      await supabase
        .from('notebook_spreadsheets')
        .update({
          sync_status: 'synced',
          last_synced_at: new Date().toISOString(),
        })
        .eq('id', spreadsheetId);

      await fetchMappings();
      toast({ title: 'Synced', description: 'Changes synced to project plan' });
      return true;
    } catch (error) {
      console.error('Error syncing to project plan:', error);
      
      await supabase
        .from('notebook_spreadsheets')
        .update({ sync_status: 'error' })
        .eq('id', spreadsheetId);

      toast({ title: 'Sync Error', description: 'Failed to sync changes', variant: 'destructive' });
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [spreadsheetId, linkInfo, mappings, toast, fetchMappings]);

  // Sync from project plan to spreadsheet
  const syncToSpreadsheet = useCallback(async (sheetId: string) => {
    if (!spreadsheetId || !linkInfo?.linked_project_id) return null;

    try {
      setIsSyncing(true);

      await supabase
        .from('notebook_spreadsheets')
        .update({ sync_status: 'syncing' })
        .eq('id', spreadsheetId);

      // Fetch all tasks for the project
      const { data: tasks, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', linkInfo.linked_project_id)
        .order('sort_order', { ascending: true });

      if (taskError) throw taskError;

      // Build new spreadsheet data
      const headerRow = PROJECT_PLAN_COLUMNS.map(c => c.header);
      const newData: any[][] = [headerRow];

      const newMappings: any[] = [];

      tasks?.forEach((task, idx) => {
        const rowIdx = idx + 1;
        newData[rowIdx] = [
          task.wbs,
          task.name,
          task.type,
          task.status,
          task.priority,
          task.start_date,
          task.end_date,
          task.duration,
          task.progress,
          task.assignee_id || '',
          task.is_critical ? 'Yes' : 'No',
          task.notes || '',
        ];

        newMappings.push({
          spreadsheet_id: spreadsheetId,
          sheet_id: sheetId,
          task_id: task.id,
          row_index: rowIdx,
        });
      });

      // Ensure minimum rows
      while (newData.length < 100) {
        newData.push(Array(12).fill(''));
      }

      // Clear old mappings and insert new ones
      await supabase
        .from('spreadsheet_task_mappings')
        .delete()
        .eq('spreadsheet_id', spreadsheetId);

      if (newMappings.length > 0) {
        await supabase
          .from('spreadsheet_task_mappings')
          .insert(newMappings);
      }

      // Update sheet
      await supabase
        .from('spreadsheet_sheets')
        .update({ data: newData })
        .eq('id', sheetId);

      await supabase
        .from('notebook_spreadsheets')
        .update({
          sync_status: 'synced',
          last_synced_at: new Date().toISOString(),
        })
        .eq('id', spreadsheetId);

      await fetchMappings();
      toast({ title: 'Synced', description: 'Spreadsheet updated from project plan' });
      return newData;
    } catch (error) {
      console.error('Error syncing to spreadsheet:', error);
      
      await supabase
        .from('notebook_spreadsheets')
        .update({ sync_status: 'error' })
        .eq('id', spreadsheetId);

      toast({ title: 'Sync Error', description: 'Failed to sync from project', variant: 'destructive' });
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, [spreadsheetId, linkInfo, toast, fetchMappings]);

  // Unlink from project plan
  const unlinkFromProjectPlan = useCallback(async () => {
    if (!spreadsheetId) return false;

    try {
      // Remove mappings
      await supabase
        .from('spreadsheet_task_mappings')
        .delete()
        .eq('spreadsheet_id', spreadsheetId);

      // Clear link info
      await supabase
        .from('notebook_spreadsheets')
        .update({
          linked_project_id: null,
          linked_at: null,
          last_synced_at: null,
          sync_status: 'synced',
          sync_direction: 'both',
        })
        .eq('id', spreadsheetId);

      setLinkInfo(null);
      setMappings([]);
      toast({ title: 'Unlinked', description: 'Spreadsheet unlinked from project plan' });
      return true;
    } catch (error) {
      console.error('Error unlinking:', error);
      toast({ title: 'Error', description: 'Failed to unlink spreadsheet', variant: 'destructive' });
      return false;
    }
  }, [spreadsheetId, toast]);

  // Debounced sync for real-time updates
  const debouncedSync = useCallback((sheetId: string, sheetData: any[][]) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      syncToProjectPlan(sheetId, sheetData);
    }, 500);
  }, [syncToProjectPlan]);

  // Initial fetch
  useEffect(() => {
    fetchLinkInfo();
    fetchMappings();
  }, [fetchLinkInfo, fetchMappings]);

  // Subscribe to task changes for linked project
  useEffect(() => {
    if (!linkInfo?.linked_project_id || !spreadsheetId) return;

    const channel = supabase
      .channel(`linked-tasks-${spreadsheetId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `project_id=eq.${linkInfo.linked_project_id}`,
        },
        () => {
          fetchMappings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [linkInfo?.linked_project_id, spreadsheetId, fetchMappings]);

  return {
    linkInfo,
    mappings,
    isSyncing,
    isLinked: !!linkInfo?.linked_project_id,
    convertToProjectPlan,
    syncToProjectPlan,
    syncToSpreadsheet,
    unlinkFromProjectPlan,
    debouncedSync,
    refetch: () => {
      fetchLinkInfo();
      fetchMappings();
    },
  };
}

// Helper functions
function parseType(value: any): 'task' | 'milestone' | 'summary' {
  const v = String(value || '').toLowerCase();
  if (v === 'milestone') return 'milestone';
  if (v === 'summary') return 'summary';
  return 'task';
}

function parseStatus(value: any): 'not-started' | 'in-progress' | 'completed' | 'blocked' | 'on-hold' {
  const v = String(value || '').toLowerCase().replace(/\s+/g, '-');
  if (['in-progress', 'completed', 'blocked', 'on-hold'].includes(v)) {
    return v as any;
  }
  return 'not-started';
}

function parsePriority(value: any): 'critical' | 'high' | 'medium' | 'low' {
  const v = String(value || '').toLowerCase();
  if (['critical', 'high', 'medium', 'low'].includes(v)) {
    return v as any;
  }
  return 'medium';
}

function parseDate(value: any): string | null {
  if (!value) return null;
  const str = String(value);
  
  // Try parsing various formats
  const date = new Date(str);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  
  // Try DD/MM/YYYY format
  const parts = str.split(/[\/\-]/);
  if (parts.length === 3) {
    const [d, m, y] = parts;
    const parsed = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  }
  
  return null;
}
