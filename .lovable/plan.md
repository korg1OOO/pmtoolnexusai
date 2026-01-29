

## Dashboard Consolidation & Reports Enhancement Plan

Based on my analysis of the codebase, here's a comprehensive strategy addressing your questions and implementation plan.

---

## Part 1: Dashboard Consolidation Recommendation

### Current State Analysis

| Dashboard | Purpose | Key Components |
|-----------|---------|----------------|
| **Dashboard** | Day-to-day project status | KPIs, progress ring, budget overview, active risks, in-progress work |
| **Morning Briefing** | AI-powered daily digest | Flexible grid with 14 customizable sections, AI insights, alerts |
| **Strategic Dashboard** | Long-term strategy & AI analysis | Business case, AI risk discovery, value engineering, stakeholder map |
| **Executive Dashboard** | High-level portfolio metrics | Portfolio KPIs, budget trends, program performance, health distribution |

### Recommendation: Unified Intelligence Hub

**Keep all dashboards but consolidate access via a Dashboard Selector dropdown.** Here's why:

1. **Morning Briefing** is unique - it's a personalized, customizable daily digest with AI generation
2. **Strategic Dashboard** serves a distinct purpose - project intake quality and value engineering
3. **Executive Dashboard** is portfolio-level, while Dashboard is project-level
4. They serve different audiences and use cases

### Proposed Architecture

```text
+------------------------------------------+
|  Dashboard (default entry point)         |
|  +------------------------------------+  |
|  |  [Dropdown: Dashboard Views ▼]     |  |
|  |   - Project Dashboard (current)    |  |
|  |   - Executive Dashboard            |  |
|  |   - Strategic Dashboard            |  |
|  +------------------------------------+  |
|                                          |
|  Morning Briefing stays separate         |
|  (unique AI-powered daily digest flow)   |
+------------------------------------------+
```

---

## Part 2: Project Timeline Overlap Fix

**Issue identified:** The `ProgramTimelineView.tsx` (806 lines) has overlapping elements in the timeline bars.

**Root cause:** Bar positioning calculations don't account for concurrent projects within programs properly.

**Fix approach:**
- Add vertical stacking logic for overlapping date ranges
- Implement swimlane separation within program groups
- Add collision detection for milestone markers

---

## Part 3: Reports Page Enhancement

**Current state:** Basic `ReportsView.tsx` with 6 mock reports and 3 sample charts.

**Proposed enhancement:**

### Report Categories
- **Status Reports**: Portfolio, Project, Sprint
- **Financial Reports**: Budget, EVM, Burn Rate
- **Resource Reports**: Utilization, Capacity, Skills
- **Risk Reports**: Register, Assessment, Trends
- **Custom Reports**: User-defined

### Key Features
- Report templates with scheduling (daily/weekly/monthly)
- Real-time generation from project data
- Export options (PDF, Excel, PowerPoint)
- Report history and versioning
- Sharing and distribution lists

---

## Part 4: PDF Export Feature

### Scope
Export capabilities for:
- All dashboards (Dashboard, Morning Briefing, Strategic, Executive)
- All reports from Reports page
- Individual components/sections

### Technical Approach
1. **Client-side rendering**: Use `html2canvas` + `jspdf` for quick exports
2. **Server-side rendering (recommended)**: Edge function using Puppeteer/Playwright for higher quality

### Export Options
- Single page or multi-page PDF
- Include/exclude sections
- Date range selection for data
- Branding/watermark options

---

## Part 5: Presentation Module - Dashboard Component Embedding

This is the most complex feature. Here's the architecture:

### Concept: "Live Data Slides"

```text
+--------------------------------------------+
|  Presentation Slide                        |
|  +--------------------------------------+  |
|  |  Embedded Dashboard Component        |  |
|  |  (e.g., Project Health Chart)        |  |
|  |                                      |  |
|  |  [🔄 Refresh] [📌 Snapshot Mode]     |  |
|  |                                      |  |
|  |  Data as of: 2026-01-29 10:30 AM     |  |
|  +--------------------------------------+  |
+--------------------------------------------+
```

