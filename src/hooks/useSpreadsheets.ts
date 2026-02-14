import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface NotebookSpreadsheet {
  id: string;
  notebook_id: string;
  section_id: string | null; // Optional section - null means notebook level
  name: string;
  color: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  // Linked project plan fields
  linked_project_id: string | null;
  linked_at: string | null;
  last_synced_at: string | null;
  sync_status: 'synced' | 'syncing' | 'error' | null;
  sync_direction: 'spreadsheet' | 'project' | 'both' | null;
}

export interface SpreadsheetSheet {
  id: string;
  spreadsheet_id: string;
  name: string;
  data: any[][]; // Array of rows, each row is an array of cell values
  column_widths: Record<string, number>;
  row_heights: Record<string, number>;
  frozen_rows: number;
  frozen_cols: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
  merged_cells?: Array<{
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
  }>;
  validation_rules?: any[]; // JSONB array of ValidationRule objects
  conditional_formats?: any[]; // JSONB array of ConditionalFormat objects
  charts?: any[]; // JSONB array of ChartConfig objects
}

export function useSpreadsheets(notebookId: string | null) {
  const [spreadsheets, setSpreadsheets] = useState<NotebookSpreadsheet[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const isValidUuid = (id: string | null | undefined): boolean => {
    if (!id) return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  const fetchSpreadsheets = async () => {
    if (!notebookId || !isValidUuid(notebookId)) {
      setSpreadsheets([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notebook_spreadsheets')
        .select('*')
        .eq('notebook_id', notebookId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      // Cast the data to our interface type
      setSpreadsheets((data || []) as unknown as NotebookSpreadsheet[]);
    } catch (error) {
      console.error('Error fetching spreadsheets:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSpreadsheet = async (name: string, color?: string) => {
    if (!notebookId || !isValidUuid(notebookId)) return null;

    try {
      const { data: spreadsheet, error } = await supabase
        .from('notebook_spreadsheets')
        .insert({
          notebook_id: notebookId,
          name,
          color,
          sort_order: spreadsheets.length,
        })
        .select()
        .single();

      if (error) throw error;

      // Create default first sheet
      await supabase
        .from('spreadsheet_sheets')
        .insert({
          spreadsheet_id: spreadsheet.id,
          name: 'Sheet 1',
          data: createEmptyGrid(20, 10),
          sort_order: 0,
        });

      toast({ title: 'Spreadsheet created' });
      return spreadsheet as unknown as NotebookSpreadsheet;
    } catch (error) {
      console.error('Error creating spreadsheet:', error);
      toast({ title: 'Error', description: 'Failed to create spreadsheet', variant: 'destructive' });
      return null;
    }
  };

  const updateSpreadsheet = async (id: string, updates: Partial<NotebookSpreadsheet>) => {
    try {
      const { error } = await supabase
        .from('notebook_spreadsheets')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating spreadsheet:', error);
      toast({ title: 'Error', description: 'Failed to update spreadsheet', variant: 'destructive' });
    }
  };

  const deleteSpreadsheet = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notebook_spreadsheets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Spreadsheet deleted' });
    } catch (error) {
      console.error('Error deleting spreadsheet:', error);
      toast({ title: 'Error', description: 'Failed to delete spreadsheet', variant: 'destructive' });
    }
  };

  const moveSpreadsheet = async (spreadsheetId: string, targetSectionId: string | null) => {
    try {
      const { error } = await supabase
        .from('notebook_spreadsheets')
        .update({ notebook_id: targetSectionId } as any)
        .eq('id', spreadsheetId);

      if (error) throw error;

      const message = targetSectionId
        ? 'Spreadsheet moved to section'
        : 'Spreadsheet moved to notebook level';
      toast({ title: message });
    } catch (error) {
      console.error('Error moving spreadsheet:', error);
      toast({ title: 'Error', description: 'Failed to move spreadsheet', variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchSpreadsheets();
  }, [notebookId]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!notebookId || !isValidUuid(notebookId)) return;

    const channel = supabase
      .channel(`spreadsheets-${notebookId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notebook_spreadsheets',
          filter: `notebook_id=eq.${notebookId}`,
        },
        () => {
          fetchSpreadsheets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [notebookId]);

  return {
    spreadsheets,
    loading,
    createSpreadsheet,
    updateSpreadsheet,
    deleteSpreadsheet,
    moveSpreadsheet,
    refetch: fetchSpreadsheets,
  };
}

export function useSheets(spreadsheetId: string | null) {
  const [sheets, setSheets] = useState<SpreadsheetSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const isValidUuid = (id: string | null | undefined): boolean => {
    if (!id) return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  const fetchSheets = async () => {
    if (!spreadsheetId || !isValidUuid(spreadsheetId)) {
      setSheets([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('spreadsheet_sheets')
        .select('*')
        .eq('spreadsheet_id', spreadsheetId)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      // Parse JSON data with proper typing
      const parsedData: SpreadsheetSheet[] = (data || []).map(sheet => ({
        id: sheet.id,
        spreadsheet_id: sheet.spreadsheet_id,
        name: sheet.name,
        data: Array.isArray(sheet.data) ? sheet.data as any[][] : [],
        column_widths: (typeof sheet.column_widths === 'object' && sheet.column_widths !== null && !Array.isArray(sheet.column_widths))
          ? sheet.column_widths as Record<string, number>
          : {},
        row_heights: (typeof sheet.row_heights === 'object' && sheet.row_heights !== null && !Array.isArray(sheet.row_heights))
          ? sheet.row_heights as Record<string, number>
          : {},
        frozen_rows: sheet.frozen_rows ?? 0,
        frozen_cols: sheet.frozen_cols ?? 0,
        sort_order: sheet.sort_order ?? 0,
        created_at: sheet.created_at,
        updated_at: sheet.updated_at,
      }));

      setSheets(parsedData);
    } catch (error) {
      console.error('Error fetching sheets:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSheet = async (name: string = 'New Sheet') => {
    if (!spreadsheetId || !isValidUuid(spreadsheetId)) return null;

    try {
      const { data, error } = await supabase
        .from('spreadsheet_sheets')
        .insert({
          spreadsheet_id: spreadsheetId,
          name,
          data: createEmptyGrid(20, 10),
          sort_order: sheets.length,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating sheet:', error);
      toast({ title: 'Error', description: 'Failed to create sheet', variant: 'destructive' });
      return null;
    }
  };

  const updateSheet = async (id: string, updates: Partial<SpreadsheetSheet>) => {
    try {
      const { error } = await supabase
        .from('spreadsheet_sheets')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating sheet:', error);
      toast({ title: 'Error', description: 'Failed to save sheet', variant: 'destructive' });
    }
  };

  const deleteSheet = async (id: string) => {
    if (sheets.length <= 1) {
      toast({ title: 'Cannot delete', description: 'Spreadsheet must have at least one sheet', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase
        .from('spreadsheet_sheets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Sheet deleted' });
    } catch (error) {
      console.error('Error deleting sheet:', error);
      toast({ title: 'Error', description: 'Failed to delete sheet', variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchSheets();
  }, [spreadsheetId]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!spreadsheetId || !isValidUuid(spreadsheetId)) return;

    const channel = supabase
      .channel(`sheets-${spreadsheetId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'spreadsheet_sheets',
          filter: `spreadsheet_id=eq.${spreadsheetId}`,
        },
        () => {
          fetchSheets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [spreadsheetId]);

  return {
    sheets,
    loading,
    createSheet,
    updateSheet,
    deleteSheet,
    refetch: fetchSheets,
  };
}

// Helper function to create an empty grid
function createEmptyGrid(rows: number, cols: number): any[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => '')
  );
}
