

# Comprehensive Application Audit Report

## 1. Database Schema Exists but No Backend/Frontend

These tables exist in the database but have **no service layer and/or no UI component** consuming them:

| Table | Backend (Service/Hook) | Frontend (UI) | Gap |
|-------|----------------------|---------------|-----|
| `affiliate_referrals` | Partial (useAffiliates) | AdminAffiliates page | Needs verification |
| `briefing_preferences` | None found | None | Both missing |
| `calendar_exceptions` | None found | None | Both missing |
| `meeting_conflicts` | None found | None | Both missing |
| `meeting_scope_changes` | None found | None | Both missing |
| `mom_templates` | None found | None | Both missing |
| `sites` | None found | None | Both missing |
| `collaboration_spaces` | collaborationSpaceService.ts | CollaborationSpaces.tsx | OK |
| `backup_jobs` | None found | None | Both missing |
| `ai_credit_pricing` | Partial | Partial | Needs verification |

---

## 2. Backend Built but No Database Schema

These tables are **referenced in code** via `.from('table_name')` but **do NOT exist** in the database:

| Missing Table | Referenced In | Impact |
|---------------|--------------|--------|
| `tenants` | tenantService.ts, TenantDashboard, TenantSettings, WorkspaceManagement, etc. | **CRITICAL** - Entire tenant module broken |
| `workspaces` | tenantService.ts, workspaceService.ts, WorkspaceDashboard, etc. | **CRITICAL** - Entire workspace module broken |
| `workspace_members` | tenantService.ts, workspaceService.ts | **CRITICAL** |
| `departments` | tenantService.ts, DepartmentManagement.tsx | **HIGH** |
| `licenses` | tenantService.ts, LicenseAllocation.tsx | **HIGH** |
| `ai_provider_api_keys` | useAIProviderSettings.ts | **MEDIUM** |
| `spreadsheet_comments` | commentsService.ts | **MEDIUM** |
| `license_keys` | useAdminServices.ts, AdminLicenseKeys | **HIGH** |
| `discount_codes` | useAdminServices.ts, AdminDiscountCodes | **HIGH** |
| `team_members` | workspaceService.ts, programService.ts | **HIGH** |
| `project_members` | useProjectMembers.ts, programInsightsService.ts | **HIGH** |
| `project_roles` | projectRolesService.ts | **MEDIUM** |
| `workspace_budgets` | workspaceService.ts | **HIGH** |
| `workspace_resources` | workspaceService.ts | **HIGH** |

---

## 3. Frontend UI Built but No Database/Backend

| Component | Issue | Severity |
|-----------|-------|----------|
| `MLAccuracyPage.tsx` | 100% hardcoded mock data (4 metrics, 5 history rows) | **HIGH** |
| `MLPredictionsPage.tsx` | Hardcoded mock predictions array, comment says "replace with real hook" | **HIGH** |
| `TenantAnalytics.tsx` | Mock chart data (growthData array hardcoded) | **MEDIUM** |
| `SubscriptionWidget.tsx` | Mock usage data (projects: 2, teamMembers: 1, storage: 45) | **MEDIUM** |
| `SubscriptionSuccessPage.tsx` | Page exists but has **no route** in App.tsx | **HIGH** |
| `LicenseAllocation.tsx` | Mock allocations array (empty), comment says "TODO: Implement user-license mapping table" | **MEDIUM** |
| `aiRequestWrapper.ts` | `callAIAPI()` returns mock responses, comment "TODO: Replace with actual API call" | **HIGH** |

---

## 4. TODOs, Mock Data, Unfunctional Elements

### TODOs (Critical)
| File | TODO | Impact |
|------|------|--------|
| `TenantDashboard.tsx` | `TODO: Get from auth context` -- uses hardcoded `'default-tenant-id'` | **CRITICAL** |
| `WorkspaceManagement.tsx` | Same hardcoded tenant ID | **CRITICAL** |
| `TenantSettings.tsx` | Same hardcoded tenant ID | **CRITICAL** |
| `TenantAnalytics.tsx` | Same hardcoded tenant ID | **CRITICAL** |
| `DepartmentManagement.tsx` | Same hardcoded tenant ID | **CRITICAL** |
| `LicenseAllocation.tsx` | Same hardcoded tenant ID | **CRITICAL** |
| `UserRoleManagement.tsx` | Hardcoded `'default-tenant'` | **CRITICAL** |
| `UserManagement.tsx` | Hardcoded `'default-tenant'` | **CRITICAL** |
| `App.tsx` line 161 | `tenantId="default-tenant-id"` hardcoded prop | **CRITICAL** |
| `ResourcePlanningView.tsx` | `TODO: Enhance with program-level demand data` | LOW |

