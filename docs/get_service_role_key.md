# 🔐 Getting Your Supabase Service Role Key

## Step-by-Step Instructions

### 1. Go to Supabase Dashboard
Visit: https://supabase.com/dashboard/project/wmnfuwmjauslyqqucmov/settings/api

### 2. Find the Service Role Key
- Scroll down to **"Project API keys"** section
- Look for the key labeled **"service_role"**
- It's a long JWT token starting with `eyJ...`
- **NOT** the "anon" key (you already have that)

### 3. Copy the Key
- Click the copy icon next to the service_role key
- It should look like:
  ```
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtbmZ1d21qYXVzbHlxcXVjbW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTYwNDg5OSwiZXhwIjoyMDg1MTgwODk5fQ.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
  ```

### 4. Update .env File
Replace line 21 in `.env`:

**Before:**
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**After:**
```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtbmZ1d21qYXVzbHlxcXVjbW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTYwNDg5OSwiZXhwIjoyMDg1MTgwODk5fQ.YOUR_ACTUAL_KEY_HERE
```

### 5. Save the File

### 6. Run Migration
```bash
node scripts/deploy_ai_credits_migration.cjs
```

---

## ⚠️ Security Warning

**The service_role key has FULL DATABASE ACCESS!**

- ✅ Use it ONLY for server-side operations
- ✅ NEVER expose it in client-side code
- ✅ NEVER commit it to git
- ✅ Keep it secret!

---

## Expected Output

When migration runs successfully, you should see:

```
🔌 Connecting to database...
✅ Connected successfully

📝 Running AI Credits migration...
✅ Migration completed successfully!

🔍 Verifying tables...
✅ Table ai_credits verified (0 rows)
✅ Table ai_usage_logs verified (0 rows)
✅ Table ai_credit_purchases verified (0 rows)
✅ Table ai_credit_pricing verified (4 rows)

✅ 4 pricing tiers loaded:
   - Starter: 100 credits for $10 (0% discount)
   - Professional: 500 credits for $45 (10% discount)
   - Business: 1000 credits for $80 (20% discount)
   - Enterprise: 5000 credits for $350 (30% discount)

🎉 AI Credits system deployed successfully!
```

---

## Troubleshooting

**Error: "Invalid API key"**
- Make sure you copied the **service_role** key, not the anon key
- Check for extra spaces or line breaks
- Verify the key starts with `eyJ`

**Error: "Permission denied"**
- The service_role key should have full access
- Try regenerating the key in Supabase dashboard

**Error: "Table already exists"**
- The migration has already been run
- You can safely ignore this if tables exist
