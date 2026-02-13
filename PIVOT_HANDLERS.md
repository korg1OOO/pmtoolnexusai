// Pivot Table Handlers for SpreadsheetEditor.tsx
// Add these after the chart handlers

const handleCreatePivot = useCallback(async (config: PivotTableConfig) => {
  if (!activeSheet || !localData) return;

  // Generate pivot data
  const data = PivotTableEngine.generate(localData, config);
  
  // Update state
  const newPivots = [...pivotTables, config];
  setPivotTables(newPivots);
  
  const newPivotData = new Map(pivotData);
  newPivotData.set(config.id, data);
  setPivotData(newPivotData);

  // Save to database
  await updateSheet(activeSheet.id, {
    pivot_tables: newPivots,
  });
}, [pivotTables, pivotData, activeSheet, localData, updateSheet]);

const handleUpdatePivot = useCallback(async (pivotId: string, updates: Partial<PivotTableConfig>) => {
  const newPivots = pivotTables.map(p =>
    p.id === pivotId ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
  );
  setPivotTables(newPivots);

  if (activeSheet) {
    await updateSheet(activeSheet.id, {
      pivot_tables: newPivots,
    });
  }
}, [pivotTables, activeSheet, updateSheet]);

const handleDeletePivot = useCallback(async (pivotId: string) => {
  const newPivots = pivotTables.filter(p => p.id !== pivotId);
  setPivotTables(newPivots);

  const newPivotData = new Map(pivotData);
  newPivotData.delete(pivotId);
  setPivotData(newPivotData);

  if (activeSheet) {
    await updateSheet(activeSheet.id, {
      pivot_tables: newPivots,
    });
  }
}, [pivotTables, pivotData, activeSheet, updateSheet]);

const handleRefreshPivot = useCallback((pivotId: string) => {
  if (!localData) return;

  const pivot = pivotTables.find(p => p.id === pivotId);
  if (!pivot) return;

  const data = PivotTableEngine.generate(localData, pivot);
  
  const newPivotData = new Map(pivotData);
  newPivotData.set(pivotId, data);
  setPivotData(newPivotData);
}, [pivotTables, localData, pivotData]);

// Add pivot button handler to toolbar
const handleCreatePivotClick = () => {
  if (!selection) {
    toast({
      title: 'Select a range',
      description: 'Please select a data range to create a pivot table',
      variant: 'destructive',
    });
    return;
  }
  
  setShowPivotDialog(true);
};
