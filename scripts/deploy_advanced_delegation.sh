#!/bin/bash

# Deploy advanced delegation features migration
# This script applies the migration directly to the Supabase database

echo "🚀 Deploying advanced delegation features migration..."
echo ""

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Migration file
MIGRATION_FILE="supabase/migrations/advanced_delegation_features.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Migration file not found: $MIGRATION_FILE"
    exit 1
fi

echo "📄 Migration file: $MIGRATION_FILE"
echo "📍 Supabase URL: $VITE_SUPABASE_URL"
echo ""

# Option 1: Use Supabase CLI (if linked)
echo "Attempting to deploy via Supabase CLI..."
supabase db push

# If that fails, provide manual instructions
if [ $? -ne 0 ]; then
    echo ""
    echo "⚠️  Supabase CLI deployment failed."
    echo ""
    echo "📋 Manual deployment options:"
    echo ""
    echo "Option 1: Supabase Dashboard"
    echo "  1. Go to: https://supabase.com/dashboard/project/wmnfuwmjauslyqqucmov/sql/new"
    echo "  2. Copy the contents of: $MIGRATION_FILE"
    echo "  3. Paste and run the SQL"
    echo ""
    echo "Option 2: psql command line"
    echo "  psql \$DATABASE_URL < $MIGRATION_FILE"
    echo ""
    echo "Option 3: Node.js script with pg library"
    echo "  npx tsx scripts/deploy_delegation_migration_pg.ts"
    echo ""
fi
