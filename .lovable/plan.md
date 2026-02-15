
# Application Readiness Report: Tenant, Workspace, Portfolio, Programs

## Current Status: Partially Working -- Key Navigation Issues Remain

### What IS Working

1. **Database layer**: All 15 previously missing tables now exist (`tenants`, `workspaces`, `workspace_members`, `departments`, `licenses`, `license_keys`, `discount_codes`, `team_members`, `project_members`, `project_custom_roles`, `workspace_budgets`, `workspace_resources`, `ai_provider_api_keys`, `spreadsheet_comments`, `workspace_teams`).

2. **RLS policies**: All new tables have Row Level Security policies correctly configured with tenant-based isolation.

3. **TenantContext**: The `TenantProvider` wraps the entire app in `App.tsx`, and `useTenant()` is used in `TenantDashboard`, `WorkspaceManagement`, `TenantSettings`, `TenantAnalytics`, `DepartmentManagement`, `LicenseAllocation`, and `TenantUserManagement` -- no more hardcoded tenant IDs.

4. **Routes registered**: All tenant (`/tenant/*`), workspace (`/workspace/:workspaceId/*`), portfolio (`/portfolio/:portfolioId/*`), and program (`/program/:programId/*`) routes are properly defined in `App.tsx`.

5. **Service layers**: `tenantService.ts` and `workspaceService.ts` are fully wired to the database with the `(supabase as any)` pattern.

---

### Issues That Will Prevent Full Functionality

#### Issue 1: Sidebar Navigation is Broken for Tenant/Workspace/Portfolio/Program Items (CRITICAL)

The sidebar items for tenant, workspace, portfolio, and program admin sections use `onItemClick(item.id)` which sets a `?view=` query parameter on the `/dashboard` page. However, these pages are **separate routes** (`/tenant`, `/workspace/:id`, etc.), not views within the dashboard's `renderView()` switch statement.

**What happens**: Clicking "Tenant Dashboard" in the sidebar sets `?view=tenant` on `/dashboard`, which falls through to the `default` case in `renderView()` and renders the main DashboardHub instead.

**Items affected**:
- `tenant`, `tenant/workspaces`, `tenant/users`, `tenant/departments`, `tenant/licenses`, `tenant/analytics`, `tenant/settings`
- `workspace/:id`, `workspace/:id/portfolios`, `workspace/:id/teams`, `workspace/:id/resources`, `workspace/:id/budget`, `workspace/:id/analytics`
- `portfolio/:id`, `portfolio/:id/resources`, `portfolio/:id/budget`, `portfolio/:id/roadmap`
- `program/:id/stakeholders`, `program/:id/resources`, `program/:id/budget`

**Fix**: The sidebar click handler needs to call `navigate('/' + item.id)` for these items instead of `onItemClick(item.id)`. The items with `:id` placeholders also need a way to resolve the actual workspace/portfolio/program ID.

#### Issue 2: WorkspaceDashboard Has Hardcoded Mock Data (MEDIUM)

`WorkspaceDashboard.tsx` fetches real metrics via `getWorkspaceOverview()`, but the Portfolios, Programs, Team Overview, and Activity Feed sections (lines 86-178) are entirely **hardcoded mock data**:
- "Digital Transformation", "Product Innovation", "Infrastructure Modernization" portfolios
- "Cloud Migration", "Mobile App Redesign", "API Platform" programs
- "Portfolio Managers: 3", "Program Managers: 8", "Project Managers: 24"
- 3 hardcoded activity items

#### Issue 3: Workspace/Portfolio/Program Sidebar Items Use `:id` Placeholder (HIGH)

The sidebar nav items use literal strings like `workspace/:id` as IDs. There is no mechanism to substitute the actual workspace, portfolio, or program ID. Users cannot navigate to these pages from the sidebar because:
- No workspace selector exists in the sidebar
- No portfolio/program selector exists
- The `:id` literal string would be passed as the route param

#### Issue 4: "Analytics" and "New Portfolio" Buttons in WorkspaceDashboard Are Unwired (LOW)

Lines 40-47 of `WorkspaceDashboard.tsx` have `<Button>` elements without `onClick` handlers -- they render but do nothing when clicked.

---

### What Needs to Be Fixed

#### Fix 1: Route-based Navigation for Admin Sidebar Items
Update the sidebar click handler to use `navigate()` for tenant/workspace/portfolio/program items instead of the view-based `onItemClick()`. For tenant items (which don't need a dynamic ID), this is straightforward: clicking "Tenant Dashboard" should navigate to `/tenant`.

#### Fix 2: Workspace/Portfolio/Program ID Resolution
Add a workspace selector (dropdown or context) so workspace admin items navigate to `/workspace/{actual-id}/...` rather than `/workspace/:id/...`. Same pattern for portfolio and program sections.

#### Fix 3: Replace WorkspaceDashboard Mock Data
Query real portfolios, programs, and team member counts from the database instead of hardcoded values.

#### Fix 4: Wire Unwired Buttons
Add `onClick` handlers to the Analytics and New Portfolio buttons in `WorkspaceDashboard`.

---

### Technical Implementation Details

**File changes needed:**

1. **`src/components/layout/Sidebar.tsx`** -- Modify `renderNavItem` click handler: detect items whose IDs start with `tenant/`, `workspace/`, `portfolio/`, or `program/` and use `navigate('/' + resolvedId)` instead of `onItemClick(item.id)`. For tenant items, this is direct. For workspace/portfolio/program items, read the selected ID from context or prompt the user to select one.

2. **`src/pages/Index.tsx`** -- No changes needed (tenant/workspace/portfolio/program pages are separate routes, not dashboard views).

3. **`src/components/workspace/WorkspaceDashboard.tsx`** -- Replace hardcoded portfolio/program/team/activity sections with queries to `portfolios`, `programs`, `workspace_members`, and `timeline_activities` tables filtered by `workspaceId`.

4. **`src/contexts/TenantContext.tsx`** -- Optionally extend to track `activeWorkspaceId` so workspace admin sidebar items can resolve the correct workspace.

---

### Summary

| Area | Status | Blocking Issue |
|------|--------|----------------|
| Database tables | Working | None |
| RLS policies | Working | None |
| TenantContext (dynamic tenant ID) | Working | None |
| Routes in App.tsx | Working | None |
| Service layers | Working | None |
| Sidebar navigation to tenant pages | **Broken** | Click handler uses view mode instead of router navigation |
| Sidebar navigation to workspace/portfolio/program pages | **Broken** | No ID resolution + wrong navigation mode |
| WorkspaceDashboard content | **Partial** | Metrics real, rest hardcoded |
| TenantDashboard | Working | None |
| WorkspaceManagement | Working | None |
| DepartmentManagement | Working | None |
| LicenseAllocation | Working | None |
| TenantAnalytics | Working | None |
| TenantSettings | Working | None |

**Bottom line**: The database and service layers are solid. The primary blocker is the sidebar navigation -- users cannot reach tenant/workspace/portfolio/program pages from the main app UI. Fixing the sidebar click handler for these route-based items will make the entire hierarchy functional.
