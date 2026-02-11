
    ml_predictions: {
      Row: {
        id: string;
        project_id: string;
        prediction_type: string;
        prediction_data: Json;
        confidence_score: number;
        created_at: string;
        expires_at: string;
        created_by: string | null;
      };
      Insert: {
        id?: string;
        project_id: string;
        prediction_type: string;
        prediction_data: Json;
        confidence_score: number;
        created_at?: string;
        expires_at?: string;
        created_by?: string | null;
      };
      Update: {
        id?: string;
        project_id?: string;
        prediction_type?: string;
        prediction_data?: Json;
        confidence_score?: number;
        created_at?: string;
        expires_at?: string;
        created_by?: string | null;
      };
      Relationships: [
        {
          foreignKeyName: "ml_predictions_project_id_fkey";
          columns: ["project_id"];
          isOneToOne: false;
          referencedRelation: "projects";
          referencedColumns: ["id"];
        }
      ];
    };
   ml_model_metadata: {
      Row: {
        id: string;
        model_type: string;
        model_version: string;
        algorithm: string;
        accuracy_metrics: Json;
        is_active: boolean;
        training_date: string;
        training_data_period_start: string | null;
        training_data_period_end: string | null;
        hyperparameters: Json | null;
        feature_importance: Json | null;
        validation_score: number | null;
        created_at: string;
        created_by: string | null;
      };
      Insert: {
        id?: string;
        model_type: string;
        model_version: string;
        algorithm: string;
        accuracy_metrics: Json;
        is_active?: boolean;
        training_date?: string;
        training_data_period_start?: string | null;
        training_data_period_end?: string | null,
        hyperparameters?: Json | null;
        feature_importance?: Json | null;
        validation_score?: number | null;
        created_at?: string;
        created_by?: string | null;
      };
      Update: {
        id?: string;
        model_type?: string;
        model_version?: string;
        algorithm?: string;
        accuracy_metrics?: Json;
        is_active?: boolean;
        training_date?: string;
        training_data_period_start?: string | null;
        training_data_period_end?: string | null;
        hyperparameters?: Json | null;
        feature_importance?: Json | null;
        validation_score?: number | null;
        created_at?: string;
        created_by?: string | null;
      };
      Relationships: [];
    };
    ml_training_data: {
      Row: {
        id: string;
        project_id: string;
        snapshot_date: string;
        snapshot_data: Json;
        data_quality_score: number;
        created_at: string;
      };
      Insert: {
        id?: string;
        project_id: string;
        snapshot_date?: string;
        snapshot_data: Json;
        data_quality_score: number;
        created_at?: string;
      
    ml_retraining_jobs: {
      Row: {
        id: string;
        model_type: string;
        status: string;
        started_at: string | null;
        completed_at: string | null;
        training_samples_count: number | null;
        new_model_id: string | null;
        accuracy_before: number | null;
        accuracy_after: number | null;
        improvement_percent: number | null;
        error_message: string | null;
        training_config: Json | null;
        created_at: string;
        created_by: string | null;
      };
      Insert: {
        id?: string;
        model_type: string;
        status: string;
        started_at?: string | null;
        completed_at?: string | null;
        training_samples_count?: number | null;
        new_model_id?: string | null;
        accuracy_before?: number | null;
        accuracy_after?: number | null;
        improvement_percent?: number | null;
        error_message?: string | null;
        training_config?: Json | null;
        created_at?: string;
        created_by?: string | null;
      };
      Update: {
        id?: string;
        model_type?: string;
        status?: string;
        started_at?: string | null;
        completed_at?: string | null;
        training_samples_count?: number | null;
        new_model_id?: string | null;
        accuracy_before?: number | null;
        accuracy_after?: number | null;
        improvement_percent?: number | null;
        error_message?: string | null;
        training_config?: Json | null;
        created_at?: string;
        created_by?: string | null;
      };
      Relationships: [
        {
          foreignKeyName: "ml_retraining_jobs_new_model_id_fkey";
          columns: ["new_model_id"];
          isOneToOne: false;
          referencedRelation: "ml_model_metadata";
          referencedColumns: ["id"];
        }
      ];
    };
    ml_accuracy_logs: {
      Row: {
        id: string;
        prediction_id: string | null;
        model_id: string | null;
        model_type: string;
        predicted_value: Json;
        actual_value: Json;
        accuracy_score: number | null;
        deviation_percent: number | null;
        is_within_threshold: boolean | null;
        notes: string | null;
        logged_at: string;
        logged_by: string | null;
      };
      Insert: {
        id?: string;
        prediction_id?: string | null;
        model_id?: string | null;
        model_type: string;
        predicted_value: Json;
        actual_value: Json;
        accuracy_score?: number | null;
        deviation_percent?: number | null;
        is_within_threshold?: boolean | null;
        notes?: string | null;
        logged_at?: string;
        logged_by?: string | null;
      };
      Update: {
        id?: string;
        prediction_id?: string | null;
        model_id?: string | null;
        model_type?: string;
        predicted_value?: Json;
        actual_value?: Json;
        accuracy_score?: number | null;
        deviation_percent?: number | null;
        is_within_threshold?: boolean | null;
        notes?: string | null;
        logged_at?: string;
        logged_by?: string | null;
      };
      Relationships: [
        {
          foreignKeyName: "ml_accuracy_logs_prediction_id_fkey";
          columns: ["prediction_id"];
          isOneToOne: false;
          referencedRelation: "ml_predictions";
          referencedColumns: ["id"];
        },
        {
          foreignKeyName: "ml_accuracy_logs_model_id_fkey";
          columns: ["model_id"];
          isOneToOne: false;
          referencedRelation: "ml_model_metadata";
          referencedColumns: ["id"];
        }
      ];
    };
    ml_alerts: {
      Row: {
        id: string;
        model_type: string;
        alert_type: string;
        severity: string;
        title: string;
        message: string;
        metadata: Json | null;
        is_acknowledged: boolean;
        acknowledged_by: string | null;
        acknowledged_at: string | null;
        created_at: string;
      };
      Insert: {
        id?: string;
        model_type: string;
        alert_type: string;
        severity: string;
        title: string;
        message: string;
        metadata?: Json | null;
        is_acknowledged?: boolean;
        acknowledged_by?: string | null;
        acknowledged_at?: string | null;
        created_at?: string;
      };
      Update: {
        id?: string;
        model_type?: string;
        alert_type?: string;
        severity?: string;
        title?: string;
        message?: string;
        metadata?: Json | null;
        is_acknowledged?: boolean;
        acknowledged_by?: string | null;
        acknowledged_at?: string | null;
        created_at?: string;
      };
      Relationships: [];
    };
};
      Update: {
        id?: string;
        project_id?: string;
        snapshot_date?: string;
        snapshot_data?: Json;
        data_quality_score?: number;
        created_at?: string;
      };
      Relationships: [
        {
          foreignKeyName: "ml_training_data_project_id_fkey";
          columns: ["project_id"];
          isOneToOne: false;
          referencedRelation: "projects";
          referencedColumns: ["id"];
        }
      ];
    };

// =============================================
// ADMIN PANEL TYPES
// Generated: 2026-02-11T21:28:19.295Z
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
