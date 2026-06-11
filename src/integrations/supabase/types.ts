export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ab_test_variants: {
        Row: {
          campaign_id: string | null
          content: Json
          created_at: string | null
          id: string
          is_winner: boolean | null
          subject: string | null
          traffic_percentage: number | null
          variant_name: string
        }
        Insert: {
          campaign_id?: string | null
          content?: Json
          created_at?: string | null
          id?: string
          is_winner?: boolean | null
          subject?: string | null
          traffic_percentage?: number | null
          variant_name: string
        }
        Update: {
          campaign_id?: string | null
          content?: Json
          created_at?: string | null
          id?: string
          is_winner?: boolean | null
          subject?: string | null
          traffic_percentage?: number | null
          variant_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "ab_test_variants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_performance_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ab_test_variants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      actions: {
        Row: {
          blocked_by: string | null
          completed_at: string | null
          created_at: string
          created_by_id: string | null
          created_by_name: string | null
          custom_fields: Json | null
          dependencies: Json | null
          description: string | null
          due_date: string | null
          history: Json | null
          id: string
          linked_items: Json | null
          notes: string | null
          owner_id: string | null
          owner_name: string | null
          priority: Database["public"]["Enums"]["priority_level"] | null
          progress: number | null
          project_id: string | null
          sla_breached: boolean | null
          sla_breached_at: string | null
          sla_started_at: string | null
          sla_target_hours: number | null
          source_id: string | null
          source_title: string | null
          source_type: string | null
          status: Database["public"]["Enums"]["action_status"] | null
          tags: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          blocked_by?: string | null
          completed_at?: string | null
          created_at?: string
          created_by_id?: string | null
          created_by_name?: string | null
          custom_fields?: Json | null
          dependencies?: Json | null
          description?: string | null
          due_date?: string | null
          history?: Json | null
          id?: string
          linked_items?: Json | null
          notes?: string | null
          owner_id?: string | null
          owner_name?: string | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          progress?: number | null
          project_id?: string | null
          sla_breached?: boolean | null
          sla_breached_at?: string | null
          sla_started_at?: string | null
          sla_target_hours?: number | null
          source_id?: string | null
          source_title?: string | null
          source_type?: string | null
          status?: Database["public"]["Enums"]["action_status"] | null
          tags?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          blocked_by?: string | null
          completed_at?: string | null
          created_at?: string
          created_by_id?: string | null
          created_by_name?: string | null
          custom_fields?: Json | null
          dependencies?: Json | null
          description?: string | null
          due_date?: string | null
          history?: Json | null
          id?: string
          linked_items?: Json | null
          notes?: string | null
          owner_id?: string | null
          owner_name?: string | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          progress?: number | null
          project_id?: string | null
          sla_breached?: boolean | null
          sla_breached_at?: string | null
          sla_started_at?: string | null
          sla_target_hours?: number | null
          source_id?: string | null
          source_title?: string | null
          source_type?: string | null
          status?: Database["public"]["Enums"]["action_status"] | null
          tags?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "actions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      active_presentations: {
        Row: {
          activated_at: string
          created_at: string
          id: string
          presentation_id: string
          user_id: string
        }
        Insert: {
          activated_at?: string
          created_at?: string
          id?: string
          presentation_id: string
          user_id: string
        }
        Update: {
          activated_at?: string
          created_at?: string
          id?: string
          presentation_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "active_presentations_presentation_id_fkey"
            columns: ["presentation_id"]
            isOneToOne: false
            referencedRelation: "presentations"
            referencedColumns: ["id"]
          },
        ]
      }
      adkar_assessments: {
        Row: {
          ability_score: number
          assessment_date: string
          assessor: string
          awareness_score: number
          business_unit: string
          created_at: string | null
          desire_score: number
          id: string
          knowledge_score: number
          module_stream: string
          notes: string | null
          overall_score: number | null
          project_id: string
          reinforcement_score: number
        }
        Insert: {
          ability_score: number
          assessment_date: string
          assessor: string
          awareness_score: number
          business_unit: string
          created_at?: string | null
          desire_score: number
          id?: string
          knowledge_score: number
          module_stream: string
          notes?: string | null
          overall_score?: number | null
          project_id: string
          reinforcement_score: number
        }
        Update: {
          ability_score?: number
          assessment_date?: string
          assessor?: string
          awareness_score?: number
          business_unit?: string
          created_at?: string | null
          desire_score?: number
          id?: string
          knowledge_score?: number
          module_stream?: string
          notes?: string | null
          overall_score?: number | null
          project_id?: string
          reinforcement_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "adkar_assessments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_activity_log: {
        Row: {
          action: string
          action_type: string
          created_at: string | null
          id: string
          metadata: Json | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          action_type: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          action_type?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admin_activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
        ]
      }
      admin_logs: {
        Row: {
          action_type: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          target_id: string | null
          target_type: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      admin_roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_system_role: boolean | null
          name: string
          permissions: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_system_role?: boolean | null
          name: string
          permissions?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_system_role?: boolean | null
          name?: string
          permissions?: Json
          updated_at?: string
        }
        Relationships: []
      }
      admin_services: {
        Row: {
          created_at: string
          health_data: Json | null
          id: string
          last_check_at: string | null
          name: string
          status: string | null
          type: string | null
          updated_at: string
          uptime_percentage: number | null
        }
        Insert: {
          created_at?: string
          health_data?: Json | null
          id?: string
          last_check_at?: string | null
          name: string
          status?: string | null
          type?: string | null
          updated_at?: string
          uptime_percentage?: number | null
        }
        Update: {
          created_at?: string
          health_data?: Json | null
          id?: string
          last_check_at?: string | null
          name?: string
          status?: string | null
          type?: string | null
          updated_at?: string
          uptime_percentage?: number | null
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          granted_at: string
          granted_by: string | null
          notes: string | null
          revoked_at: string | null
          revoked_by: string | null
          role_id: string
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          notes?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          role_id: string
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          notes?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_users_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admin_users_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
          {
            foreignKeyName: "admin_users_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admin_users_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
          {
            foreignKeyName: "admin_users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "admin_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admin_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
        ]
      }
      affiliate_payouts: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          notes: string | null
          payout_method: string | null
          processed_at: string | null
          referral_code_id: string | null
          status: string | null
          transaction_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          notes?: string | null
          payout_method?: string | null
          processed_at?: string | null
          referral_code_id?: string | null
          status?: string | null
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          notes?: string | null
          payout_method?: string | null
          processed_at?: string | null
          referral_code_id?: string | null
          status?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_payouts_referral_code_id_fkey"
            columns: ["referral_code_id"]
            isOneToOne: false
            referencedRelation: "affiliate_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_payouts_referral_code_id_fkey"
            columns: ["referral_code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_referrals: {
        Row: {
          affiliate_id: string | null
          amount: number | null
          commission: number | null
          converted_at: string | null
          created_at: string
          id: string
          referred_user_id: string | null
          status: string | null
        }
        Insert: {
          affiliate_id?: string | null
          amount?: number | null
          commission?: number | null
          converted_at?: string | null
          created_at?: string
          id?: string
          referred_user_id?: string | null
          status?: string | null
        }
        Update: {
          affiliate_id?: string | null
          amount?: number | null
          commission?: number | null
          converted_at?: string | null
          created_at?: string
          id?: string
          referred_user_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_referrals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          code: string | null
          commission_rate: number | null
          created_at: string
          email: string | null
          id: string
          metadata: Json | null
          name: string | null
          payout_method: string | null
          status: string | null
          total_earnings: number | null
          total_referrals: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          code?: string | null
          commission_rate?: number | null
          created_at?: string
          email?: string | null
          id?: string
          metadata?: Json | null
          name?: string | null
          payout_method?: string | null
          status?: string | null
          total_earnings?: number | null
          total_referrals?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          code?: string | null
          commission_rate?: number | null
          created_at?: string
          email?: string | null
          id?: string
          metadata?: Json | null
          name?: string | null
          payout_method?: string | null
          status?: string | null
          total_earnings?: number | null
          total_referrals?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ai_agent_capabilities: {
        Row: {
          agent_id: string
          capability_key: string
          created_at: string | null
          description: string | null
          id: string
          requires_role: string[] | null
        }
        Insert: {
          agent_id: string
          capability_key: string
          created_at?: string | null
          description?: string | null
          id?: string
          requires_role?: string[] | null
        }
        Update: {
          agent_id?: string
          capability_key?: string
          created_at?: string | null
          description?: string | null
          id?: string
          requires_role?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_capabilities_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agent_logs: {
        Row: {
          agent_type: string
          conversation_id: string | null
          created_at: string | null
          error_message: string | null
          execution_time_ms: number | null
          id: string
          input_data: Json | null
          output_data: Json | null
          success: boolean | null
        }
        Insert: {
          agent_type: string
          conversation_id?: string | null
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          success?: boolean | null
        }
        Update: {
          agent_type?: string
          conversation_id?: string | null
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          success?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_logs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agent_settings: {
        Row: {
          agent_id: string
          created_at: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_settings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agent_versions: {
        Row: {
          agent_id: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          model_name: string | null
          model_provider: string | null
          performance_metrics: Json | null
          system_prompt: string | null
          version: number
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          model_name?: string | null
          model_provider?: string | null
          performance_metrics?: Json | null
          system_prompt?: string | null
          version: number
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          model_name?: string | null
          model_provider?: string | null
          performance_metrics?: Json | null
          system_prompt?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_versions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agent_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ai_agent_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
        ]
      }
      ai_agents: {
        Row: {
          agent_type: string
          color: string
          created_at: string | null
          description: string | null
          icon: string
          id: string
          is_active: boolean | null
          label: string
          max_tokens: number | null
          model_name: string | null
          model_provider: string | null
          system_prompt: string | null
          temperature: number | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          agent_type: string
          color: string
          created_at?: string | null
          description?: string | null
          icon: string
          id?: string
          is_active?: boolean | null
          label: string
          max_tokens?: number | null
          model_name?: string | null
          model_provider?: string | null
          system_prompt?: string | null
          temperature?: number | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          agent_type?: string
          color?: string
          created_at?: string | null
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean | null
          label?: string
          max_tokens?: number | null
          model_name?: string | null
          model_provider?: string | null
          system_prompt?: string | null
          temperature?: number | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: []
      }
      ai_budgets: {
        Row: {
          alert_threshold: number | null
          budget_type: string
          created_at: string
          end_date: string | null
          id: string
          is_active: boolean | null
          limit_usd: number
          name: string
          period: string
          start_date: string
          target_id: string | null
          updated_at: string
        }
        Insert: {
          alert_threshold?: number | null
          budget_type: string
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          limit_usd: number
          name: string
          period: string
          start_date: string
          target_id?: string | null
          updated_at?: string
        }
        Update: {
          alert_threshold?: number | null
          budget_type?: string
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          limit_usd?: number
          name?: string
          period?: string
          start_date?: string
          target_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          created_at: string | null
          id: string
          project_id: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_cost_records: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          period_end: string | null
          period_start: string | null
          provider: string | null
          request_count: number | null
          total_cost: number | null
          total_tokens: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          period_end?: string | null
          period_start?: string | null
          provider?: string | null
          request_count?: number | null
          total_cost?: number | null
          total_tokens?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          period_end?: string | null
          period_start?: string | null
          provider?: string | null
          request_count?: number | null
          total_cost?: number | null
          total_tokens?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_credit_adjustments: {
        Row: {
          adjusted_by: string | null
          amount: number
          created_at: string
          id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          adjusted_by?: string | null
          amount: number
          created_at?: string
          id?: string
          reason?: string | null
          user_id: string
        }
        Update: {
          adjusted_by?: string | null
          amount?: number
          created_at?: string
          id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_credit_pricing: {
        Row: {
          created_at: string | null
          credits: number
          currency: string | null
          description: string | null
          discount_percentage: number | null
          display_order: number | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          is_popular: boolean | null
          price: number
          tier_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          credits: number
          currency?: string | null
          description?: string | null
          discount_percentage?: number | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_popular?: boolean | null
          price: number
          tier_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          credits?: number
          currency?: string | null
          description?: string | null
          discount_percentage?: number | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_popular?: boolean | null
          price?: number
          tier_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_credit_purchases: {
        Row: {
          amount_paid: number
          applied_at: string | null
          credits_purchased: number
          currency: string | null
          id: string
          payment_id: string | null
          payment_method: string | null
          payment_status: string | null
          purchased_at: string | null
          tenant_id: string
          user_id: string
        }
        Insert: {
          amount_paid: number
          applied_at?: string | null
          credits_purchased: number
          currency?: string | null
          id?: string
          payment_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          purchased_at?: string | null
          tenant_id: string
          user_id: string
        }
        Update: {
          amount_paid?: number
          applied_at?: string | null
          credits_purchased?: number
          currency?: string | null
          id?: string
          payment_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          purchased_at?: string | null
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_credit_purchases_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_credit_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ai_credit_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
        ]
      }
      ai_credits: {
        Row: {
          auto_recharge_amount: number | null
          auto_recharge_enabled: boolean | null
          auto_recharge_threshold: number | null
          available_credits: number | null
          created_at: string | null
          id: string
          last_recharged_at: string | null
          low_balance_threshold: number | null
          monthly_credits_granted_at: string | null
          tenant_id: string
          total_credits: number
          updated_at: string | null
          used_credits: number
          user_id: string | null
        }
        Insert: {
          auto_recharge_amount?: number | null
          auto_recharge_enabled?: boolean | null
          auto_recharge_threshold?: number | null
          available_credits?: number | null
          created_at?: string | null
          id?: string
          last_recharged_at?: string | null
          low_balance_threshold?: number | null
          monthly_credits_granted_at?: string | null
          tenant_id: string
          total_credits?: number
          updated_at?: string | null
          used_credits?: number
          user_id?: string | null
        }
        Update: {
          auto_recharge_amount?: number | null
          auto_recharge_enabled?: boolean | null
          auto_recharge_threshold?: number | null
          available_credits?: number | null
          created_at?: string | null
          id?: string
          last_recharged_at?: string | null
          low_balance_threshold?: number | null
          monthly_credits_granted_at?: string | null
          tenant_id?: string
          total_credits?: number
          updated_at?: string | null
          used_credits?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_credits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_credits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ai_credits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
        ]
      }
      ai_insights: {
        Row: {
          category: string
          confidence: number | null
          created_at: string | null
          description: string
          dismissed_at: string | null
          expires_at: string | null
          id: string
          is_dismissed: boolean | null
          metadata: Json | null
          project_id: string | null
          title: string
          trend: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          category: string
          confidence?: number | null
          created_at?: string | null
          description: string
          dismissed_at?: string | null
          expires_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          metadata?: Json | null
          project_id?: string | null
          title: string
          trend?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string
          confidence?: number | null
          created_at?: string | null
          description?: string
          dismissed_at?: string | null
          expires_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          metadata?: Json | null
          project_id?: string | null
          title?: string
          trend?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_insights_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_insights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ai_insights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
        ]
      }
      ai_interaction_logs: {
        Row: {
          agent_id: string | null
          created_at: string
          feedback_score: number | null
          feedback_text: string | null
          id: string
          model: string | null
          provider: string | null
          query_summary: string | null
          response_time_ms: number | null
          tokens: number | null
          user_id: string | null
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          feedback_score?: number | null
          feedback_text?: string | null
          id?: string
          model?: string | null
          provider?: string | null
          query_summary?: string | null
          response_time_ms?: number | null
          tokens?: number | null
          user_id?: string | null
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          feedback_score?: number | null
          feedback_text?: string | null
          id?: string
          model?: string | null
          provider?: string | null
          query_summary?: string | null
          response_time_ms?: number | null
          tokens?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          agent_type: string | null
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          agent_type?: string | null
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          agent_type?: string | null
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_pending_actions: {
        Row: {
          created_at: string
          diff: Json
          executed_at: string | null
          id: string
          params: Json
          status: string
          summary: string | null
          tenant_id: string | null
          tool_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          diff?: Json
          executed_at?: string | null
          id?: string
          params?: Json
          status?: string
          summary?: string | null
          tenant_id?: string | null
          tool_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          diff?: Json
          executed_at?: string | null
          id?: string
          params?: Json
          status?: string
          summary?: string | null
          tenant_id?: string | null
          tool_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_pending_actions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_pending_actions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ai_pending_actions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
        ]
      }
      ai_provider_api_keys: {
        Row: {
          created_at: string | null
          encrypted_api_key: string
          id: string
          is_configured: boolean | null
          organization_id: string | null
          provider_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          encrypted_api_key: string
          id?: string
          is_configured?: boolean | null
          organization_id?: string | null
          provider_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          encrypted_api_key?: string
          id?: string
          is_configured?: boolean | null
          organization_id?: string | null
          provider_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_provider_api_keys_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_provider_api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ai_provider_api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
        ]
      }
      ai_provider_costs: {
        Row: {
          completion_token_cost: number
          created_at: string
          effective_date: string
          id: string
          model: string
          notes: string | null
          prompt_token_cost: number
          provider: string
        }
        Insert: {
          completion_token_cost: number
          created_at?: string
          effective_date?: string
          id?: string
          model: string
          notes?: string | null
          prompt_token_cost: number
          provider: string
        }
        Update: {
          completion_token_cost?: number
          created_at?: string
          effective_date?: string
          id?: string
          model?: string
          notes?: string | null
          prompt_token_cost?: number
          provider?: string
        }
        Relationships: []
      }
      ai_provider_settings: {
        Row: {
          active_provider: string
          created_at: string | null
          fallback_enabled: boolean | null
          fallback_provider: string | null
          id: string
          organization_id: string | null
          selected_model: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          active_provider?: string
          created_at?: string | null
          fallback_enabled?: boolean | null
          fallback_provider?: string | null
          id?: string
          organization_id?: string | null
          selected_model?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          active_provider?: string
          created_at?: string | null
          fallback_enabled?: boolean | null
          fallback_provider?: string | null
          id?: string
          organization_id?: string | null
          selected_model?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_provider_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_provider_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ai_provider_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
        ]
      }
      ai_usage_logs: {
        Row: {
          completion_tokens: number
          cost_usd: number
          created_at: string
          credits_after: number | null
          credits_before: number | null
          credits_used: number | null
          duration_ms: number | null
          error_message: string | null
          feature_type: string | null
          id: string
          metadata: Json | null
          model: string
          model_name: string | null
          operation: string
          prompt_tokens: number
          provider: string
          request_duration_ms: number | null
          request_id: string | null
          success: boolean | null
          tenant_id: string | null
          total_tokens: number
          user_id: string | null
        }
        Insert: {
          completion_tokens?: number
          cost_usd?: number
          created_at?: string
          credits_after?: number | null
          credits_before?: number | null
          credits_used?: number | null
          duration_ms?: number | null
          error_message?: string | null
          feature_type?: string | null
          id?: string
          metadata?: Json | null
          model: string
          model_name?: string | null
          operation: string
          prompt_tokens?: number
          provider: string
          request_duration_ms?: number | null
          request_id?: string | null
          success?: boolean | null
          tenant_id?: string | null
          total_tokens?: number
          user_id?: string | null
        }
        Update: {
          completion_tokens?: number
          cost_usd?: number
          created_at?: string
          credits_after?: number | null
          credits_before?: number | null
          credits_used?: number | null
          duration_ms?: number | null
          error_message?: string | null
          feature_type?: string | null
          id?: string
          metadata?: Json | null
          model?: string
          model_name?: string | null
          operation?: string
          prompt_tokens?: number
          provider?: string
          request_duration_ms?: number | null
          request_id?: string | null
          success?: boolean | null
          tenant_id?: string | null
          total_tokens?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ai_usage_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
        ]
      }
      announcement_dismissals: {
        Row: {
          announcement_id: string
          dismissed_at: string | null
          user_id: string
        }
        Insert: {
          announcement_id: string
          dismissed_at?: string | null
          user_id: string
        }
        Update: {
          announcement_id?: string
          dismissed_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_dismissals_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "active_announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcement_dismissals_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcement_dismissals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "announcement_dismissals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
        ]
      }
      announcements: {
        Row: {
          created_at: string | null
          ends_at: string | null
          id: string
          is_active: boolean | null
          is_dismissible: boolean | null
          link_text: string | null
          link_url: string | null
          message: string
          starts_at: string | null
          target_audience: Json | null
          title: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          is_dismissible?: boolean | null
          link_text?: string | null
          link_url?: string | null
          message: string
          starts_at?: string | null
          target_audience?: Json | null
          title: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          is_dismissible?: boolean | null
          link_text?: string | null
          link_url?: string | null
          message?: string
          starts_at?: string | null
          target_audience?: Json | null
          title?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          key_hash: string
          last_used_at: string | null
          name: string
          prefix: string
          scopes: string[] | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          key_hash: string
          last_used_at?: string | null
          name: string
          prefix: string
          scopes?: string[] | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          key_hash?: string
          last_used_at?: string | null
          name?: string
          prefix?: string
          scopes?: string[] | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_features"
            referencedColumns: ["user_id"]
          },
        ]
      }
      approvals: {
        Row: {
          approved_at: string | null
          assignee_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          metadata: Json | null
          priority: string
          project_id: string | null
          rejected_at: string | null
          rejection_reason: string | null
          status: string
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          assignee_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          priority?: string
          project_id?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          status?: string
          title: string
          type?: string
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          assignee_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          priority?: string
          project_id?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approvals_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "user_features"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "approvals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_features"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "approvals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      assumptions: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          impact_if_wrong: string | null
          owner_name: string | null
          project_id: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          impact_if_wrong?: string | null
          owner_name?: string | null
          project_id: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          impact_if_wrong?: string | null
          owner_name?: string | null
          project_id?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assumptions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_patterns: {
        Row: {
          acceptance_rate: number | null
          attendance_rate: number | null
          avg_response_time_hours: number | null
          created_at: string | null
          id: string
          period_end: string
          period_start: string
          tenant_id: string
          total_meetings_accepted: number | null
          total_meetings_attended: number | null
          total_meetings_declined: number | null
          total_meetings_invited: number | null
          total_meetings_tentative: number | null
          total_no_shows: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          acceptance_rate?: number | null
          attendance_rate?: number | null
          avg_response_time_hours?: number | null
          created_at?: string | null
          id?: string
          period_end: string
          period_start: string
          tenant_id: string
          total_meetings_accepted?: number | null
          total_meetings_attended?: number | null
          total_meetings_declined?: number | null
          total_meetings_invited?: number | null
          total_meetings_tentative?: number | null
          total_no_shows?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          acceptance_rate?: number | null
          attendance_rate?: number | null
          avg_response_time_hours?: number | null
          created_at?: string | null
          id?: string
          period_end?: string
          period_start?: string
          tenant_id?: string
          total_meetings_accepted?: number | null
          total_meetings_attended?: number | null
          total_meetings_declined?: number | null
          total_meetings_invited?: number | null
          total_meetings_tentative?: number | null
          total_no_shows?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_patterns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "attendance_patterns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          resource: string
          severity: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource: string
          severity?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource?: string
          severity?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_features"
            referencedColumns: ["user_id"]
          },
        ]
      }
      auto_recharge_logs: {
        Row: {
          amount_attempted: number
          created_at: string | null
          credits_attempted: number
          error_message: string | null
          id: string
          payment_intent_id: string | null
          status: string
          tenant_id: string
          triggered_at: string | null
          user_id: string
        }
        Insert: {
          amount_attempted: number
          created_at?: string | null
          credits_attempted: number
          error_message?: string | null
          id?: string
          payment_intent_id?: string | null
          status: string
          tenant_id: string
          triggered_at?: string | null
          user_id: string
        }
        Update: {
          amount_attempted?: number
          created_at?: string | null
          credits_attempted?: number
          error_message?: string | null
          id?: string
          payment_intent_id?: string | null
          status?: string
          tenant_id?: string
          triggered_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auto_recharge_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auto_recharge_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "auto_recharge_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
        ]
      }
      backlog_items: {
        Row: {
          assignee_id: string | null
          assignee_name: string | null
          created_at: string
          custom_fields: Json | null
          description: string | null
          epic_id: string | null
          id: string
          key: string | null
          labels: Json | null
          priority: Database["public"]["Enums"]["priority_level"] | null
          project_id: string | null
          sort_order: number | null
          sprint_id: string | null
          status: Database["public"]["Enums"]["backlog_status"] | null
          story_points: number | null
          title: string
          type: Database["public"]["Enums"]["item_type"] | null
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          assignee_name?: string | null
          created_at?: string
          custom_fields?: Json | null
          description?: string | null
          epic_id?: string | null
          id?: string
          key?: string | null
          labels?: Json | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          project_id?: string | null
          sort_order?: number | null
          sprint_id?: string | null
          status?: Database["public"]["Enums"]["backlog_status"] | null
          story_points?: number | null
          title: string
          type?: Database["public"]["Enums"]["item_type"] | null
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          assignee_name?: string | null
          created_at?: string
          custom_fields?: Json | null
          description?: string | null
          epic_id?: string | null
          id?: string
          key?: string | null
          labels?: Json | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          project_id?: string | null
          sort_order?: number | null
          sprint_id?: string | null
          status?: Database["public"]["Enums"]["backlog_status"] | null
          story_points?: number | null
          title?: string
          type?: Database["public"]["Enums"]["item_type"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "backlog_items_epic_id_fkey"
            columns: ["epic_id"]
            isOneToOne: false
            referencedRelation: "epics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backlog_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backlog_items_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_jobs: {
        Row: {
          backup_type: string
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          error_message: string | null
          file_size: number | null
          id: string
          started_at: string | null
          status: string | null
          storage_location: string | null
        }
        Insert: {
          backup_type: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          file_size?: number | null
          id?: string
          started_at?: string | null
          status?: string | null
          storage_location?: string | null
        }
        Update: {
          backup_type?: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          file_size?: number | null
          id?: string
          started_at?: string | null
          status?: string | null
          storage_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "backup_jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "backup_jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
        ]
      }
      backup_schedules: {
        Row: {
          backup_type: string
          created_at: string | null
          cron_expression: string
          id: string
          is_active: boolean | null
          last_run_at: string | null
          name: string
          next_run_at: string | null
          retention_days: number | null
          updated_at: string | null
        }
        Insert: {
          backup_type: string
          created_at?: string | null
          cron_expression: string
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          name: string
          next_run_at?: string | null
          retention_days?: number | null
          updated_at?: string | null
        }
        Update: {
          backup_type?: string
          created_at?: string | null
          cron_expression?: string
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          name?: string
          next_run_at?: string | null
          retention_days?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backups: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          name: string | null
          size_bytes: number | null
          started_at: string | null
          status: string | null
          storage_path: string | null
          type: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          name?: string | null
          size_bytes?: number | null
          started_at?: string | null
          status?: string | null
          storage_path?: string | null
          type?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          name?: string | null
          size_bytes?: number | null
          started_at?: string | null
          status?: string | null
          storage_path?: string | null
          type?: string | null
        }
        Relationships: []
      }
      blog_post_tags: {
        Row: {
          blog_post_id: string
          blog_tag_id: string
        }
        Insert: {
          blog_post_id: string
          blog_tag_id: string
        }
        Update: {
          blog_post_id?: string
          blog_tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_tags_blog_post_id_fkey"
            columns: ["blog_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_tags_blog_post_id_fkey"
            columns: ["blog_post_id"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_tags_blog_tag_id_fkey"
            columns: ["blog_tag_id"]
            isOneToOne: false
            referencedRelation: "blog_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string | null
          category_id: string | null
          content: string
          created_at: string | null
          deleted_at: string | null
          excerpt: string | null
          featured_image_url: string | null
          id: string
          likes_count: number | null
          meta_description: string | null
          meta_keywords: string[] | null
          meta_title: string | null
          published_at: string | null
          reading_time_minutes: number | null
          scheduled_for: string | null
          slug: string
          status: string | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          author_id?: string | null
          category_id?: string | null
          content: string
          created_at?: string | null
          deleted_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          likes_count?: number | null
          meta_description?: string | null
          meta_keywords?: string[] | null
          meta_title?: string | null
          published_at?: string | null
          reading_time_minutes?: number | null
          scheduled_for?: string | null
          slug: string
          status?: string | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          author_id?: string | null
          category_id?: string | null
          content?: string
          created_at?: string | null
          deleted_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          likes_count?: number | null
          meta_description?: string | null
          meta_keywords?: string[] | null
          meta_title?: string | null
          published_at?: string | null
          reading_time_minutes?: number | null
          scheduled_for?: string | null
          slug?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "content_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "published_documentation"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "published_faqs"
            referencedColumns: ["category_id"]
          },
        ]
      }
      blog_tags: {
        Row: {
          created_at: string | null
          id: string
          name: string
          slug: string
          usage_count: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          slug: string
          usage_count?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      briefing_preferences: {
        Row: {
          created_at: string
          enabled_sections: Json
          id: string
          project_id: string | null
          section_order: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled_sections?: Json
          id?: string
          project_id?: string | null
          section_order?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled_sections?: Json
          id?: string
          project_id?: string | null
          section_order?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "briefing_preferences_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_exceptions: {
        Row: {
          calendar_id: string
          created_at: string
          end_date: string
          exception_type: string
          id: string
          name: string
          start_date: string
          work_hours: Json | null
        }
        Insert: {
          calendar_id: string
          created_at?: string
          end_date: string
          exception_type?: string
          id?: string
          name: string
          start_date: string
          work_hours?: Json | null
        }
        Update: {
          calendar_id?: string
          created_at?: string
          end_date?: string
          exception_type?: string
          id?: string
          name?: string
          start_date?: string
          work_hours?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_exceptions_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: false
            referencedRelation: "project_calendars"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_analytics: {
        Row: {
          campaign_id: string | null
          id: string
          metadata: Json | null
          metric_type: string
          metric_value: number
          timestamp: string | null
        }
        Insert: {
          campaign_id?: string | null
          id?: string
          metadata?: Json | null
          metric_type: string
          metric_value?: number
          timestamp?: string | null
        }
        Update: {
          campaign_id?: string | null
          id?: string
          metadata?: Json | null
          metric_type?: string
          metric_value?: number
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_analytics_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_performance_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_analytics_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_events: {
        Row: {
          campaign_id: string | null
          created_at: string
          email: string | null
          event_type: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          email?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          email?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_performance_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_recipients: {
        Row: {
          campaign_id: string | null
          clicked_at: string | null
          converted_at: string | null
          created_at: string | null
          email: string
          error_message: string | null
          id: string
          opened_at: string | null
          sent_at: string | null
          status: string | null
          unsubscribed_at: string | null
          user_id: string | null
          variant_id: string | null
        }
        Insert: {
          campaign_id?: string | null
          clicked_at?: string | null
          converted_at?: string | null
          created_at?: string | null
          email: string
          error_message?: string | null
          id?: string
          opened_at?: string | null
          sent_at?: string | null
          status?: string | null
          unsubscribed_at?: string | null
          user_id?: string | null
          variant_id?: string | null
        }
        Update: {
          campaign_id?: string | null
          clicked_at?: string | null
          converted_at?: string | null
          created_at?: string | null
          email?: string
          error_message?: string | null
          id?: string
          opened_at?: string | null
          sent_at?: string | null
          status?: string | null
          unsubscribed_at?: string | null
          user_id?: string | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_performance_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_recipients_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "ab_test_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      change_requests: {
        Row: {
          affected_tasks: Json | null
          alternatives: string | null
          approved_by_id: string | null
          approved_by_name: string | null
          created_at: string | null
          custom_fields: Json | null
          description: string | null
          id: string
          impact_area: string | null
          impact_details: Json | null
          justification: string | null
          priority: Database["public"]["Enums"]["priority_level"] | null
          project_id: string | null
          requested_at: string | null
          requested_by_id: string | null
          requested_by_name: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["cr_status"] | null
          title: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          affected_tasks?: Json | null
          alternatives?: string | null
          approved_by_id?: string | null
          approved_by_name?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          description?: string | null
          id?: string
          impact_area?: string | null
          impact_details?: Json | null
          justification?: string | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          project_id?: string | null
          requested_at?: string | null
          requested_by_id?: string | null
          requested_by_name?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["cr_status"] | null
          title: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          affected_tasks?: Json | null
          alternatives?: string | null
          approved_by_id?: string | null
          approved_by_name?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          description?: string | null
          id?: string
          impact_area?: string | null
          impact_details?: Json | null
          justification?: string | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          project_id?: string | null
          requested_at?: string | null
          requested_by_id?: string | null
          requested_by_name?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["cr_status"] | null
          title?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "change_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_channel_members: {
        Row: {
          channel_id: string
          joined_at: string | null
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          channel_id: string
          joined_at?: string | null
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          channel_id?: string
          joined_at?: string | null
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_channel_members_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_channel_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "chat_channel_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
        ]
      }
      chat_channels: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          last_message_at: string | null
          metadata: Json | null
          name: string
          project_id: string | null
          type: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          last_message_at?: string | null
          metadata?: Json | null
          name: string
          project_id?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          last_message_at?: string | null
          metadata?: Json | null
          name?: string
          project_id?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_channels_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "chat_channels_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
          {
            foreignKeyName: "chat_channels_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          attachment_name: string | null
          attachment_size: number | null
          attachment_type: string | null
          attachment_url: string | null
          channel_id: string | null
          content: string | null
          created_at: string | null
          deleted_at: string | null
          edit_history: Json | null
          id: string
          is_deleted: boolean | null
          is_pinned: boolean | null
          pinned_at: string | null
          pinned_by: string | null
          reactions: Json | null
          read_by: Json | null
          reply_to: string | null
          updated_at: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          attachment_name?: string | null
          attachment_size?: number | null
          attachment_type?: string | null
          attachment_url?: string | null
          channel_id?: string | null
          content?: string | null
          created_at?: string | null
          deleted_at?: string | null
          edit_history?: Json | null
          id?: string
          is_deleted?: boolean | null
          is_pinned?: boolean | null
          pinned_at?: string | null
          pinned_by?: string | null
          reactions?: Json | null
          read_by?: Json | null
          reply_to?: string | null
          updated_at?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          attachment_name?: string | null
          attachment_size?: number | null
          attachment_type?: string | null
          attachment_url?: string | null
          channel_id?: string | null
          content?: string | null
          created_at?: string | null
          deleted_at?: string | null
          edit_history?: Json | null
          id?: string
          is_deleted?: boolean | null
          is_pinned?: boolean | null
          pinned_at?: string | null
          pinned_by?: string | null
          reactions?: Json | null
          read_by?: Json | null
          reply_to?: string | null
          updated_at?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_pinned_by_fkey"
            columns: ["pinned_by"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "chat_messages_pinned_by_fkey"
            columns: ["pinned_by"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
          {
            foreignKeyName: "chat_messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
        ]
      }
      collaboration_space_members: {
        Row: {
          added_by_user_id: string | null
          id: string
          joined_at: string | null
          project_id: string | null
          role: string | null
          space_id: string
          user_id: string
        }
        Insert: {
          added_by_user_id?: string | null
          id?: string
          joined_at?: string | null
          project_id?: string | null
          role?: string | null
          space_id: string
          user_id: string
        }
        Update: {
          added_by_user_id?: string | null
          id?: string
          joined_at?: string | null
          project_id?: string | null
          role?: string | null
          space_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaboration_space_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaboration_space_members_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "collaboration_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      collaboration_spaces: {
        Row: {
          created_at: string | null
          created_by_user_id: string
          description: string | null
          id: string
          name: string
          program_id: string
          project_ids: string[]
          purpose: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by_user_id: string
          description?: string | null
          id?: string
          name: string
          program_id: string
          project_ids: string[]
          purpose?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by_user_id?: string
          description?: string | null
          id?: string
          name?: string
          program_id?: string
          project_ids?: string[]
          purpose?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collaboration_spaces_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      content_categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          name: string
          slug: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      content_items: {
        Row: {
          author_id: string | null
          content: string | null
          created_at: string
          id: string
          metadata: Json | null
          published_at: string | null
          slug: string | null
          status: string | null
          title: string
          type: string | null
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          content?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          published_at?: string | null
          slug?: string | null
          status?: string | null
          title: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          content?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          published_at?: string | null
          slug?: string | null
          status?: string | null
          title?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      contract_document_links: {
        Row: {
          created_at: string | null
          doc_type: string
          id: string
          name: string
          phase: string | null
          project_id: string
          status: string | null
          url: string | null
          version: string | null
        }
        Insert: {
          created_at?: string | null
          doc_type: string
          id?: string
          name: string
          phase?: string | null
          project_id: string
          status?: string | null
          url?: string | null
          version?: string | null
        }
        Update: {
          created_at?: string | null
          doc_type?: string
          id?: string
          name?: string
          phase?: string | null
          project_id?: string
          status?: string | null
          url?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_document_links_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cross_project_dependencies: {
        Row: {
          created_at: string | null
          created_by_user_id: string | null
          dependency_type: string | null
          id: string
          lag: number | null
          program_id: string
          source_project_id: string
          source_task_id: string | null
          status: string | null
          target_project_id: string
          target_task_id: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          created_by_user_id?: string | null
          dependency_type?: string | null
          id?: string
          lag?: number | null
          program_id: string
          source_project_id: string
          source_task_id?: string | null
          status?: string | null
          target_project_id: string
          target_task_id?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          created_by_user_id?: string | null
          dependency_type?: string | null
          id?: string
          lag?: number | null
          program_id?: string
          source_project_id?: string
          source_task_id?: string | null
          status?: string | null
          target_project_id?: string
          target_task_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cross_project_dependencies_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cross_project_dependencies_source_project_id_fkey"
            columns: ["source_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cross_project_dependencies_source_task_id_fkey"
            columns: ["source_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cross_project_dependencies_target_project_id_fkey"
            columns: ["target_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cross_project_dependencies_target_task_id_fkey"
            columns: ["target_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cross_project_dependencies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      decisions: {
        Row: {
          alternatives: Json | null
          context: string | null
          created_at: string
          custom_fields: Json | null
          date: string | null
          decision: string
          id: string
          impact: string | null
          key: string | null
          linked_items: Json | null
          linked_meetings: Json | null
          linked_risks: Json | null
          linked_tasks: Json | null
          owner_id: string | null
          owner_name: string | null
          project_id: string | null
          status: string | null
          tags: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          alternatives?: Json | null
          context?: string | null
          created_at?: string
          custom_fields?: Json | null
          date?: string | null
          decision: string
          id?: string
          impact?: string | null
          key?: string | null
          linked_items?: Json | null
          linked_meetings?: Json | null
          linked_risks?: Json | null
          linked_tasks?: Json | null
          owner_id?: string | null
          owner_name?: string | null
          project_id?: string | null
          status?: string | null
          tags?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          alternatives?: Json | null
          context?: string | null
          created_at?: string
          custom_fields?: Json | null
          date?: string | null
          decision?: string
          id?: string
          impact?: string | null
          key?: string | null
          linked_items?: Json | null
          linked_meetings?: Json | null
          linked_risks?: Json | null
          linked_tasks?: Json | null
          owner_id?: string | null
          owner_name?: string | null
          project_id?: string | null
          status?: string | null
          tags?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "decisions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      defects: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          description: string | null
          external_ticket_url: string | null
          id: string
          priority: string | null
          project_id: string
          raised_by: string
          raised_date: string
          resolution_notes: string | null
          resolved_date: string | null
          status: string | null
          title: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          external_ticket_url?: string | null
          id?: string
          priority?: string | null
          project_id: string
          raised_by: string
          raised_date?: string
          resolution_notes?: string | null
          resolved_date?: string | null
          status?: string | null
          title: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          external_ticket_url?: string | null
          id?: string
          priority?: string | null
          project_id?: string
          raised_by?: string
          raised_date?: string
          resolution_notes?: string | null
          resolved_date?: string | null
          status?: string | null
          title?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "defects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      delegation_templates: {
        Row: {
          can_subdelegate: boolean | null
          created_at: string | null
          delegate_id: string
          delegation_type: string
          duration_days: number | null
          id: string
          name: string
          reason: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          can_subdelegate?: boolean | null
          created_at?: string | null
          delegate_id: string
          delegation_type?: string
          duration_days?: number | null
          id?: string
          name: string
          reason?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          can_subdelegate?: boolean | null
          created_at?: string | null
          delegate_id?: string
          delegation_type?: string
          duration_days?: number | null
          id?: string
          name?: string
          reason?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delegation_templates_delegate_id_fkey"
            columns: ["delegate_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delegation_templates_delegate_id_fkey"
            columns: ["delegate_id"]
            isOneToOne: false
            referencedRelation: "user_features"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "delegation_templates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delegation_templates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_features"
            referencedColumns: ["user_id"]
          },
        ]
      }
      delegations: {
        Row: {
          approval_id: string | null
          can_subdelegate: boolean | null
          created_at: string | null
          delegate_id: string
          delegation_depth: number | null
          delegation_type: string
          delegator_id: string
          expires_at: string | null
          id: string
          parent_delegation_id: string | null
          reason: string | null
          revoked_at: string | null
          revoked_reason: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          approval_id?: string | null
          can_subdelegate?: boolean | null
          created_at?: string | null
          delegate_id: string
          delegation_depth?: number | null
          delegation_type?: string
          delegator_id: string
          expires_at?: string | null
          id?: string
          parent_delegation_id?: string | null
          reason?: string | null
          revoked_at?: string | null
          revoked_reason?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          approval_id?: string | null
          can_subdelegate?: boolean | null
          created_at?: string | null
          delegate_id?: string
          delegation_depth?: number | null
          delegation_type?: string
          delegator_id?: string
          expires_at?: string | null
          id?: string
          parent_delegation_id?: string | null
          reason?: string | null
          revoked_at?: string | null
          revoked_reason?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delegations_approval_id_fkey"
            columns: ["approval_id"]
            isOneToOne: false
            referencedRelation: "approvals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delegations_delegate_id_fkey"
            columns: ["delegate_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delegations_delegate_id_fkey"
            columns: ["delegate_id"]
            isOneToOne: false
            referencedRelation: "user_features"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "delegations_delegator_id_fkey"
            columns: ["delegator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delegations_delegator_id_fkey"
            columns: ["delegator_id"]
            isOneToOne: false
            referencedRelation: "user_features"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "delegations_parent_delegation_id_fkey"
            columns: ["parent_delegation_id"]
            isOneToOne: false
            referencedRelation: "delegation_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delegations_parent_delegation_id_fkey"
            columns: ["parent_delegation_id"]
            isOneToOne: false
            referencedRelation: "delegations"
            referencedColumns: ["id"]
          },
        ]
      }
      deliverable_tasks: {
        Row: {
          deliverable_id: string
          task_id: string
        }
        Insert: {
          deliverable_id: string
          task_id: string
        }
        Update: {
          deliverable_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliverable_tasks_deliverable_id_fkey"
            columns: ["deliverable_id"]
            isOneToOne: false
            referencedRelation: "deliverables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliverable_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      deliverables: {
        Row: {
          acceptance_criteria: Json | null
          completed_date: string | null
          created_at: string | null
          custom_fields: Json | null
          description: string | null
          due_date: string | null
          id: string
          name: string
          owner_id: string | null
          phase: string | null
          progress: number | null
          project_id: string
          status: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          acceptance_criteria?: Json | null
          completed_date?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          description?: string | null
          due_date?: string | null
          id?: string
          name: string
          owner_id?: string | null
          phase?: string | null
          progress?: number | null
          project_id: string
          status?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          acceptance_criteria?: Json | null
          completed_date?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          description?: string | null
          due_date?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          phase?: string | null
          progress?: number | null
          project_id?: string
          status?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deliverables_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliverables_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "user_features"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "deliverables_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          budget: number | null
          created_at: string
          description: string | null
          id: string
          manager_id: string | null
          member_count: number
          name: string
          parent_id: string | null
          spent: number | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          budget?: number | null
          created_at?: string
          description?: string | null
          id?: string
          manager_id?: string | null
          member_count?: number
          name: string
          parent_id?: string | null
          spent?: number | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          budget?: number | null
          created_at?: string
          description?: string | null
          id?: string
          manager_id?: string | null
          member_count?: number
          name?: string
          parent_id?: string | null
          spent?: number | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      dependencies: {
        Row: {
          created_at: string | null
          dependent_on: string
          description: string | null
          due_date: string | null
          id: string
          notes: string | null
          owner_name: string | null
          project_id: string
          provider: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dependent_on: string
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          owner_name?: string | null
          project_id: string
          provider?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dependent_on?: string
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          owner_name?: string | null
          project_id?: string
          provider?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dependencies_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_code_usage: {
        Row: {
          discount_amount: number
          discount_code_id: string
          final_amount: number
          id: string
          original_amount: number
          subscription_id: string | null
          used_at: string
          user_id: string
        }
        Insert: {
          discount_amount: number
          discount_code_id: string
          final_amount: number
          id?: string
          original_amount: number
          subscription_id?: string | null
          used_at?: string
          user_id: string
        }
        Update: {
          discount_amount?: number
          discount_code_id?: string
          final_amount?: number
          id?: string
          original_amount?: number
          subscription_id?: string | null
          used_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discount_code_usage_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_code_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "discount_code_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
        ]
      }
      discount_codes: {
        Row: {
          applicable_billing_cycles: string[] | null
          applicable_tiers: string[] | null
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          discount_type: string
          discount_value: number
          first_time_user_only: boolean | null
          id: string
          is_active: boolean | null
          is_referral_code: boolean | null
          max_discount_amount: number | null
          max_uses: number | null
          max_uses_per_user: number | null
          metadata: Json | null
          min_purchase_amount: number | null
          tier_restrictions: string[] | null
          updated_at: string
          used_count: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          applicable_billing_cycles?: string[] | null
          applicable_tiers?: string[] | null
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type: string
          discount_value: number
          first_time_user_only?: boolean | null
          id?: string
          is_active?: boolean | null
          is_referral_code?: boolean | null
          max_discount_amount?: number | null
          max_uses?: number | null
          max_uses_per_user?: number | null
          metadata?: Json | null
          min_purchase_amount?: number | null
          tier_restrictions?: string[] | null
          updated_at?: string
          used_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          applicable_billing_cycles?: string[] | null
          applicable_tiers?: string[] | null
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          first_time_user_only?: boolean | null
          id?: string
          is_active?: boolean | null
          is_referral_code?: boolean | null
          max_discount_amount?: number | null
          max_uses?: number | null
          max_uses_per_user?: number | null
          metadata?: Json | null
          min_purchase_amount?: number | null
          tier_restrictions?: string[] | null
          updated_at?: string
          used_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discount_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "discount_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
        ]
      }
      document_approvers: {
        Row: {
          comment: string | null
          created_at: string
          decided_at: string | null
          document_id: string
          id: string
          order_num: number
          status: string
          user_id: string | null
          user_name: string
          user_role: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          decided_at?: string | null
          document_id: string
          id?: string
          order_num?: number
          status?: string
          user_id?: string | null
          user_name: string
          user_role?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          decided_at?: string | null
          document_id?: string
          id?: string
          order_num?: number
          status?: string
          user_id?: string | null
          user_name?: string
          user_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_approvers_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_collaborators: {
        Row: {
          added_at: string | null
          added_by_user_id: string | null
          can_comment: boolean | null
          can_edit: boolean | null
          can_share: boolean | null
          document_id: string
          id: string
          last_accessed_at: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          added_at?: string | null
          added_by_user_id?: string | null
          can_comment?: boolean | null
          can_edit?: boolean | null
          can_share?: boolean | null
          document_id: string
          id?: string
          last_accessed_at?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          added_at?: string | null
          added_by_user_id?: string | null
          can_comment?: boolean | null
          can_edit?: boolean | null
          can_share?: boolean | null
          document_id?: string
          id?: string
          last_accessed_at?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_collaborators_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_comments: {
        Row: {
          content: string
          created_at: string | null
          created_by_user_id: string
          document_id: string
          id: string
          is_deleted: boolean | null
          is_edited: boolean | null
          is_resolved: boolean | null
          location_data: Json | null
          parent_comment_id: string | null
          resolved_at: string | null
          resolved_by_user_id: string | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by_user_id: string
          document_id: string
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          is_resolved?: boolean | null
          location_data?: Json | null
          parent_comment_id?: string | null
          resolved_at?: string | null
          resolved_by_user_id?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by_user_id?: string
          document_id?: string
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          is_resolved?: boolean | null
          location_data?: Json | null
          parent_comment_id?: string | null
          resolved_at?: string | null
          resolved_by_user_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_comments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "document_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      document_folders: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          parent_id: string | null
          project_id: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          project_id: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          project_id?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "document_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_folders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      document_shares: {
        Row: {
          created_at: string
          created_by: string | null
          document_id: string | null
          expires_at: string | null
          folder_id: string | null
          id: string
          permission: string
          share_link: string | null
          shared_with_email: string | null
          shared_with_user_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          document_id?: string | null
          expires_at?: string | null
          folder_id?: string | null
          id?: string
          permission?: string
          share_link?: string | null
          shared_with_email?: string | null
          shared_with_user_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          document_id?: string | null
          expires_at?: string | null
          folder_id?: string | null
          id?: string
          permission?: string
          share_link?: string | null
          shared_with_email?: string | null
          shared_with_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_shares_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_shares_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "document_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      document_templates: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          created_by_user_id: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          placeholders: Json | null
          program_id: string | null
          scope: string | null
          tags: string[] | null
          template_type: string | null
          tenant_id: string
          updated_at: string | null
          usage_count: number | null
          workspace_id: string | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          created_by_user_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          placeholders?: Json | null
          program_id?: string | null
          scope?: string | null
          tags?: string[] | null
          template_type?: string | null
          tenant_id: string
          updated_at?: string | null
          usage_count?: number | null
          workspace_id?: string | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          created_by_user_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          placeholders?: Json | null
          program_id?: string | null
          scope?: string | null
          tags?: string[] | null
          template_type?: string | null
          tenant_id?: string
          updated_at?: string | null
          usage_count?: number | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_templates_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_templates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      document_version_history: {
        Row: {
          change_summary: string | null
          changed_at: string | null
          changed_by_user_id: string
          checksum: string | null
          content: string | null
          document_id: string
          file_size: number | null
          id: string
          title: string
          version_number: number
        }
        Insert: {
          change_summary?: string | null
          changed_at?: string | null
          changed_by_user_id: string
          checksum?: string | null
          content?: string | null
          document_id: string
          file_size?: number | null
          id?: string
          title: string
          version_number: number
        }
        Update: {
          change_summary?: string | null
          changed_at?: string | null
          changed_by_user_id?: string
          checksum?: string | null
          content?: string | null
          document_id?: string
          file_size?: number | null
          id?: string
          title?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_version_history_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_versions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          approved_by_name: string | null
          change_notes: string | null
          created_at: string
          document_id: string
          file_size: number
          file_url: string
          id: string
          status: string
          uploaded_by: string | null
          uploaded_by_name: string | null
          version: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          approved_by_name?: string | null
          change_notes?: string | null
          created_at?: string
          document_id: string
          file_size?: number
          file_url: string
          id?: string
          status?: string
          uploaded_by?: string | null
          uploaded_by_name?: string | null
          version: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          approved_by_name?: string | null
          change_notes?: string | null
          created_at?: string
          document_id?: string
          file_size?: number
          file_url?: string
          id?: string
          status?: string
          uploaded_by?: string | null
          uploaded_by_name?: string | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documentation: {
        Row: {
          category_id: string | null
          content: string
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          id: string
          is_published: boolean | null
          meta_description: string | null
          order_index: number | null
          parent_id: string | null
          slug: string
          title: string
          updated_at: string | null
          updated_by: string | null
          version: string
          view_count: number | null
        }
        Insert: {
          category_id?: string | null
          content: string
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          order_index?: number | null
          parent_id?: string | null
          slug: string
          title: string
          updated_at?: string | null
          updated_by?: string | null
          version?: string
          view_count?: number | null
        }
        Update: {
          category_id?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          order_index?: number | null
          parent_id?: string | null
          slug?: string
          title?: string
          updated_at?: string | null
          updated_by?: string | null
          version?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documentation_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "content_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentation_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "documentation_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "published_documentation"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "documentation_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "published_faqs"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "documentation_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "documentation_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
          {
            foreignKeyName: "documentation_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "documentation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentation_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "published_documentation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentation_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "documentation_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
        ]
      }
      documents: {
        Row: {
          category: string | null
          created_at: string
          deleted_at: string | null
          document_type: string | null
          file_size: number
          file_type: string
          file_url: string
          folder_id: string | null
          id: string
          is_deleted: boolean | null
          is_locked: boolean | null
          is_starred: boolean | null
          is_template: boolean | null
          locked_by: string | null
          metadata: Json | null
          name: string
          parent_document_id: string | null
          portfolio_id: string | null
          program_id: string | null
          project_id: string
          sharing_scope: string | null
          status: string
          tags: string[] | null
          template_scope: string | null
          tenant_id: string | null
          updated_at: string
          uploaded_by: string | null
          uploaded_by_name: string | null
          version: string
          version_number: number | null
          workspace_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          deleted_at?: string | null
          document_type?: string | null
          file_size?: number
          file_type?: string
          file_url: string
          folder_id?: string | null
          id?: string
          is_deleted?: boolean | null
          is_locked?: boolean | null
          is_starred?: boolean | null
          is_template?: boolean | null
          locked_by?: string | null
          metadata?: Json | null
          name: string
          parent_document_id?: string | null
          portfolio_id?: string | null
          program_id?: string | null
          project_id: string
          sharing_scope?: string | null
          status?: string
          tags?: string[] | null
          template_scope?: string | null
          tenant_id?: string | null
          updated_at?: string
          uploaded_by?: string | null
          uploaded_by_name?: string | null
          version?: string
          version_number?: number | null
          workspace_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          deleted_at?: string | null
          document_type?: string | null
          file_size?: number
          file_type?: string
          file_url?: string
          folder_id?: string | null
          id?: string
          is_deleted?: boolean | null
          is_locked?: boolean | null
          is_starred?: boolean | null
          is_template?: boolean | null
          locked_by?: string | null
          metadata?: Json | null
          name?: string
          parent_document_id?: string | null
          portfolio_id?: string | null
          program_id?: string | null
          project_id?: string
          sharing_scope?: string | null
          status?: string
          tags?: string[] | null
          template_scope?: string | null
          tenant_id?: string | null
          updated_at?: string
          uploaded_by?: string | null
          uploaded_by_name?: string | null
          version?: string
          version_number?: number | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "document_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_parent_document_id_fkey"
            columns: ["parent_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      dunning_attempts: {
        Row: {
          attempt_number: number
          created_at: string | null
          email_sent_at: string | null
          grace_period_ends: string | null
          id: string
          notes: string | null
          status: string
          stripe_invoice_id: string | null
          subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          attempt_number: number
          created_at?: string | null
          email_sent_at?: string | null
          grace_period_ends?: string | null
          id?: string
          notes?: string | null
          status: string
          stripe_invoice_id?: string | null
          subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          attempt_number?: number
          created_at?: string | null
          email_sent_at?: string | null
          grace_period_ends?: string | null
          id?: string
          notes?: string | null
          status?: string
          stripe_invoice_id?: string | null
          subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dunning_attempts_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      email_accounts: {
        Row: {
          account_type: string
          created_at: string
          display_name: string | null
          email_address: string
          id: string
          imap_encryption: string
          imap_host: string
          imap_password: string
          imap_port: number
          imap_username: string
          is_active: boolean
          last_sync_at: string | null
          oauth_access_token: string | null
          oauth_client_id: string | null
          oauth_client_secret: string | null
          oauth_refresh_token: string | null
          oauth_token_expires_at: string | null
          project_id: string | null
          provider_type: string | null
          smtp_encryption: string | null
          smtp_host: string | null
          smtp_password: string | null
          smtp_port: number | null
          smtp_username: string | null
          sync_error: string | null
          sync_status: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          account_type?: string
          created_at?: string
          display_name?: string | null
          email_address: string
          id?: string
          imap_encryption?: string
          imap_host: string
          imap_password: string
          imap_port?: number
          imap_username: string
          is_active?: boolean
          last_sync_at?: string | null
          oauth_access_token?: string | null
          oauth_client_id?: string | null
          oauth_client_secret?: string | null
          oauth_refresh_token?: string | null
          oauth_token_expires_at?: string | null
          project_id?: string | null
          provider_type?: string | null
          smtp_encryption?: string | null
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_username?: string | null
          sync_error?: string | null
          sync_status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          account_type?: string
          created_at?: string
          display_name?: string | null
          email_address?: string
          id?: string
          imap_encryption?: string
          imap_host?: string
          imap_password?: string
          imap_port?: number
          imap_username?: string
          is_active?: boolean
          last_sync_at?: string | null
          oauth_access_token?: string | null
          oauth_client_id?: string | null
          oauth_client_secret?: string | null
          oauth_refresh_token?: string | null
          oauth_token_expires_at?: string | null
          project_id?: string | null
          provider_type?: string | null
          smtp_encryption?: string | null
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_username?: string | null
          sync_error?: string | null
          sync_status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_accounts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "email_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
        ]
      }
      email_campaign_recipients: {
        Row: {
          campaign_id: string | null
          clicked_at: string | null
          created_at: string | null
          email: string
          error_message: string | null
          id: string
          opened_at: string | null
          sent_at: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          campaign_id?: string | null
          clicked_at?: string | null
          created_at?: string | null
          email: string
          error_message?: string | null
          id?: string
          opened_at?: string | null
          sent_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          campaign_id?: string | null
          clicked_at?: string | null
          created_at?: string | null
          email?: string
          error_message?: string | null
          id?: string
          opened_at?: string | null
          sent_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaign_recipients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "email_campaign_recipients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          click_count: number | null
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          open_count: number | null
          scheduled_at: string | null
          sent_at: string | null
          sent_count: number | null
          status: string | null
          subject: string
          target_audience: Json | null
          template_id: string | null
          updated_at: string | null
        }
        Insert: {
          click_count?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          open_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string | null
          subject: string
          target_audience?: Json | null
          template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          click_count?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          open_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string | null
          subject?: string
          target_audience?: Json | null
          template_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "email_campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
          {
            foreignKeyName: "email_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "template_performance"
            referencedColumns: ["template_id"]
          },
        ]
      }
      email_drafts: {
        Row: {
          account_id: string
          bcc_addresses: Json | null
          body_html: string | null
          body_text: string | null
          cc_addresses: Json | null
          created_at: string
          forward_email_id: string | null
          id: string
          reply_to_email_id: string | null
          subject: string | null
          to_addresses: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          bcc_addresses?: Json | null
          body_html?: string | null
          body_text?: string | null
          cc_addresses?: Json | null
          created_at?: string
          forward_email_id?: string | null
          id?: string
          reply_to_email_id?: string | null
          subject?: string | null
          to_addresses?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          bcc_addresses?: Json | null
          body_html?: string | null
          body_text?: string | null
          cc_addresses?: Json | null
          created_at?: string
          forward_email_id?: string | null
          id?: string
          reply_to_email_id?: string | null
          subject?: string | null
          to_addresses?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_drafts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "email_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_drafts_forward_email_id_fkey"
            columns: ["forward_email_id"]
            isOneToOne: false
            referencedRelation: "emails"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_drafts_reply_to_email_id_fkey"
            columns: ["reply_to_email_id"]
            isOneToOne: false
            referencedRelation: "emails"
            referencedColumns: ["id"]
          },
        ]
      }
      email_folders: {
        Row: {
          account_id: string
          created_at: string
          folder_type: string | null
          id: string
          name: string
          remote_name: string
          total_count: number | null
          unread_count: number | null
        }
        Insert: {
          account_id: string
          created_at?: string
          folder_type?: string | null
          id?: string
          name: string
          remote_name: string
          total_count?: number | null
          unread_count?: number | null
        }
        Update: {
          account_id?: string
          created_at?: string
          folder_type?: string | null
          id?: string
          name?: string
          remote_name?: string
          total_count?: number | null
          unread_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "email_folders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "email_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      email_preferences: {
        Row: {
          created_at: string
          id: string
          license_emails: boolean | null
          marketing_emails: boolean | null
          payment_emails: boolean | null
          subscription_emails: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          license_emails?: boolean | null
          marketing_emails?: boolean | null
          payment_emails?: boolean | null
          subscription_emails?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          license_emails?: boolean | null
          marketing_emails?: boolean | null
          payment_emails?: boolean | null
          subscription_emails?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "email_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
        ]
      }
      email_queue: {
        Row: {
          attempts: number | null
          created_at: string | null
          data: Json
          error_message: string | null
          id: string
          max_attempts: number | null
          recipients: Json
          scheduled_for: string | null
          sent_at: string | null
          status: string | null
          subject: string
          template: string
          user_id: string | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          data: Json
          error_message?: string | null
          id?: string
          max_attempts?: number | null
          recipients: Json
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
          subject: string
          template: string
          user_id?: string | null
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          data?: Json
          error_message?: string | null
          id?: string
          max_attempts?: number | null
          recipients?: Json
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string
          template?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_features"
            referencedColumns: ["user_id"]
          },
        ]
      }
      email_template_versions: {
        Row: {
          category: string
          change_notes: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          html_template: string
          id: string
          name: string
          parent_template_id: string | null
          subject_template: string
          template_key: string
          text_template: string | null
          variables: Json | null
          version: number
        }
        Insert: {
          category: string
          change_notes?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          html_template: string
          id?: string
          name: string
          parent_template_id?: string | null
          subject_template: string
          template_key: string
          text_template?: string | null
          variables?: Json | null
          version: number
        }
        Update: {
          category?: string
          change_notes?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          html_template?: string
          id?: string
          name?: string
          parent_template_id?: string | null
          subject_template?: string
          template_key?: string
          text_template?: string | null
          variables?: Json | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "email_template_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "email_template_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
          {
            foreignKeyName: "email_template_versions_parent_template_id_fkey"
            columns: ["parent_template_id"]
            isOneToOne: false
            referencedRelation: "email_templates_admin"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          active: boolean | null
          category: string
          created_at: string | null
          description: string | null
          html_template: string | null
          id: string
          name: string
          required_variables: Json | null
          subject_template: string
          text_template: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          category: string
          created_at?: string | null
          description?: string | null
          html_template?: string | null
          id: string
          name: string
          required_variables?: Json | null
          subject_template: string
          text_template?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          category?: string
          created_at?: string | null
          description?: string | null
          html_template?: string | null
          id?: string
          name?: string
          required_variables?: Json | null
          subject_template?: string
          text_template?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      email_templates_admin: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          html_template: string
          id: string
          is_active: boolean | null
          name: string
          subject_template: string
          template_key: string
          text_template: string | null
          updated_at: string | null
          updated_by: string | null
          variables: Json | null
          version: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          html_template: string
          id?: string
          is_active?: boolean | null
          name: string
          subject_template: string
          template_key: string
          text_template?: string | null
          updated_at?: string | null
          updated_by?: string | null
          variables?: Json | null
          version?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          html_template?: string
          id?: string
          is_active?: boolean | null
          name?: string
          subject_template?: string
          template_key?: string
          text_template?: string | null
          updated_at?: string | null
          updated_by?: string | null
          variables?: Json | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_admin_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "email_templates_admin_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
          {
            foreignKeyName: "email_templates_admin_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "email_templates_admin_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
        ]
      }
      emails: {
        Row: {
          account_id: string
          attachments: Json | null
          bcc_addresses: Json | null
          body_html: string | null
          body_text: string | null
          cc_addresses: Json | null
          created_at: string
          folder_id: string
          from_address: string
          from_name: string | null
          has_attachments: boolean | null
          id: string
          in_reply_to: string | null
          is_flagged: boolean | null
          is_read: boolean | null
          is_starred: boolean | null
          labels: Json | null
          message_id: string
          received_at: string
          references_ids: Json | null
          reply_to: string | null
          sent_at: string | null
          snippet: string | null
          subject: string | null
          thread_id: string | null
          to_addresses: Json | null
        }
        Insert: {
          account_id: string
          attachments?: Json | null
          bcc_addresses?: Json | null
          body_html?: string | null
          body_text?: string | null
          cc_addresses?: Json | null
          created_at?: string
          folder_id: string
          from_address: string
          from_name?: string | null
          has_attachments?: boolean | null
          id?: string
          in_reply_to?: string | null
          is_flagged?: boolean | null
          is_read?: boolean | null
          is_starred?: boolean | null
          labels?: Json | null
          message_id: string
          received_at?: string
          references_ids?: Json | null
          reply_to?: string | null
          sent_at?: string | null
          snippet?: string | null
          subject?: string | null
          thread_id?: string | null
          to_addresses?: Json | null
        }
        Update: {
          account_id?: string
          attachments?: Json | null
          bcc_addresses?: Json | null
          body_html?: string | null
          body_text?: string | null
          cc_addresses?: Json | null
          created_at?: string
          folder_id?: string
          from_address?: string
          from_name?: string | null
          has_attachments?: boolean | null
          id?: string
          in_reply_to?: string | null
          is_flagged?: boolean | null
          is_read?: boolean | null
          is_starred?: boolean | null
          labels?: Json | null
          message_id?: string
          received_at?: string
          references_ids?: Json | null
          reply_to?: string | null
          sent_at?: string | null
          snippet?: string | null
          subject?: string | null
          thread_id?: string | null
          to_addresses?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "emails_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "email_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emails_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "email_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      epics: {
        Row: {
          color: string | null
          completed_points: number | null
          created_at: string
          description: string | null
          id: string
          name: string
          progress: number | null
          project_id: string | null
          sort_order: number | null
          total_points: number | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          completed_points?: number | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          progress?: number | null
          project_id?: string | null
          sort_order?: number | null
          total_points?: number | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          completed_points?: number | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          progress?: number | null
          project_id?: string | null
          sort_order?: number | null
          total_points?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "epics_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      escalations: {
        Row: {
          created_at: string | null
          description: string | null
          escalated_to: string | null
          id: string
          priority: string | null
          project_id: string
          raised_by: string
          raised_date: string
          response: string | null
          response_date: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          escalated_to?: string | null
          id?: string
          priority?: string | null
          project_id: string
          raised_by: string
          raised_date: string
          response?: string | null
          response_date?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          escalated_to?: string | null
          id?: string
          priority?: string | null
          project_id?: string
          raised_by?: string
          raised_date?: string
          response?: string | null
          response_date?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escalations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          answer: string
          category_id: string | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          display_order: number | null
          helpful_count: number | null
          id: string
          is_published: boolean | null
          keywords: string[] | null
          not_helpful_count: number | null
          question: string
          updated_at: string | null
          updated_by: string | null
          view_count: number | null
        }
        Insert: {
          answer: string
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          display_order?: number | null
          helpful_count?: number | null
          id?: string
          is_published?: boolean | null
          keywords?: string[] | null
          not_helpful_count?: number | null
          question: string
          updated_at?: string | null
          updated_by?: string | null
          view_count?: number | null
        }
        Update: {
          answer?: string
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          display_order?: number | null
          helpful_count?: number | null
          id?: string
          is_published?: boolean | null
          keywords?: string[] | null
          not_helpful_count?: number | null
          question?: string
          updated_at?: string | null
          updated_by?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "faqs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "content_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faqs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "faqs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "published_documentation"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "faqs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "published_faqs"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "faqs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "faqs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
          {
            foreignKeyName: "faqs_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "faqs_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_enabled: boolean | null
          name: string
          rollout_percentage: number | null
          target_tiers: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_enabled?: boolean | null
          name: string
          rollout_percentage?: number | null
          target_tiers?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_enabled?: boolean | null
          name?: string
          rollout_percentage?: number | null
          target_tiers?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      features: {
        Row: {
          category: string
          created_at: string
          description: string | null
          is_enabled: boolean
          key: string
          min_plan_tier: string
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          is_enabled?: boolean
          key: string
          min_plan_tier?: string
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          is_enabled?: boolean
          key?: string
          min_plan_tier?: string
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      final_reports: {
        Row: {
          completion_date: string | null
          created_at: string | null
          deliverables_status: Json | null
          executive_summary: string | null
          financial_performance: Json | null
          id: string
          objectives_achievement: Json | null
          project_id: string | null
          recommendations: Json | null
          schedule_performance: Json | null
          stakeholder_satisfaction: number | null
          status: string | null
          team_recognition: Json | null
          updated_at: string | null
        }
        Insert: {
          completion_date?: string | null
          created_at?: string | null
          deliverables_status?: Json | null
          executive_summary?: string | null
          financial_performance?: Json | null
          id?: string
          objectives_achievement?: Json | null
          project_id?: string | null
          recommendations?: Json | null
          schedule_performance?: Json | null
          stakeholder_satisfaction?: number | null
          status?: string | null
          team_recognition?: Json | null
          updated_at?: string | null
        }
        Update: {
          completion_date?: string | null
          created_at?: string | null
          deliverables_status?: Json | null
          executive_summary?: string | null
          financial_performance?: Json | null
          id?: string
          objectives_achievement?: Json | null
          project_id?: string | null
          recommendations?: Json | null
          schedule_performance?: Json | null
          stakeholder_satisfaction?: number | null
          status?: string | null
          team_recognition?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "final_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      health_checks: {
        Row: {
          checked_at: string
          created_at: string
          details: Json | null
          id: string
          response_time_ms: number | null
          service_name: string
          status: string | null
        }
        Insert: {
          checked_at?: string
          created_at?: string
          details?: Json | null
          id?: string
          response_time_ms?: number | null
          service_name: string
          status?: string | null
        }
        Update: {
          checked_at?: string
          created_at?: string
          details?: Json | null
          id?: string
          response_time_ms?: number | null
          service_name?: string
          status?: string | null
        }
        Relationships: []
      }
      imap_accounts: {
        Row: {
          created_at: string | null
          email_address: string
          error_message: string | null
          folder_to_sync: string | null
          id: string
          imap_host: string
          imap_password_encrypted: string
          imap_port: number
          imap_username: string
          last_sync_at: string | null
          provider: string
          status: string | null
          sync_frequency_minutes: number | null
          updated_at: string | null
          use_ssl: boolean | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email_address: string
          error_message?: string | null
          folder_to_sync?: string | null
          id?: string
          imap_host: string
          imap_password_encrypted: string
          imap_port: number
          imap_username: string
          last_sync_at?: string | null
          provider: string
          status?: string | null
          sync_frequency_minutes?: number | null
          updated_at?: string | null
          use_ssl?: boolean | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email_address?: string
          error_message?: string | null
          folder_to_sync?: string | null
          id?: string
          imap_host?: string
          imap_password_encrypted?: string
          imap_port?: number
          imap_username?: string
          last_sync_at?: string | null
          provider?: string
          status?: string | null
          sync_frequency_minutes?: number | null
          updated_at?: string | null
          use_ssl?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "imap_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "imap_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
        ]
      }
      imap_presets: {
        Row: {
          display_name: string
          help_url: string | null
          imap_host: string
          imap_port: number
          instructions: string | null
          provider: string
          use_ssl: boolean | null
        }
        Insert: {
          display_name: string
          help_url?: string | null
          imap_host: string
          imap_port: number
          instructions?: string | null
          provider: string
          use_ssl?: boolean | null
        }
        Update: {
          display_name?: string
          help_url?: string | null
          imap_host?: string
          imap_port?: number
          instructions?: string | null
          provider?: string
          use_ssl?: boolean | null
        }
        Relationships: []
      }
      invoice_line_items: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          invoice_id: string | null
          period_end: string | null
          period_start: string | null
          quantity: number | null
          unit_amount: number | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          invoice_id?: string | null
          period_end?: string | null
          period_start?: string | null
          quantity?: number | null
          unit_amount?: number | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          invoice_id?: string | null
          period_end?: string | null
          period_start?: string | null
          quantity?: number | null
          unit_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_due: number
          amount_paid: number
          billing_reason: string | null
          created_at: string | null
          currency: string | null
          due_date: string | null
          hosted_invoice_url: string | null
          id: string
          invoice_number: string | null
          invoice_pdf: string | null
          paid_at: string | null
          refund_amount: number | null
          refund_date: string | null
          status: string
          stripe_customer_id: string
          stripe_invoice_id: string
          stripe_payment_intent_id: string | null
          subscription_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount_due: number
          amount_paid: number
          billing_reason?: string | null
          created_at?: string | null
          currency?: string | null
          due_date?: string | null
          hosted_invoice_url?: string | null
          id?: string
          invoice_number?: string | null
          invoice_pdf?: string | null
          paid_at?: string | null
          refund_amount?: number | null
          refund_date?: string | null
          status: string
          stripe_customer_id: string
          stripe_invoice_id: string
          stripe_payment_intent_id?: string | null
          subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount_due?: number
          amount_paid?: number
          billing_reason?: string | null
          created_at?: string | null
          currency?: string | null
          due_date?: string | null
          hosted_invoice_url?: string | null
          id?: string
          invoice_number?: string | null
          invoice_pdf?: string | null
          paid_at?: string | null
          refund_amount?: number | null
          refund_date?: string | null
          status?: string
          stripe_customer_id?: string
          stripe_invoice_id?: string
          stripe_payment_intent_id?: string | null
          subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "invoices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
        ]
      }
      issues: {
        Row: {
          affected_areas: Json | null
          assignee_id: string | null
          assignee_name: string | null
          closed_at: string | null
          comments: Json | null
          created_at: string
          custom_fields: Json | null
          description: string | null
          history: Json | null
          id: string
          key: string | null
          linked_items: Json | null
          priority: Database["public"]["Enums"]["priority_level"] | null
          project_id: string | null
          reporter_id: string | null
          reporter_name: string | null
          resolution: string | null
          resolved_at: string | null
          root_cause: string | null
          severity: Database["public"]["Enums"]["issue_severity"] | null
          sla_breached: boolean | null
          sla_target_resolution: number | null
          status: Database["public"]["Enums"]["issue_status"] | null
          tags: Json | null
          title: string
          type: string | null
          updated_at: string
        }
        Insert: {
          affected_areas?: Json | null
          assignee_id?: string | null
          assignee_name?: string | null
          closed_at?: string | null
          comments?: Json | null
          created_at?: string
          custom_fields?: Json | null
          description?: string | null
          history?: Json | null
          id?: string
          key?: string | null
          linked_items?: Json | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          project_id?: string | null
          reporter_id?: string | null
          reporter_name?: string | null
          resolution?: string | null
          resolved_at?: string | null
          root_cause?: string | null
          severity?: Database["public"]["Enums"]["issue_severity"] | null
          sla_breached?: boolean | null
          sla_target_resolution?: number | null
          status?: Database["public"]["Enums"]["issue_status"] | null
          tags?: Json | null
          title: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          affected_areas?: Json | null
          assignee_id?: string | null
          assignee_name?: string | null
          closed_at?: string | null
          comments?: Json | null
          created_at?: string
          custom_fields?: Json | null
          description?: string | null
          history?: Json | null
          id?: string
          key?: string | null
          linked_items?: Json | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          project_id?: string | null
          reporter_id?: string | null
          reporter_name?: string | null
          resolution?: string | null
          resolved_at?: string | null
          root_cause?: string | null
          severity?: Database["public"]["Enums"]["issue_severity"] | null
          sla_breached?: boolean | null
          sla_target_resolution?: number | null
          status?: Database["public"]["Enums"]["issue_status"] | null
          tags?: Json | null
          title?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "issues_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      key_personnel: {
        Row: {
          contract_start_date: string | null
          created_at: string | null
          id: string
          name: string
          organisation: string | null
          project_id: string
          role: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          contract_start_date?: string | null
          created_at?: string | null
          id?: string
          name: string
          organisation?: string | null
          project_id: string
          role: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          contract_start_date?: string | null
          created_at?: string | null
          id?: string
          name?: string
          organisation?: string | null
          project_id?: string
          role?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "key_personnel_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      key_personnel_replacements: {
        Row: {
          created_at: string | null
          date_notified: string
          id: string
          key_person_id: string
          notes: string | null
          outcome: string | null
          reason: string
          replacement_name: string | null
          review_deadline: string | null
          review_period_days: number | null
        }
        Insert: {
          created_at?: string | null
          date_notified: string
          id?: string
          key_person_id: string
          notes?: string | null
          outcome?: string | null
          reason: string
          replacement_name?: string | null
          review_deadline?: string | null
          review_period_days?: number | null
        }
        Update: {
          created_at?: string | null
          date_notified?: string
          id?: string
          key_person_id?: string
          notes?: string | null
          outcome?: string | null
          reason?: string
          replacement_name?: string | null
          review_deadline?: string | null
          review_period_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "key_personnel_replacements_key_person_id_fkey"
            columns: ["key_person_id"]
            isOneToOne: false
            referencedRelation: "key_personnel"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_articles: {
        Row: {
          article_type: string | null
          category: string | null
          content: string
          created_at: string | null
          created_by_user_id: string
          helpful_count: number | null
          id: string
          is_featured: boolean | null
          last_reviewed_at: string | null
          not_helpful_count: number | null
          program_id: string | null
          related_articles: string[] | null
          related_documents: string[] | null
          reviewed_by_user_id: string | null
          scope: string | null
          status: string | null
          summary: string | null
          tags: string[] | null
          tenant_id: string
          title: string
          updated_at: string | null
          view_count: number | null
          workspace_id: string | null
        }
        Insert: {
          article_type?: string | null
          category?: string | null
          content: string
          created_at?: string | null
          created_by_user_id: string
          helpful_count?: number | null
          id?: string
          is_featured?: boolean | null
          last_reviewed_at?: string | null
          not_helpful_count?: number | null
          program_id?: string | null
          related_articles?: string[] | null
          related_documents?: string[] | null
          reviewed_by_user_id?: string | null
          scope?: string | null
          status?: string | null
          summary?: string | null
          tags?: string[] | null
          tenant_id: string
          title: string
          updated_at?: string | null
          view_count?: number | null
          workspace_id?: string | null
        }
        Update: {
          article_type?: string | null
          category?: string | null
          content?: string
          created_at?: string | null
          created_by_user_id?: string
          helpful_count?: number | null
          id?: string
          is_featured?: boolean | null
          last_reviewed_at?: string | null
          not_helpful_count?: number | null
          program_id?: string | null
          related_articles?: string[] | null
          related_documents?: string[] | null
          reviewed_by_user_id?: string | null
          scope?: string | null
          status?: string | null
          summary?: string | null
          tags?: string[] | null
          tenant_id?: string
          title?: string
          updated_at?: string | null
          view_count?: number | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_articles_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_articles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_articles_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons_learned: {
        Row: {
          category: string | null
          created_at: string | null
          created_by_id: string | null
          created_by_name: string | null
          custom_fields: Json | null
          description: string | null
          id: string
          impact: Database["public"]["Enums"]["stakeholder_level"] | null
          impact_level: string | null
          phase: string | null
          project_id: string | null
          recommendation: string | null
          recommendations: string[] | null
          submitted_by: string | null
          submitted_by_name: string | null
          tags: string[] | null
          title: string
          type: string | null
          updated_at: string | null
          votes: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by_id?: string | null
          created_by_name?: string | null
          custom_fields?: Json | null
          description?: string | null
          id?: string
          impact?: Database["public"]["Enums"]["stakeholder_level"] | null
          impact_level?: string | null
          phase?: string | null
          project_id?: string | null
          recommendation?: string | null
          recommendations?: string[] | null
          submitted_by?: string | null
          submitted_by_name?: string | null
          tags?: string[] | null
          title: string
          type?: string | null
          updated_at?: string | null
          votes?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by_id?: string | null
          created_by_name?: string | null
          custom_fields?: Json | null
          description?: string | null
          id?: string
          impact?: Database["public"]["Enums"]["stakeholder_level"] | null
          impact_level?: string | null
          phase?: string | null
          project_id?: string | null
          recommendation?: string | null
          recommendations?: string[] | null
          submitted_by?: string | null
          submitted_by_name?: string | null
          tags?: string[] | null
          title?: string
          type?: string | null
          updated_at?: string | null
          votes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_learned_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      license_key_activations: {
        Row: {
          activated_at: string
          deactivated_at: string | null
          deactivation_reason: string | null
          device_fingerprint: string | null
          device_name: string | null
          id: string
          ip_address: unknown
          is_active: boolean | null
          license_key_id: string
          machine_id: string | null
          user_agent: string | null
        }
        Insert: {
          activated_at?: string
          deactivated_at?: string | null
          deactivation_reason?: string | null
          device_fingerprint?: string | null
          device_name?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          license_key_id: string
          machine_id?: string | null
          user_agent?: string | null
        }
        Update: {
          activated_at?: string
          deactivated_at?: string | null
          deactivation_reason?: string | null
          device_fingerprint?: string | null
          device_name?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          license_key_id?: string
          machine_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "license_key_activations_license_key_id_fkey"
            columns: ["license_key_id"]
            isOneToOne: false
            referencedRelation: "license_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      license_keys: {
        Row: {
          activated_at: string | null
          activation_count: number | null
          assigned_email: string | null
          auto_renewal: boolean | null
          created_at: string
          created_by: string | null
          device_fingerprints: Json | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          is_redeemed: boolean | null
          key: string
          key_prefix: string | null
          license_type: string
          max_activations: number | null
          metadata: Json | null
          notes: string | null
          offline_token: string | null
          offline_validation_enabled: boolean | null
          source: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          activated_at?: string | null
          activation_count?: number | null
          assigned_email?: string | null
          auto_renewal?: boolean | null
          created_at?: string
          created_by?: string | null
          device_fingerprints?: Json | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_redeemed?: boolean | null
          key: string
          key_prefix?: string | null
          license_type: string
          max_activations?: number | null
          metadata?: Json | null
          notes?: string | null
          offline_token?: string | null
          offline_validation_enabled?: boolean | null
          source?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          activated_at?: string | null
          activation_count?: number | null
          assigned_email?: string | null
          auto_renewal?: boolean | null
          created_at?: string
          created_by?: string | null
          device_fingerprints?: Json | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_redeemed?: boolean | null
          key?: string
          key_prefix?: string | null
          license_type?: string
          max_activations?: number | null
          metadata?: Json | null
          notes?: string | null
          offline_token?: string | null
          offline_validation_enabled?: boolean | null
          source?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "license_keys_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "license_keys_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
          {
            foreignKeyName: "license_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "license_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
        ]
      }
      licenses: {
        Row: {
          allocated_licenses: number
          created_at: string
          id: string
          license_type: string
          price_per_license: number | null
          renewal_date: string | null
          status: string
          tenant_id: string
          total_licenses: number
          updated_at: string
        }
        Insert: {
          allocated_licenses?: number
          created_at?: string
          id?: string
          license_type: string
          price_per_license?: number | null
          renewal_date?: string | null
          status?: string
          tenant_id: string
          total_licenses?: number
          updated_at?: string
        }
        Update: {
          allocated_licenses?: number
          created_at?: string
          id?: string
          license_type?: string
          price_per_license?: number | null
          renewal_date?: string | null
          status?: string
          tenant_id?: string
          total_licenses?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "licenses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_campaigns: {
        Row: {
          completed_at: string | null
          content: Json
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          scheduled_at: string | null
          started_at: string | null
          status: string
          subject: string | null
          target_audience: Json | null
          type: string
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          content?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          subject?: string | null
          target_audience?: Json | null
          type: string
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          content?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          subject?: string | null
          target_audience?: Json | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "marketing_campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
        ]
      }
      media_library: {
        Row: {
          alt_text: string | null
          caption: string | null
          created_at: string | null
          deleted_at: string | null
          duration: number | null
          file_size: number
          file_type: string
          filename: string
          folder: string | null
          height: number | null
          id: string
          mime_type: string | null
          original_filename: string
          public_url: string
          storage_path: string
          tags: string[] | null
          updated_at: string | null
          uploaded_by: string | null
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string | null
          deleted_at?: string | null
          duration?: number | null
          file_size: number
          file_type: string
          filename: string
          folder?: string | null
          height?: number | null
          id?: string
          mime_type?: string | null
          original_filename: string
          public_url: string
          storage_path: string
          tags?: string[] | null
          updated_at?: string | null
          uploaded_by?: string | null
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string | null
          deleted_at?: string | null
          duration?: number | null
          file_size?: number
          file_type?: string
          filename?: string
          folder?: string | null
          height?: number | null
          id?: string
          mime_type?: string | null
          original_filename?: string
          public_url?: string
          storage_path?: string
          tags?: string[] | null
          updated_at?: string | null
          uploaded_by?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_library_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "media_library_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
        ]
      }
      meeting_action_items: {
        Row: {
          ai_confidence: number | null
          assigned_by_user_id: string | null
          blocked_by: Json | null
          completed_at: string | null
          created_at: string
          created_by_user_id: string | null
          deferral_count: number | null
          dependencies: Json | null
          description: string | null
          due_date: string | null
          id: string
          linked_task_id: string | null
          meeting_id: string
          original_due_date: string | null
          owner_name: string
          owner_user_id: string | null
          priority: string | null
          source: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          ai_confidence?: number | null
          assigned_by_user_id?: string | null
          blocked_by?: Json | null
          completed_at?: string | null
          created_at?: string
          created_by_user_id?: string | null
          deferral_count?: number | null
          dependencies?: Json | null
          description?: string | null
          due_date?: string | null
          id?: string
          linked_task_id?: string | null
          meeting_id: string
          original_due_date?: string | null
          owner_name: string
          owner_user_id?: string | null
          priority?: string | null
          source?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          ai_confidence?: number | null
          assigned_by_user_id?: string | null
          blocked_by?: Json | null
          completed_at?: string | null
          created_at?: string
          created_by_user_id?: string | null
          deferral_count?: number | null
          dependencies?: Json | null
          description?: string | null
          due_date?: string | null
          id?: string
          linked_task_id?: string | null
          meeting_id?: string
          original_due_date?: string | null
          owner_name?: string
          owner_user_id?: string | null
          priority?: string | null
          source?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_action_items_linked_task_id_fkey"
            columns: ["linked_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_action_items_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_agenda_items: {
        Row: {
          actual_duration_minutes: number | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          meeting_id: string
          notes: string | null
          presenter_id: string | null
          presenter_name: string | null
          sort_order: number | null
          status: string | null
          title: string
        }
        Insert: {
          actual_duration_minutes?: number | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          meeting_id: string
          notes?: string | null
          presenter_id?: string | null
          presenter_name?: string | null
          sort_order?: number | null
          status?: string | null
          title: string
        }
        Update: {
          actual_duration_minutes?: number | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          meeting_id?: string
          notes?: string | null
          presenter_id?: string | null
          presenter_name?: string | null
          sort_order?: number | null
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_agenda_items_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_analytics: {
        Row: {
          action_items_completed: number | null
          action_items_created: number | null
          action_items_pending: number | null
          actual_duration: number | null
          attendance_rate: number | null
          calculated_at: string | null
          completion_rate: number | null
          created_at: string | null
          duration_efficiency: number | null
          effectiveness_score: number | null
          id: string
          meeting_id: string
          notes_count: number | null
          scheduled_duration: number | null
          tenant_id: string
          total_accepted: number | null
          total_attended: number | null
          total_declined: number | null
          total_invites: number | null
          total_no_shows: number | null
          total_tentative: number | null
          updated_at: string | null
        }
        Insert: {
          action_items_completed?: number | null
          action_items_created?: number | null
          action_items_pending?: number | null
          actual_duration?: number | null
          attendance_rate?: number | null
          calculated_at?: string | null
          completion_rate?: number | null
          created_at?: string | null
          duration_efficiency?: number | null
          effectiveness_score?: number | null
          id?: string
          meeting_id: string
          notes_count?: number | null
          scheduled_duration?: number | null
          tenant_id: string
          total_accepted?: number | null
          total_attended?: number | null
          total_declined?: number | null
          total_invites?: number | null
          total_no_shows?: number | null
          total_tentative?: number | null
          updated_at?: string | null
        }
        Update: {
          action_items_completed?: number | null
          action_items_created?: number | null
          action_items_pending?: number | null
          actual_duration?: number | null
          attendance_rate?: number | null
          calculated_at?: string | null
          completion_rate?: number | null
          created_at?: string | null
          duration_efficiency?: number | null
          effectiveness_score?: number | null
          id?: string
          meeting_id?: string
          notes_count?: number | null
          scheduled_duration?: number | null
          tenant_id?: string
          total_accepted?: number | null
          total_attended?: number | null
          total_declined?: number | null
          total_invites?: number | null
          total_no_shows?: number | null
          total_tentative?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_analytics_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: true
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_attendees: {
        Row: {
          added_at: string | null
          added_by_user_id: string | null
          id: string
          meeting_id: string
          response_at: string | null
          response_note: string | null
          role: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          added_at?: string | null
          added_by_user_id?: string | null
          id?: string
          meeting_id: string
          response_at?: string | null
          response_note?: string | null
          role?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          added_at?: string | null
          added_by_user_id?: string | null
          id?: string
          meeting_id?: string
          response_at?: string | null
          response_note?: string | null
          role?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_attendees_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_conflicts: {
        Row: {
          ai_confidence: number | null
          conflict_type: string | null
          created_at: string
          description: string
          id: string
          meeting_id: string
          parties: Json | null
          resolved: boolean | null
          resolved_at: string | null
          severity: string | null
          suggested_resolution: string | null
        }
        Insert: {
          ai_confidence?: number | null
          conflict_type?: string | null
          created_at?: string
          description: string
          id?: string
          meeting_id: string
          parties?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          severity?: string | null
          suggested_resolution?: string | null
        }
        Update: {
          ai_confidence?: number | null
          conflict_type?: string | null
          created_at?: string
          description?: string
          id?: string
          meeting_id?: string
          parties?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          severity?: string | null
          suggested_resolution?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_conflicts_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_decisions: {
        Row: {
          ai_confidence: number | null
          approved_by: Json | null
          created_at: string
          decision_type: string | null
          description: string
          id: string
          impact: string | null
          implemented: boolean | null
          implemented_at: string | null
          linked_risks: Json | null
          linked_tasks: Json | null
          made_by: string | null
          made_by_user_id: string | null
          meeting_id: string
          source: string | null
          timestamp_in_meeting: string | null
        }
        Insert: {
          ai_confidence?: number | null
          approved_by?: Json | null
          created_at?: string
          decision_type?: string | null
          description: string
          id?: string
          impact?: string | null
          implemented?: boolean | null
          implemented_at?: string | null
          linked_risks?: Json | null
          linked_tasks?: Json | null
          made_by?: string | null
          made_by_user_id?: string | null
          meeting_id: string
          source?: string | null
          timestamp_in_meeting?: string | null
        }
        Update: {
          ai_confidence?: number | null
          approved_by?: Json | null
          created_at?: string
          decision_type?: string | null
          description?: string
          id?: string
          impact?: string | null
          implemented?: boolean | null
          implemented_at?: string | null
          linked_risks?: Json | null
          linked_tasks?: Json | null
          made_by?: string | null
          made_by_user_id?: string | null
          meeting_id?: string
          source?: string | null
          timestamp_in_meeting?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_decisions_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          meeting_id: string
          note_type: string | null
          timestamp_in_meeting: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          meeting_id: string
          note_type?: string | null
          timestamp_in_meeting?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          meeting_id?: string
          note_type?: string | null
          timestamp_in_meeting?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_notes_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_participants: {
        Row: {
          attendance_status: string | null
          attended: boolean | null
          created_at: string
          email: string | null
          id: string
          interest_level: string | null
          join_time: string | null
          leave_time: string | null
          meeting_id: string
          name: string
          power_level: string | null
          role: string
          speaking_time_seconds: number | null
          user_id: string | null
        }
        Insert: {
          attendance_status?: string | null
          attended?: boolean | null
          created_at?: string
          email?: string | null
          id?: string
          interest_level?: string | null
          join_time?: string | null
          leave_time?: string | null
          meeting_id: string
          name: string
          power_level?: string | null
          role?: string
          speaking_time_seconds?: number | null
          user_id?: string | null
        }
        Update: {
          attendance_status?: string | null
          attended?: boolean | null
          created_at?: string
          email?: string | null
          id?: string
          interest_level?: string | null
          join_time?: string | null
          leave_time?: string | null
          meeting_id?: string
          name?: string
          power_level?: string | null
          role?: string
          speaking_time_seconds?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_participants_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_risks: {
        Row: {
          ai_confidence: number | null
          category: string | null
          created_at: string
          description: string | null
          id: string
          impact: string | null
          meeting_id: string
          probability: string | null
          source: string | null
          suggested_mitigation: string | null
          title: string
        }
        Insert: {
          ai_confidence?: number | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          impact?: string | null
          meeting_id: string
          probability?: string | null
          source?: string | null
          suggested_mitigation?: string | null
          title: string
        }
        Update: {
          ai_confidence?: number | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          impact?: string | null
          meeting_id?: string
          probability?: string | null
          source?: string | null
          suggested_mitigation?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_risks_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_scope_changes: {
        Row: {
          ai_confidence: number | null
          approved: boolean | null
          approved_at: string | null
          approved_by: string | null
          change_type: string
          created_at: string
          description: string
          id: string
          impact_area: string | null
          magnitude: string | null
          meeting_id: string
          requires_approval: boolean | null
        }
        Insert: {
          ai_confidence?: number | null
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          change_type: string
          created_at?: string
          description: string
          id?: string
          impact_area?: string | null
          magnitude?: string | null
          meeting_id: string
          requires_approval?: boolean | null
        }
        Update: {
          ai_confidence?: number | null
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          change_type?: string
          created_at?: string
          description?: string
          id?: string
          impact_area?: string | null
          magnitude?: string | null
          meeting_id?: string
          requires_approval?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_scope_changes_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_templates: {
        Row: {
          agenda: string | null
          created_at: string | null
          created_by_user_id: string | null
          default_attendees: Json | null
          default_duration: number | null
          description: string | null
          id: string
          is_active: boolean | null
          meeting_type: string | null
          name: string
          program_id: string | null
          scope: string | null
          tenant_id: string
          updated_at: string | null
          usage_count: number | null
          workspace_id: string | null
        }
        Insert: {
          agenda?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          default_attendees?: Json | null
          default_duration?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          meeting_type?: string | null
          name: string
          program_id?: string | null
          scope?: string | null
          tenant_id: string
          updated_at?: string | null
          usage_count?: number | null
          workspace_id?: string | null
        }
        Update: {
          agenda?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          default_attendees?: Json | null
          default_duration?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          meeting_type?: string | null
          name?: string
          program_id?: string | null
          scope?: string | null
          tenant_id?: string
          updated_at?: string | null
          usage_count?: number | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_templates_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_templates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_trends: {
        Row: {
          avg_attendance_rate: number | null
          avg_completion_rate: number | null
          avg_effectiveness_score: number | null
          completed_action_items: number | null
          created_at: string | null
          id: string
          meetings_by_scope: Json | null
          meetings_by_type: Json | null
          period_end: string
          period_start: string
          period_type: string
          portfolio_id: string | null
          program_id: string | null
          tenant_id: string
          total_action_items: number | null
          total_meetings: number | null
          workspace_id: string | null
        }
        Insert: {
          avg_attendance_rate?: number | null
          avg_completion_rate?: number | null
          avg_effectiveness_score?: number | null
          completed_action_items?: number | null
          created_at?: string | null
          id?: string
          meetings_by_scope?: Json | null
          meetings_by_type?: Json | null
          period_end: string
          period_start: string
          period_type: string
          portfolio_id?: string | null
          program_id?: string | null
          tenant_id: string
          total_action_items?: number | null
          total_meetings?: number | null
          workspace_id?: string | null
        }
        Update: {
          avg_attendance_rate?: number | null
          avg_completion_rate?: number | null
          avg_effectiveness_score?: number | null
          completed_action_items?: number | null
          created_at?: string | null
          id?: string
          meetings_by_scope?: Json | null
          meetings_by_type?: Json | null
          period_end?: string
          period_start?: string
          period_type?: string
          portfolio_id?: string | null
          program_id?: string | null
          tenant_id?: string
          total_action_items?: number | null
          total_meetings?: number | null
          workspace_id?: string | null
        }
        Relationships: []
      }
      meetings: {
        Row: {
          ai_confidence: number | null
          ai_key_topics: Json | null
          ai_next_steps: Json | null
          ai_processed_at: string | null
          ai_sentiment: Json | null
          ai_summary: string | null
          audio_available: boolean | null
          budget_authority: number | null
          capture_confidence: string | null
          capture_mode: string | null
          created_at: string
          created_by: string | null
          date: string
          decision_scope_type: string | null
          description: string | null
          duration_minutes: number | null
          end_time: string | null
          expected_outcomes: Json | null
          id: string
          is_recurring: boolean | null
          is_template: boolean | null
          linked_risks: Json | null
          linked_workstreams: Json | null
          location: string | null
          meeting_link: string | null
          meeting_scope: string | null
          meeting_type: string
          mom_approved: boolean | null
          mom_approved_at: string | null
          mom_approved_by: string | null
          mom_content: string | null
          mom_generated: boolean | null
          mom_template_id: string | null
          organizer_id: string | null
          parent_meeting_id: string | null
          portfolio_id: string | null
          program_id: string | null
          project_id: string | null
          purpose_description: string | null
          purpose_type: string | null
          recording_url: string | null
          recurrence_pattern: Json | null
          recurring_end_date: string | null
          recurring_instance_date: string | null
          recurring_parent_id: string | null
          recurring_schedule: string | null
          required_quorum: number | null
          resource_authority: boolean | null
          scope_change_authority: boolean | null
          source_type: string | null
          start_time: string
          status: string
          success_criteria: Json | null
          tags: string[] | null
          template_id: string | null
          tenant_id: string | null
          title: string
          transcript_available: boolean | null
          transcript_text: string | null
          updated_at: string
          video_available: boolean | null
          workspace_id: string | null
        }
        Insert: {
          ai_confidence?: number | null
          ai_key_topics?: Json | null
          ai_next_steps?: Json | null
          ai_processed_at?: string | null
          ai_sentiment?: Json | null
          ai_summary?: string | null
          audio_available?: boolean | null
          budget_authority?: number | null
          capture_confidence?: string | null
          capture_mode?: string | null
          created_at?: string
          created_by?: string | null
          date: string
          decision_scope_type?: string | null
          description?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          expected_outcomes?: Json | null
          id?: string
          is_recurring?: boolean | null
          is_template?: boolean | null
          linked_risks?: Json | null
          linked_workstreams?: Json | null
          location?: string | null
          meeting_link?: string | null
          meeting_scope?: string | null
          meeting_type?: string
          mom_approved?: boolean | null
          mom_approved_at?: string | null
          mom_approved_by?: string | null
          mom_content?: string | null
          mom_generated?: boolean | null
          mom_template_id?: string | null
          organizer_id?: string | null
          parent_meeting_id?: string | null
          portfolio_id?: string | null
          program_id?: string | null
          project_id?: string | null
          purpose_description?: string | null
          purpose_type?: string | null
          recording_url?: string | null
          recurrence_pattern?: Json | null
          recurring_end_date?: string | null
          recurring_instance_date?: string | null
          recurring_parent_id?: string | null
          recurring_schedule?: string | null
          required_quorum?: number | null
          resource_authority?: boolean | null
          scope_change_authority?: boolean | null
          source_type?: string | null
          start_time: string
          status?: string
          success_criteria?: Json | null
          tags?: string[] | null
          template_id?: string | null
          tenant_id?: string | null
          title: string
          transcript_available?: boolean | null
          transcript_text?: string | null
          updated_at?: string
          video_available?: boolean | null
          workspace_id?: string | null
        }
        Update: {
          ai_confidence?: number | null
          ai_key_topics?: Json | null
          ai_next_steps?: Json | null
          ai_processed_at?: string | null
          ai_sentiment?: Json | null
          ai_summary?: string | null
          audio_available?: boolean | null
          budget_authority?: number | null
          capture_confidence?: string | null
          capture_mode?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          decision_scope_type?: string | null
          description?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          expected_outcomes?: Json | null
          id?: string
          is_recurring?: boolean | null
          is_template?: boolean | null
          linked_risks?: Json | null
          linked_workstreams?: Json | null
          location?: string | null
          meeting_link?: string | null
          meeting_scope?: string | null
          meeting_type?: string
          mom_approved?: boolean | null
          mom_approved_at?: string | null
          mom_approved_by?: string | null
          mom_content?: string | null
          mom_generated?: boolean | null
          mom_template_id?: string | null
          organizer_id?: string | null
          parent_meeting_id?: string | null
          portfolio_id?: string | null
          program_id?: string | null
          project_id?: string | null
          purpose_description?: string | null
          purpose_type?: string | null
          recording_url?: string | null
          recurrence_pattern?: Json | null
          recurring_end_date?: string | null
          recurring_instance_date?: string | null
          recurring_parent_id?: string | null
          recurring_schedule?: string | null
          required_quorum?: number | null
          resource_authority?: boolean | null
          scope_change_authority?: boolean | null
          source_type?: string | null
          start_time?: string
          status?: string
          success_criteria?: Json | null
          tags?: string[] | null
          template_id?: string | null
          tenant_id?: string | null
          title?: string
          transcript_available?: boolean | null
          transcript_text?: string | null
          updated_at?: string
          video_available?: boolean | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meetings_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "meetings_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
          {
            foreignKeyName: "meetings_parent_meeting_id_fkey"
            columns: ["parent_meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_recurring_parent_fkey"
            columns: ["recurring_parent_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_ab_test_results: {
        Row: {
          ab_test_id: string | null
          created_at: string | null
          id: string
          pattern_id: string | null
          prediction_id: string | null
          variant: string
          was_successful: boolean | null
        }
        Insert: {
          ab_test_id?: string | null
          created_at?: string | null
          id?: string
          pattern_id?: string | null
          prediction_id?: string | null
          variant: string
          was_successful?: boolean | null
        }
        Update: {
          ab_test_id?: string | null
          created_at?: string | null
          id?: string
          pattern_id?: string | null
          prediction_id?: string | null
          variant?: string
          was_successful?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_ab_test_results_ab_test_id_fkey"
            columns: ["ab_test_id"]
            isOneToOne: false
            referencedRelation: "ml_ab_tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ml_ab_test_results_pattern_id_fkey"
            columns: ["pattern_id"]
            isOneToOne: false
            referencedRelation: "ml_learning_patterns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ml_ab_test_results_prediction_id_fkey"
            columns: ["prediction_id"]
            isOneToOne: false
            referencedRelation: "ml_predictions"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_ab_tests: {
        Row: {
          confidence_level: number | null
          created_at: string | null
          description: string | null
          ended_at: string | null
          id: string
          name: string
          pattern_a_id: string | null
          pattern_b_id: string | null
          pattern_c_id: string | null
          pattern_d_id: string | null
          started_at: string | null
          status: string | null
          traffic_split: Json | null
          winner_pattern_id: string | null
        }
        Insert: {
          confidence_level?: number | null
          created_at?: string | null
          description?: string | null
          ended_at?: string | null
          id?: string
          name: string
          pattern_a_id?: string | null
          pattern_b_id?: string | null
          pattern_c_id?: string | null
          pattern_d_id?: string | null
          started_at?: string | null
          status?: string | null
          traffic_split?: Json | null
          winner_pattern_id?: string | null
        }
        Update: {
          confidence_level?: number | null
          created_at?: string | null
          description?: string | null
          ended_at?: string | null
          id?: string
          name?: string
          pattern_a_id?: string | null
          pattern_b_id?: string | null
          pattern_c_id?: string | null
          pattern_d_id?: string | null
          started_at?: string | null
          status?: string | null
          traffic_split?: Json | null
          winner_pattern_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_ab_tests_pattern_a_id_fkey"
            columns: ["pattern_a_id"]
            isOneToOne: false
            referencedRelation: "ml_learning_patterns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ml_ab_tests_pattern_b_id_fkey"
            columns: ["pattern_b_id"]
            isOneToOne: false
            referencedRelation: "ml_learning_patterns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ml_ab_tests_pattern_c_id_fkey"
            columns: ["pattern_c_id"]
            isOneToOne: false
            referencedRelation: "ml_learning_patterns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ml_ab_tests_pattern_d_id_fkey"
            columns: ["pattern_d_id"]
            isOneToOne: false
            referencedRelation: "ml_learning_patterns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ml_ab_tests_winner_pattern_id_fkey"
            columns: ["winner_pattern_id"]
            isOneToOne: false
            referencedRelation: "ml_learning_patterns"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_accuracy_logs: {
        Row: {
          accuracy_score: number | null
          actual_value: Json
          deviation_percent: number | null
          id: string
          is_within_threshold: boolean | null
          logged_at: string
          logged_by: string | null
          model_id: string | null
          model_type: string
          notes: string | null
          predicted_value: Json
          prediction_id: string | null
        }
        Insert: {
          accuracy_score?: number | null
          actual_value: Json
          deviation_percent?: number | null
          id?: string
          is_within_threshold?: boolean | null
          logged_at?: string
          logged_by?: string | null
          model_id?: string | null
          model_type: string
          notes?: string | null
          predicted_value: Json
          prediction_id?: string | null
        }
        Update: {
          accuracy_score?: number | null
          actual_value?: Json
          deviation_percent?: number | null
          id?: string
          is_within_threshold?: boolean | null
          logged_at?: string
          logged_by?: string | null
          model_id?: string | null
          model_type?: string
          notes?: string | null
          predicted_value?: Json
          prediction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_accuracy_logs_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ml_model_metadata"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ml_accuracy_logs_prediction_id_fkey"
            columns: ["prediction_id"]
            isOneToOne: false
            referencedRelation: "ml_predictions"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          created_at: string
          id: string
          is_acknowledged: boolean | null
          message: string
          metadata: Json | null
          model_type: string
          severity: string
          title: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: string
          created_at?: string
          id?: string
          is_acknowledged?: boolean | null
          message: string
          metadata?: Json | null
          model_type: string
          severity: string
          title: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          created_at?: string
          id?: string
          is_acknowledged?: boolean | null
          message?: string
          metadata?: Json | null
          model_type?: string
          severity?: string
          title?: string
        }
        Relationships: []
      }
      ml_auto_learning_config: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          id: string
          min_feedbacks_for_pattern: number | null
          min_success_rate_threshold: number | null
          optimization_enabled: boolean | null
          pruning_enabled: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          min_feedbacks_for_pattern?: number | null
          min_success_rate_threshold?: number | null
          optimization_enabled?: boolean | null
          pruning_enabled?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          min_feedbacks_for_pattern?: number | null
          min_success_rate_threshold?: number | null
          optimization_enabled?: boolean | null
          pruning_enabled?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ml_execution_logs: {
        Row: {
          cache_hit: boolean
          created_at: string
          error_message: string | null
          error_occurred: boolean
          execution_time_ms: number
          id: string
          input_hash: string | null
          model_version: string | null
          prediction_id: string | null
          prediction_type: string
          project_id: string | null
        }
        Insert: {
          cache_hit?: boolean
          created_at?: string
          error_message?: string | null
          error_occurred?: boolean
          execution_time_ms?: number
          id?: string
          input_hash?: string | null
          model_version?: string | null
          prediction_id?: string | null
          prediction_type: string
          project_id?: string | null
        }
        Update: {
          cache_hit?: boolean
          created_at?: string
          error_message?: string | null
          error_occurred?: boolean
          execution_time_ms?: number
          id?: string
          input_hash?: string | null
          model_version?: string | null
          prediction_id?: string | null
          prediction_type?: string
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_execution_logs_prediction_id_fkey"
            columns: ["prediction_id"]
            isOneToOne: false
            referencedRelation: "ml_predictions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ml_execution_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_learning_patterns: {
        Row: {
          adjustment: Json
          application_count: number | null
          approval_status: string | null
          approved_by_user_id: string | null
          context: Json
          created_at: string | null
          created_by_user_id: string | null
          id: string
          is_active: boolean | null
          pattern_type: string
          portfolio_id: string | null
          prediction_type: string
          project_id: string | null
          promoted_from_pattern_id: string | null
          promotion_reason: string | null
          sample_size: number | null
          sharing_scope: string | null
          source_type: string | null
          success_rate: number | null
          tenant_id: string | null
          workspace_id: string | null
        }
        Insert: {
          adjustment: Json
          application_count?: number | null
          approval_status?: string | null
          approved_by_user_id?: string | null
          context: Json
          created_at?: string | null
          created_by_user_id?: string | null
          id?: string
          is_active?: boolean | null
          pattern_type: string
          portfolio_id?: string | null
          prediction_type: string
          project_id?: string | null
          promoted_from_pattern_id?: string | null
          promotion_reason?: string | null
          sample_size?: number | null
          sharing_scope?: string | null
          source_type?: string | null
          success_rate?: number | null
          tenant_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          adjustment?: Json
          application_count?: number | null
          approval_status?: string | null
          approved_by_user_id?: string | null
          context?: Json
          created_at?: string | null
          created_by_user_id?: string | null
          id?: string
          is_active?: boolean | null
          pattern_type?: string
          portfolio_id?: string | null
          prediction_type?: string
          project_id?: string | null
          promoted_from_pattern_id?: string | null
          promotion_reason?: string | null
          sample_size?: number | null
          sharing_scope?: string | null
          source_type?: string | null
          success_rate?: number | null
          tenant_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_learning_patterns_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ml_learning_patterns_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ml_learning_patterns_promoted_from_pattern_id_fkey"
            columns: ["promoted_from_pattern_id"]
            isOneToOne: false
            referencedRelation: "ml_learning_patterns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ml_learning_patterns_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ml_learning_patterns_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_learning_velocity: {
        Row: {
          avg_success_rate: number | null
          created_at: string | null
          date: string
          id: string
          improvement_rate: number | null
          patterns_created: number | null
          patterns_optimized: number | null
          patterns_pruned: number | null
          prediction_type: string
        }
        Insert: {
          avg_success_rate?: number | null
          created_at?: string | null
          date: string
          id?: string
          improvement_rate?: number | null
          patterns_created?: number | null
          patterns_optimized?: number | null
          patterns_pruned?: number | null
          prediction_type: string
        }
        Update: {
          avg_success_rate?: number | null
          created_at?: string | null
          date?: string
          id?: string
          improvement_rate?: number | null
          patterns_created?: number | null
          patterns_optimized?: number | null
          patterns_pruned?: number | null
          prediction_type?: string
        }
        Relationships: []
      }
      ml_manual_learnings: {
        Row: {
          applies_to_scope: string | null
          category: string | null
          converted_to_pattern_id: string | null
          created_at: string | null
          created_by_user_id: string
          description: string | null
          id: string
          imported_from: string | null
          is_active: boolean | null
          learning_data: Json
          learning_type: string
          portfolio_id: string | null
          project_id: string | null
          source_description: string | null
          source_project_id: string | null
          status: string | null
          tags: string[] | null
          tenant_id: string
          title: string
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          applies_to_scope?: string | null
          category?: string | null
          converted_to_pattern_id?: string | null
          created_at?: string | null
          created_by_user_id: string
          description?: string | null
          id?: string
          imported_from?: string | null
          is_active?: boolean | null
          learning_data: Json
          learning_type: string
          portfolio_id?: string | null
          project_id?: string | null
          source_description?: string | null
          source_project_id?: string | null
          status?: string | null
          tags?: string[] | null
          tenant_id: string
          title: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          applies_to_scope?: string | null
          category?: string | null
          converted_to_pattern_id?: string | null
          created_at?: string | null
          created_by_user_id?: string
          description?: string | null
          id?: string
          imported_from?: string | null
          is_active?: boolean | null
          learning_data?: Json
          learning_type?: string
          portfolio_id?: string | null
          project_id?: string | null
          source_description?: string | null
          source_project_id?: string | null
          status?: string | null
          tags?: string[] | null
          tenant_id?: string
          title?: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_manual_learnings_converted_to_pattern_id_fkey"
            columns: ["converted_to_pattern_id"]
            isOneToOne: false
            referencedRelation: "ml_learning_patterns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ml_manual_learnings_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ml_manual_learnings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ml_manual_learnings_source_project_id_fkey"
            columns: ["source_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ml_manual_learnings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ml_manual_learnings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_model_metadata: {
        Row: {
          accuracy_metrics: Json | null
          algorithm: string
          created_at: string
          hyperparameters: Json | null
          id: string
          is_active: boolean
          model_type: string
          model_version: string
          notes: string | null
          training_data_size: number | null
          training_date: string
        }
        Insert: {
          accuracy_metrics?: Json | null
          algorithm: string
          created_at?: string
          hyperparameters?: Json | null
          id?: string
          is_active?: boolean
          model_type: string
          model_version: string
          notes?: string | null
          training_data_size?: number | null
          training_date?: string
        }
        Update: {
          accuracy_metrics?: Json | null
          algorithm?: string
          created_at?: string
          hyperparameters?: Json | null
          id?: string
          is_active?: boolean
          model_type?: string
          model_version?: string
          notes?: string | null
          training_data_size?: number | null
          training_date?: string
        }
        Relationships: []
      }
      ml_models: {
        Row: {
          accuracy: number | null
          created_at: string
          id: string
          last_trained_at: string | null
          metadata: Json | null
          model_type: string | null
          name: string
          status: string | null
          training_data_count: number | null
          updated_at: string
          version: string | null
        }
        Insert: {
          accuracy?: number | null
          created_at?: string
          id?: string
          last_trained_at?: string | null
          metadata?: Json | null
          model_type?: string | null
          name: string
          status?: string | null
          training_data_count?: number | null
          updated_at?: string
          version?: string | null
        }
        Update: {
          accuracy?: number | null
          created_at?: string
          id?: string
          last_trained_at?: string | null
          metadata?: Json | null
          model_type?: string | null
          name?: string
          status?: string | null
          training_data_count?: number | null
          updated_at?: string
          version?: string | null
        }
        Relationships: []
      }
      ml_pattern_changelog: {
        Row: {
          change_type: string
          changes: Json | null
          created_at: string | null
          created_by: string | null
          id: string
          pattern_id: string | null
          version_from: number | null
          version_to: number | null
        }
        Insert: {
          change_type: string
          changes?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          pattern_id?: string | null
          version_from?: number | null
          version_to?: number | null
        }
        Update: {
          change_type?: string
          changes?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          pattern_id?: string | null
          version_from?: number | null
          version_to?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_pattern_changelog_pattern_id_fkey"
            columns: ["pattern_id"]
            isOneToOne: false
            referencedRelation: "ml_learning_patterns"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_pattern_sharing_log: {
        Row: {
          action_type: string
          created_at: string | null
          created_by_user_id: string | null
          from_portfolio_id: string | null
          from_project_id: string | null
          from_workspace_id: string | null
          id: string
          pattern_id: string
          reason: string | null
          shared_from_scope: string
          shared_to_scope: string
        }
        Insert: {
          action_type: string
          created_at?: string | null
          created_by_user_id?: string | null
          from_portfolio_id?: string | null
          from_project_id?: string | null
          from_workspace_id?: string | null
          id?: string
          pattern_id: string
          reason?: string | null
          shared_from_scope: string
          shared_to_scope: string
        }
        Update: {
          action_type?: string
          created_at?: string | null
          created_by_user_id?: string | null
          from_portfolio_id?: string | null
          from_project_id?: string | null
          from_workspace_id?: string | null
          id?: string
          pattern_id?: string
          reason?: string | null
          shared_from_scope?: string
          shared_to_scope?: string
        }
        Relationships: [
          {
            foreignKeyName: "ml_pattern_sharing_log_from_portfolio_id_fkey"
            columns: ["from_portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ml_pattern_sharing_log_from_project_id_fkey"
            columns: ["from_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ml_pattern_sharing_log_from_workspace_id_fkey"
            columns: ["from_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ml_pattern_sharing_log_pattern_id_fkey"
            columns: ["pattern_id"]
            isOneToOne: false
            referencedRelation: "ml_learning_patterns"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_pattern_versions: {
        Row: {
          change_description: string | null
          created_at: string | null
          created_by: string | null
          id: string
          pattern_id: string | null
          pattern_snapshot: Json
          version_number: number
          version_tag: string | null
        }
        Insert: {
          change_description?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          pattern_id?: string | null
          pattern_snapshot: Json
          version_number: number
          version_tag?: string | null
        }
        Update: {
          change_description?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          pattern_id?: string | null
          pattern_snapshot?: Json
          version_number?: number
          version_tag?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_pattern_versions_pattern_id_fkey"
            columns: ["pattern_id"]
            isOneToOne: false
            referencedRelation: "ml_learning_patterns"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_predictions: {
        Row: {
          actual_outcome: Json | null
          confidence: number | null
          confidence_score: number
          created_at: string
          created_by: string | null
          expires_at: string
          feedback_notes: string | null
          id: string
          input_data: Json | null
          prediction: Json | null
          prediction_data: Json
          prediction_type: string
          project_id: string
          user_accepted: boolean | null
          user_feedback_data: Json | null
          user_modified: boolean | null
          user_rating: number | null
        }
        Insert: {
          actual_outcome?: Json | null
          confidence?: number | null
          confidence_score: number
          created_at?: string
          created_by?: string | null
          expires_at?: string
          feedback_notes?: string | null
          id?: string
          input_data?: Json | null
          prediction?: Json | null
          prediction_data: Json
          prediction_type: string
          project_id: string
          user_accepted?: boolean | null
          user_feedback_data?: Json | null
          user_modified?: boolean | null
          user_rating?: number | null
        }
        Update: {
          actual_outcome?: Json | null
          confidence?: number | null
          confidence_score?: number
          created_at?: string
          created_by?: string | null
          expires_at?: string
          feedback_notes?: string | null
          id?: string
          input_data?: Json | null
          prediction?: Json | null
          prediction_data?: Json
          prediction_type?: string
          project_id?: string
          user_accepted?: boolean | null
          user_feedback_data?: Json | null
          user_modified?: boolean | null
          user_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_predictions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_retraining_jobs: {
        Row: {
          accuracy_after: number | null
          accuracy_before: number | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          error_message: string | null
          id: string
          improvement_percent: number | null
          model_type: string
          new_model_id: string | null
          started_at: string | null
          status: string
          training_config: Json | null
          training_samples_count: number | null
        }
        Insert: {
          accuracy_after?: number | null
          accuracy_before?: number | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          improvement_percent?: number | null
          model_type: string
          new_model_id?: string | null
          started_at?: string | null
          status: string
          training_config?: Json | null
          training_samples_count?: number | null
        }
        Update: {
          accuracy_after?: number | null
          accuracy_before?: number | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          improvement_percent?: number | null
          model_type?: string
          new_model_id?: string | null
          started_at?: string | null
          status?: string
          training_config?: Json | null
          training_samples_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_retraining_jobs_new_model_id_fkey"
            columns: ["new_model_id"]
            isOneToOne: false
            referencedRelation: "ml_model_metadata"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_retraining_schedules: {
        Row: {
          enabled: boolean
          frequency: string
          id: string
          last_run: string | null
          model_type: string
          next_run: string
          updated_at: string
        }
        Insert: {
          enabled?: boolean
          frequency?: string
          id?: string
          last_run?: string | null
          model_type: string
          next_run: string
          updated_at?: string
        }
        Update: {
          enabled?: boolean
          frequency?: string
          id?: string
          last_run?: string | null
          model_type?: string
          next_run?: string
          updated_at?: string
        }
        Relationships: []
      }
      ml_training_data: {
        Row: {
          actual_duration_days: number | null
          actual_spent: number | null
          budget: number | null
          completed_tasks: number | null
          cost_variance: number | null
          created_at: string
          delayed_tasks: number | null
          external_factors: Json | null
          high_risk_count: number | null
          id: string
          methodology: string | null
          planned_duration_days: number | null
          project_health: string | null
          project_id: string
          project_status: string | null
          resource_count: number | null
          resource_utilization: number | null
          risk_count: number | null
          schedule_variance_days: number | null
          snapshot_date: string
          total_tasks: number | null
        }
        Insert: {
          actual_duration_days?: number | null
          actual_spent?: number | null
          budget?: number | null
          completed_tasks?: number | null
          cost_variance?: number | null
          created_at?: string
          delayed_tasks?: number | null
          external_factors?: Json | null
          high_risk_count?: number | null
          id?: string
          methodology?: string | null
          planned_duration_days?: number | null
          project_health?: string | null
          project_id: string
          project_status?: string | null
          resource_count?: number | null
          resource_utilization?: number | null
          risk_count?: number | null
          schedule_variance_days?: number | null
          snapshot_date?: string
          total_tasks?: number | null
        }
        Update: {
          actual_duration_days?: number | null
          actual_spent?: number | null
          budget?: number | null
          completed_tasks?: number | null
          cost_variance?: number | null
          created_at?: string
          delayed_tasks?: number | null
          external_factors?: Json | null
          high_risk_count?: number | null
          id?: string
          methodology?: string | null
          planned_duration_days?: number | null
          project_health?: string | null
          project_id?: string
          project_status?: string | null
          resource_count?: number | null
          resource_utilization?: number | null
          risk_count?: number | null
          schedule_variance_days?: number | null
          snapshot_date?: string
          total_tasks?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_training_data_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_user_preferences: {
        Row: {
          confidence: number | null
          created_at: string | null
          id: string
          learned_preferences: Json
          preference_type: string
          project_id: string | null
          user_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          id?: string
          learned_preferences: Json
          preference_type: string
          project_id?: string | null
          user_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          id?: string
          learned_preferences?: Json
          preference_type?: string
          project_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      mom_templates: {
        Row: {
          approval_workflow: Json | null
          created_at: string
          created_by: string | null
          formatting: Json | null
          id: string
          is_default: boolean | null
          name: string
          organization: string | null
          project_id: string | null
          sections: Json | null
          updated_at: string
          version: number | null
        }
        Insert: {
          approval_workflow?: Json | null
          created_at?: string
          created_by?: string | null
          formatting?: Json | null
          id?: string
          is_default?: boolean | null
          name: string
          organization?: string | null
          project_id?: string | null
          sections?: Json | null
          updated_at?: string
          version?: number | null
        }
        Update: {
          approval_workflow?: Json | null
          created_at?: string
          created_by?: string | null
          formatting?: Json | null
          id?: string
          is_default?: boolean | null
          name?: string
          organization?: string | null
          project_id?: string | null
          sections?: Json | null
          updated_at?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mom_templates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notebook_page_links: {
        Row: {
          created_at: string
          id: string
          link_text: string | null
          source_page_id: string
          target_page_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link_text?: string | null
          source_page_id: string
          target_page_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link_text?: string | null
          source_page_id?: string
          target_page_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notebook_page_links_source_page_id_fkey"
            columns: ["source_page_id"]
            isOneToOne: false
            referencedRelation: "notebook_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notebook_page_links_target_page_id_fkey"
            columns: ["target_page_id"]
            isOneToOne: false
            referencedRelation: "notebook_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      notebook_pages: {
        Row: {
          content: string | null
          content_html: string | null
          created_at: string
          created_by: string | null
          created_by_user_id: string | null
          id: string
          is_favorite: boolean | null
          is_pinned: boolean | null
          section_id: string
          sort_order: number | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          content_html?: string | null
          created_at?: string
          created_by?: string | null
          created_by_user_id?: string | null
          id?: string
          is_favorite?: boolean | null
          is_pinned?: boolean | null
          section_id: string
          sort_order?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          content_html?: string | null
          created_at?: string
          created_by?: string | null
          created_by_user_id?: string | null
          id?: string
          is_favorite?: boolean | null
          is_pinned?: boolean | null
          section_id?: string
          sort_order?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notebook_pages_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "notebook_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      notebook_sections: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          notebook_id: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          notebook_id: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          notebook_id?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notebook_sections_notebook_id_fkey"
            columns: ["notebook_id"]
            isOneToOne: false
            referencedRelation: "notebooks"
            referencedColumns: ["id"]
          },
        ]
      }
      notebook_spreadsheets: {
        Row: {
          color: string | null
          created_at: string
          id: string
          last_synced_at: string | null
          linked_at: string | null
          linked_project_id: string | null
          name: string
          notebook_id: string
          section_id: string | null
          sort_order: number | null
          sync_direction: string | null
          sync_status: string | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          last_synced_at?: string | null
          linked_at?: string | null
          linked_project_id?: string | null
          name?: string
          notebook_id: string
          section_id?: string | null
          sort_order?: number | null
          sync_direction?: string | null
          sync_status?: string | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          last_synced_at?: string | null
          linked_at?: string | null
          linked_project_id?: string | null
          name?: string
          notebook_id?: string
          section_id?: string | null
          sort_order?: number | null
          sync_direction?: string | null
          sync_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notebook_spreadsheets_linked_project_id_fkey"
            columns: ["linked_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notebook_spreadsheets_notebook_id_fkey"
            columns: ["notebook_id"]
            isOneToOne: false
            referencedRelation: "notebooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notebook_spreadsheets_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "notebook_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      notebooks: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          is_shared: boolean | null
          name: string
          project_id: string | null
          sort_order: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_shared?: boolean | null
          name: string
          project_id?: string | null
          sort_order?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_shared?: boolean | null
          name?: string
          project_id?: string | null
          sort_order?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notebooks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_analytics: {
        Row: {
          bounce_reason: string | null
          bounced_at: string | null
          channel: string
          clicked_at: string | null
          delivered_at: string | null
          id: string
          metadata: Json | null
          notification_id: string | null
          opened_at: string | null
          sent_at: string | null
          status: string | null
          template_key: string
          user_id: string | null
        }
        Insert: {
          bounce_reason?: string | null
          bounced_at?: string | null
          channel: string
          clicked_at?: string | null
          delivered_at?: string | null
          id?: string
          metadata?: Json | null
          notification_id?: string | null
          opened_at?: string | null
          sent_at?: string | null
          status?: string | null
          template_key: string
          user_id?: string | null
        }
        Update: {
          bounce_reason?: string | null
          bounced_at?: string | null
          channel?: string
          clicked_at?: string | null
          delivered_at?: string | null
          id?: string
          metadata?: Json | null
          notification_id?: string | null
          opened_at?: string | null
          sent_at?: string | null
          status?: string | null
          template_key?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notification_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
        ]
      }
      notification_channels: {
        Row: {
          api_key_encrypted: string | null
          channel: string
          configuration: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          provider: string
          updated_at: string | null
        }
        Insert: {
          api_key_encrypted?: string | null
          channel: string
          configuration?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          provider: string
          updated_at?: string | null
        }
        Update: {
          api_key_encrypted?: string | null
          channel?: string
          configuration?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          provider?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          billing_emails: boolean | null
          created_at: string | null
          desktop_notifications: boolean | null
          digest_frequency: string | null
          in_app_notifications: boolean | null
          marketing_emails: boolean | null
          product_updates: boolean | null
          updated_at: string | null
          usage_emails: boolean | null
          user_id: string
        }
        Insert: {
          billing_emails?: boolean | null
          created_at?: string | null
          desktop_notifications?: boolean | null
          digest_frequency?: string | null
          in_app_notifications?: boolean | null
          marketing_emails?: boolean | null
          product_updates?: boolean | null
          updated_at?: string | null
          usage_emails?: boolean | null
          user_id: string
        }
        Update: {
          billing_emails?: boolean | null
          created_at?: string | null
          desktop_notifications?: boolean | null
          digest_frequency?: string | null
          in_app_notifications?: boolean | null
          marketing_emails?: boolean | null
          product_updates?: boolean | null
          updated_at?: string | null
          usage_emails?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_features"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          active: boolean | null
          body: string | null
          channel: string | null
          created_at: string
          id: string
          name: string
          subject: string | null
          updated_at: string
          variables: Json | null
        }
        Insert: {
          active?: boolean | null
          body?: string | null
          channel?: string | null
          created_at?: string
          id?: string
          name: string
          subject?: string | null
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          active?: boolean | null
          body?: string | null
          channel?: string | null
          created_at?: string
          id?: string
          name?: string
          subject?: string | null
          updated_at?: string
          variables?: Json | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          message: string
          priority: string
          read: boolean | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          message: string
          priority: string
          read?: boolean | null
          title: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          message?: string
          priority?: string
          read?: boolean | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_features"
            referencedColumns: ["user_id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          id: string
          logo_url: string | null
          name: string
          plan: string | null
          slug: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          plan?: string | null
          slug?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          plan?: string | null
          slug?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      password_policies: {
        Row: {
          created_at: string | null
          id: string
          lockout_duration_minutes: number | null
          max_login_attempts: number | null
          min_length: number | null
          password_expiry_days: number | null
          prevent_reuse_count: number | null
          require_lowercase: boolean | null
          require_numbers: boolean | null
          require_special_chars: boolean | null
          require_uppercase: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lockout_duration_minutes?: number | null
          max_login_attempts?: number | null
          min_length?: number | null
          password_expiry_days?: number | null
          prevent_reuse_count?: number | null
          require_lowercase?: boolean | null
          require_numbers?: boolean | null
          require_special_chars?: boolean | null
          require_uppercase?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lockout_duration_minutes?: number | null
          max_login_attempts?: number | null
          min_length?: number | null
          password_expiry_days?: number | null
          prevent_reuse_count?: number | null
          require_lowercase?: boolean | null
          require_numbers?: boolean | null
          require_special_chars?: boolean | null
          require_uppercase?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          brand: string | null
          created_at: string | null
          customer_id: string
          exp_month: number | null
          exp_year: number | null
          id: string
          is_default: boolean | null
          last4: string | null
          stripe_payment_method_id: string
          type: string
          updated_at: string | null
        }
        Insert: {
          brand?: string | null
          created_at?: string | null
          customer_id: string
          exp_month?: number | null
          exp_year?: number | null
          id?: string
          is_default?: boolean | null
          last4?: string | null
          stripe_payment_method_id: string
          type?: string
          updated_at?: string | null
        }
        Update: {
          brand?: string | null
          created_at?: string | null
          customer_id?: string
          exp_month?: number | null
          exp_year?: number | null
          id?: string
          is_default?: boolean | null
          last4?: string | null
          stripe_payment_method_id?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          paid_at: string | null
          payment_method: string | null
          status: string
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          status: string
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_thresholds: {
        Row: {
          created_at: string
          critical_threshold: number
          description: string | null
          metric_type: string
          unit: string
          updated_at: string
          warning_threshold: number
        }
        Insert: {
          created_at?: string
          critical_threshold: number
          description?: string | null
          metric_type: string
          unit: string
          updated_at?: string
          warning_threshold: number
        }
        Update: {
          created_at?: string
          critical_threshold?: number
          description?: string | null
          metric_type?: string
          unit?: string
          updated_at?: string
          warning_threshold?: number
        }
        Relationships: []
      }
      plan_configs: {
        Row: {
          description: string | null
          display_name: string
          is_active: boolean
          is_popular: boolean
          max_ai_credits: number
          max_file_size_mb: number
          max_members: number
          max_projects: number
          max_storage_mb: number
          price_annual: number
          price_monthly: number
          sort_order: number
          stripe_price_annual_id: string | null
          stripe_price_monthly_id: string | null
          tier: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          display_name: string
          is_active?: boolean
          is_popular?: boolean
          max_ai_credits?: number
          max_file_size_mb?: number
          max_members?: number
          max_projects?: number
          max_storage_mb?: number
          price_annual?: number
          price_monthly?: number
          sort_order?: number
          stripe_price_annual_id?: string | null
          stripe_price_monthly_id?: string | null
          tier: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          display_name?: string
          is_active?: boolean
          is_popular?: boolean
          max_ai_credits?: number
          max_file_size_mb?: number
          max_members?: number
          max_projects?: number
          max_storage_mb?: number
          price_annual?: number
          price_monthly?: number
          sort_order?: number
          stripe_price_annual_id?: string | null
          stripe_price_monthly_id?: string | null
          tier?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_configs_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "plan_configs_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
        ]
      }
      platform_features: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          key: string
          name: string
          sort_order: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          key: string
          name: string
          sort_order?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          key?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      platform_role_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          after_state: Json | null
          before_state: Json | null
          created_at: string | null
          feature_key: string | null
          id: string
          role_id: string | null
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string | null
          feature_key?: string | null
          id?: string
          role_id?: string | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string | null
          feature_key?: string | null
          id?: string
          role_id?: string | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      platform_role_permissions: {
        Row: {
          feature_key: string
          id: string
          is_enabled: boolean | null
          role_id: string
        }
        Insert: {
          feature_key: string
          id?: string
          is_enabled?: boolean | null
          role_id: string
        }
        Update: {
          feature_key?: string
          id?: string
          is_enabled?: boolean | null
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "platform_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_roles: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_system_role: boolean | null
          name: string
          scope: string
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_system_role?: boolean | null
          name: string
          scope?: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_system_role?: boolean | null
          name?: string
          scope?: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      platform_user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          role_id: string
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role_id: string
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role_id?: string
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "platform_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolios: {
        Row: {
          created_at: string | null
          created_by: string | null
          created_by_user_id: string | null
          currency: string | null
          description: string | null
          end_date: string | null
          id: string
          inherit_workspace_ml: boolean | null
          is_active: boolean | null
          ml_sharing_scope: string | null
          name: string
          owner_id: string | null
          portfolio_type: string | null
          slug: string
          start_date: string | null
          status: string | null
          tenant_id: string | null
          total_budget: number | null
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          created_by_user_id?: string | null
          currency?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          inherit_workspace_ml?: boolean | null
          is_active?: boolean | null
          ml_sharing_scope?: string | null
          name: string
          owner_id?: string | null
          portfolio_type?: string | null
          slug: string
          start_date?: string | null
          status?: string | null
          tenant_id?: string | null
          total_budget?: number | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          created_by_user_id?: string | null
          currency?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          inherit_workspace_ml?: boolean | null
          is_active?: boolean | null
          ml_sharing_scope?: string | null
          name?: string
          owner_id?: string | null
          portfolio_type?: string | null
          slug?: string
          start_date?: string | null
          status?: string | null
          tenant_id?: string | null
          total_budget?: number | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolios_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolios_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_features"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "portfolios_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolios_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      presentation_collaborators: {
        Row: {
          created_at: string
          cursor_position: Json | null
          id: string
          last_active: string | null
          permission: string | null
          presentation_id: string
          user_email: string | null
          user_id: string | null
          user_name: string
        }
        Insert: {
          created_at?: string
          cursor_position?: Json | null
          id?: string
          last_active?: string | null
          permission?: string | null
          presentation_id: string
          user_email?: string | null
          user_id?: string | null
          user_name: string
        }
        Update: {
          created_at?: string
          cursor_position?: Json | null
          id?: string
          last_active?: string | null
          permission?: string | null
          presentation_id?: string
          user_email?: string | null
          user_id?: string | null
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "presentation_collaborators_presentation_id_fkey"
            columns: ["presentation_id"]
            isOneToOne: false
            referencedRelation: "presentations"
            referencedColumns: ["id"]
          },
        ]
      }
      presentation_folders: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          parent_id: string | null
          project_id: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          project_id: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          project_id?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "presentation_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "presentation_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presentation_folders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      presentation_slides: {
        Row: {
          background: Json | null
          charts: Json | null
          content: Json | null
          created_at: string
          embedded_components: Json | null
          html_content: string | null
          id: string
          images: Json | null
          presentation_id: string
          shapes: Json | null
          sort_order: number | null
          speaker_notes: string | null
          template: string | null
          title: string
          transition: Json | null
          updated_at: string
        }
        Insert: {
          background?: Json | null
          charts?: Json | null
          content?: Json | null
          created_at?: string
          embedded_components?: Json | null
          html_content?: string | null
          id?: string
          images?: Json | null
          presentation_id: string
          shapes?: Json | null
          sort_order?: number | null
          speaker_notes?: string | null
          template?: string | null
          title?: string
          transition?: Json | null
          updated_at?: string
        }
        Update: {
          background?: Json | null
          charts?: Json | null
          content?: Json | null
          created_at?: string
          embedded_components?: Json | null
          html_content?: string | null
          id?: string
          images?: Json | null
          presentation_id?: string
          shapes?: Json | null
          sort_order?: number | null
          speaker_notes?: string | null
          template?: string | null
          title?: string
          transition?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "presentation_slides_presentation_id_fkey"
            columns: ["presentation_id"]
            isOneToOne: false
            referencedRelation: "presentations"
            referencedColumns: ["id"]
          },
        ]
      }
      presentation_versions: {
        Row: {
          change_notes: string | null
          created_at: string
          created_by: string | null
          created_by_name: string | null
          id: string
          presentation_id: string
          slides_snapshot: Json
          version: number
        }
        Insert: {
          change_notes?: string | null
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          id?: string
          presentation_id: string
          slides_snapshot: Json
          version: number
        }
        Update: {
          change_notes?: string | null
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          id?: string
          presentation_id?: string
          slides_snapshot?: Json
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "presentation_versions_presentation_id_fkey"
            columns: ["presentation_id"]
            isOneToOne: false
            referencedRelation: "presentations"
            referencedColumns: ["id"]
          },
        ]
      }
      presentations: {
        Row: {
          created_at: string
          created_by: string | null
          created_by_name: string | null
          folder_id: string | null
          id: string
          is_shared: boolean | null
          project_id: string
          slide_master: Json | null
          template: string | null
          theme: Json | null
          title: string
          transitions: Json | null
          updated_at: string
          version: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          folder_id?: string | null
          id?: string
          is_shared?: boolean | null
          project_id: string
          slide_master?: Json | null
          template?: string | null
          theme?: Json | null
          title?: string
          transitions?: Json | null
          updated_at?: string
          version?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          folder_id?: string | null
          id?: string
          is_shared?: boolean | null
          project_id?: string
          slide_master?: Json | null
          template?: string | null
          theme?: Json | null
          title?: string
          transitions?: Json | null
          updated_at?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "presentations_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "presentation_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presentations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_cache: {
        Row: {
          data: Json
          id: string
          updated_at: string
        }
        Insert: {
          data?: Json
          id?: string
          updated_at?: string
        }
        Update: {
          data?: Json
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          email: string | null
          full_name: string | null
          id: string
          last_active_at: string | null
          organization_id: string | null
          phone_number: string | null
          role: string | null
          status: string | null
          subscription_tier: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          last_active_at?: string | null
          organization_id?: string | null
          phone_number?: string | null
          role?: string | null
          status?: string | null
          subscription_tier?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          last_active_at?: string | null
          organization_id?: string | null
          phone_number?: string | null
          role?: string | null
          status?: string | null
          subscription_tier?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      program_contract_config: {
        Row: {
          acceptance_period_days: number | null
          contract_value: number | null
          created_at: string | null
          currency: string | null
          governing_reference: string | null
          hypercare_weeks: number | null
          id: string
          key_personnel_review_days: number | null
          notes: string | null
          payment_terms_days: number | null
          penalty_cap_pct: number | null
          penalty_rate_pct: number | null
          project_id: string
          subcontractor_review_days: number | null
          training_hours_target: number | null
          training_max_per_session: number | null
          training_sessions_target: number | null
          updated_at: string | null
        }
        Insert: {
          acceptance_period_days?: number | null
          contract_value?: number | null
          created_at?: string | null
          currency?: string | null
          governing_reference?: string | null
          hypercare_weeks?: number | null
          id?: string
          key_personnel_review_days?: number | null
          notes?: string | null
          payment_terms_days?: number | null
          penalty_cap_pct?: number | null
          penalty_rate_pct?: number | null
          project_id: string
          subcontractor_review_days?: number | null
          training_hours_target?: number | null
          training_max_per_session?: number | null
          training_sessions_target?: number | null
          updated_at?: string | null
        }
        Update: {
          acceptance_period_days?: number | null
          contract_value?: number | null
          created_at?: string | null
          currency?: string | null
          governing_reference?: string | null
          hypercare_weeks?: number | null
          id?: string
          key_personnel_review_days?: number | null
          notes?: string | null
          payment_terms_days?: number | null
          penalty_cap_pct?: number | null
          penalty_rate_pct?: number | null
          project_id?: string
          subcontractor_review_days?: number | null
          training_hours_target?: number | null
          training_max_per_session?: number | null
          training_sessions_target?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "program_contract_config_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      program_members: {
        Row: {
          id: string
          invited_by_user_id: string | null
          is_active: boolean | null
          joined_at: string | null
          permissions: Json | null
          program_id: string
          role: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          id?: string
          invited_by_user_id?: string | null
          is_active?: boolean | null
          joined_at?: string | null
          permissions?: Json | null
          program_id: string
          role?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          id?: string
          invited_by_user_id?: string | null
          is_active?: boolean | null
          joined_at?: string | null
          permissions?: Json | null
          program_id?: string
          role?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_members_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      program_milestones: {
        Row: {
          actual_date: string | null
          created_at: string | null
          created_by_user_id: string | null
          dependencies: Json | null
          description: string | null
          id: string
          is_active: boolean | null
          linked_project_tasks: Json | null
          milestone_type: string | null
          name: string
          program_id: string
          status: string | null
          target_date: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          actual_date?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          dependencies?: Json | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          linked_project_tasks?: Json | null
          milestone_type?: string | null
          name: string
          program_id: string
          status?: string | null
          target_date: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          actual_date?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          dependencies?: Json | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          linked_project_tasks?: Json | null
          milestone_type?: string | null
          name?: string
          program_id?: string
          status?: string | null
          target_date?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "program_milestones_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_milestones_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          description: string | null
          health: string | null
          id: string
          is_active: boolean | null
          manager_id: string | null
          name: string
          owner_id: string | null
          portfolio_id: string | null
          program_type: string | null
          settings: Json | null
          status: string | null
          tenant_id: string | null
          total_budget: number | null
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          health?: string | null
          id?: string
          is_active?: boolean | null
          manager_id?: string | null
          name: string
          owner_id?: string | null
          portfolio_id?: string | null
          program_type?: string | null
          settings?: Json | null
          status?: string | null
          tenant_id?: string | null
          total_budget?: number | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          health?: string | null
          id?: string
          is_active?: boolean | null
          manager_id?: string | null
          name?: string
          owner_id?: string | null
          portfolio_id?: string | null
          program_type?: string | null
          settings?: Json | null
          status?: string | null
          tenant_id?: string | null
          total_budget?: number | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "programs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_features"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "programs_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programs_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "user_features"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "programs_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      project_automation_rules: {
        Row: {
          action_config: Json | null
          action_type: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          name: string
          project_id: string | null
          trigger_config: Json | null
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          action_config?: Json | null
          action_type: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          project_id?: string | null
          trigger_config?: Json | null
          trigger_type: string
          updated_at?: string | null
        }
        Update: {
          action_config?: Json | null
          action_type?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          project_id?: string | null
          trigger_config?: Json | null
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_automation_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "project_automation_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
          {
            foreignKeyName: "project_automation_rules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_baselines: {
        Row: {
          baseline_date: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          project_id: string
        }
        Insert: {
          baseline_date?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          project_id: string
        }
        Update: {
          baseline_date?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_baselines_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "project_baselines_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
          {
            foreignKeyName: "project_baselines_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_budget_items: {
        Row: {
          actual: number | null
          category: string
          created_at: string | null
          forecast: number | null
          id: string
          planned: number | null
          project_id: string | null
          updated_at: string | null
          variance: number | null
        }
        Insert: {
          actual?: number | null
          category: string
          created_at?: string | null
          forecast?: number | null
          id?: string
          planned?: number | null
          project_id?: string | null
          updated_at?: string | null
          variance?: number | null
        }
        Update: {
          actual?: number | null
          category?: string
          created_at?: string | null
          forecast?: number | null
          id?: string
          planned?: number | null
          project_id?: string | null
          updated_at?: string | null
          variance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_budget_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_calendars: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          name: string
          project_id: string
          work_hours: Json
          working_days: Json
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          project_id: string
          work_hours?: Json
          working_days?: Json
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          project_id?: string
          work_hours?: Json
          working_days?: Json
        }
        Relationships: [
          {
            foreignKeyName: "project_calendars_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_charters: {
        Row: {
          approval_authorities: Json | null
          approved_at: string | null
          approved_by_id: string | null
          assumptions: Json | null
          budget_summary: Json | null
          constraints: Json | null
          created_at: string | null
          id: string
          milestones: Json | null
          mission: string | null
          objectives: Json | null
          project_id: string | null
          status: string | null
          success_criteria: Json | null
          updated_at: string | null
          version: string | null
          vision: string | null
        }
        Insert: {
          approval_authorities?: Json | null
          approved_at?: string | null
          approved_by_id?: string | null
          assumptions?: Json | null
          budget_summary?: Json | null
          constraints?: Json | null
          created_at?: string | null
          id?: string
          milestones?: Json | null
          mission?: string | null
          objectives?: Json | null
          project_id?: string | null
          status?: string | null
          success_criteria?: Json | null
          updated_at?: string | null
          version?: string | null
          vision?: string | null
        }
        Update: {
          approval_authorities?: Json | null
          approved_at?: string | null
          approved_by_id?: string | null
          assumptions?: Json | null
          budget_summary?: Json | null
          constraints?: Json | null
          created_at?: string | null
          id?: string
          milestones?: Json | null
          mission?: string | null
          objectives?: Json | null
          project_id?: string | null
          status?: string | null
          success_criteria?: Json | null
          updated_at?: string | null
          version?: string | null
          vision?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_charters_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_custom_roles: {
        Row: {
          based_on_role: string | null
          color: string | null
          created_at: string | null
          created_by: string | null
          icon: string | null
          id: string
          is_custom: boolean | null
          permissions: Json | null
          project_id: string
          role_description: string | null
          role_id: string
          role_name: string
          updated_at: string | null
        }
        Insert: {
          based_on_role?: string | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          icon?: string | null
          id?: string
          is_custom?: boolean | null
          permissions?: Json | null
          project_id: string
          role_description?: string | null
          role_id: string
          role_name: string
          updated_at?: string | null
        }
        Update: {
          based_on_role?: string | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          icon?: string | null
          id?: string
          is_custom?: boolean | null
          permissions?: Json | null
          project_id?: string
          role_description?: string | null
          role_id?: string
          role_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_custom_roles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "project_custom_roles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
          {
            foreignKeyName: "project_custom_roles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_evm_snapshots: {
        Row: {
          ac: number | null
          as_of_date: string
          bac: number | null
          cpi: number | null
          created_at: string | null
          ev: number | null
          id: string
          project_id: string | null
          pv: number | null
          spi: number | null
        }
        Insert: {
          ac?: number | null
          as_of_date: string
          bac?: number | null
          cpi?: number | null
          created_at?: string | null
          ev?: number | null
          id?: string
          project_id?: string | null
          pv?: number | null
          spi?: number | null
        }
        Update: {
          ac?: number | null
          as_of_date?: string
          bac?: number | null
          cpi?: number | null
          created_at?: string | null
          ev?: number | null
          id?: string
          project_id?: string | null
          pv?: number | null
          spi?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_evm_snapshots_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_invoices: {
        Row: {
          amount: number
          created_at: string | null
          date: string
          id: string
          invoice_number: string
          milestone: string | null
          project_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          date: string
          id?: string
          invoice_number: string
          milestone?: string | null
          project_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          date?: string
          id?: string
          invoice_number?: string
          milestone?: string | null
          project_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          id: string
          is_active: boolean
          joined_at: string
          project_id: string
          role: string
          user_id: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          joined_at?: string
          project_id: string
          role?: string
          user_id: string
        }
        Update: {
          id?: string
          is_active?: boolean
          joined_at?: string
          project_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_messages: {
        Row: {
          attachment_name: string | null
          attachment_size: number | null
          attachment_type: string | null
          attachment_url: string | null
          content: string
          created_at: string
          deleted_at: string | null
          edit_history: Json | null
          edited_at: string | null
          id: string
          is_deleted: boolean | null
          is_pinned: boolean | null
          pinned_at: string | null
          pinned_by: string | null
          project_id: string
          reactions: Json | null
          read_by: Json | null
          reply_to: string | null
          user_email: string
          user_id: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_size?: number | null
          attachment_type?: string | null
          attachment_url?: string | null
          content: string
          created_at?: string
          deleted_at?: string | null
          edit_history?: Json | null
          edited_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_pinned?: boolean | null
          pinned_at?: string | null
          pinned_by?: string | null
          project_id: string
          reactions?: Json | null
          read_by?: Json | null
          reply_to?: string | null
          user_email: string
          user_id: string
        }
        Update: {
          attachment_name?: string | null
          attachment_size?: number | null
          attachment_type?: string | null
          attachment_url?: string | null
          content?: string
          created_at?: string
          deleted_at?: string | null
          edit_history?: Json | null
          edited_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_pinned?: boolean | null
          pinned_at?: string | null
          pinned_by?: string | null
          project_id?: string
          reactions?: Json | null
          read_by?: Json | null
          reply_to?: string | null
          user_email?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "project_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      project_milestones: {
        Row: {
          created_at: string | null
          custom_fields: Json | null
          dependencies: number | null
          description: string | null
          due_date: string | null
          id: string
          name: string
          owner_id: string | null
          progress: number | null
          project_id: string | null
          status: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          custom_fields?: Json | null
          dependencies?: number | null
          description?: string | null
          due_date?: string | null
          id?: string
          name: string
          owner_id?: string | null
          progress?: number | null
          project_id?: string | null
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          custom_fields?: Json | null
          dependencies?: number | null
          description?: string | null
          due_date?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          progress?: number | null
          project_id?: string | null
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "project_milestones_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_milestones_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      project_nodes: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          mega_project_id: string
          name: string
          parent_id: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          mega_project_id: string
          name: string
          parent_id?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          mega_project_id?: string
          name?: string
          parent_id?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_nodes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "project_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      project_quality_register: {
        Row: {
          comments: string | null
          created_at: string | null
          custom_fields: Json | null
          id: string
          inspection_date: string | null
          inspector_name: string | null
          item_name: string
          project_id: string
          standard_reference: string | null
          status: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          comments?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          id?: string
          inspection_date?: string | null
          inspector_name?: string | null
          item_name: string
          project_id: string
          standard_reference?: string | null
          status?: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          comments?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          id?: string
          inspection_date?: string | null
          inspector_name?: string | null
          item_name?: string
          project_id?: string
          standard_reference?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_quality_register_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_status_reports: {
        Row: {
          audience: string
          content: Json
          created_at: string | null
          created_by: string | null
          id: string
          project_id: string
          report_date: string | null
          title: string
        }
        Insert: {
          audience: string
          content: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          project_id: string
          report_date?: string | null
          title: string
        }
        Update: {
          audience?: string
          content?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          project_id?: string
          report_date?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_status_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_status_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_features"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "project_status_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          budget: number | null
          code: string
          created_at: string
          description: string | null
          end_date: string | null
          health: string
          id: string
          inheritance_settings: Json | null
          methodology: string
          ml_inheritance_enabled: boolean | null
          ml_scope: string | null
          name: string
          owner_id: string | null
          portfolio_id: string | null
          program_id: string | null
          progress: number | null
          spent: number | null
          start_date: string
          status: string
          tenant_id: string | null
          updated_at: string
          visibility_scope: string | null
          workspace_id: string | null
        }
        Insert: {
          budget?: number | null
          code: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          health?: string
          id?: string
          inheritance_settings?: Json | null
          methodology?: string
          ml_inheritance_enabled?: boolean | null
          ml_scope?: string | null
          name: string
          owner_id?: string | null
          portfolio_id?: string | null
          program_id?: string | null
          progress?: number | null
          spent?: number | null
          start_date?: string
          status?: string
          tenant_id?: string | null
          updated_at?: string
          visibility_scope?: string | null
          workspace_id?: string | null
        }
        Update: {
          budget?: number | null
          code?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          health?: string
          id?: string
          inheritance_settings?: Json | null
          methodology?: string
          ml_inheritance_enabled?: boolean | null
          ml_scope?: string | null
          name?: string
          owner_id?: string | null
          portfolio_id?: string | null
          program_id?: string | null
          progress?: number | null
          spent?: number | null
          start_date?: string
          status?: string
          tenant_id?: string | null
          updated_at?: string
          visibility_scope?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
          {
            foreignKeyName: "projects_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      proration_credits: {
        Row: {
          amount: number
          applied_at: string | null
          created_at: string | null
          from_tier: string | null
          id: string
          reason: string
          stripe_credit_note_id: string | null
          subscription_id: string | null
          to_tier: string | null
        }
        Insert: {
          amount: number
          applied_at?: string | null
          created_at?: string | null
          from_tier?: string | null
          id?: string
          reason: string
          stripe_credit_note_id?: string | null
          subscription_id?: string | null
          to_tier?: string | null
        }
        Update: {
          amount?: number
          applied_at?: string | null
          created_at?: string | null
          from_tier?: string | null
          id?: string
          reason?: string
          stripe_credit_note_id?: string | null
          subscription_id?: string | null
          to_tier?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proration_credits_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      raci_assignments: {
        Row: {
          activity: string
          created_at: string | null
          id: string
          project_id: string | null
          raci_role: string
          stakeholder_id: string | null
          updated_at: string | null
        }
        Insert: {
          activity: string
          created_at?: string | null
          id?: string
          project_id?: string | null
          raci_role: string
          stakeholder_id?: string | null
          updated_at?: string | null
        }
        Update: {
          activity?: string
          created_at?: string | null
          id?: string
          project_id?: string | null
          raci_role?: string
          stakeholder_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "raci_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raci_assignments_stakeholder_id_fkey"
            columns: ["stakeholder_id"]
            isOneToOne: false
            referencedRelation: "stakeholders"
            referencedColumns: ["id"]
          },
        ]
      }
      record_locks: {
        Row: {
          expires_at: string
          id: string
          locked_at: string | null
          record_id: string
          table_name: string
          user_id: string
        }
        Insert: {
          expires_at: string
          id?: string
          locked_at?: string | null
          record_id: string
          table_name: string
          user_id: string
        }
        Update: {
          expires_at?: string
          id?: string
          locked_at?: string | null
          record_id?: string
          table_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "record_locks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "record_locks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
        ]
      }
      referral_codes: {
        Row: {
          code: string
          commission_rate: number | null
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          payout_method: Json | null
          payout_status: string | null
          referee_discount_id: string | null
          referrer_discount_id: string | null
          referrer_user_id: string
          successful_conversions: number | null
          total_earnings: number | null
          updated_at: string
          uses_count: number | null
        }
        Insert: {
          code: string
          commission_rate?: number | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          payout_method?: Json | null
          payout_status?: string | null
          referee_discount_id?: string | null
          referrer_discount_id?: string | null
          referrer_user_id: string
          successful_conversions?: number | null
          total_earnings?: number | null
          updated_at?: string
          uses_count?: number | null
        }
        Update: {
          code?: string
          commission_rate?: number | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          payout_method?: Json | null
          payout_status?: string | null
          referee_discount_id?: string | null
          referrer_discount_id?: string | null
          referrer_user_id?: string
          successful_conversions?: number | null
          total_earnings?: number | null
          updated_at?: string
          uses_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_codes_referee_discount_id_fkey"
            columns: ["referee_discount_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_codes_referrer_discount_id_fkey"
            columns: ["referrer_discount_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_codes_referrer_user_id_fkey"
            columns: ["referrer_user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "referral_codes_referrer_user_id_fkey"
            columns: ["referrer_user_id"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
        ]
      }
      referral_conversions: {
        Row: {
          conversion_value: number | null
          converted_at: string
          id: string
          referee_user_id: string
          referral_code_id: string
          subscription_id: string | null
        }
        Insert: {
          conversion_value?: number | null
          converted_at?: string
          id?: string
          referee_user_id: string
          referral_code_id: string
          subscription_id?: string | null
        }
        Update: {
          conversion_value?: number | null
          converted_at?: string
          id?: string
          referee_user_id?: string
          referral_code_id?: string
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_conversions_referee_user_id_fkey"
            columns: ["referee_user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "referral_conversions_referee_user_id_fkey"
            columns: ["referee_user_id"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
          {
            foreignKeyName: "referral_conversions_referral_code_id_fkey"
            columns: ["referral_code_id"]
            isOneToOne: false
            referencedRelation: "affiliate_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_conversions_referral_code_id_fkey"
            columns: ["referral_code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          currency: string | null
          id: string
          invoice_id: string | null
          notes: string | null
          reason: string | null
          status: string
          stripe_refund_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          reason?: string | null
          status: string
          stripe_refund_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          reason?: string | null
          status?: string
          stripe_refund_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "refunds_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "refunds_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
          {
            foreignKeyName: "refunds_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      report_executions: {
        Row: {
          error_message: string | null
          executed_at: string | null
          file_size: number | null
          id: string
          recipients_count: number | null
          scheduled_report_id: string
          status: string
        }
        Insert: {
          error_message?: string | null
          executed_at?: string | null
          file_size?: number | null
          id?: string
          recipients_count?: number | null
          scheduled_report_id: string
          status: string
        }
        Update: {
          error_message?: string | null
          executed_at?: string | null
          file_size?: number | null
          id?: string
          recipients_count?: number | null
          scheduled_report_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_executions_scheduled_report_id_fkey"
            columns: ["scheduled_report_id"]
            isOneToOne: false
            referencedRelation: "scheduled_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          category: string
          config: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          frequency: string | null
          id: string
          is_scheduled: boolean | null
          last_generated: string | null
          name: string
          next_run: string | null
          project_id: string
          type: string
          updated_at: string | null
        }
        Insert: {
          category: string
          config?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          frequency?: string | null
          id?: string
          is_scheduled?: boolean | null
          last_generated?: string | null
          name: string
          next_run?: string | null
          project_id: string
          type: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          config?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          frequency?: string | null
          id?: string
          is_scheduled?: boolean | null
          last_generated?: string | null
          name?: string
          next_run?: string | null
          project_id?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_features"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      requirement_traceability_items: {
        Row: {
          code: string | null
          consultant: string | null
          created_at: string | null
          custom_fields: Json | null
          date: string | null
          department: string | null
          description: string | null
          id: string
          meeting_reference: string | null
          module: string | null
          owner: string | null
          process: string | null
          project_id: string
          requirement: string | null
          sort_order: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          code?: string | null
          consultant?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          date?: string | null
          department?: string | null
          description?: string | null
          id?: string
          meeting_reference?: string | null
          module?: string | null
          owner?: string | null
          process?: string | null
          project_id: string
          requirement?: string | null
          sort_order?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: string | null
          consultant?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          date?: string | null
          department?: string | null
          description?: string | null
          id?: string
          meeting_reference?: string | null
          module?: string | null
          owner?: string | null
          process?: string | null
          project_id?: string
          requirement?: string | null
          sort_order?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      resource_assignments: {
        Row: {
          actual_cost: number
          actual_work_hours: number
          cost: number
          created_at: string
          end_date: string | null
          id: string
          remaining_work_hours: number
          resource_id: string
          start_date: string | null
          task_id: string
          units: number
          updated_at: string
          work_hours: number
        }
        Insert: {
          actual_cost?: number
          actual_work_hours?: number
          cost?: number
          created_at?: string
          end_date?: string | null
          id?: string
          remaining_work_hours?: number
          resource_id: string
          start_date?: string | null
          task_id: string
          units?: number
          updated_at?: string
          work_hours?: number
        }
        Update: {
          actual_cost?: number
          actual_work_hours?: number
          cost?: number
          created_at?: string
          end_date?: string | null
          id?: string
          remaining_work_hours?: number
          resource_id?: string
          start_date?: string | null
          task_id?: string
          units?: number
          updated_at?: string
          work_hours?: number
        }
        Relationships: [
          {
            foreignKeyName: "resource_assignments_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_assignments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          calendar_id: string | null
          cost_per_use: number
          created_at: string
          email: string | null
          id: string
          max_units: number
          name: string
          notes: string | null
          overtime_rate: number
          project_id: string
          standard_rate: number
          type: Database["public"]["Enums"]["resource_type"]
          updated_at: string
        }
        Insert: {
          calendar_id?: string | null
          cost_per_use?: number
          created_at?: string
          email?: string | null
          id?: string
          max_units?: number
          name: string
          notes?: string | null
          overtime_rate?: number
          project_id: string
          standard_rate?: number
          type?: Database["public"]["Enums"]["resource_type"]
          updated_at?: string
        }
        Update: {
          calendar_id?: string | null
          cost_per_use?: number
          created_at?: string
          email?: string | null
          id?: string
          max_units?: number
          name?: string
          notes?: string | null
          overtime_rate?: number
          project_id?: string
          standard_rate?: number
          type?: Database["public"]["Enums"]["resource_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: false
            referencedRelation: "project_calendars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      risks: {
        Row: {
          category: string | null
          closed_at: string | null
          contingency_plan: string | null
          created_at: string
          custom_fields: Json | null
          description: string | null
          due_date: string | null
          id: string
          impact: Database["public"]["Enums"]["risk_level"] | null
          linked_items: Json | null
          mitigation_plan: string | null
          owner_id: string | null
          owner_name: string | null
          probability: Database["public"]["Enums"]["risk_level"] | null
          project_id: string | null
          status: Database["public"]["Enums"]["risk_status"] | null
          title: string
          triggers: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          closed_at?: string | null
          contingency_plan?: string | null
          created_at?: string
          custom_fields?: Json | null
          description?: string | null
          due_date?: string | null
          id?: string
          impact?: Database["public"]["Enums"]["risk_level"] | null
          linked_items?: Json | null
          mitigation_plan?: string | null
          owner_id?: string | null
          owner_name?: string | null
          probability?: Database["public"]["Enums"]["risk_level"] | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["risk_status"] | null
          title: string
          triggers?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          closed_at?: string | null
          contingency_plan?: string | null
          created_at?: string
          custom_fields?: Json | null
          description?: string | null
          due_date?: string | null
          id?: string
          impact?: Database["public"]["Enums"]["risk_level"] | null
          linked_items?: Json | null
          mitigation_plan?: string | null
          owner_id?: string | null
          owner_name?: string | null
          probability?: Database["public"]["Enums"]["risk_level"] | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["risk_status"] | null
          title?: string
          triggers?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "risks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      scenarios: {
        Row: {
          created_at: string | null
          created_by: string | null
          data: Json | null
          description: string | null
          id: string
          name: string
          project_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          data?: Json | null
          description?: string | null
          id?: string
          name: string
          project_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          data?: Json | null
          description?: string | null
          id?: string
          name?: string
          project_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scenarios_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_reports: {
        Row: {
          created_at: string | null
          dashboard_id: string
          description: string | null
          filters: Json | null
          id: string
          is_active: boolean | null
          last_run_at: string | null
          name: string
          next_run_at: string | null
          project_id: string | null
          recipients: string[]
          report_type: string
          schedule_day: number | null
          schedule_frequency: string
          schedule_time: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          dashboard_id: string
          description?: string | null
          filters?: Json | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          name: string
          next_run_at?: string | null
          project_id?: string | null
          recipients: string[]
          report_type: string
          schedule_day?: number | null
          schedule_frequency: string
          schedule_time: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          dashboard_id?: string
          description?: string | null
          filters?: Json | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          name?: string
          next_run_at?: string | null
          project_id?: string | null
          recipients?: string[]
          report_type?: string
          schedule_day?: number | null
          schedule_frequency?: string
          schedule_time?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "scheduled_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
        ]
      }
      security_audit_logs: {
        Row: {
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          ip_address: string | null
          severity: string
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          severity: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          severity?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "security_audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
        ]
      }
      service_status: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          last_check_at: string | null
          metadata: Json | null
          response_time: number | null
          service_name: string
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          last_check_at?: string | null
          metadata?: Json | null
          response_time?: number | null
          service_name: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          last_check_at?: string | null
          metadata?: Json | null
          response_time?: number | null
          service_name?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      spreadsheet_comments: {
        Row: {
          cell_ref: string
          content: string
          created_at: string
          id: string
          mentions: string[] | null
          parent_id: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          sheet_id: string
          updated_at: string
          user_email: string | null
          user_id: string
          user_name: string
        }
        Insert: {
          cell_ref: string
          content: string
          created_at?: string
          id?: string
          mentions?: string[] | null
          parent_id?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          sheet_id: string
          updated_at?: string
          user_email?: string | null
          user_id: string
          user_name: string
        }
        Update: {
          cell_ref?: string
          content?: string
          created_at?: string
          id?: string
          mentions?: string[] | null
          parent_id?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          sheet_id?: string
          updated_at?: string
          user_email?: string | null
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "spreadsheet_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "spreadsheet_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spreadsheet_comments_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "spreadsheet_comments_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
          {
            foreignKeyName: "spreadsheet_comments_sheet_id_fkey"
            columns: ["sheet_id"]
            isOneToOne: false
            referencedRelation: "spreadsheet_sheets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spreadsheet_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "spreadsheet_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
        ]
      }
      spreadsheet_presence: {
        Row: {
          created_at: string
          cursor_position: Json | null
          id: string
          last_seen: string
          selection: Json | null
          sheet_id: string
          user_color: string
          user_email: string | null
          user_id: string
          user_name: string
        }
        Insert: {
          created_at?: string
          cursor_position?: Json | null
          id?: string
          last_seen?: string
          selection?: Json | null
          sheet_id: string
          user_color?: string
          user_email?: string | null
          user_id: string
          user_name: string
        }
        Update: {
          created_at?: string
          cursor_position?: Json | null
          id?: string
          last_seen?: string
          selection?: Json | null
          sheet_id?: string
          user_color?: string
          user_email?: string | null
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "spreadsheet_presence_sheet_id_fkey"
            columns: ["sheet_id"]
            isOneToOne: false
            referencedRelation: "spreadsheet_sheets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spreadsheet_presence_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "spreadsheet_presence_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
        ]
      }
      spreadsheet_shares: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          permission: Database["public"]["Enums"]["share_permission"]
          shared_with_email: string | null
          shared_with_user_id: string | null
          spreadsheet_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          permission?: Database["public"]["Enums"]["share_permission"]
          shared_with_email?: string | null
          shared_with_user_id?: string | null
          spreadsheet_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          permission?: Database["public"]["Enums"]["share_permission"]
          shared_with_email?: string | null
          shared_with_user_id?: string | null
          spreadsheet_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "spreadsheet_shares_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "spreadsheet_shares_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
          {
            foreignKeyName: "spreadsheet_shares_shared_with_user_id_fkey"
            columns: ["shared_with_user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "spreadsheet_shares_shared_with_user_id_fkey"
            columns: ["shared_with_user_id"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
          {
            foreignKeyName: "spreadsheet_shares_spreadsheet_id_fkey"
            columns: ["spreadsheet_id"]
            isOneToOne: false
            referencedRelation: "notebook_spreadsheets"
            referencedColumns: ["id"]
          },
        ]
      }
      spreadsheet_sheets: {
        Row: {
          charts: Json | null
          column_widths: Json | null
          conditional_formats: Json | null
          created_at: string
          data: Json | null
          frozen_cols: number | null
          frozen_rows: number | null
          id: string
          merged_cells: Json | null
          name: string
          pivot_tables: Json | null
          row_heights: Json | null
          sort_order: number | null
          spreadsheet_id: string
          updated_at: string
          validation_rules: Json | null
        }
        Insert: {
          charts?: Json | null
          column_widths?: Json | null
          conditional_formats?: Json | null
          created_at?: string
          data?: Json | null
          frozen_cols?: number | null
          frozen_rows?: number | null
          id?: string
          merged_cells?: Json | null
          name?: string
          pivot_tables?: Json | null
          row_heights?: Json | null
          sort_order?: number | null
          spreadsheet_id: string
          updated_at?: string
          validation_rules?: Json | null
        }
        Update: {
          charts?: Json | null
          column_widths?: Json | null
          conditional_formats?: Json | null
          created_at?: string
          data?: Json | null
          frozen_cols?: number | null
          frozen_rows?: number | null
          id?: string
          merged_cells?: Json | null
          name?: string
          pivot_tables?: Json | null
          row_heights?: Json | null
          sort_order?: number | null
          spreadsheet_id?: string
          updated_at?: string
          validation_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "spreadsheet_sheets_spreadsheet_id_fkey"
            columns: ["spreadsheet_id"]
            isOneToOne: false
            referencedRelation: "notebook_spreadsheets"
            referencedColumns: ["id"]
          },
        ]
      }
      spreadsheet_task_mappings: {
        Row: {
          created_at: string
          id: string
          row_index: number
          sheet_id: string
          spreadsheet_id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          row_index: number
          sheet_id: string
          spreadsheet_id: string
          task_id: string
        }
        Update: {
          created_at?: string
          id?: string
          row_index?: number
          sheet_id?: string
          spreadsheet_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spreadsheet_task_mappings_sheet_id_fkey"
            columns: ["sheet_id"]
            isOneToOne: false
            referencedRelation: "spreadsheet_sheets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spreadsheet_task_mappings_spreadsheet_id_fkey"
            columns: ["spreadsheet_id"]
            isOneToOne: false
            referencedRelation: "notebook_spreadsheets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spreadsheet_task_mappings_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      spreadsheet_versions: {
        Row: {
          cell_formats: Json | null
          change_summary: string | null
          charts: Json | null
          conditional_formats: Json | null
          created_at: string
          id: string
          label: string | null
          sheet_id: string
          snapshot_data: Json
          user_id: string | null
          user_name: string | null
          validation_rules: Json | null
        }
        Insert: {
          cell_formats?: Json | null
          change_summary?: string | null
          charts?: Json | null
          conditional_formats?: Json | null
          created_at?: string
          id?: string
          label?: string | null
          sheet_id: string
          snapshot_data: Json
          user_id?: string | null
          user_name?: string | null
          validation_rules?: Json | null
        }
        Update: {
          cell_formats?: Json | null
          change_summary?: string | null
          charts?: Json | null
          conditional_formats?: Json | null
          created_at?: string
          id?: string
          label?: string | null
          sheet_id?: string
          snapshot_data?: Json
          user_id?: string | null
          user_name?: string | null
          validation_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "spreadsheet_versions_sheet_id_fkey"
            columns: ["sheet_id"]
            isOneToOne: false
            referencedRelation: "spreadsheet_sheets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spreadsheet_versions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "spreadsheet_versions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
        ]
      }
      sprints: {
        Row: {
          capacity: number | null
          created_at: string
          custom_fields: Json | null
          end_date: string
          goal: string | null
          id: string
          name: string
          project_id: string | null
          start_date: string
          status: Database["public"]["Enums"]["sprint_status"] | null
          updated_at: string
          velocity: number | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          custom_fields?: Json | null
          end_date: string
          goal?: string | null
          id?: string
          name: string
          project_id?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["sprint_status"] | null
          updated_at?: string
          velocity?: number | null
        }
        Update: {
          capacity?: number | null
          created_at?: string
          custom_fields?: Json | null
          end_date?: string
          goal?: string | null
          id?: string
          name?: string
          project_id?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["sprint_status"] | null
          updated_at?: string
          velocity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sprints_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      stakeholders: {
        Row: {
          category: string | null
          communication_preference: string | null
          created_at: string | null
          custom_fields: Json | null
          email: string | null
          engagement:
            | Database["public"]["Enums"]["stakeholder_engagement"]
            | null
          id: string
          influence: Database["public"]["Enums"]["stakeholder_level"] | null
          interest: Database["public"]["Enums"]["stakeholder_level"] | null
          is_key_stakeholder: boolean | null
          key_interests: Json | null
          name: string
          organization: string | null
          phone: string | null
          project_id: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          communication_preference?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          email?: string | null
          engagement?:
            | Database["public"]["Enums"]["stakeholder_engagement"]
            | null
          id?: string
          influence?: Database["public"]["Enums"]["stakeholder_level"] | null
          interest?: Database["public"]["Enums"]["stakeholder_level"] | null
          is_key_stakeholder?: boolean | null
          key_interests?: Json | null
          name: string
          organization?: string | null
          phone?: string | null
          project_id?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          communication_preference?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          email?: string | null
          engagement?:
            | Database["public"]["Enums"]["stakeholder_engagement"]
            | null
          id?: string
          influence?: Database["public"]["Enums"]["stakeholder_level"] | null
          interest?: Database["public"]["Enums"]["stakeholder_level"] | null
          is_key_stakeholder?: boolean | null
          key_interests?: Json | null
          name?: string
          organization?: string | null
          phone?: string | null
          project_id?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stakeholders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      strategic_insights: {
        Row: {
          created_at: string | null
          data: Json
          id: string
          project_id: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json
          id?: string
          project_id?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json
          id?: string
          project_id?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "strategic_insights_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_customers: {
        Row: {
          created_at: string
          email: string | null
          id: string
          metadata: Json | null
          stripe_customer_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          metadata?: Json | null
          stripe_customer_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          metadata?: Json | null
          stripe_customer_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      stripe_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          payload: Json | null
          processed: boolean | null
          processed_at: string | null
          stripe_event_id: string
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          payload?: Json | null
          processed?: boolean | null
          processed_at?: string | null
          stripe_event_id: string
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
          processed?: boolean | null
          processed_at?: string | null
          stripe_event_id?: string
        }
        Relationships: []
      }
      stripe_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string | null
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      subscription_features: {
        Row: {
          created_at: string | null
          description: string | null
          feature_key: string
          feature_name: string
          id: string
          is_enabled: boolean | null
          metadata: Json | null
          tier: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          feature_key: string
          feature_name: string
          id?: string
          is_enabled?: boolean | null
          metadata?: Json | null
          tier: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          feature_key?: string
          feature_name?: string
          id?: string
          is_enabled?: boolean | null
          metadata?: Json | null
          tier?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          active: boolean | null
          created_at: string
          features: Json | null
          id: string
          limits: Json | null
          name: string
          price_annual: number | null
          price_monthly: number | null
          stripe_price_id_annual: string | null
          stripe_price_id_monthly: string | null
          tier: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          features?: Json | null
          id?: string
          limits?: Json | null
          name: string
          price_annual?: number | null
          price_monthly?: number | null
          stripe_price_id_annual?: string | null
          stripe_price_id_monthly?: string | null
          tier: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          features?: Json | null
          id?: string
          limits?: Json | null
          name?: string
          price_annual?: number | null
          price_monthly?: number | null
          stripe_price_id_annual?: string | null
          stripe_price_id_monthly?: string | null
          tier?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_cycle: string | null
          cancelled_at: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          joined_at: string | null
          metadata: Json | null
          mrr: number | null
          renewal_date: string | null
          status: string
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          tier: string
          trial_ends_at: string | null
          updated_at: string | null
          usage_stats: Json | null
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          billing_cycle?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          joined_at?: string | null
          metadata?: Json | null
          mrr?: number | null
          renewal_date?: string | null
          status: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          tier: string
          trial_ends_at?: string | null
          updated_at?: string | null
          usage_stats?: Json | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          billing_cycle?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          joined_at?: string | null
          metadata?: Json | null
          mrr?: number | null
          renewal_date?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          trial_ends_at?: string | null
          updated_at?: string | null
          usage_stats?: Json | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
          {
            foreignKeyName: "subscriptions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string | null
          created_at: string | null
          description: string
          id: string
          priority: string | null
          resolved_at: string | null
          status: string | null
          subject: string
          ticket_number: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string | null
          description: string
          id?: string
          priority?: string | null
          resolved_at?: string | null
          status?: string | null
          subject: string
          ticket_number: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string | null
          description?: string
          id?: string
          priority?: string | null
          resolved_at?: string | null
          status?: string | null
          subject?: string
          ticket_number?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
        ]
      }
      sync_history: {
        Row: {
          created_at: string | null
          errors: Json | null
          id: string
          items_processed: number | null
          items_total: number | null
          message: string
          project_id: string | null
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          errors?: Json | null
          id?: string
          items_processed?: number | null
          items_total?: number | null
          message: string
          project_id?: string | null
          status: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          errors?: Json | null
          id?: string
          items_processed?: number | null
          items_total?: number | null
          message?: string
          project_id?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sync_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sync_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "sync_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
        ]
      }
      system_metrics: {
        Row: {
          id: string
          metadata: Json | null
          metric_type: string
          recorded_at: string
          unit: string | null
          value: number
        }
        Insert: {
          id?: string
          metadata?: Json | null
          metric_type: string
          recorded_at?: string
          unit?: string | null
          value: number
        }
        Update: {
          id?: string
          metadata?: Json | null
          metric_type?: string
          recorded_at?: string
          unit?: string | null
          value?: number
        }
        Relationships: []
      }
      system_status: {
        Row: {
          created_at: string | null
          id: string
          last_checked: string | null
          metadata: Json | null
          service_name: string
          status: string
          updated_at: string | null
          uptime_percentage: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_checked?: string | null
          metadata?: Json | null
          service_name: string
          status: string
          updated_at?: string | null
          uptime_percentage?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_checked?: string | null
          metadata?: Json | null
          service_name?: string
          status?: string
          updated_at?: string | null
          uptime_percentage?: number | null
        }
        Relationships: []
      }
      task_baselines: {
        Row: {
          baseline_cost: number | null
          baseline_duration: number
          baseline_end: string
          baseline_name: string
          baseline_start: string
          created_at: string
          id: string
          task_id: string
        }
        Insert: {
          baseline_cost?: number | null
          baseline_duration: number
          baseline_end: string
          baseline_name?: string
          baseline_start: string
          created_at?: string
          id?: string
          task_id: string
        }
        Update: {
          baseline_cost?: number | null
          baseline_duration?: number
          baseline_end?: string
          baseline_name?: string
          baseline_start?: string
          created_at?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_baselines_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          attachments: Json | null
          content: string
          created_at: string | null
          created_by_user_id: string
          edited_at: string | null
          id: string
          is_deleted: boolean | null
          is_edited: boolean | null
          mentioned_tasks: string[] | null
          mentioned_users: string[] | null
          project_id: string
          task_id: string
          updated_at: string | null
        }
        Insert: {
          attachments?: Json | null
          content: string
          created_at?: string | null
          created_by_user_id: string
          edited_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          mentioned_tasks?: string[] | null
          mentioned_users?: string[] | null
          project_id: string
          task_id: string
          updated_at?: string | null
        }
        Update: {
          attachments?: Json | null
          content?: string
          created_at?: string | null
          created_by_user_id?: string
          edited_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          mentioned_tasks?: string[] | null
          mentioned_users?: string[] | null
          project_id?: string
          task_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_dependencies: {
        Row: {
          created_at: string
          id: string
          lag: number | null
          predecessor_id: string
          scenario_id: string | null
          task_id: string
          type: Database["public"]["Enums"]["dependency_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          lag?: number | null
          predecessor_id: string
          scenario_id?: string | null
          task_id: string
          type?: Database["public"]["Enums"]["dependency_type"]
        }
        Update: {
          created_at?: string
          id?: string
          lag?: number | null
          predecessor_id?: string
          scenario_id?: string | null
          task_id?: string
          type?: Database["public"]["Enums"]["dependency_type"]
        }
        Relationships: [
          {
            foreignKeyName: "task_dependencies_predecessor_id_fkey"
            columns: ["predecessor_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_dependencies_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_dependencies_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_links: {
        Row: {
          created_at: string | null
          created_by_user_id: string | null
          id: string
          link_type: string | null
          source_project_id: string
          source_task_id: string
          target_project_id: string
          target_task_id: string
        }
        Insert: {
          created_at?: string | null
          created_by_user_id?: string | null
          id?: string
          link_type?: string | null
          source_project_id: string
          source_task_id: string
          target_project_id: string
          target_task_id: string
        }
        Update: {
          created_at?: string | null
          created_by_user_id?: string | null
          id?: string
          link_type?: string | null
          source_project_id?: string
          source_task_id?: string
          target_project_id?: string
          target_task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_links_source_project_id_fkey"
            columns: ["source_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_links_source_task_id_fkey"
            columns: ["source_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_links_target_project_id_fkey"
            columns: ["target_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_links_target_task_id_fkey"
            columns: ["target_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_templates: {
        Row: {
          category: string | null
          created_at: string | null
          created_by_user_id: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          program_id: string | null
          scope: string | null
          tags: string[] | null
          task_data: Json
          template_type: string | null
          tenant_id: string
          updated_at: string | null
          usage_count: number | null
          workspace_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          program_id?: string | null
          scope?: string | null
          tags?: string[] | null
          task_data?: Json
          template_type?: string | null
          tenant_id: string
          updated_at?: string | null
          usage_count?: number | null
          workspace_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          program_id?: string | null
          scope?: string | null
          tags?: string[] | null
          task_data?: Json
          template_type?: string | null
          tenant_id?: string
          updated_at?: string | null
          usage_count?: number | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_templates_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_templates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          acceptance_criteria: string | null
          actual_cost: number | null
          actual_work_hours: number | null
          assignee_id: string | null
          calendar_id: string | null
          child_project_id: string | null
          constraint_date: string | null
          constraint_type: Database["public"]["Enums"]["constraint_type"] | null
          cost: number | null
          created_at: string
          created_by: string | null
          created_by_user_id: string | null
          custom_fields: Json | null
          deadline: string | null
          duration: number
          early_finish: string | null
          early_start: string | null
          effort_driven: boolean | null
          end_date: string
          expanded: boolean | null
          fixed_cost: number | null
          fixed_cost_accrual: Database["public"]["Enums"]["cost_accrual"] | null
          free_slack: number | null
          id: string
          is_critical: boolean | null
          late_finish: string | null
          late_start: string | null
          level: number
          manually_scheduled: boolean | null
          milestone_type: string | null
          name: string
          notes: string | null
          parent_id: string | null
          portfolio_id: string | null
          priority: Database["public"]["Enums"]["priority_level"]
          program_id: string | null
          progress: number
          project_id: string
          remaining_work_hours: number | null
          scenario_id: string | null
          shared_across_program: boolean | null
          sort_order: number
          sprint_id: string | null
          start_date: string
          status: Database["public"]["Enums"]["task_status"]
          story_points: number | null
          tags: string[] | null
          tenant_id: string | null
          total_slack: number | null
          type: Database["public"]["Enums"]["task_type"]
          updated_at: string
          visibility_scope: string | null
          wbs: string
          work_hours: number | null
          workspace_id: string | null
        }
        Insert: {
          acceptance_criteria?: string | null
          actual_cost?: number | null
          actual_work_hours?: number | null
          assignee_id?: string | null
          calendar_id?: string | null
          child_project_id?: string | null
          constraint_date?: string | null
          constraint_type?:
            | Database["public"]["Enums"]["constraint_type"]
            | null
          cost?: number | null
          created_at?: string
          created_by?: string | null
          created_by_user_id?: string | null
          custom_fields?: Json | null
          deadline?: string | null
          duration?: number
          early_finish?: string | null
          early_start?: string | null
          effort_driven?: boolean | null
          end_date?: string
          expanded?: boolean | null
          fixed_cost?: number | null
          fixed_cost_accrual?:
            | Database["public"]["Enums"]["cost_accrual"]
            | null
          free_slack?: number | null
          id?: string
          is_critical?: boolean | null
          late_finish?: string | null
          late_start?: string | null
          level?: number
          manually_scheduled?: boolean | null
          milestone_type?: string | null
          name: string
          notes?: string | null
          parent_id?: string | null
          portfolio_id?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          program_id?: string | null
          progress?: number
          project_id: string
          remaining_work_hours?: number | null
          scenario_id?: string | null
          shared_across_program?: boolean | null
          sort_order?: number
          sprint_id?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["task_status"]
          story_points?: number | null
          tags?: string[] | null
          tenant_id?: string | null
          total_slack?: number | null
          type?: Database["public"]["Enums"]["task_type"]
          updated_at?: string
          visibility_scope?: string | null
          wbs: string
          work_hours?: number | null
          workspace_id?: string | null
        }
        Update: {
          acceptance_criteria?: string | null
          actual_cost?: number | null
          actual_work_hours?: number | null
          assignee_id?: string | null
          calendar_id?: string | null
          child_project_id?: string | null
          constraint_date?: string | null
          constraint_type?:
            | Database["public"]["Enums"]["constraint_type"]
            | null
          cost?: number | null
          created_at?: string
          created_by?: string | null
          created_by_user_id?: string | null
          custom_fields?: Json | null
          deadline?: string | null
          duration?: number
          early_finish?: string | null
          early_start?: string | null
          effort_driven?: boolean | null
          end_date?: string
          expanded?: boolean | null
          fixed_cost?: number | null
          fixed_cost_accrual?:
            | Database["public"]["Enums"]["cost_accrual"]
            | null
          free_slack?: number | null
          id?: string
          is_critical?: boolean | null
          late_finish?: string | null
          late_start?: string | null
          level?: number
          manually_scheduled?: boolean | null
          milestone_type?: string | null
          name?: string
          notes?: string | null
          parent_id?: string | null
          portfolio_id?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          program_id?: string | null
          progress?: number
          project_id?: string
          remaining_work_hours?: number | null
          scenario_id?: string | null
          shared_across_program?: boolean | null
          sort_order?: number
          sprint_id?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["task_status"]
          story_points?: number | null
          tags?: string[] | null
          tenant_id?: string | null
          total_slack?: number | null
          type?: Database["public"]["Enums"]["task_type"]
          updated_at?: string
          visibility_scope?: string | null
          wbs?: string
          work_hours?: number | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
          {
            foreignKeyName: "tasks_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: false
            referencedRelation: "project_calendars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_child_project_id_fkey"
            columns: ["child_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
          {
            foreignKeyName: "tasks_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          allocation_percentage: number | null
          assigned_at: string
          availability_status: string | null
          id: string
          role: string | null
          skills: string[] | null
          user_id: string | null
          workspace_id: string
        }
        Insert: {
          allocation_percentage?: number | null
          assigned_at?: string
          availability_status?: string | null
          id?: string
          role?: string | null
          skills?: string[] | null
          user_id?: string | null
          workspace_id: string
        }
        Update: {
          allocation_percentage?: number | null
          assigned_at?: string
          availability_status?: string | null
          id?: string
          role?: string | null
          skills?: string[] | null
          user_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string | null
          created_by_user_id: string | null
          id: string
          is_active: boolean | null
          max_projects: number | null
          max_users: number | null
          max_workspaces: number | null
          ml_config: Json | null
          name: string
          slug: string
          subscription_tier: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by_user_id?: string | null
          id?: string
          is_active?: boolean | null
          max_projects?: number | null
          max_users?: number | null
          max_workspaces?: number | null
          ml_config?: Json | null
          name: string
          slug: string
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by_user_id?: string | null
          id?: string
          is_active?: boolean | null
          max_projects?: number | null
          max_users?: number | null
          max_workspaces?: number | null
          ml_config?: Json | null
          name?: string
          slug?: string
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ticket_replies: {
        Row: {
          content: string
          created_at: string
          id: string
          is_staff: boolean | null
          ticket_id: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_staff?: boolean | null
          ticket_id?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_staff?: boolean | null
          ticket_id?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      timeline_activities: {
        Row: {
          color: string
          created_at: string | null
          duration_months: number
          id: string
          name: string
          notes: string | null
          order_index: number | null
          resources_per_month: Json | null
          start_month: number
          swimlane_id: string
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          color: string
          created_at?: string | null
          duration_months: number
          id?: string
          name: string
          notes?: string | null
          order_index?: number | null
          resources_per_month?: Json | null
          start_month: number
          swimlane_id: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          color?: string
          created_at?: string | null
          duration_months?: number
          id?: string
          name?: string
          notes?: string | null
          order_index?: number | null
          resources_per_month?: Json | null
          start_month?: number
          swimlane_id?: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timeline_activities_swimlane_id_fkey"
            columns: ["swimlane_id"]
            isOneToOne: false
            referencedRelation: "timeline_swimlanes"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_dependencies: {
        Row: {
          created_at: string | null
          id: string
          source_activity_id: string
          target_activity_id: string
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          source_activity_id: string
          target_activity_id: string
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          source_activity_id?: string
          target_activity_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_dependencies_source_activity_id_fkey"
            columns: ["source_activity_id"]
            isOneToOne: false
            referencedRelation: "timeline_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_dependencies_target_activity_id_fkey"
            columns: ["target_activity_id"]
            isOneToOne: false
            referencedRelation: "timeline_activities"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_milestones: {
        Row: {
          color: string
          created_at: string | null
          id: string
          month_index: number
          name: string
          project_id: string
        }
        Insert: {
          color: string
          created_at?: string | null
          id?: string
          month_index: number
          name: string
          project_id: string
        }
        Update: {
          color?: string
          created_at?: string | null
          id?: string
          month_index?: number
          name?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_sites: {
        Row: {
          created_at: string | null
          id: string
          name: string
          project_id: string
          region: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          project_id: string
          region?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          project_id?: string
          region?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timeline_sites_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_snapshots: {
        Row: {
          created_at: string | null
          data: Json
          description: string | null
          id: string
          name: string
          project_id: string
        }
        Insert: {
          created_at?: string | null
          data: Json
          description?: string | null
          id?: string
          name: string
          project_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json
          description?: string | null
          id?: string
          name?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_snapshots_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_swimlanes: {
        Row: {
          collapsed: boolean | null
          color: string
          created_at: string | null
          id: string
          label: string
          order_index: number
          project_id: string
          site_ids: string[] | null
          target_duration: number | null
          team_ids: string[] | null
          updated_at: string | null
        }
        Insert: {
          collapsed?: boolean | null
          color: string
          created_at?: string | null
          id?: string
          label: string
          order_index: number
          project_id: string
          site_ids?: string[] | null
          target_duration?: number | null
          team_ids?: string[] | null
          updated_at?: string | null
        }
        Update: {
          collapsed?: boolean | null
          color?: string
          created_at?: string | null
          id?: string
          label?: string
          order_index?: number
          project_id?: string
          site_ids?: string[] | null
          target_duration?: number | null
          team_ids?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timeline_swimlanes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_teams: {
        Row: {
          color: string
          created_at: string | null
          id: string
          location: string | null
          name: string
          project_id: string
        }
        Insert: {
          color: string
          created_at?: string | null
          id?: string
          location?: string | null
          name: string
          project_id: string
        }
        Update: {
          color?: string
          created_at?: string | null
          id?: string
          location?: string | null
          name?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_teams_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      traceability_matrix: {
        Row: {
          created_at: string | null
          id: string
          project_id: string | null
          relationship_type: string | null
          source_id: string
          source_type: string
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id?: string | null
          relationship_type?: string | null
          source_id: string
          source_type: string
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string | null
          relationship_type?: string | null
          source_id?: string
          source_type?: string
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "traceability_matrix_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      training_sessions: {
        Row: {
          attendance_count: number | null
          created_at: string | null
          date: string
          id: string
          location: string | null
          max_capacity: number | null
          module_stream: string
          notes: string | null
          participant_names: string[] | null
          project_id: string
          status: string | null
          trainer: string
          updated_at: string | null
        }
        Insert: {
          attendance_count?: number | null
          created_at?: string | null
          date: string
          id?: string
          location?: string | null
          max_capacity?: number | null
          module_stream: string
          notes?: string | null
          participant_names?: string[] | null
          project_id: string
          status?: string | null
          trainer: string
          updated_at?: string | null
        }
        Update: {
          attendance_count?: number | null
          created_at?: string | null
          date?: string
          id?: string
          location?: string | null
          max_capacity?: number | null
          module_stream?: string
          notes?: string | null
          participant_names?: string[] | null
          project_id?: string
          status?: string | null
          trainer?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      triage_sessions: {
        Row: {
          actions: string | null
          created_at: string | null
          date: string
          decisions: string
          defects_triaged: number | null
          id: string
          next_triage_date: string | null
          participants: string[] | null
          project_id: string
        }
        Insert: {
          actions?: string | null
          created_at?: string | null
          date: string
          decisions: string
          defects_triaged?: number | null
          id?: string
          next_triage_date?: string | null
          participants?: string[] | null
          project_id: string
        }
        Update: {
          actions?: string | null
          created_at?: string | null
          date?: string
          decisions?: string
          defects_triaged?: number | null
          id?: string
          next_triage_date?: string | null
          participants?: string[] | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "triage_sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_records: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          metric_key: string
          quantity: number
          subscription_id: string | null
          timestamp: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_key: string
          quantity: number
          subscription_id?: string | null
          timestamp?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_key?: string
          quantity?: number
          subscription_id?: string | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_records_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_device_tokens: {
        Row: {
          created_at: string | null
          device_token: string
          id: string
          last_used_at: string | null
          platform: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_token: string
          id?: string
          last_used_at?: string | null
          platform?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_token?: string
          id?: string
          last_used_at?: string | null
          platform?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_device_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_device_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
        ]
      }
      user_payment_methods: {
        Row: {
          brand: string | null
          created_at: string | null
          exp_month: number | null
          exp_year: number | null
          id: string
          is_default: boolean | null
          last4: string | null
          stripe_payment_method_id: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          brand?: string | null
          created_at?: string | null
          exp_month?: number | null
          exp_year?: number | null
          id?: string
          is_default?: boolean | null
          last4?: string | null
          stripe_payment_method_id: string
          type?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          brand?: string | null
          created_at?: string | null
          exp_month?: number | null
          exp_year?: number | null
          id?: string
          is_default?: boolean | null
          last4?: string | null
          stripe_payment_method_id?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_payment_methods_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_payment_methods_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string
          id: string
          preference_key: string
          preference_value: Json
          project_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          preference_key: string
          preference_value: Json
          project_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          preference_key?: string
          preference_value?: Json
          project_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          permissions: Json | null
          project_id: string | null
          role: Database["public"]["Enums"]["project_role"]
          role_name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          permissions?: Json | null
          project_id?: string | null
          role?: Database["public"]["Enums"]["project_role"]
          role_name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          permissions?: Json | null
          project_id?: string | null
          role?: Database["public"]["Enums"]["project_role"]
          role_name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_tenants: {
        Row: {
          created_at: string
          id: string
          role: string
          tenant_id: string
          tenant_name: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          tenant_id?: string
          tenant_name?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          tenant_id?: string
          tenant_name?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          department_id: string | null
          email: string
          full_name: string
          id: string
          job_title: string | null
          last_login_at: string | null
          metadata: Json | null
          phone: string | null
          role: string
          status: string
          tenant_id: string | null
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          department_id?: string | null
          email: string
          full_name: string
          id?: string
          job_title?: string | null
          last_login_at?: string | null
          metadata?: Json | null
          phone?: string | null
          role: string
          status?: string
          tenant_id?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          department_id?: string | null
          email?: string
          full_name?: string
          id?: string
          job_title?: string | null
          last_login_at?: string | null
          metadata?: Json | null
          phone?: string | null
          role?: string
          status?: string
          tenant_id?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_budgets: {
        Row: {
          allocated_budget: number
          created_at: string
          forecast: number
          id: string
          period_end: string | null
          period_start: string | null
          spent_budget: number
          total_budget: number
          updated_at: string
          variance: number
          workspace_id: string
        }
        Insert: {
          allocated_budget?: number
          created_at?: string
          forecast?: number
          id?: string
          period_end?: string | null
          period_start?: string | null
          spent_budget?: number
          total_budget?: number
          updated_at?: string
          variance?: number
          workspace_id: string
        }
        Update: {
          allocated_budget?: number
          created_at?: string
          forecast?: number
          id?: string
          period_end?: string | null
          period_start?: string | null
          spent_budget?: number
          total_budget?: number
          updated_at?: string
          variance?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_budgets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          id: string
          invited_by_user_id: string | null
          is_active: boolean | null
          joined_at: string | null
          permissions: Json | null
          role: string
          tenant_id: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          id?: string
          invited_by_user_id?: string | null
          is_active?: boolean | null
          joined_at?: string | null
          permissions?: Json | null
          role?: string
          tenant_id: string
          user_id: string
          workspace_id: string
        }
        Update: {
          id?: string
          invited_by_user_id?: string | null
          is_active?: boolean | null
          joined_at?: string | null
          permissions?: Json | null
          role?: string
          tenant_id?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_resources: {
        Row: {
          allocated_capacity: number
          available_capacity: number
          created_at: string
          id: string
          resource_name: string
          resource_type: string
          total_capacity: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          allocated_capacity?: number
          available_capacity?: number
          created_at?: string
          id?: string
          resource_name: string
          resource_type?: string
          total_capacity?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          allocated_capacity?: number
          available_capacity?: number
          created_at?: string
          id?: string
          resource_name?: string
          resource_type?: string
          total_capacity?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_resources_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_teams: {
        Row: {
          allocation_percentage: number | null
          assigned_at: string
          availability_status: string | null
          id: string
          role: string | null
          skills: string[] | null
          user_id: string | null
          workspace_id: string
        }
        Insert: {
          allocation_percentage?: number | null
          assigned_at?: string
          availability_status?: string | null
          id?: string
          role?: string | null
          skills?: string[] | null
          user_id?: string | null
          workspace_id: string
        }
        Update: {
          allocation_percentage?: number | null
          assigned_at?: string
          availability_status?: string | null
          id?: string
          role?: string | null
          skills?: string[] | null
          user_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_teams_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string | null
          created_by_user_id: string | null
          description: string | null
          id: string
          inherit_tenant_ml: boolean | null
          is_active: boolean | null
          ml_sharing_enabled: boolean | null
          ml_sharing_scope: string | null
          name: string
          settings: Json | null
          slug: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by_user_id?: string | null
          description?: string | null
          id?: string
          inherit_tenant_ml?: boolean | null
          is_active?: boolean | null
          ml_sharing_enabled?: boolean | null
          ml_sharing_scope?: string | null
          name: string
          settings?: Json | null
          slug: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by_user_id?: string | null
          description?: string | null
          id?: string
          inherit_tenant_ml?: boolean | null
          is_active?: boolean | null
          ml_sharing_enabled?: boolean | null
          ml_sharing_scope?: string | null
          name?: string
          settings?: Json | null
          slug?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      active_admin_users: {
        Row: {
          email: string | null
          full_name: string | null
          granted_at: string | null
          granted_by: string | null
          permissions: Json | null
          role_description: string | null
          role_name: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_users_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admin_users_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
          {
            foreignKeyName: "admin_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admin_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
        ]
      }
      active_announcements: {
        Row: {
          created_at: string | null
          dismissal_count: number | null
          ends_at: string | null
          id: string | null
          is_active: boolean | null
          is_dismissible: boolean | null
          link_text: string | null
          link_url: string | null
          message: string | null
          starts_at: string | null
          target_audience: Json | null
          title: string | null
          type: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      affiliate_performance: {
        Row: {
          code: string | null
          commission_rate: number | null
          conversion_rate: number | null
          id: string | null
          payout_status: string | null
          referrer_email: string | null
          referrer_user_id: string | null
          successful_conversions: number | null
          total_earnings: number | null
          uses_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_codes_referrer_user_id_fkey"
            columns: ["referrer_user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "referral_codes_referrer_user_id_fkey"
            columns: ["referrer_user_id"]
            isOneToOne: false
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
        ]
      }
      ai_budget_status: {
        Row: {
          alert_threshold: number | null
          budget_type: string | null
          end_date: string | null
          id: string | null
          is_active: boolean | null
          limit_usd: number | null
          name: string | null
          period: string | null
          remaining_usd: number | null
          spent_usd: number | null
          start_date: string | null
          status: string | null
          utilization: number | null
        }
        Relationships: []
      }
      ai_cost_by_provider: {
        Row: {
          avg_cost_per_request: number | null
          provider: string | null
          request_count: number | null
          total_cost_usd: number | null
          total_tokens: number | null
          unique_users: number | null
        }
        Relationships: []
      }
      ai_usage_by_user: {
        Row: {
          email: string | null
          full_name: string | null
          last_usage: string | null
          providers_used: string[] | null
          request_count: number | null
          total_cost_usd: number | null
          total_tokens: number | null
          user_id: string | null
        }
        Relationships: []
      }
      ai_usage_summary: {
        Row: {
          avg_duration_ms: number | null
          error_count: number | null
          model: string | null
          provider: string | null
          request_count: number | null
          total_completion_tokens: number | null
          total_cost_usd: number | null
          total_prompt_tokens: number | null
          total_tokens: number | null
          usage_date: string | null
        }
        Relationships: []
      }
      analytics_discount_performance: {
        Row: {
          code: string | null
          discount_type: string | null
          discount_value: number | null
          max_uses: number | null
          redemptions: number | null
          total_discount_given: number | null
          total_revenue: number | null
          used_count: number | null
        }
        Relationships: []
      }
      analytics_license_usage: {
        Row: {
          active_keys: number | null
          avg_activations_per_key: number | null
          license_type: string | null
          redeemed_keys: number | null
          total_activations: number | null
          total_keys: number | null
        }
        Relationships: []
      }
      backup_history: {
        Row: {
          backup_type: string | null
          completed_at: string | null
          created_at: string | null
          created_by_email: string | null
          duration_seconds: number | null
          file_size: number | null
          id: string | null
          started_at: string | null
          status: string | null
          storage_location: string | null
        }
        Relationships: []
      }
      campaign_performance_overview: {
        Row: {
          clicked_count: number | null
          completed_at: string | null
          created_at: string | null
          id: string | null
          name: string | null
          open_rate: number | null
          opened_count: number | null
          scheduled_at: string | null
          sent_count: number | null
          started_at: string | null
          status: string | null
          total_recipients: number | null
          type: string | null
        }
        Relationships: []
      }
      delegation_history: {
        Row: {
          approval_id: string | null
          approval_title: string | null
          can_subdelegate: boolean | null
          created_at: string | null
          delegate_email: string | null
          delegate_id: string | null
          delegate_name: string | null
          delegation_depth: number | null
          delegation_type: string | null
          delegator_email: string | null
          delegator_id: string | null
          delegator_name: string | null
          expires_at: string | null
          id: string | null
          parent_delegation_id: string | null
          reason: string | null
          revoked_at: string | null
          status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delegations_approval_id_fkey"
            columns: ["approval_id"]
            isOneToOne: false
            referencedRelation: "approvals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delegations_delegate_id_fkey"
            columns: ["delegate_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delegations_delegate_id_fkey"
            columns: ["delegate_id"]
            isOneToOne: false
            referencedRelation: "user_features"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "delegations_delegator_id_fkey"
            columns: ["delegator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delegations_delegator_id_fkey"
            columns: ["delegator_id"]
            isOneToOne: false
            referencedRelation: "user_features"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "delegations_parent_delegation_id_fkey"
            columns: ["parent_delegation_id"]
            isOneToOne: false
            referencedRelation: "delegation_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delegations_parent_delegation_id_fkey"
            columns: ["parent_delegation_id"]
            isOneToOne: false
            referencedRelation: "delegations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_analytics: {
        Row: {
          click_count: number | null
          click_rate: number | null
          click_through_rate: number | null
          created_at: string | null
          created_by_email: string | null
          id: string | null
          name: string | null
          open_count: number | null
          open_rate: number | null
          sent_at: string | null
          sent_count: number | null
          status: string | null
        }
        Relationships: []
      }
      metric_threshold_violations: {
        Row: {
          critical_threshold: number | null
          id: string | null
          metadata: Json | null
          metric_type: string | null
          recorded_at: string | null
          severity: string | null
          unit: string | null
          value: number | null
          warning_threshold: number | null
        }
        Relationships: []
      }
      notification_analytics_summary: {
        Row: {
          bounce_rate: number | null
          channel: string | null
          click_rate: number | null
          date: string | null
          delivery_rate: number | null
          open_rate: number | null
          template_key: string | null
          total_bounced: number | null
          total_clicked: number | null
          total_delivered: number | null
          total_opened: number | null
          total_sent: number | null
        }
        Relationships: []
      }
      published_blog_posts: {
        Row: {
          author_email: string | null
          author_id: string | null
          category_id: string | null
          category_name: string | null
          category_slug: string | null
          content: string | null
          excerpt: string | null
          featured_image_url: string | null
          id: string | null
          likes_count: number | null
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          reading_time_minutes: number | null
          slug: string | null
          tags: string[] | null
          title: string | null
          view_count: number | null
        }
        Relationships: []
      }
      published_documentation: {
        Row: {
          category_id: string | null
          category_name: string | null
          content: string | null
          created_at: string | null
          id: string | null
          meta_description: string | null
          order_index: number | null
          parent_id: string | null
          parent_slug: string | null
          parent_title: string | null
          slug: string | null
          title: string | null
          updated_at: string | null
          version: string | null
          view_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documentation_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "documentation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentation_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "published_documentation"
            referencedColumns: ["id"]
          },
        ]
      }
      published_faqs: {
        Row: {
          answer: string | null
          category_icon: string | null
          category_id: string | null
          category_name: string | null
          category_slug: string | null
          created_at: string | null
          display_order: number | null
          helpful_count: number | null
          id: string | null
          not_helpful_count: number | null
          question: string | null
          updated_at: string | null
          view_count: number | null
        }
        Relationships: []
      }
      recent_metrics_summary: {
        Row: {
          avg_value: number | null
          last_recorded: string | null
          max_value: number | null
          median_value: number | null
          metric_type: string | null
          min_value: number | null
          p95_value: number | null
          p99_value: number | null
          sample_count: number | null
        }
        Relationships: []
      }
      subscription_analytics: {
        Row: {
          active_subscriptions: number | null
          avg_mrr: number | null
          cancelled_subscriptions: number | null
          churned_30d: number | null
          new_subscriptions_30d: number | null
          total_arr: number | null
          total_mrr: number | null
          total_subscriptions: number | null
        }
        Relationships: []
      }
      system_health_summary: {
        Row: {
          error_message: string | null
          freshness: string | null
          last_check_at: string | null
          response_time: number | null
          service_name: string | null
          status: string | null
        }
        Insert: {
          error_message?: string | null
          freshness?: never
          last_check_at?: string | null
          response_time?: number | null
          service_name?: string | null
          status?: string | null
        }
        Update: {
          error_message?: string | null
          freshness?: never
          last_check_at?: string | null
          response_time?: number | null
          service_name?: string | null
          status?: string | null
        }
        Relationships: []
      }
      template_performance: {
        Row: {
          avg_click_rate: number | null
          avg_open_rate: number | null
          campaigns_count: number | null
          template_id: string | null
          template_name: string | null
          template_type: string | null
          total_sent: number | null
        }
        Relationships: []
      }
      ticket_analytics: {
        Row: {
          avg_resolution_hours: number | null
          category: string | null
          count: number | null
          earliest_ticket: string | null
          latest_ticket: string | null
          priority: string | null
          status: string | null
        }
        Relationships: []
      }
      tier_analytics: {
        Row: {
          active_count: number | null
          avg_mrr: number | null
          churn_rate_30d: number | null
          tier: string | null
          tier_mrr: number | null
          total_count: number | null
        }
        Relationships: []
      }
      user_features: {
        Row: {
          description: string | null
          feature_key: string | null
          feature_name: string | null
          is_enabled: boolean | null
          subscription_tier: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "ai_usage_by_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "published_blog_posts"
            referencedColumns: ["author_id"]
          },
        ]
      }
    }
    Functions: {
      add_ai_credits: {
        Args: { p_credits: number; p_user_id: string }
        Returns: Json
      }
      assign_project_creator_role: {
        Args: { p_project_id: string; p_user_id: string }
        Returns: undefined
      }
      calculate_meeting_analytics: {
        Args: { p_meeting_id: string }
        Returns: string
      }
      calculate_program_health: {
        Args: { p_program_id: string }
        Returns: string
      }
      check_admin_permission: {
        Args: { p_action: string; p_resource: string; p_user_id: string }
        Returns: boolean
      }
      check_circular_dependency: {
        Args: { p_source_task_id: string; p_target_task_id: string }
        Returns: boolean
      }
      check_expired_delegations: { Args: never; Returns: undefined }
      check_metric_threshold: {
        Args: { p_metric_type: string; p_value: number }
        Returns: string
      }
      cleanup_expired_locks: { Args: never; Returns: undefined }
      cleanup_stale_presence: { Args: never; Returns: undefined }
      create_notification: {
        Args: {
          p_action_label?: string
          p_action_url?: string
          p_expires_hours?: number
          p_message: string
          p_priority: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      deduct_ai_credits:
        | {
            Args: {
              p_completion_tokens: number
              p_credits_used: number
              p_feature_type: string
              p_model_name: string
              p_prompt_tokens: number
              p_request_id: string
              p_tenant_id: string
              p_user_id: string
            }
            Returns: {
              credits_after: number
              credits_before: number
              usage_id: string
            }[]
          }
        | {
            Args: {
              p_credits: number
              p_feature_type: string
              p_metadata?: Json
              p_model_used?: string
              p_tokens_used?: number
              p_user_id: string
            }
            Returns: Json
          }
      get_campaign_metrics: {
        Args: { p_campaign_id: string }
        Returns: {
          bounced_count: number
          click_rate: number
          clicked_count: number
          conversion_rate: number
          converted_count: number
          delivered_count: number
          open_rate: number
          opened_count: number
          sent_count: number
          total_recipients: number
          unsubscribed_count: number
        }[]
      }
      get_next_version_number: {
        Args: { p_pattern_id: string }
        Returns: number
      }
      get_program_financials: {
        Args: { p_program_id: string }
        Returns: {
          forecast: number
          spent_budget: number
          total_budget: number
          variance: number
        }[]
      }
      get_program_hierarchy: {
        Args: { p_program_id: string }
        Returns: {
          portfolio_id: string
          program_id: string
          tenant_id: string
          workspace_id: string
        }[]
      }
      get_program_projects_count: {
        Args: { p_program_id: string }
        Returns: number
      }
      get_project_hierarchy: {
        Args: { p_project_id: string }
        Returns: {
          portfolio_id: string
          project_id: string
          tenant_id: string
          workspace_id: string
        }[]
      }
      get_project_tasks_hierarchical: {
        Args: { p_project_id: string }
        Returns: {
          assignee_id: string
          created_at: string
          duration: number
          end_date: string
          expanded: boolean
          id: string
          is_critical: boolean
          level: number
          name: string
          notes: string
          parent_id: string
          priority: Database["public"]["Enums"]["priority_level"]
          progress: number
          project_id: string
          sort_order: number
          start_date: string
          status: Database["public"]["Enums"]["task_status"]
          type: Database["public"]["Enums"]["task_type"]
          updated_at: string
          wbs: string
        }[]
      }
      get_task_hierarchy: {
        Args: { p_task_id: string }
        Returns: {
          portfolio_id: string
          program_id: string
          project_id: string
          tenant_id: string
          workspace_id: string
        }[]
      }
      get_user_monthly_cost: { Args: { p_user_id: string }; Returns: number }
      get_user_role: {
        Args: { p_project_id: string; p_user_id: string }
        Returns: Database["public"]["Enums"]["project_role"]
      }
      get_visible_tasks_for_scope: {
        Args: { p_scope: string; p_scope_id: string; p_user_id: string }
        Returns: {
          id: string
          name: string
          project_id: string
          status: Database["public"]["Enums"]["task_status"]
          visibility_scope: string
        }[]
      }
      has_project_role: {
        Args: {
          p_project_id: string
          p_role: Database["public"]["Enums"]["project_role"]
          p_user_id: string
        }
        Returns: boolean
      }
      increment_content_views: {
        Args: { content_id: string; content_type: string }
        Returns: undefined
      }
      increment_faq_feedback: {
        Args: { faq_id: string; is_helpful: boolean }
        Returns: undefined
      }
      log_admin_activity: {
        Args: {
          p_action: string
          p_admin_user_id: string
          p_details?: Json
          p_resource_id?: string
          p_resource_type?: string
        }
        Returns: string
      }
      log_ai_usage: {
        Args: {
          p_completion_tokens: number
          p_duration_ms?: number
          p_error_message?: string
          p_metadata?: Json
          p_model: string
          p_operation: string
          p_prompt_tokens: number
          p_provider: string
          p_success?: boolean
          p_user_id: string
        }
        Returns: string
      }
      log_security_event: {
        Args: {
          p_details?: Json
          p_event_type: string
          p_ip_address: string
          p_severity: string
          p_user_agent: string
          p_user_email: string
          p_user_id: string
        }
        Returns: string
      }
      populate_task_hierarchy: { Args: never; Returns: undefined }
      queue_email: {
        Args: {
          p_data: Json
          p_recipients: Json
          p_scheduled_for?: string
          p_subject: string
          p_template: string
          p_user_id: string
        }
        Returns: string
      }
      record_system_metric: {
        Args: {
          p_metadata?: Json
          p_metric_type: string
          p_unit?: string
          p_value: number
        }
        Returns: string
      }
      update_attendance_patterns: {
        Args: {
          p_period_end: string
          p_period_start: string
          p_user_id: string
        }
        Returns: string
      }
      update_service_status: {
        Args: {
          p_error_message?: string
          p_metadata?: Json
          p_response_time?: number
          p_service_name: string
          p_status: string
        }
        Returns: string
      }
      user_has_feature: {
        Args: { feature: string; user_id: string }
        Returns: boolean
      }
      validate_password: { Args: { p_password: string }; Returns: Json }
    }
    Enums: {
      action_status:
        | "pending"
        | "in-progress"
        | "completed"
        | "deferred"
        | "cancelled"
      backlog_status: "todo" | "in-progress" | "review" | "done"
      constraint_type:
        | "ASAP"
        | "ALAP"
        | "MSO"
        | "MFO"
        | "SNET"
        | "SNLT"
        | "FNET"
        | "FNLT"
      cost_accrual: "start" | "end" | "prorated"
      cr_status:
        | "pending"
        | "analyzing"
        | "approved"
        | "rejected"
        | "implemented"
      dependency_type: "FS" | "SS" | "FF" | "SF"
      issue_severity: "minor" | "moderate" | "major" | "critical"
      issue_status:
        | "open"
        | "investigating"
        | "in-progress"
        | "resolved"
        | "closed"
      item_type: "epic" | "story" | "task" | "bug" | "tech-debt"
      priority_level: "critical" | "high" | "medium" | "low"
      project_role: "admin" | "pm" | "lead" | "developer" | "analyst" | "viewer"
      resource_type: "work" | "material" | "cost"
      risk_level: "low" | "medium" | "high" | "critical"
      risk_status:
        | "identified"
        | "analyzing"
        | "mitigating"
        | "closed"
        | "accepted"
      share_permission: "view" | "edit" | "admin"
      sprint_status: "planning" | "active" | "completed" | "cancelled"
      stakeholder_engagement: "supportive" | "neutral" | "resistant"
      stakeholder_level: "low" | "medium" | "high" | "critical"
      task_status:
        | "not-started"
        | "in-progress"
        | "completed"
        | "blocked"
        | "on-hold"
      task_type: "task" | "milestone" | "summary" | "story" | "bug" | "epic"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      action_status: [
        "pending",
        "in-progress",
        "completed",
        "deferred",
        "cancelled",
      ],
      backlog_status: ["todo", "in-progress", "review", "done"],
      constraint_type: [
        "ASAP",
        "ALAP",
        "MSO",
        "MFO",
        "SNET",
        "SNLT",
        "FNET",
        "FNLT",
      ],
      cost_accrual: ["start", "end", "prorated"],
      cr_status: [
        "pending",
        "analyzing",
        "approved",
        "rejected",
        "implemented",
      ],
      dependency_type: ["FS", "SS", "FF", "SF"],
      issue_severity: ["minor", "moderate", "major", "critical"],
      issue_status: [
        "open",
        "investigating",
        "in-progress",
        "resolved",
        "closed",
      ],
      item_type: ["epic", "story", "task", "bug", "tech-debt"],
      priority_level: ["critical", "high", "medium", "low"],
      project_role: ["admin", "pm", "lead", "developer", "analyst", "viewer"],
      resource_type: ["work", "material", "cost"],
      risk_level: ["low", "medium", "high", "critical"],
      risk_status: [
        "identified",
        "analyzing",
        "mitigating",
        "closed",
        "accepted",
      ],
      share_permission: ["view", "edit", "admin"],
      sprint_status: ["planning", "active", "completed", "cancelled"],
      stakeholder_engagement: ["supportive", "neutral", "resistant"],
      stakeholder_level: ["low", "medium", "high", "critical"],
      task_status: [
        "not-started",
        "in-progress",
        "completed",
        "blocked",
        "on-hold",
      ],
      task_type: ["task", "milestone", "summary", "story", "bug", "epic"],
    },
  },
} as const
