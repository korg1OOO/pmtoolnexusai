

# Enhanced Morning Briefing with AI-Powered Insights

## Overview

Transform the Morning Briefing into a comprehensive AI-powered daily intelligence center where users can customize which sections to display and generate real-time insights across all project dimensions by clicking the refresh button.

---

## Architecture Recommendation: Keep Separate Views

Based on analysis of the existing codebase, I recommend maintaining **separate but complementary** views:

| View | Purpose | Primary Use Case |
|------|---------|------------------|
| **Dashboard** | Real-time operational status with KPIs | Day-to-day monitoring |
| **Morning Briefing** | AI-curated daily intelligence digest | PM's "start of day" review |
| **Reports** | On-demand analytical reports for export | Stakeholder communication |
| **Executive Dashboard** | Strategic portfolio overview | C-level, steering committee |

**Reasoning**: Each view serves a distinct mental model and workflow. Morning Briefing is unique in being AI-generated, personalized, and action-oriented for starting the workday.

---

## Information Sections to Include

### Core Sections (Always Available)
1. **Critical Alerts & Notifications** - Urgent items requiring immediate attention
2. **Today's Focus Areas** - Priority tasks and activities for the day

### AI-Generated Sections (New)
3. **AI Insights & Predictions** - Schedule forecasts, bottleneck warnings, pattern recognition
4. **Budget & Financial Analysis** - Burn rate, CV/SV, forecast to completion
5. **Expected Profit/Loss Forecast** - AI-calculated projection based on resource burn
6. **Schedule Slippage Analysis** - Tasks slipping from baseline, critical path changes
7. **Risk Assessment & Mitigations** - Escalated risks, AI-suggested mitigations
8. **Actions Due / SLA Status** - Overdue actions with breach indicators
9. **Open Issues Summary** - Issues by severity with trending
10. **Recent Decisions** - Decisions made and pending
11. **Today's Meetings** - Calendar for the day
12. **Team Availability** - Member status and workload

### Additional Suggested Sections
13. **Communication Intelligence** - Email/chat patterns, sentiment analysis
14. **Milestone Tracker** - Upcoming/at-risk milestones
15. **Resource Utilization** - Team capacity heatmap

---

## User Customization Features

### Settings Panel
Users can:
- Toggle sections on/off via checkboxes
- Drag sections to reorder display priority
- Save preferences per project
- Reset to default configuration

### Refresh Behavior
When user clicks "Refresh Briefing":
- All enabled sections regenerate with latest data
- AI-powered sections call the backend for fresh analysis
- Shows loading skeleton while generating
- Displays last refresh timestamp

---

## Technical Implementation

### Database Changes

**New Table: `briefing_preferences`**
```text
Columns:
- id: UUID (primary key)
- user_id: UUID (references auth.users)
- project_id: UUID (references projects)
- enabled_sections: JSONB (array of section IDs)
- section_order: JSONB (ordered array of section IDs)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
- UNIQUE constraint on (user_id, project_id)
```

RLS policies will ensure users can only access their own preferences.

### New Edge Function: `morning-briefing-generate`

This function will:
1. Accept project ID and enabled sections
2. Aggregate data from: tasks, risks, issues, actions, meetings, resources, financials
3. Build comprehensive AI prompt with project context
4. Call Lovable AI (Gemini) for insight generation
5. Return structured briefing data with all sections

### New Frontend Components

```text
src/components/briefing/
├── BriefingSettingsPanel.tsx    # Settings popover for section toggles
├── BriefingSectionCard.tsx      # Reusable collapsible section card
├── sections/
│   ├── CriticalAlertsSection.tsx
│   ├── AIInsightsSection.tsx
│   ├── BudgetAnalysisSection.tsx
│   ├── ProfitLossSection.tsx
│   ├── ScheduleSlippageSection.tsx
│   ├── RiskAssessmentSection.tsx
│   ├── ActionsSection.tsx
│   ├── IssuesSection.tsx
│   ├── DecisionsSection.tsx
│   ├── MeetingsSection.tsx
│   ├── TeamAvailabilitySection.tsx
│   └── CommunicationSection.tsx
├── hooks/
│   └── useBriefingPreferences.ts  # CRUD for user preferences
└── types.ts                       # Briefing types and interfaces
```

