#!/usr/bin/env bash
# Deploy AI Agent Migration via PostgreSQL

set -e

echo "🚀 Deploying AI Agent System Migration..."
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ psql not found. Installing via Homebrew..."
    brew install postgresql
fi

# Database credentials from .env
DATABASE_URL="postgresql://postgres:ZjcJszLxFbP4YiE3@db.rlnaylyjxjjaqzwpuhar.supabase.co:5432/postgres"

echo "📄 Executing migration..."
psql "$DATABASE_URL" -f supabase/migrations/20260212142800_ai_agent_system.sql

echo ""
echo "🔍 Verifying deployment..."
echo ""

# Verify agents table
echo "Checking ai_agents table..."
psql "$DATABASE_URL" -c "SELECT COUNT(*) as total_agents FROM ai_agents;"

echo ""
echo "Listing all agents..."
psql "$DATABASE_URL" -c "SELECT agent_type, label, model_provider FROM ai_agents ORDER BY agent_type;"

echo ""
echo "Checking capabilities..."
psql "$DATABASE_URL" -c "SELECT COUNT(*) as total_capabilities FROM ai_agent_capabilities;"

echo ""
echo "============================================================"
echo "✅ DEPLOYMENT SUCCESSFUL!"
echo "============================================================"
echo ""
echo "📊 Tables Created:"
echo "   - ai_agents"
echo "   - ai_agent_capabilities"
echo "   - ai_agent_settings"
echo "   - ai_agent_versions"
echo ""
echo "🎯 Next: Phase 3 - Update Edge Function"
echo ""
