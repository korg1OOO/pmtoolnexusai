# Phase 1 Deployment Instructions

## Migration Created ✅

**File:** `/supabase/migrations/20260212142800_ai_agent_system.sql`

This migration creates:
- 4 tables (ai_agents, ai_agent_capabilities, ai_agent_settings, ai_agent_versions)
- RLS policies for security
- 11 seeded AI agents
- 18+ agent capabilities

---

## Deployment Options

### Option 1: Via Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard:**
   - Go to https://supabase.com/dashboard
   - Select your ProjectOye project

2. **Navigate to SQL Editor:**
   - Click "SQL Editor" in left sidebar
   - Click "New Query"

3. **Copy & Paste Migration:**
   - Open: `/supabase/migrations/20260212142800_ai_agent_system.sql`
   - Copy entire contents
   - Paste into SQL Editor
   - Click "Run"

4. **Verify:**
   - Check for success message
   - Run: `SELECT COUNT(*) FROM ai_agents;` (should return 11)

### Option 2: Via Supabase CLI (If Available)

```bash
# Install Supabase CLI (if not installed)
brew install supabase/tap/supabase

# Login
supabase login

# Link project
supabase link --project-ref <your-project-ref>

# Push migration
supabase db push

# Update types
npm run update-types
```

### Option 3: Direct SQL Execution

Use any PostgreSQL client (pgAdmin, DBeaver, etc.) to execute the migration file directly against your Supabase database.

---

## After Deployment

### 1. Verify Migration

Run the verification script:
```bash
npx tsx scripts/verify_ai_agent_system.ts
```

Expected output:
```
✅ Found 11 agents
✅ All agent types present  
✅ Found 18+ capabilities
✅ ALL TESTS PASSED
```

### 2. Update TypeScript Types

**Manual Update (if no CLI):**

Add these interfaces to `/src/integrations/supabase/types.ts`:

```typescript
export interface AIAgent {
  id: string;
  agent_type: string;
  label: string;
  description: string | null;
  icon: string;
  color: string;
  system_prompt: string | null;
  model_provider: string;
  model_name: string;
  max_tokens: number;
  temperature: number;
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface AIAgentCapability {
  id: string;
  agent_id: string;
  capability_key: string;
  description: string | null;
  requires_role: string[];
  created_at: string;
}

export interface AIAgentSetting {
  id: string;
  agent_id: string;
  setting_key: string;
  setting_value: any; // JSONB
  created_at: string;
  updated_at: string;
}

export interface AIAgentVersion {
  id: string;
  agent_id: string;
  version: number;
  system_prompt: string | null;
  model_provider: string | null;
  model_name: string | null;
  is_active: boolean;
  performance_metrics: any; // JSONB
  created_at: string;
  created_by: string | null;
}
```

**Or use Supabase CLI:**
```bash
npm run update-types
# or
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

---

## Next Phase

Once deployed and verified:

**Phase 2: Backend Service Layer**
- Create `/src/services/aiAgentService.ts`
- Create `/src/hooks/useAIAgents.ts`
- Implement CRUD operations for AI agents

---

## Rollback (If Needed)

If migration causes issues:

```sql
-- Rollback script
DROP TABLE IF EXISTS ai_agent_versions CASCADE;
DROP TABLE IF EXISTS ai_agent_settings CASCADE;
DROP TABLE IF EXISTS ai_agent_capabilities CASCADE;
DROP TABLE IF EXISTS ai_agents CASCADE;
```

---

**Status:** Migration ready, awaiting deployment
**Next Step:** Deploy via Supabase Dashboard (Option 1)
