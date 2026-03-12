# Security Fixes — Items 2, 3, 4

## Fix 2: .env → .gitignore + secrets to .env.local
- [ ] Add .env, *.local, .env.exampleLocal, .env.exampleProd to .gitignore
- [ ] Create .env.local with secrets
- [ ] Strip .env to public-only values
- [ ] Scrub .env.exampleLocal to use placeholders

## Fix 3: ai-integration.ts → Edge Function proxy
- [ ] Rewrite callOpenAI and callGoogleAI to use supabase.functions.invoke('ai-proxy')
- [ ] Remove VITE_OPENAI_API_KEY and VITE_GOOGLE_AI_API_KEY references

## Fix 4: SUPABASE_SERVICE_ROLE_KEY removed from frontend env
- [ ] Remove from .env (done via Fix 2)
- [ ] Add warning comment in .env.exampleLocal

## Verification
- [ ] grep confirms no live secrets in tracked files
- [ ] Build passes (exit 0)
