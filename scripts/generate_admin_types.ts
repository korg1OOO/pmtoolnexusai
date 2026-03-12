/**
 * Generate TypeScript types for admin tables
 * Appends types to supabase types file
 */

import { writeFileSync } from 'fs';
import { join } from 'path';

const adminTypes = `
// =============================================
// ADMIN PANEL TYPES
// Generated: ${new Date().toISOString()}
// =============================================

export interface Subscription {
  id: string;
  user_id: string;
  tier: 'pro' | 'business' | 'agency';
  status: 'active' | 'cancelled' | 'past_due' | 'paused' | 'trialing';
  billing_cycle: 'monthly' | 'annual' | 'lifetime';
  mrr: number;
  currency: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  stripe_price_id?: string;
  current_period_start?: string;
  current_period_end?: string;
  trial_end?: string;
  cancelled_at?: string;
  usage_limit_articles?: number;
  usage_current_articles: number;
  usage_reset_at?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface DiscountCode {
  id: string;
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  min_purchase_amount?: number;
  max_discount_amount?: number;
  applicable_tiers: string[];
  applicable_billing_cycles: string[];
  max_uses?: number;
  max_uses_per_user: number;
  used_count: number;
  valid_from: string;
  valid_until?: string;
  is_active: boolean;
  created_by?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface DiscountCodeUsage {
  id: string;
  discount_code_id: string;
  user_id: string;
  subscription_id?: string;
  discount_amount: number;
  original_amount: number;
  final_amount: number;
  used_at: string;
}

export interface LicenseKey {
  id: string;
  key: string;
  key_prefix?: string;
  license_type: 'trial' | 'pro' | 'business' | 'agency' | 'enterprise' | 'lifetime';
  user_id?: string;
  assigned_email?: string;
  is_active: boolean;
  is_redeemed: boolean;
  activated_at?: string;
  expires_at?: string;
  max_activations: number;
  activation_count: number;
  device_fingerprints: any[];
  notes?: string;
  metadata: Record<string, any>;
  created_by?: string;
  source?: string;
  created_at: string;
  updated_at: string;
}

export interface LicenseKeyActivation {
  id: string;
  license_key_id: string;
  device_fingerprint?: string;
  device_name?: string;
  ip_address?: string;
  user_agent?: string;
  is_active: boolean;
  deactivated_at?: string;
  deactivation_reason?: string;
  activated_at: string;
}

// Export all admin types together
export type AdminTables = {
  subscriptions: Subscription;
  discount_codes: DiscountCode;
  discount_code_usage: DiscountCodeUsage;
  license_keys: LicenseKey;
  license_key_activations: LicenseKeyActivation;
};
`;

const typesPath = join(process.cwd(), 'src/integrations/supabase/types.ts');

try {
    console.log('📝 Appending admin types to Supabase types file...');
    writeFileSync(typesPath, adminTypes, { flag: 'a' });
    console.log('✅ Admin types appended successfully!');
    console.log(`📄 File: ${typesPath}`);
} catch (error) {
    console.error('❌ Error appending types:', error);
    process.exit(1);
}
