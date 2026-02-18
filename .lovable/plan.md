

# Fix Build Errors and Seed Sample Data

## Part 1: Fix Build Errors (10 errors)

### Error Group A: `@/lib/supabase` module not found (5 files)
The following files import from `@/lib/supabase` which doesn't exist. The correct import is `@/integrations/supabase/client`:
- `src/hooks/useCursor.ts` (line 7)
- `src/hooks/useCustomEvents.ts` (line 7)
- `src/hooks/useOfflineSync.ts` (line 8)
- `src/hooks/useRecordLock.ts` (line 7)
- `src/services/filterPresetService.ts` (line 6)
- `src/services/realtimeService.ts` (line 6)

**Fix**: Replace `import { supabase } from '@/lib/supabase'` with `import { supabase } from '@/integrations/supabase/client'` in all 6 files.

### Error Group B: `useProject` not exported from ProjectContext
`src/components/collaboration/ActiveUsers.tsx` imports `useProject` but the context only exports `useProjectContext`.

**Fix**: Change import to `useProjectContext` and update usage: `const { settings: currentProject } = useProjectContext()` then use `currentProject.id`.

### Error Group C: Duplicate `FilterPreset` type with conflicting `filters` property
`src/types/analytics.ts` has TWO `FilterPreset` interfaces -- one at line 216 with `filters: FilterConfig` and another at line 566 with `filters: FilterState`. TypeScript merges them and finds a conflict.

**Fix**: Remove the duplicate `FilterPreset` at lines 566-575 (keep the one at line 216). Update `filterPresetService.ts` to use `FilterConfig` instead of `FilterState` for the `filters` parameter, or adjust the first `FilterPreset` to use `FilterState`. The simpler fix: remove the second duplicate and update `filterPresetService.ts` to accept `FilterConfig`.

### Error Group D: `useCustomEvents.ts` type error
Line 50 uses `event` (the DOM event variable name) which shadows the `CustomEvent` type. The `subscribe` callback references `event` from the outer scope incorrectly.

**Fix**: The `subscribe` function body has a bug -- it pushes a DOM `event` into the array. Fix by removing the broken `setEvents` call inside `subscribe` (the actual event handling happens in the `useEffect` broadcast listener).

---

## Part 2: Seed Sample Data

Insert realistic sample data across all major tables so dashboards, reports, and views load with content. All data will be inserted via the database insert tool.

### Seed Order (respecting foreign keys):

1. **Tenant** (1 record): "Acme Corporation" with slug "acme-corp"
2. **Workspaces** (2 records): "Engineering", "Operations" linked to tenant
3. **Departments** (3 records): "Software Development", "QA", "DevOps" linked to tenant
4. **Licenses** (2 records): "Enterprise Suite", "Developer Tools" linked to tenant
5. **Portfolios** (2 records): "Digital Transformation", "Product Innovation" linked to workspace
6. **Programs** (3 records): "Cloud Migration", "Mobile Platform", "API Modernization" linked to portfolios and workspace
7. **Projects** (3 records): Update existing project + add 2 more linked to workspace/tenant/programs
8. **Resources** (4 records): Team members linked to projects
9. **Tasks** (add more to existing project + new projects)
10. **Risks** (4 records): Linked to projects
11. **Issues** (3 records): Linked to projects
12. **Decisions** (3 records): Linked to projects
13. **Actions** (3 records): Linked to projects
14. **Meetings** (2 records): Linked to projects
15. **Stakeholders** (4 records): Linked to projects
16. **Notifications** (3 records): System notifications
17. **Timeline activities** (5 records): Recent activity feed entries

---

## Technical Details

### Files to modify:
1. `src/hooks/useCursor.ts` -- fix import
2. `src/hooks/useCustomEvents.ts` -- fix import + type error
3. `src/hooks/useOfflineSync.ts` -- fix import
4. `src/hooks/useRecordLock.ts` -- fix import
5. `src/services/filterPresetService.ts` -- fix import + type alignment
6. `src/services/realtimeService.ts` -- fix import
7. `src/components/collaboration/ActiveUsers.tsx` -- fix useProject import
8. `src/types/analytics.ts` -- remove duplicate FilterPreset

### Database inserts (no schema changes):
- ~50 sample records across 17+ tables
- All UUIDs generated via `gen_random_uuid()`
- Dates relative to current date for realistic timeline data
- Projects with varied statuses (active, planning, on-hold)
- Risks with mixed probability/impact levels
- Financial data with budgets and actual costs

