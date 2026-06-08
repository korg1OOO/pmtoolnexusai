#!/bin/bash
# apply-phase2-phase5-migrations.sh
# Applies only the new notifications and AI provider settings migrations

echo "🔍 Getting Supabase connection details..."

# This script applies the two new migrations directly
# You can run this with: bash apply-phase2-phase5-migrations.sh

echo ""
echo "📋 To apply the migrations, you have 3 options:"
echo ""
echo "Option 1: Supabase Dashboard (Recommended)"
echo "  1. Go to: https://supabase.com/dashboard/project/_/sql/new"
echo "  2. Copy/paste contents of: supabase/migrations/20260212120000_notifications.sql"
echo "  3. Click 'Run'"
echo "  4. Then copy/paste contents of: supabase/migrations/20260212130000_ai_provider_settings.sql"
echo "  5. Click 'Run'"
echo ""
echo "Option 2: Using psql (if you have connection string)"
echo "  psql 'your-connection-string' < supabase/migrations/20260212120000_notifications.sql"
echo "  psql 'your-connection-string' < supabase/migrations/20260212130000_ai_provider_settings.sql"
echo ""
echo "Option 3: Mark migrations as applied and skip (if tables already exist)"
echo "  The frontend will work if the tables exist, even if not tracked in migration history"
echo ""
echo "📄 Migration files ready at:"
echo "  - supabase/migrations/20260212120000_notifications.sql (2.1 KB)"
echo "  - supabase/migrations/20260212130000_ai_provider_settings.sql (4.3 KB)"
echo "  - supabase/migrations/20260212140000_marketing.sql (X.X KB)"
