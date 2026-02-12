#!/bin/bash

# Stripe Advanced Features Deployment Script
# Deploys migrations and Edge Functions

set -e

echo "🚀 Deploying Stripe Advanced Features..."
echo ""

# Check Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Install it first:"
    echo "   brew install supabase/tap/supabase"
    exit 1
fi

echo "📋 Step 1: Applying Database Migrations"
echo "----------------------------------------"

# Apply invoice management migration
echo "Applying invoice_management migration..."
supabase db push --include-all

echo "✅ Migrations applied successfully"
echo ""

echo "🔧 Step 2: Deploying Edge Functions"
echo "------------------------------------"

# Deploy create-portal-session
echo "Deploying create-portal-session..."
supabase functions deploy create-portal-session

# Redeploy stripe-webhook with invoice sync
echo "Deploying stripe-webhook (enhanced)..."
supabase functions deploy stripe-webhook

# Deploy create-checkout-session (if not already)
echo "Deploying create-checkout-session..."
supabase functions deploy create-checkout-session

echo "✅ Edge Functions deployed successfully"
echo ""

echo "🔑 Step 3: Setting Secrets"
echo "---------------------------"
echo "Please ensure the following secrets are set:"
echo ""
echo "  supabase secrets set STRIPE_SECRET_KEY=sk_test_xxxxx"
echo "  supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxx"
echo ""
echo "Run the above commands with your actual keys"
echo ""

echo "✅ Deployment Complete!"
echo ""
echo "📖 Next Steps:"
echo "  1. Configure Stripe webhook in dashboard"
echo "     URL: https://your-project.supabase.co/functions/v1/stripe-webhook"
echo "     Events: checkout.session.completed, customer.subscription.*, invoice.*"
echo ""
echo "  2. Enable Stripe Customer Portal:"
echo "     Dashboard → Settings → Billing → Customer Portal"
echo ""
echo "  3. Test the integration:"
echo "     - Create a test subscription"
echo "     - Check invoice sync"
echo "     - Test customer portal"
echo ""
echo "  4. View analytics in admin dashboard"
