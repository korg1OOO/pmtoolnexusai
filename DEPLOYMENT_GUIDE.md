# 🚀 AI Agent System - Deployment Guide

## Current Status

✅ **Phase 1 Complete:** Database schema migration created  
✅ **Phase 2 Complete:** Backend service layer & hooks created  
⏳ **Ready for Deployment**

---

## Step 1: Deploy Database Migration

### Via Supabase Dashboard (Recommended)

1. **Open Your Supabase Project:**
   - Go to https://supabase.com/dashboard
   - Select your ProjectOye project

2. **Open SQL Editor:**
   - Click "SQL Editor" in the left sidebar
   - Click "+ New Query"

3. **Execute Migration:**
   - Open file: `supabase/migrations/20260212142800_ai_agent_system.sql`
   - Copy the **entire contents** (450+ lines)
   - Paste into the SQL Editor
   - Click "Run" (or press Cmd+Enter)

4. **Verify Success:**
   You should see:
   ```
   Success. No rows returned
   ```

5. **Quick Verification Query:**
   Run this in a new query:
   ```sql
   SELECT COUNT(*) as total_agents FROM ai_agents;
   SELECT agent_type, label, model_provider FROM ai_agents ORDER BY agent_type;
   SELECT COUNT(*) as total_capabilities FROM ai_agent_capabilities;
   ```
   
   **Expected Results:**
   - `total_agents`: 11
   - `total_capabilities`: 18+
   - Agent list should show all 11 agents (scheduler, finance, risk, etc.)

---

## Step 2: Verify Tables Created

Run this verification query:

```sql
-- Check all 4 tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'ai_agent%'
ORDER BY table_name;
```

**Expected Output:**
```
ai_agent_capabilities
ai_agent_settings
ai_agent_versions
ai_agents
```

---

## Step 3: Update TypeScript Types

### Option A: Manual Update (No CLI Required)

Add these types to `/src/integrations/supabase/types.ts`:

```typescript
// Add to your Database interface under Tables:
export interface Database {
  public: {
    Tables: {
      // ... existing tables ...
      
      ai_agents: {
        Row: {
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
        };
        Insert: {
          id?: string;
          agent_type: string;
          label: string;
          description?: string | null;
          icon: string;
          color: string;
          system_prompt?: string | null;
          model_provider?: string;
          model_name?: string;
          max_tokens?: number;
          temperature?: number;
          is_active?: boolean;
          version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          agent_type?: string;
          label?: string;
          description?: string | null;
          icon?: string;
          color?: string;
          system_prompt?: string | null;
          model_provider?: string;
          model_name?: string;
          max_tokens?: number;
          temperature?: number;
          is_active?: boolean;
          version?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      
      ai_agent_capabilities: {
        Row: {
          id: string;
          agent_id: string;
          capability_key: string;
          description: string | null;
          requires_role: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          agent_id: string;
          capability_key: string;
          description?: string | null;
          requires_role?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          agent_id?: string;
          capability_key?: string;
          description?: string | null;
          requires_role?: string[];
          created_at?: string;
        };
      };
      
      ai_agent_settings: {
        Row: {
          id: string;
          agent_id: string;
          setting_key: string;
          setting_value: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          agent_id: string;
          setting_key: string;
          setting_value: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          agent_id?: string;
          setting_key?: string;
          setting_value?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
      
      ai_agent_versions: {
        Row: {
          id: string;
          agent_id: string;
          version: number;
          system_prompt: string | null;
          model_provider: string | null;
          model_name: string | null;
          is_active: boolean;
          performance_metrics: any;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          agent_id: string;
          version: number;
          system_prompt?: string | null;
          model_provider?: string | null;
          model_name?: string | null;
          is_active?: boolean;
          performance_metrics?: any;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          agent_id?: string;
          version?: number;
          system_prompt?: string | null;
          model_provider?: string | null;
          model_name?: string | null;
          is_active?: boolean;
          performance_metrics?: any;
          created_at?: string;
          created_by?: string | null;
        };
      };
    };
  };
}
```

### Option B: Via Supabase CLI (If You Install It)

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Login
supabase login

# Link project
supabase link --project-ref <your-project-ref>

# Generate types
supabase gen types typescript --linked > src/integrations/supabase/types.ts
```

---

## Step 4: Test the Integration

### Test with React Query DevTools

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open browser DevTools and check React Query tab

3. Look for queries:
   - `['ai-agents']`
   - `['ai-agent', <type>]`

4. These should show data once migration is deployed

### Test with Console

Open browser console and run:

```javascript
// Test fetching agents
const { data } = await supabase.from('ai_agents').select('*');
console.log('AI Agents:', data);

// Should show 11 agents
```

---

## Step 5: Verify RLS Policies

Run this to check policies are active:

```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename LIKE 'ai_agent%';
```

**Expected:** Multiple policies per table (view/manage split by role)

---

## Common Issues & Solutions

### Issue: Migration fails with "already exists"

**Solution:** Tables may already exist. Drop them first:
```sql
DROP TABLE IF EXISTS ai_agent_versions CASCADE;
DROP TABLE IF EXISTS ai_agent_settings CASCADE;
DROP TABLE IF EXISTS ai_agent_capabilities CASCADE;
DROP TABLE IF EXISTS ai_agents CASCADE;
```
Then re-run the migration.

### Issue: No agents returned

**Check:**
1. RLS policies are correct
2. User is authenticated
3. Agents are marked `is_active = true`

**Debug query:**
```sql
SELECT * FROM ai_agents WHERE is_active = true;
```

### Issue: Permission denied

**Check:** User role in `user_roles` table:
```sql
SELECT * FROM user_roles WHERE user_id = auth.uid();
```

---

## Next Steps After Deployment

Once migration is deployed and verified:

1. ✅ Test hooks in a component:
   ```typescript
   import { useAIAgents } from '@/hooks/useAIAgents';
   
   const { data: agents, isLoading } = useAIAgents();
   console.log('Agents from DB:', agents);
   ```

2. 🚀 **Continue to Phase 3:** Update ai-orchestrator Edge Function

3. 🎨 **Phase 4:** Build Admin UI to manage agents

---

## Rollback Plan

If anything goes wrong:

```sql
-- Complete rollback script
DROP TABLE IF EXISTS ai_agent_versions CASCADE;
DROP TABLE IF EXISTS ai_agent_settings CASCADE;
DROP TABLE IF EXISTS ai_agent_capabilities CASCADE;
DROP TABLE IF EXISTS ai_agents CASCADE;
```

---

## Support

**Migration File:** `supabase/migrations/20260212142800_ai_agent_system.sql`  
**Service Layer:** `src/services/aiAgentService.ts`  
**Hooks:** `src/hooks/useAIAgents.ts`

**Status:** ✅ Ready to deploy!
