

# Microsoft Project Feature Enhancement Plan

## Overview

This plan adds enterprise-grade MS Project features to the existing Project Plan and Gantt Chart, building on the current database-backed implementation.

---

## Current State Analysis

### Already Implemented
- Hierarchical WBS task structure with parent/child relationships
- Four dependency types (FS, SS, FF, SF) with lag support
- Baseline management (project and task level)
- Drag-to-reschedule Gantt bars
- Real-time sync via Supabase subscriptions
- Inline editing, keyboard navigation
- Critical path flag (manual)

### Missing MS Project Features
1. **Resource Management** - No resources table, assignments, or leveling
2. **Calendar System** - No working calendars, holidays, or non-working time
3. **Critical Path Algorithm** - Manual flag only, no automatic calculation
4. **Constraint Types** - No "Must Start On", "No Earlier Than", etc.
5. **Slack/Float Calculation** - No early/late start-finish dates
6. **Auto-Scheduling** - No automatic date recalculation on changes
7. **Cost Management** - Tasks have no cost fields
8. **Work vs Duration** - No effort-driven scheduling
9. **Percent Work Complete** - Only percent complete, no work tracking
10. **Multiple Baselines** - Baseline system exists but UI limited
11. **Predecessor Column** - No visual predecessor editing in grid
12. **Resource Histogram** - No workload visualization

---

## Implementation Plan

### Phase 1: Database Schema Enhancements

Add new tables and columns to support MS Project features:

**New Tables:**
```
resources
- id, project_id, name, email
- type (work/material/cost)
- max_units (100% = 1.0)
- standard_rate, overtime_rate
- calendar_id, created_at

resource_assignments
- id, task_id, resource_id
- units (percent allocation)
- work_hours, actual_work
- start_date, end_date
- cost, created_at

project_calendars
- id, project_id, name, is_default
- working_days (jsonb: {mon: true...})
- work_hours (jsonb: {start: "09:00", end: "17:00"})

calendar_exceptions
- id, calendar_id, name
- exception_type (holiday/working)
- start_date, end_date
- work_hours (jsonb, null for non-working)
```

**Task Table Additions:**
- constraint_type (enum: ASAP, ALAP, MustStartOn, MustFinishOn, etc.)
- constraint_date
- work_hours (effort in hours)
- actual_work_hours
- remaining_work
- cost, actual_cost
- fixed_cost, fixed_cost_accrual
- early_start, early_finish
- late_start, late_finish
- free_slack, total_slack
- effort_driven (boolean)

---

### Phase 2: Critical Path Calculation Engine

Create a server-side function for CPM (Critical Path Method):

```
calculate_critical_path(project_id)
├── Build dependency graph
├── Forward pass (calculate Early Start/Finish)
├── Backward pass (calculate Late Start/Finish)
├── Calculate Total Slack = Late Start - Early Start
├── Mark tasks with Slack = 0 as critical
└── Return updated task data
```

**Implementation approach:**
- Edge function or database function
- Triggered on task/dependency changes
- Updates is_critical, early_start, late_start, etc.
- Respects calendar exceptions

---

### Phase 3: Enhanced Task Grid (MS Project Style)

New columns for the DatabaseTaskGrid:

| Column | Feature |
|--------|---------|
| Predecessors | Editable, format: "3FS+2d, 5SS" |
| Successors | Display only, auto-calculated |
| Resource Names | Multi-select dropdown |
| Work | Effort in hours, editable |
| Constraint | Type + Date selector |
| Deadline | Warning indicator |
| Free Slack | Days display |
| Total Slack | Days display |
| Cost | Calculated from resources + fixed |
| Baseline Start | From saved baseline |
| Baseline Finish | From saved baseline |
| Variance | Finish - Baseline Finish |

**Additional Grid Features:**
- Column resizing and reordering
- Column visibility toggle dialog
- Split view (grid + details pane)
- Task Information dialog (all fields)
- Copy/Paste tasks
- Task Notes panel

---

### Phase 4: Resource Management Views

**Resource Sheet:**
- List all resources with rates
- Availability calendar
- Assignments overview

**Resource Usage View:**
- Time-phased work by resource
- Over-allocation highlighting (red)
- Workload histogram

**Task Usage View:**
- Time-phased work by task
- Resource breakdown per task

**Resource Leveling:**
- Auto-level algorithm
- Priority-based leveling
- Level selected resources only

---

### Phase 5: Enhanced Gantt Chart

New Gantt features:

**Visual Elements:**
- Deadline markers (green down arrow)
- Constraint indicators
- Slack bars (thin gray extensions)
- Baseline bars (gray behind actual)
- Progress lines (serpentine through timeline)

