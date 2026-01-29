
# Multi-Agent AI System with Orchestrator Pattern

## Overview
Transform the existing standalone AI agents (PM Coach, Strategic AI, Meeting AI, Communication AI, Morning Briefing) into a unified, fully operational multi-agent system. Users interact with a single "AI Assistant" interface while the backend Orchestrator intelligently routes requests to specialized agents based on intent detection and RBAC permissions.

---

## Architecture Design

### Hub-and-Spoke Pattern

```text
+------------------+
|   User (Chat)    |
+--------+---------+
         |
         v
+--------+---------+
|   GlobalAI       |  <-- Single Frontend Interface
|   Sidebar        |      (Unified Chat Experience)
+--------+---------+
         |
         v
+--------+---------+
|   MainAgent      |  <-- Orchestrator Edge Function
|   (Router)       |      Intent Classification + RBAC
+--------+---------+
         |
    +----+----+----+----+----+----+----+
    |    |    |    |    |    |    |    |
    v    v    v    v    v    v    v    v
  +---+ +---+ +---+ +---+ +---+ +---+ +---+
  |Sch| |Fin| |Rsk| |Mtg| |Com| |Res| |Doc|
  +---+ +---+ +---+ +---+ +---+ +---+ +---+

  Specialized Agents (Sub-functions in Orchestrator)
```

---

## Database Schema Changes

### New Tables

**Table: `user_roles` (RBAC)**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK to auth.users |
| project_id | UUID | FK to projects |
| role | ENUM | admin, pm, lead, developer, analyst, viewer |
| created_at | TIMESTAMP | |

**Table: `ai_conversations`**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| project_id | UUID | FK to projects |
| user_id | UUID | User who initiated |
| title | TEXT | Conversation title |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

**Table: `ai_messages`**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| conversation_id | UUID | FK to ai_conversations |
| role | TEXT | user, assistant, system |
| content | TEXT | Message content |
| agent_type | TEXT | Which agent responded |
| metadata | JSONB | Additional data (intents, actions) |
| created_at | TIMESTAMP | |

**Table: `ai_agent_logs`**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| conversation_id | UUID | FK to ai_conversations |
| agent_type | TEXT | scheduler, finance, risk, etc. |
| input_data | JSONB | Data sent to agent |
| output_data | JSONB | Agent response |
| execution_time_ms | INTEGER | Performance tracking |
| success | BOOLEAN | |
| error_message | TEXT | If failed |
| created_at | TIMESTAMP | |

---

## Permission Model (RBAC)

### Role Permissions Matrix

| Permission | Admin | PM | Lead | Dev | Analyst | Viewer |
|------------|-------|-----|------|-----|---------|--------|
| SCHEDULE_EDIT | Yes | Yes | Yes | No | No | No |
| FINANCE_VIEW | Yes | Yes | No | No | No | No |
| FINANCE_EDIT | Yes | Yes | No | No | No | No |
| RISK_MANAGE | Yes | Yes | Yes | No | No | No |
| TEAM_MANAGE | Yes | Yes | Yes | No | No | No |
| MEETING_MANAGE | Yes | Yes | Yes | Yes | Yes | No |
| DOC_GENERATE | Yes | Yes | Yes | Yes | Yes | No |
| VIEW_ALL | Yes | Yes | Yes | Yes | Yes | Yes |

### Agent-Permission Mapping

```typescript
const AGENT_PERMISSIONS = {
  'scheduler': ['SCHEDULE_EDIT'],
  'finance': ['FINANCE_VIEW', 'FINANCE_EDIT'],
  'risk': ['RISK_MANAGE', 'VIEW_ALL'],
  'assignment': ['TEAM_MANAGE'],
  'meeting': ['MEETING_MANAGE'],
  'document': ['DOC_GENERATE'],
  'insight': ['VIEW_ALL'],
  'briefing': ['VIEW_ALL'],
  'strategic': ['VIEW_ALL', 'RISK_MANAGE'],
  'communication': ['VIEW_ALL'],
};
```

---

## Specialized Agents

### 1. SchedulerAgent
- **Purpose**: Handle schedule changes, date adjustments, critical path analysis
- **Capabilities**: Move tasks, adjust dependencies, calculate impact, auto-schedule
- **Data Access**: Tasks, Dependencies, Calendars, Resources
- **Required Permission**: `SCHEDULE_EDIT`

### 2. FinanceAgent
- **Purpose**: Budget analysis, cost forecasting, EVM calculations
- **Capabilities**: Budget queries, variance analysis, invoice status, forecasting
- **Data Access**: Budgets, Invoices, Time entries, Costs
- **Required Permission**: `FINANCE_VIEW` or `FINANCE_EDIT`