### Modified Files

**`src/components/views/MorningBriefingView.tsx`**
- Add settings panel toggle in header
- Integrate preferences hook for section visibility
- Dynamic section rendering based on user preferences
- Connect to edge function for AI generation on refresh
- Add loading states for each section

---

## AI-Powered Analysis Details

### Expected Profit/Loss Calculation
AI considers:
- Current resource burn rate (hours * hourly rate)
- Remaining work estimate based on incomplete tasks
- Historical velocity from completed tasks
- Risk-adjusted scenarios (optimistic/likely/pessimistic)

### Schedule Slippage Analysis
AI identifies:
- Tasks where actual dates deviate from baseline
- Critical path changes since last check
- Milestone risk indicators
- Dependencies causing cascading delays

### Risk Assessment
AI provides:
- Newly identified risks based on project patterns
- Escalation recommendations for existing risks
- Auto-generated mitigation suggestions
- Risk score trending over time

---

## UI/UX Design

### Settings Panel Layout
```text
┌─────────────────────────────────────────────────────────────┐
│ ⚙ Customize Your Briefing                        [Save] [X] │
├─────────────────────────────────────────────────────────────┤
│ Select sections to include:                                  │
│                                                              │
│ ☑ Critical Alerts      ☑ AI Insights       ☑ Budget         │
│ ☑ Profit/Loss          ☑ Schedule          ☑ Risks          │
│ ☑ Actions              ☑ Issues            ☑ Decisions      │
│ ☑ Meetings             ☑ Team Status       ☐ Communications │
│                                                              │
│ Drag to reorder:                                            │
│ ≡ Critical Alerts                                            │
│ ≡ AI Insights                                               │
│ ≡ Budget Analysis                                           │
│ ...                                                          │
└─────────────────────────────────────────────────────────────┘
```

### Section Card Design
Each section will be a collapsible card with:
- Section icon and title
- "View Details" link to full view
- AI confidence indicator (where applicable)
- Refresh indicator when loading

---

## Implementation Phases

### Phase 1: Core Infrastructure
1. Create database table for preferences
2. Create `useBriefingPreferences` hook
3. Create `BriefingSettingsPanel` component
4. Update `MorningBriefingView` with settings integration

### Phase 2: Section Components
1. Create reusable `BriefingSectionCard` component
2. Implement individual section components
3. Add dynamic rendering based on preferences

### Phase 3: AI Integration
1. Create `morning-briefing-generate` edge function
2. Connect refresh button to trigger AI generation
3. Add loading states and error handling
4. Implement caching for performance

### Phase 4: Polish
1. Add drag-and-drop for section reordering
2. Implement section animations
3. Add tooltips and help text
4. Mobile-responsive adjustments

---

## Default Section Order

1. Critical Alerts
2. AI Insights & Predictions
3. Expected Profit/Loss Forecast
4. Schedule Slippage Analysis
5. Budget & Financial Analysis
6. Risk Assessment
7. Actions Due
8. Issues Summary
9. Today's Meetings
10. Recent Decisions
11. Team Availability
12. Communication Intelligence (disabled by default)

---

## Summary

This enhancement transforms Morning Briefing into a powerful, personalized daily intelligence tool that:

- Provides comprehensive AI-generated insights across all project dimensions
- Allows complete customization of visible sections and their order
- Persists user preferences per project in the database
- Refreshes on-demand with latest AI analysis
- Links seamlessly to detailed views for drill-down investigation
- Maintains separation from other dashboard views for focused workflows