**Interactions:**
- Link tasks by dragging (visual dependency creation)
- Double-click to open Task Information
- Right-click context menu
- Zoom to fit / zoom to selection
- Scroll to task button

**Timeline Enhancements:**
- Non-working time shading
- Today line with date
- Status date line
- Gridline customization

---

### Phase 6: Calendar Management

**Project Calendar Dialog:**
- Set working hours (e.g., 9AM-5PM)
- Select working days (Mon-Fri)
- Add holidays/exceptions
- Copy calendar from template

**Resource Calendar:**
- Inherit from project or custom
- Personal exceptions (vacation)
- Part-time schedules

**Duration Calculation:**
- Account for non-working days
- Work hours to duration conversion

---

### Phase 7: Auto-Scheduling Engine

When enabled, changes trigger automatic recalculation:

```
Task date changes → Update successors
Dependency changes → Recalculate chain
Resource assignment → Recalculate work/duration
Calendar changes → Recalculate all tasks
```

**Scheduling Modes:**
- Auto-schedule (default)
- Manually scheduled (fixed dates)
- Per-task toggle

---

### Phase 8: Baseline & Tracking

**Multiple Baselines:**
- Save up to 10 baselines
- Clear baseline function
- Compare any two baselines

**Tracking Table View:**
- Actual Start/Finish
- Remaining Duration
- Percent Complete
- Physical % Complete (separate from duration %)

**Variance Analysis:**
- Start Variance
- Finish Variance
- Work Variance
- Cost Variance

---

## Technical Implementation Details

### Database Migration SQL (Summary)

```sql
-- New enums
CREATE TYPE constraint_type AS ENUM ('ASAP', 'ALAP', 'MSO', 'MFO', 'SNET', 'SNLT', 'FNET', 'FNLT');
CREATE TYPE resource_type AS ENUM ('work', 'material', 'cost');

-- Resources table
CREATE TABLE resources (...);

-- Resource assignments
CREATE TABLE resource_assignments (...);

-- Project calendars
CREATE TABLE project_calendars (...);

-- Calendar exceptions
CREATE TABLE calendar_exceptions (...);

-- Add columns to tasks
ALTER TABLE tasks ADD COLUMN constraint_type constraint_type DEFAULT 'ASAP';
ALTER TABLE tasks ADD COLUMN constraint_date date;
ALTER TABLE tasks ADD COLUMN work_hours numeric DEFAULT 0;
ALTER TABLE tasks ADD COLUMN early_start date;
ALTER TABLE tasks ADD COLUMN late_finish date;
ALTER TABLE tasks ADD COLUMN total_slack integer;
-- ... more columns
```

### New React Components

```
src/components/planning/
├── MSProjectGrid.tsx          # Enhanced grid with all columns
├── ResourceSheet.tsx          # Resource management
├── ResourceUsageView.tsx      # Time-phased workload
├── TaskInformationDialog.tsx  # Full task editor
├── DependencyEditor.tsx       # Visual link editing
├── CalendarDialog.tsx         # Working time setup
├── BaselineManager.tsx        # Multi-baseline controls
└── CriticalPathEngine.ts      # CPM algorithm

src/hooks/
├── useResources.ts            # Resource CRUD
├── useResourceAssignments.ts  # Assignment management
├── useCalendars.ts            # Calendar operations
├── useCriticalPath.ts         # CPM calculation trigger
└── useAutoSchedule.ts         # Auto-scheduling logic
```

### Edge Functions

```
supabase/functions/
├── calculate-critical-path/   # CPM calculation
├── auto-schedule/             # Scheduling engine
├── level-resources/           # Resource leveling
└── recalculate-dates/         # Calendar-aware dates
```

---

## Implementation Priority

| Priority | Feature | Effort | Status |
|----------|---------|--------|--------|
| 1 | Critical Path Algorithm | High | ✅ Done |
| 2 | Predecessor Column in Grid | Medium | ✅ Done |
| 3 | Resource Table + Assignments | High | ✅ Done |
| 4 | Constraint Types | Medium | ✅ Done |
| 5 | Slack/Float Display | Low | ✅ Done |
| 6 | Project Calendar | Medium | ✅ Done |
| 7 | Resource Histogram | High | 🔲 Pending |
| 8 | Auto-Scheduling | High | 🔲 Pending |
| 9 | Multiple Baselines UI | Low | 🔲 Pending |
| 10 | Variance Columns | Low | 🔲 Pending |

---

## Summary

This enhancement transforms the Project Plan into a true MS Project alternative with:

- **Full scheduling engine** with CPM critical path
- **Resource management** with leveling
- **Calendar system** for working time
- **Constraint types** for complex scheduling
- **Baseline tracking** with variance analysis

All features will be database-backed with real-time sync, maintaining the existing Supabase architecture.