### 3. RiskAgent
- **Purpose**: Risk identification, analysis, mitigation recommendations
- **Capabilities**: Risk scoring, pattern detection, mitigation planning
- **Data Access**: Risks, Issues, Historical patterns
- **Required Permission**: `RISK_MANAGE`

### 4. AssignmentAgent
- **Purpose**: Resource allocation, workload balancing, team optimization
- **Capabilities**: Auto-assign tasks, capacity analysis, skill matching
- **Data Access**: Resources, Teams, Skills, Allocations
- **Required Permission**: `TEAM_MANAGE`

### 5. MeetingAgent
- **Purpose**: Meeting intelligence, action extraction, MoM generation
- **Capabilities**: Transcript analysis, decision extraction, follow-up tracking
- **Data Access**: Meetings, Notes, Transcripts, Actions
- **Required Permission**: `MEETING_MANAGE`

### 6. DocumentAgent
- **Purpose**: Generate reports, status updates, executive summaries
- **Capabilities**: Report generation, template filling, narrative creation
- **Data Access**: All project data (read-only for context)
- **Required Permission**: `DOC_GENERATE`

### 7. InsightAgent
- **Purpose**: Project health analysis, predictions, recommendations
- **Capabilities**: Trend analysis, velocity predictions, health scoring
- **Data Access**: All project data (read-only)
- **Required Permission**: `VIEW_ALL`

### 8. StrategicAgent
- **Purpose**: High-level strategic analysis, stakeholder insights
- **Capabilities**: Value engineering, trade-off analysis, stakeholder mapping
- **Data Access**: Strategic context, Business case, Stakeholders
- **Required Permission**: `VIEW_ALL`

### 9. CommunicationAgent
- **Purpose**: Analyze communications for signals and patterns
- **Capabilities**: Delay detection, scope creep signals, sentiment analysis
- **Data Access**: Emails, Chat messages, Meeting notes
- **Required Permission**: `VIEW_ALL`

---

## Technical Implementation

### Phase 1: Database & RBAC Setup

**Migration SQL:**
```sql
-- User roles enum and table
CREATE TYPE public.project_role AS ENUM ('admin', 'pm', 'lead', 'developer', 'analyst', 'viewer');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  role project_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, project_id)
);

-- RLS and security definer function
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID, p_project_id UUID)
RETURNS project_role
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM user_roles 
  WHERE user_id = p_user_id AND project_id = p_project_id
  LIMIT 1
$$;

-- AI conversations
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT DEFAULT 'New Conversation',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  agent_type TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ai_agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL,
  input_data JSONB,
  output_data JSONB,
  execution_time_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE ai_messages;
```

### Phase 2: Orchestrator Edge Function

**File: `supabase/functions/ai-orchestrator/index.ts`**

Core responsibilities:
1. **Intent Classification**: Determine which agent(s) to call
2. **Permission Verification**: Check RBAC before delegation
3. **Context Assembly**: Gather relevant data for the agent
4. **Agent Delegation**: Call specialized agent logic
5. **Response Synthesis**: Combine multi-agent responses
6. **Streaming**: Support real-time response streaming

**Intent Categories:**
```typescript
const INTENT_CATEGORIES = [
  'SCHEDULE_QUERY',      // "When is the deadline?"
  'SCHEDULE_MODIFY',     // "Move the launch date"
  'BUDGET_QUERY',        // "What's the budget status?"
  'BUDGET_ANALYSIS',     // "Analyze cost overruns"
  'RISK_QUERY',          // "What are the top risks?"
  'RISK_ANALYZE',        // "Assess impact of delay"
  'RESOURCE_QUERY',      // "Who is available?"
  'RESOURCE_ASSIGN',     // "Assign tasks to team"
  'MEETING_QUERY',       // "What was decided?"
  'MEETING_GENERATE',    // "Create MoM"
  'REPORT_GENERATE',     // "Generate status report"
  'INSIGHT_REQUEST',     // "How is the project doing?"
  'STRATEGIC_ANALYSIS',  // "Analyze trade-offs"
  'COMMUNICATION_SCAN',  // "Any delay signals?"
  'GENERAL_CHAT',        // General conversation
];
```

### Phase 3: Specialized Agent Modules

Each agent is implemented as a module within the orchestrator with:
- System prompt specific to its domain
- Data fetching functions
- Response formatting
- Confidence scoring

