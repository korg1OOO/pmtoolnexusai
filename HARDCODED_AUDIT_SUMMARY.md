# Hardcoded Data & Mock Data - Quick Reference

> **Full Plan:** See `/brain/hardcoded_refactoring_plan.md`

## Summary

**Total Issues Found:** 100+

### Critical Issues (Must Fix) 🔴

1. **11 AI Agents** - Hardcoded in `/src/types/ai-agents.ts`
   - Cannot be configured without code deploy
   - No admin UI to manage
   - Solution: Create `ai_agents` database table + Admin UI

2. **918-Line Mock Data File** - `/src/data/mockData.ts`
   - 26.7 KB of fake data
   - ~15 views showing mock data to users
   - Solution: Wire all views to database, delete file

### High Priority Issues 🟡

3. **30+ TODOs** - Incomplete features
   - AdminDashboard - hardcoded MRR, project count
   - AdminProUsers - missing CSV export
   - AIProviderSettings - unencrypted API keys ⚠️
   - useBackups - no actual backup function

4. **Hardcoded Metrics**
   - DashboardView - 85% utilization (fake)
   - MorningBriefingView - $25,000 burn rate (fake)
   - ML Services - mock cache hit rates, execution times

## Refactoring Plan (6 Phases)

| Phase | Focus | Effort | Files |
|-------|-------|--------|-------|
| 1 | Database Schema for AI Agents | 8 hrs | 1 migration |
| 2 | Backend Service Layer | 10 hrs | 2 services, 2 hooks |
| 3 | Update Edge Function | 6 hrs | 1 Edge Function |
| 4 | Admin UI for AI Agents | 12 hrs | 1 admin page |
| 5 | Eliminate Mock Data | 10 hrs | 9 views + delete mockData.ts |
| 6 | Resolve TODOs | 6 hrs | 6 files |

**Total:** 52 hours (~1.5 months part-time)

## AI Agents - Before & After

**Before (Hardcoded):**
```typescript
// types/ai-agents.ts
export const AGENT_DISPLAY_INFO = { 
  scheduler: {...},
  finance: {...},
  // ... hardcoded
}
```

**After (Database):**
```sql
SELECT * FROM ai_agents WHERE is_active = true;
-- 11 rows, fully configurable via Admin UI
```

## Quick Wins (< 2 hours each)

1. Encrypt API keys in `AIProviderSettings` - 1hr
2. Implement CSV export in `AdminProUsers` - 30min
3. Wire AdminDashboard MRR to database - 1hr
4. Fix `@ts-ignore` in `useStrategicInsights` - 15min

## Files to Modify

**Phase 1:**
- ` supabase/migrations/[new]_ai_agent_system.sql`

**Phase 2:**
- `src/services/aiAgentService.ts` (NEW)
- `src/hooks/useAIAgents.ts` (NEW)

**Phase 3:**
- `supabase/functions/ai-orchestrator/index.ts` (MODIFY)

**Phase 4:**
- `src/components/admin/pages/AdminAIAgents.tsx` (NEW)

**Phase 5:**
- `src/data/mockData.ts` (DELETE)
- 9 view components (MODIFY)

**Phase 6:**
- 6 files with TODOs (MODIFY)

## Next Steps

1. Review full plan: `/brain/hardcoded_refactoring_plan.md`
2. Approve or request changes
3. Create feature branch: `feature/refactor-ai-agents`
4. Start Phase 1 (or Quick Wins)

## Risk Mitigation

- **Feature Flag:** `USE_DB_AI_AGENTS` for gradual rollout
- **Parallel Run:** Keep mockData.ts for 1 sprint during migration
- **Monitoring:** Track AI response times, error rates
- **Rollback Plan:** SQL to drop tables, restore files from Git

## Success Metrics

| Metric | Before | Target |
|--------|--------|--------|
| Hardcoded Agents | 11 | 0 |
| Mock Data Lines | 918 | 0 |
| TODOs | 30+ | <5 |
| Fake Data Views | ~15 | 0 |

---

**Full detailed plan with SQL, code samples, and UI mockups:**
`/Users/mbjunaid/.gemini/antigravity/brain/6de4c1fd-47e9-49b2-923f-9b3b2aa420fd/hardcoded_refactoring_plan.md`