### Key Behaviors
1. **Active Presentation**: Components refresh on-demand when opened
2. **Inactive Presentations**: Data frozen at last saved state (snapshot)
3. **Manual Refresh**: User clicks to update specific components
4. **Bulk Refresh**: "Refresh All" updates all live components in active presentation

### Data Model

```text
slides table:
  - id
  - presentation_id
  - embedded_components: JSON
    [
      {
        componentId: "budget-trend-chart",
        componentType: "dashboard-widget",
        sourceModule: "executive-dashboard",
        position: { x, y, width, height },
        dataSnapshot: { ... frozen data ... },
        snapshotAt: timestamp,
        isLive: boolean
      }
    ]
```

### Component Registry
Create an embeddable component registry that catalogs:
- All charts from dashboards
- All briefing sections
- All report visualizations
- Custom metrics widgets

---

## Implementation Plan

### Phase 1: Foundation (Reports + PDF Export)

**Tasks:**
1. Create embeddable component registry system
2. Build enhanced Reports page with categories, templates, and scheduling
3. Implement PDF export edge function
4. Add export buttons to all dashboards
5. Create print-optimized CSS stylesheets

### Phase 2: Dashboard Consolidation

**Tasks:**
1. Create `DashboardSwitcher` dropdown component
2. Unify Dashboard, Executive, and Strategic under single entry point
3. Add "Open in" quick-access from Morning Briefing to relevant dashboards
4. Fix Project Timeline overlap issues

### Phase 3: Presentation Embedding

**Tasks:**
1. Extend slides schema for embedded components
2. Create `ComponentPicker` dialog for inserting dashboard widgets
3. Build `EmbeddedComponent` wrapper with refresh controls
4. Implement data snapshot vs live toggle
5. Add "active presentation" tracking for selective refresh
6. Create component refresh queue/management system

---

## Technical Specifications

### New Files to Create

| File | Purpose |
|------|---------|
| `src/lib/embeddableComponents.ts` | Component registry with metadata |
| `src/components/common/PDFExporter.tsx` | Reusable PDF export wrapper |
| `src/components/presentations/ComponentPicker.tsx` | Dialog for selecting embeddable components |
| `src/components/presentations/EmbeddedDashboardWidget.tsx` | Wrapper for embedded live widgets |
| `src/components/views/DashboardHub.tsx` | Unified dashboard with view switcher |
| `supabase/functions/generate-pdf/index.ts` | Server-side PDF generation |

### Database Changes

```sql
-- Add embedded components support to slides
ALTER TABLE slides ADD COLUMN embedded_components JSONB DEFAULT '[]';

-- Add active presentation tracking
CREATE TABLE active_presentations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  presentation_id UUID REFERENCES presentations(id),
  activated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);
```

### Edge Function for PDF Export

```typescript
// supabase/functions/generate-pdf/index.ts
// Uses Puppeteer to render dashboards/reports as PDF
// Accepts: component IDs, date range, export options
// Returns: PDF blob or signed URL
```

---

## Summary of Recommendations

| Question | Recommendation |
|----------|----------------|
| Keep Strategic + Morning Briefing? | **Yes** - different purposes (strategy vs daily ops) |
| Merge Executive + Strategic? | **No** - Executive is portfolio-level, Strategic is project-level |
| Dashboard dropdown? | **Yes** - unify Dashboard/Executive/Strategic access |
| Morning Briefing separate? | **Yes** - unique AI-powered daily workflow |

---

## Dependencies & Considerations

1. **PDF Export**: Consider `@react-pdf/renderer` for complex layouts or edge function for server-side
2. **Component Embedding**: Requires careful state management for live vs snapshot data
3. **Active Presentation Tracking**: Real-time subscription to refresh only when needed
4. **Performance**: Lazy-load embedded components, cache data snapshots