**Example Agent Structure:**
```typescript
interface AgentInput {
  query: string;
  context: ProjectContext;
  userRole: string;
  conversationHistory: Message[];
}

interface AgentOutput {
  response: string;
  actions?: ActionItem[];
  confidence: number;
  metadata?: Record<string, any>;
}

type AgentFunction = (input: AgentInput) => Promise<AgentOutput>;
```

### Phase 4: Frontend - Global AI Sidebar

**File: `src/components/ai/GlobalAISidebar.tsx`**

Features:
- Single chat interface (replaces individual sidebars)
- Conversation history
- Real-time streaming responses
- Action confirmation dialogs
- Context indicators (which agent is responding)
- Permission-aware UI (hide actions user can't perform)

**UI Components:**
```text
+----------------------------------+
| AI Assistant            [Close] |
+----------------------------------+
| Project: Cloud Migration        |
| Your Role: Project Manager      |
+----------------------------------+
| [New Chat] | History           |
+----------------------------------+
| Conversation Messages           |
|                                 |
| User: Move launch to Friday    |
|                                 |
| Assistant (Scheduler):         |
| I've analyzed the impact...    |
| [Confirm Action] [Cancel]      |
|                                 |
| User: Check budget impact      |
|                                 |
| Assistant (Finance):           |
| The extension will cost...     |
+----------------------------------+
| [Type a message...] [Send]     |
+----------------------------------+
```

---

## File Structure

### New Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/ai-orchestrator/index.ts` | Main orchestrator edge function |
| `supabase/functions/ai-orchestrator/agents/scheduler.ts` | Scheduler agent logic |
| `supabase/functions/ai-orchestrator/agents/finance.ts` | Finance agent logic |
| `supabase/functions/ai-orchestrator/agents/risk.ts` | Risk agent logic |
| `supabase/functions/ai-orchestrator/agents/assignment.ts` | Assignment agent logic |
| `supabase/functions/ai-orchestrator/agents/meeting.ts` | Meeting agent logic |
| `supabase/functions/ai-orchestrator/agents/document.ts` | Document agent logic |
| `supabase/functions/ai-orchestrator/agents/insight.ts` | Insight agent logic |
| `supabase/functions/ai-orchestrator/agents/strategic.ts` | Strategic agent logic |
| `supabase/functions/ai-orchestrator/agents/communication.ts` | Communication agent logic |
| `supabase/functions/ai-orchestrator/utils/intent-classifier.ts` | Intent classification logic |
| `supabase/functions/ai-orchestrator/utils/permission-gate.ts` | RBAC verification |
| `supabase/functions/ai-orchestrator/utils/context-builder.ts` | Data assembly |
| `src/components/ai/GlobalAISidebar.tsx` | Unified AI chat interface |
| `src/components/ai/ChatMessage.tsx` | Message display component |
| `src/components/ai/ActionConfirmDialog.tsx` | Confirm destructive actions |
| `src/components/ai/AgentIndicator.tsx` | Show which agent is active |
| `src/hooks/useAIChat.ts` | Chat hook with streaming |
| `src/hooks/useUserRole.ts` | Get user's project role |
| `src/types/ai-agents.ts` | Type definitions |

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/layout/AppShell.tsx` | Replace PMCoachSidebar with GlobalAISidebar |
| `supabase/config.toml` | Add ai-orchestrator function config |

---

## Key Implementation Details

### Intent Classification Prompt

```text
You are an intent classifier for a project management AI system.

Given a user message, classify it into ONE of these categories:
- SCHEDULE_QUERY: Questions about dates, timelines, milestones
- SCHEDULE_MODIFY: Requests to change dates, move tasks, adjust dependencies
- BUDGET_QUERY: Questions about costs, budget, spending
- BUDGET_ANALYSIS: Requests for cost analysis, forecasting, variance
- RISK_QUERY: Questions about risks, issues, blockers
- RISK_ANALYZE: Requests for risk assessment, impact analysis
- RESOURCE_QUERY: Questions about team, availability, workload
- RESOURCE_ASSIGN: Requests to assign tasks, allocate resources
- MEETING_QUERY: Questions about meetings, decisions, action items
- MEETING_GENERATE: Requests to create MoM, summarize meetings
- REPORT_GENERATE: Requests for reports, status updates, summaries
- INSIGHT_REQUEST: General project health, predictions, recommendations
- STRATEGIC_ANALYSIS: Trade-off analysis, value engineering, stakeholder insights
- COMMUNICATION_SCAN: Check communications for patterns, signals
- GENERAL_CHAT: General conversation, greetings, unclear intent

Also identify if the request:
- Requires data modification (vs read-only)
- Needs multi-agent coordination (multiple intents)

Output JSON: { "primary_intent": "...", "secondary_intents": [], "requires_modification": boolean }
```

### Permission Denial Response

When a user lacks permission:
```text
I understand you'd like to [ACTION], but I notice you have a [ROLE] role on this project. 
This action requires [REQUIRED_PERMISSION] permission.

What I can do instead:
- [Alternative action 1 they CAN do]
- [Alternative action 2 they CAN do]

Would you like me to help with one of these, or should I request access on your behalf?
```

### Multi-Agent Response Synthesis

When multiple agents are needed:
```text
User: "Move the launch date to Friday and tell me the budget impact"

Orchestrator Flow:
1. Classify: SCHEDULE_MODIFY + BUDGET_ANALYSIS
2. Check permissions for both
3. Call SchedulerAgent → Get date change analysis
4. Call FinanceAgent → Get budget impact
5. Synthesize: Combine responses into coherent narrative
```

---

## Streaming Implementation

The orchestrator supports streaming for real-time UX:

```typescript
// Backend streams SSE events
// - intent_detected: Show which agent is being called
// - agent_started: Indicate agent is processing
// - content_delta: Stream response tokens
// - action_proposed: Show actionable items
// - complete: Signal end of response
```

---

## Security Considerations

1. **Never expose agent routing logic to client** - All classification happens server-side
2. **Double-check permissions before data modification** - Even if intent classified correctly
3. **Audit log all agent actions** - Track what each agent did
4. **Rate limiting** - Prevent abuse of AI calls
5. **Data scoping** - Each agent only sees data it needs
6. **Confirmation for destructive actions** - User must confirm schedule/budget changes

---

## Implementation Order

1. **Database Migration**: Create RBAC tables, AI conversation tables
2. **Permission Functions**: Implement `get_user_role` and permission helpers
3. **Orchestrator Skeleton**: Basic edge function with intent classification
4. **InsightAgent**: Start with read-only agent (lowest risk)
5. **GlobalAISidebar**: Frontend chat interface with streaming
6. **SchedulerAgent**: Add first modification agent
7. **FinanceAgent**: Add budget analysis
8. **RiskAgent**: Add risk management
9. **MeetingAgent**: Integrate existing meeting-ai-extract logic
10. **AssignmentAgent**: Add resource management
11. **DocumentAgent**: Add report generation
12. **StrategicAgent**: Add strategic analysis
13. **CommunicationAgent**: Add communication scanning
14. **Multi-Agent Synthesis**: Handle complex queries
15. **Action Confirmation UI**: Add confirmation dialogs
16. **Testing & Polish**: End-to-end testing, error handling

---

## Example Interactions

### Scenario 1: PM asks about schedule
```text
User: "What's the status of Phase 3?"

Orchestrator:
→ Intent: INSIGHT_REQUEST
→ Permission: VIEW_ALL (PM has this) ✓
→ Agent: InsightAgent

Response: "Phase 3 is currently at 68% completion, 3 days behind schedule. 
Key blockers: Integration testing delayed due to API dependencies. 
Recommendation: Consider fast-tracking the API mock development to unblock testing."
```

### Scenario 2: Viewer tries to modify
```text
User: "Move the deadline to next month"

Orchestrator:
→ Intent: SCHEDULE_MODIFY
→ Permission: SCHEDULE_EDIT (Viewer lacks this) ✗

Response: "I can't modify the schedule with your current permissions. 
As a Viewer, you have read-only access.

I can help you:
- View the current schedule
- See milestone dates
- Request schedule changes from a Project Manager"
```

### Scenario 3: Complex multi-agent query
```text
User: "Auto-assign the remaining Beta tasks and tell me how this affects the budget"

Orchestrator:
→ Intent: RESOURCE_ASSIGN + BUDGET_ANALYSIS
→ Permissions: TEAM_MANAGE ✓, FINANCE_VIEW ✓

Agent 1 (Assignment): Analyzes tasks, team capacity, skills
Agent 2 (Finance): Calculates cost impact of assignments

Synthesized Response: "I've analyzed 12 unassigned Beta tasks and created an optimal assignment:
- 4 tasks → Emily (React specialist)
- 5 tasks → Michael (API development)
- 3 tasks → Anna (Data migration)

Budget Impact: This assignment uses 240 additional hours, translating to ~$36,000.
Current budget has $42,000 remaining, so this is within limits.

[Confirm Assignments] [Cancel]"
```
