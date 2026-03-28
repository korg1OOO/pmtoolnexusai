# Route Guard Rules

This directory contains the application's route configuration, split by domain.

## The Two Guards

| Guard | Import from | When to use | What it provides |
|---|---|---|---|
| `<ProtectedProjectRoute>` | `@/components/routing` | Any view that renders **inside the main app shell** (sidebar, top nav) | Auth check + `ProjectProvider` + `PresenceProvider` + `AppShell` |
| `<ProtectedRoute>` | `@/components/auth/ProtectedRoute` | Views with their own **full-page layout** (billing, tenant admin, workspace admin, ML analytics) | Auth check only |

> **Rule of thumb:** If you can see the sidebar, use `<ProtectedProjectRoute>`.  
> If the page takes over the entire screen, use `<ProtectedRoute>`.

### Role & Membership Guards

| Guard | Import from | When to use |
|---|---|---|
| `<AdminRoute>` | `@/components/auth/AdminRoute` | Routes accessible **only to users with `role = 'admin'`** in their profile |
| `<TenantRoute>` | `@/components/auth/TenantRoute` | Tenant administration — checks tenant membership + owner/admin role |
| `<WorkspaceRoute>` | `@/components/auth/WorkspaceRoute` | Workspace routes — checks `workspace_members` for membership + role |
| `<ProgramRoute>` | `@/components/auth/ProgramRoute` | Program routes — checks `program_members` for membership + role |

### Subscription Tier Gate

| Guard | Import from | When to use |
|---|---|---|
| `<RequireTier minTier="business">` | `@/components/subscription/RequireTier` | Enterprise features — workspace, portfolio, and program admin |

`AdminRoute` is additionally gated by `import.meta.env.DEV` for the `/debug` route — it is not rendered in production builds at all.

---

## File Map

| File | Routes | Guard |
|---|---|---|
| `publicRoutes.tsx` | `/`, `/login`, `/about`, `/blog`, `/docs`, etc. | None / `<ProtectedRoute>` for post-payment landing |
| `projectRoutes.tsx` | `/dashboard`, `/gantt`, `/risks`, `/financials`, etc. | `<ProtectedProjectRoute>` |
| `tenantWorkspaceRoutes.tsx` | `/tenant/*`, `/workspace/:id/*`, `/portfolio/:id/*`, `/program/:id/*`, `/billing`, `/ml-analytics/:id` | `<ProtectedRoute>` + `WorkspaceRoute`/`ProgramRoute` + `RequireTier(business)` |
| `creditsRoutes.tsx` | `/purchase-credits`, `/usage-dashboard`, `/auto-recharge` | `<ProtectedRoute>` |
| `adminRoutes.tsx` | `/admin` and all nested children | `<ProtectedRoute>` (AdminPanel enforces role internally) |

