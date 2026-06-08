#!/bin/bash

# Database Migration Script for Supabase
# This script applies all migrations from supabase/migrations/ to your remote Supabase instance

set -e  # Exit on error

echo "🚀 Starting database migration process..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found${NC}"
    echo "Please create a .env file with your Supabase credentials"
    exit 1
fi

# Load environment variables
source .env

# Extract project ref from VITE_SUPABASE_URL
PROJECT_REF=$(echo $VITE_SUPABASE_URL | sed -n 's/.*\/\/\([^.]*\).*/\1/p')

if [ -z "$PROJECT_REF" ]; then
    echo -e "${RED}❌ Error: Could not extract project reference from VITE_SUPABASE_URL${NC}"
    exit 1
fi

echo -e "${GREEN}📋 Project Reference: $PROJECT_REF${NC}"

# Check if supabase CLI is installed
if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ Error: npx not found. Please install Node.js${NC}"
    exit 1
fi

# Link to Supabase project (if not already linked)
echo -e "${YELLOW}🔗 Linking to Supabase project...${NC}"
npx supabase link --project-ref $PROJECT_REF || {
    echo -e "${YELLOW}⚠️  Project may already be linked or link failed${NC}"
}

# Apply migrations
echo -e "${YELLOW}📤 Pushing migrations to remote database...${NC}"
npx supabase db push

# Verify migration
echo -e "${GREEN}✅ Migration completed successfully!${NC}"
echo ""
echo "To verify, check your Supabase dashboard:"
echo "https://supabase.com/dashboard/project/$PROJECT_REF/editor"
