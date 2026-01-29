
# Spreadsheet to Project Plan Conversion & Bi-directional Sync

## Overview
This feature allows users to convert a spreadsheet into a linked Project Plan, creating a powerful bi-directional sync between tabular data entry and the formal project scheduling system. Once linked, edits in either view automatically propagate to the other.

## Visual Design

### Linked Spreadsheet Indicators
- **Blue-tinted grid cells**: All data cells in a linked spreadsheet will have a subtle blue background (`#eff6ff` / light blue) to distinguish them from regular spreadsheets
- **Special icon in sidebar**: The sidebar will display a linked icon (Table2 with a small link badge) instead of the standard spreadsheet icon
- **Sync status indicator**: A sync button/badge in the toolbar showing last sync time and status
- **Locked sheet tabs**: "Add Sheet" button will be disabled; existing sheets cannot be deleted

### Project Plan Column Mapping
When converted, the spreadsheet will automatically populate with these columns:

| Column | Header | Description |
|--------|--------|-------------|
| A | WBS | Work Breakdown Structure code |
| B | Task Name | Name of the task |
| C | Type | task / milestone / summary |
| D | Status | not-started / in-progress / completed / blocked / on-hold |
| E | Priority | critical / high / medium / low |
| F | Start Date | Task start date |
| G | End Date | Task end date |
| H | Duration | Calculated duration in days |
| I | Progress | 0-100% completion |
| J | Assignee | Resource name |
| K | Critical | Yes/No if on critical path |
| L | Notes | Task notes |

---

## Technical Implementation

### Phase 1: Database Schema Extension

**New columns for `notebook_spreadsheets` table:**
```text
linked_project_id     UUID (nullable, FK to projects)
linked_at             TIMESTAMP (when linking occurred)
last_synced_at        TIMESTAMP (last successful sync)
sync_status           TEXT ('synced' | 'syncing' | 'error')
sync_direction        TEXT ('spreadsheet' | 'project' | 'both')
```

**New table `spreadsheet_task_mappings`:**
```text
id                    UUID PRIMARY KEY
spreadsheet_id        UUID FK to notebook_spreadsheets
sheet_id              UUID FK to spreadsheet_sheets
task_id               UUID FK to tasks
row_index             INTEGER (0-based row in spreadsheet)
created_at            TIMESTAMP
```

This mapping table enables tracking which spreadsheet row corresponds to which task.

### Phase 2: Hook & State Management

**New hook: `useLinkedSpreadsheet`**
- Manages the link between spreadsheet and project plan
- Provides methods:
  - `convertToProjectPlan()`: Creates tasks from spreadsheet data
  - `syncToSpreadsheet()`: Pulls task changes into spreadsheet
  - `syncToProjectPlan()`: Pushes spreadsheet changes to tasks
  - `unlinkFromProjectPlan()`: Removes the link (keeps data in both)
- Subscribes to realtime changes on both `tasks` and `spreadsheet_sheets` tables
- Implements conflict detection and resolution

### Phase 3: UI Components

**A. Conversion Dialog (`ConvertToProjectPlanDialog.tsx`)**
- Triggered from spreadsheet toolbar/menu
- Options:
  - Create new project or link to existing
  - Column mapping preview
  - Confirmation of data parsing

**B. Enhanced SpreadsheetEditor**
- Detect `linked_project_id` and render blue-tinted cells
- Add sync button to toolbar when linked
- Show sync status indicator (last synced time, error states)
- Disable "Add Sheet" and sheet deletion for linked spreadsheets
- Add visual lock icon on sheet tabs

**C. Enhanced NotebookSidebar**
- New icon variant for linked spreadsheets:
  - Use `Table2` with a small blue link overlay badge
  - Tooltip shows "Linked to Project Plan"

**D. Sync Status Component**
- Shows sync direction arrows
- Displays last sync timestamp
- Manual sync trigger button
- Conflict resolution modal when needed

### Phase 4: Sync Logic

**Spreadsheet → Project Plan:**
1. Parse spreadsheet rows starting from row 2 (row 1 = headers)
2. For each row with data in column B (Task Name):
   - If row exists in `spreadsheet_task_mappings`: UPDATE task
   - If row is new: CREATE task and mapping
   - If row was deleted: Mark task as deleted or remove
3. Calculate WBS automatically based on hierarchy (blank cells in Name = child of previous)
4. Update `last_synced_at` timestamp

**Project Plan → Spreadsheet:**
1. Query all tasks for the linked project
2. Sort by `sort_order` (maintains hierarchy)
3. For each task:
   - Find corresponding row in mapping or add new row
   - Update cell values for all mapped columns
4. Apply blue cell formatting
5. Update `last_synced_at` timestamp

**Conflict Resolution:**
- Timestamp-based: Most recent change wins
- Option to show conflict dialog for major differences
- Preserve user's manual formatting choices

### Phase 5: Real-time Sync

**Supabase Subscriptions:**
- Subscribe to `tasks` changes for the linked project
- Subscribe to `spreadsheet_sheets` changes for the linked spreadsheet
- Debounce rapid changes (500ms) to prevent sync storms
- Queue changes and apply in batches

---

## User Workflow

### Converting a Spreadsheet to Project Plan:
1. User creates a spreadsheet and enters task data
2. User clicks "Convert to Project Plan" in toolbar
3. Dialog appears with options and preview
4. Upon confirmation:
   - Spreadsheet headers auto-populate if empty
   - Existing data maps to tasks
   - Grid turns blue-tinted
   - Sync button appears
   - Sidebar icon updates

### Working with Linked Spreadsheet:
1. Edit cells directly - changes sync to Project Plan
2. Use Gantt/Planning views - changes sync back to spreadsheet
3. Click Sync button to force immediate sync
4. View sync status for last updated time

---

## Files to Create/Modify

### New Files:
1. `src/hooks/useLinkedSpreadsheet.ts` - Main sync logic hook
2. `src/components/notes/spreadsheet/ConvertToProjectPlanDialog.tsx` - Conversion wizard
3. `src/components/notes/spreadsheet/SyncStatusIndicator.tsx` - Sync status display
4. `src/components/notes/spreadsheet/LinkedSpreadsheetIcon.tsx` - Special sidebar icon

### Modified Files:
1. `src/hooks/useSpreadsheets.ts` - Add linked fields to types
2. `src/components/notes/SpreadsheetEditor.tsx` - Blue tint, sync button, disable add sheet
3. `src/components/notes/NotebookSidebar.tsx` - Linked spreadsheet icon
4. `src/components/notes/spreadsheet/SpreadsheetToolbar.tsx` - Add convert/sync buttons
5. `supabase/migrations/` - New migration for schema changes

### Database Migration:
- Add columns to `notebook_spreadsheets`
- Create `spreadsheet_task_mappings` table
- Add RLS policies for new table

---

## Enhancement Suggestions

1. **Bulk Import Mode**: Allow pasting Excel data that auto-converts to Project Plan
2. **Template Columns**: Pre-built column templates for different methodologies (Agile, Waterfall)
3. **Dependency Editing**: Column for predecessor task references (e.g., "3FS+2d")
4. **Resource Integration**: Column linked to resources table for assignee dropdown
5. **Baseline Comparison**: Show baseline data in separate columns (grayed out)
6. **Version History**: Track sync history with rollback capability
7. **Export Options**: Export linked spreadsheet as .xlsx with formatting
8. **Validation Indicators**: Cell-level validation errors (red border for invalid dates, etc.)
9. **Auto-hierarchy Detection**: Detect parent/child relationships from indentation in Task Name
10. **Smart Date Parsing**: Parse various date formats and convert to standard format
