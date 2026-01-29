

# Implementation Plan: Backend Wiring and PDF Export

This plan covers five major implementation areas for ProjectOye:
1. PDF Export functionality for Reports, EVM, and Final Report views
2. Backlog and Sprint Board database wiring  
3. Risk Register database wiring
4. Actions View database wiring with SLA tracking
5. Issues Register database wiring

---

## Overview

### Current State Analysis
- **PDF Export**: The `PDFExporter` component exists and works using `html2canvas` and `jspdf`. Individual views have "Export PDF" buttons that currently show "coming soon" toasts or do nothing.
- **Backlog/Sprint Board**: Uses local React state with `mockBacklogItems`, `mockEpics`, and `mockSprintItems` from `mockData.ts`. No database tables exist.
- **Risks**: Uses `mockRisks` from `mockData.ts`. Only `meeting_risks` table exists (scoped to meetings). No standalone risk register table.
- **Actions**: Uses local `mockActions` array in `ActionsView.tsx`. Only `meeting_action_items` table exists. No standalone actions table with SLA tracking.
- **Issues**: Uses local `mockIssues` array in `IssuesRegisterView.tsx`. No database tables exist.

---

## Phase 1: PDF Export Implementation

### 1.1 EVM View PDF Export
Wire the existing "Export Report" button to generate a multi-page PDF capturing:
- Overview tab with S-curve charts
- Variance metrics cards
- WBS performance summary table

**Implementation:**
- Add a `contentRef` to wrap the main content area
- Integrate `PDFExporter` component with section-based export
- Add landscape orientation for charts

### 1.2 Final Report View PDF Export  
Wire the "Export PDF" button to generate a comprehensive project closure report:
- Executive Summary
- Objectives Achievement table
- Financial Summary
- Deliverables Status
- Team Recognition

**Implementation:**
- Add refs for each tab content section
- Use `PDFExporter` with section picker dialog
- Style optimization for print (hide interactive elements)

### 1.3 Reports View Enhancement
The Reports view already has `PDFExporter` integrated. Enhancement needed:
- Wire individual report cards' "Export" action to generate actual PDF content
- Generate dynamic report content based on report type

---

## Phase 2: Backlog and Sprint Board Wiring

### 2.1 Database Schema
Create three new tables:

```text
┌──────────────────────┐
│       epics          │
├──────────────────────┤
│ id (uuid, PK)        │
│ project_id (FK)      │
│ name                 │
│ color                │
│ description          │
│ progress             │
│ total_points         │
│ completed_points     │
│ sort_order           │
│ created_at           │
│ updated_at           │
└──────────────────────┘

┌──────────────────────┐
│   backlog_items      │
├──────────────────────┤
│ id (uuid, PK)        │
│ project_id (FK)      │
│ epic_id (FK, null)   │
│ sprint_id (FK, null) │
│ title                │
│ description          │
│ type (enum)          │
│ priority (enum)      │
│ story_points         │
│ assignee_id          │
│ assignee_name        │
│ labels (jsonb)       │
│ status (enum)        │
│ sort_order           │
│ created_at           │
│ updated_at           │
└──────────────────────┘

┌──────────────────────┐
│      sprints         │
├──────────────────────┤
│ id (uuid, PK)        │
│ project_id (FK)      │
│ name                 │
│ start_date           │
│ end_date             │
│ goal                 │
│ velocity             │
│ capacity             │
│ status (enum)        │
│ created_at           │
│ updated_at           │
└──────────────────────┘
```

### 2.2 Custom Hooks
- `useEpics.ts`: CRUD operations for epics with real-time subscriptions
- `useBacklogItems.ts`: Backlog item management with drag-drop reordering
- `useSprints.ts`: Sprint management with velocity tracking

### 2.3 View Updates
- **BacklogView.tsx**: Replace `mockBacklogItems` and `mockEpics` with hooks
- **SprintBoardView.tsx**: Replace `mockSprintItems` and `mockSprint` with hooks
- Add item status updates on column drag-drop

---

## Phase 3: Risk Register Wiring

### 3.1 Database Schema
Create standalone risk register table:

```text
┌──────────────────────────┐
│        risks             │
├──────────────────────────┤
│ id (uuid, PK)            │
│ project_id (FK)          │
│ title                    │
│ description              │
│ category                 │
│ probability (enum)       │
│ impact (enum)            │
│ status (enum)            │
│ owner_id                 │
│ owner_name               │
│ mitigation_plan          │
│ contingency_plan         │
│ triggers                 │
│ linked_items (jsonb)     │
│ due_date                 │
│ created_at               │
│ updated_at               │
│ closed_at                │
└──────────────────────────┘
```

### 3.2 Custom Hook
- `useRisks.ts`: 
  - Full CRUD for risk items
  - Filtering by status, probability, impact
  - Real-time subscription for multi-user updates
  - Risk score calculation