### Unwired/Nonfunctional Buttons and Links
| Component | Issue |
|-----------|-------|
| `MessageBubble.tsx` (x2) | `ThreadIndicator onClick={() => {}}` -- thread click does nothing |
| `Auth.tsx` | "Forgot password?" link is `href="#"` -- goes nowhere |

### Missing Route
| Page | Issue |
|------|-------|
| `SubscriptionSuccessPage.tsx` | File exists at `src/pages/` but **not registered** in `App.tsx` routes |

### Mock Data Still Present
| File | Type |
|------|------|
| `MLAccuracyPage.tsx` | Fully hardcoded accuracy metrics and performance history |
| `MLPredictionsPage.tsx` | Hardcoded predictions array |
| `TenantAnalytics.tsx` | Hardcoded growth chart data |
| `SubscriptionWidget.tsx` | Hardcoded usage stats |
| `TraceabilityMatrixView.tsx` | `MOCK_TRACEABILITY_ITEMS` for demo mode (acceptable for demo) |
| `EnhancedMeetingsView.tsx` | `MOCK_MEETINGS` for demo mode (acceptable for demo) |
| `aiRequestWrapper.ts` | Mock AI API responses |
| `mlRetrainingService.ts` | Mock retraining schedule data |
| `mlModelOperations.ts` | Mock data drift scores |

### `.bak` Files (Dead Code)
- `src/components/portfolio/ResourcePlanningView.tsx.bak`
- `src/components/portfolio/StrategicRoadmap.tsx.bak`
- `src/components/program/AdvancedResourceAllocation.tsx.bak`

---

## 5. Tenant/Workspace/Portfolio/Program Readiness

### Verdict: Will NOT work in current state

The entire multi-tenancy hierarchy is **broken** because:

1. **No database tables exist** for `tenants`, `workspaces`, `workspace_members`, `departments`, `licenses`, `team_members`, `project_members`, `workspace_budgets`, `workspace_resources`, `license_keys`, `discount_codes`, or `project_roles`.

2. **Every tenant component uses a hardcoded ID** (`'default-tenant-id'` or `'default-tenant'`) instead of deriving it from the authenticated user's context. There is no `user_tenants` lookup (the table exists but no context provider uses it).

3. **No tenant context provider** exists. The auth system (`useAuth.ts`) returns a `User` but has no concept of which tenant or workspace the user belongs to.

4. **Navigation is disconnected** -- no component uses `navigate('/tenant/...')` or `navigate('/workspace/...')`. Users cannot reach these pages from the main app UI.

### What Needs to Happen (Implementation Plan)

**Phase 1: Database Migration (15 tables)**
Create the missing tables: `tenants`, `workspaces`, `workspace_members`, `departments`, `licenses`, `license_keys`, `discount_codes`, `team_members`, `project_members`, `project_roles`, `workspace_budgets`, `workspace_resources`, `ai_provider_api_keys`, `spreadsheet_comments`, and add foreign keys linking `projects` and `programs` to `workspace_id`/`tenant_id`.

**Phase 2: Tenant Context Provider**
Create a `TenantContext` that:
- Queries `user_tenants` for the logged-in user
- Provides `tenantId`, `workspaceId`, and role to all child components
- Replaces all 9+ instances of hardcoded `'default-tenant-id'`

**Phase 3: Wire Navigation**
- Add tenant/workspace navigation items to the main sidebar
- Add the missing `/subscription/success` route
- Wire the "Forgot password?" link to a real password reset flow
- Wire `ThreadIndicator` onClick to open thread views

**Phase 4: Replace Mock Data**
- `MLAccuracyPage` and `MLPredictionsPage`: wire to `useMLPredictions` / `useMLModels` hooks
- `TenantAnalytics`: derive chart data from real tenant overview queries
- `SubscriptionWidget`: query actual project/member/storage counts
- `aiRequestWrapper.ts`: connect to Lovable AI edge function

**Phase 5: Cleanup**
- Delete 3 `.bak` files
- Remove or properly implement `callAIAPI()` mock
- Audit all `(supabase as any)` casts -- these bypass type safety

---

### Summary Counts

| Category | Count |
|----------|-------|
| Missing DB tables (backend references them) | **15** |
| Components with hardcoded mock data | **9** |
| Hardcoded tenant IDs (needs context provider) | **9 instances across 8 files** |
| Unwired buttons/links | **3** (2 thread indicators, 1 forgot password) |
| Missing routes | **1** (SubscriptionSuccessPage) |
| Dead `.bak` files | **3** |
| Critical blockers for tenant/workspace flow | **3** (no tables, no context, no navigation) |