### 3.3 View Updates
- **RisksView.tsx**: 
  - Replace `mockRisks` with `useRisks` hook
  - Wire "Add Risk" button to create dialog
  - Add risk detail panel with edit capability
  - Wire risk matrix to show database risks
  - Add status transition actions

---

## Phase 4: Actions View Wiring with SLA Tracking

### 4.1 Database Schema
Create actions table with SLA support:

```text
┌──────────────────────────┐
│       actions            │
├──────────────────────────┤
│ id (uuid, PK)            │
│ project_id (FK)          │
│ title                    │
│ description              │
│ priority (enum)          │
│ status (enum)            │
│ owner_id                 │
│ owner_name               │
│ created_by_id            │
│ created_by_name          │
│ due_date                 │
│ completed_at             │
│ progress (int)           │
│ notes                    │
│ source_type (enum)       │
│ source_id                │
│ source_title             │
│ linked_items (jsonb)     │
│ dependencies (jsonb)     │
│ blocked_by               │
│ tags (jsonb)             │
│ sla_target_hours         │
│ sla_started_at           │
│ sla_breached             │
│ sla_breached_at          │
│ history (jsonb)          │
│ created_at               │
│ updated_at               │
└──────────────────────────┘
```

### 4.2 SLA Monitoring
- Add database trigger to automatically mark `sla_breached = true` when target exceeded
- Create Edge Function `check-sla-breaches` to run periodically and update breach status
- Real-time subscription for SLA timer updates in UI

### 4.3 Custom Hook  
- `useActions.ts`:
  - Full CRUD with optimistic updates
  - Filter by status, priority, owner, SLA status
  - Create action from issue/meeting/decision source
  - Update progress and status
  - History tracking for audit trail

### 4.4 View Updates
- **ActionsView.tsx**:
  - Replace `mockActions` with `useActions` hook
  - Wire all filter tabs (All, My Actions, SLA Breached)
  - Connect owner filter dropdown
  - Wire detail panel status changes
  - Add "Create Action" dialog

---

## Phase 5: Issues Register Wiring

### 5.1 Database Schema
Create issues table:

```text
┌──────────────────────────┐
│        issues            │
├──────────────────────────┤
│ id (uuid, PK)            │
│ project_id (FK)          │
│ title                    │
│ description              │
│ type (enum)              │
│ severity (enum)          │
│ priority (enum)          │
│ status (enum)            │
│ reporter_id              │
│ reporter_name            │
│ assignee_id              │
│ assignee_name            │
│ sla_target_resolution    │
│ sla_breached             │
│ linked_items (jsonb)     │
│ affected_areas (jsonb)   │
│ tags (jsonb)             │
│ root_cause               │
│ resolution               │
│ comments (jsonb)         │
│ history (jsonb)          │
│ created_at               │
│ updated_at               │
│ resolved_at              │
│ closed_at                │
└──────────────────────────┘
```

### 5.2 Custom Hook
- `useIssues.ts`:
  - Full CRUD operations
  - Status transition with history logging
  - Comment management
  - Link to related actions/risks/meetings
  - SLA monitoring integration
  - Filter by severity, priority, status

### 5.3 View Updates
- **IssuesRegisterView.tsx**:
  - Replace `mockIssues` with `useIssues` hook
  - Wire "Add Issue" button
  - Connect all filter tabs
  - Wire detail panel with status changes
  - Add "Create Action from Issue" functionality
  - Enable comments section

---

## Implementation Order

1. **Database Migrations** (single migration with all tables and RLS policies)
2. **Custom Hooks** (create all hooks with Supabase integration)
3. **PDF Export** (EVMView, FinalReportView, ReportsView)
4. **Risks View** wiring
5. **Issues Register** wiring  
6. **Actions View** wiring (includes SLA trigger)
7. **Backlog/Sprint** wiring (most complex due to drag-drop state)

---

## Technical Details

### RLS Policies
All new tables will have Row Level Security enabled with policies:
- SELECT: Users can read all records in projects they have access to
- INSERT/UPDATE/DELETE: Users with appropriate project roles

### Realtime Subscriptions
Enable realtime for collaborative editing:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.risks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.issues;
ALTER PUBLICATION supabase_realtime ADD TABLE public.actions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.backlog_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sprints;
```

### Files to Create
- `src/hooks/useRisks.ts`
- `src/hooks/useIssues.ts`  
- `src/hooks/useActions.ts`
- `src/hooks/useEpics.ts`
- `src/hooks/useBacklogItems.ts`
- `src/hooks/useSprints.ts`

### Files to Modify
- `src/components/views/RisksView.tsx`
- `src/components/views/IssuesRegisterView.tsx`
- `src/components/views/ActionsView.tsx`
- `src/components/views/BacklogView.tsx`
- `src/components/views/SprintBoardView.tsx`
- `src/components/views/EVMView.tsx`
- `src/components/views/FinalReportView.tsx`
- `src/components/views/ReportsView.tsx`

