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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      actions: {
        Row: {
          blocked_by: string | null
          completed_at: string | null
          created_at: string
          created_by_id: string | null
          created_by_name: string | null
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
      ai_provider_settings: {
        Row: {
          active: boolean | null
          api_key_configured: boolean | null
          created_at: string
          id: string
          is_default: boolean | null
          model: string | null
          provider: string
          rate_limits: Json | null
          settings: Json | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          api_key_configured?: boolean | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          model?: string | null
          provider: string
          rate_limits?: Json | null
          settings?: Json | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          api_key_configured?: boolean | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          model?: string | null
          provider?: string
          rate_limits?: Json | null
          settings?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      ai_usage_logs: {
        Row: {
          cost: number | null
          created_at: string
          error_message: string | null
          id: string
          input_tokens: number | null
          latency_ms: number | null
          metadata: Json | null
          model: string | null
          operation: string | null
          output_tokens: number | null
          provider: string | null
          success: boolean | null
          user_id: string | null
        }
        Insert: {
          cost?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          input_tokens?: number | null
          latency_ms?: number | null
          metadata?: Json | null
          model?: string | null
          operation?: string | null
          output_tokens?: number | null
          provider?: string | null
          success?: boolean | null
          user_id?: string | null
        }
        Update: {
          cost?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          input_tokens?: number | null
          latency_ms?: number | null
          metadata?: Json | null
          model?: string | null
          operation?: string | null
          output_tokens?: number | null
          provider?: string | null
          success?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      backlog_items: {
        Row: {
          assignee_id: string | null
          assignee_name: string | null
          created_at: string
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
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      change_requests: {
        Row: {
          affected_tasks: Json | null
          alternatives: string | null
          approved_at: string | null
          approved_by_id: string | null
          approved_by_name: string | null
          created_at: string
          description: string | null
          id: string
          impact_details: Json | null
          justification: string | null
          priority: string | null
          project_id: string | null
          requested_at: string | null
          requested_by_id: string | null
          requested_by_name: string | null
          status: string | null
          title: string
          type: string | null
          updated_at: string
        }
        Insert: {
          affected_tasks?: Json | null
          alternatives?: string | null
          approved_at?: string | null
          approved_by_id?: string | null
          approved_by_name?: string | null
          created_at?: string
          description?: string | null
          id?: string
          impact_details?: Json | null
          justification?: string | null
          priority?: string | null
          project_id?: string | null
          requested_at?: string | null
          requested_by_id?: string | null
          requested_by_name?: string | null
          status?: string | null
          title: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          affected_tasks?: Json | null
          alternatives?: string | null
          approved_at?: string | null
          approved_by_id?: string | null
          approved_by_name?: string | null
          created_at?: string
          description?: string | null
          id?: string
          impact_details?: Json | null
          justification?: string | null
          priority?: string | null
          project_id?: string | null
          requested_at?: string | null
          requested_by_id?: string | null
          requested_by_name?: string | null
          status?: string | null
          title?: string
          type?: string | null
          updated_at?: string
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
      decisions: {
        Row: {
          alternatives: Json | null
          context: string | null
          created_at: string
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
      deliverables: {
        Row: {
          acceptance_criteria: string | null
          assignee_id: string | null
          assignee_name: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          name: string
          project_id: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          acceptance_criteria?: string | null
          assignee_id?: string | null
          assignee_name?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          name: string
          project_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          acceptance_criteria?: string | null
          assignee_id?: string | null
          assignee_name?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          name?: string
          project_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliverables_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
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
      documents: {
        Row: {
          created_at: string
          deleted_at: string | null
          file_size: number
          file_type: string
          file_url: string
          folder_id: string | null
          id: string
          is_deleted: boolean | null
          is_locked: boolean | null
          is_starred: boolean | null
          locked_by: string | null
          metadata: Json | null
          name: string
          project_id: string
          status: string
          updated_at: string
          uploaded_by: string | null
          uploaded_by_name: string | null
          version: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          file_size?: number
          file_type?: string
          file_url: string
          folder_id?: string | null
          id?: string
          is_deleted?: boolean | null
          is_locked?: boolean | null
          is_starred?: boolean | null
          locked_by?: string | null
          metadata?: Json | null
          name: string
          project_id: string
          status?: string
          updated_at?: string
          uploaded_by?: string | null
          uploaded_by_name?: string | null
          version?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          file_size?: number
          file_type?: string
          file_url?: string
          folder_id?: string | null
          id?: string
          is_deleted?: boolean | null
          is_locked?: boolean | null
          is_starred?: boolean | null
          locked_by?: string | null
          metadata?: Json | null
          name?: string
          project_id?: string
          status?: string
          updated_at?: string
          uploaded_by?: string | null
          uploaded_by_name?: string | null
          version?: string
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
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
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
      email_templates: {
        Row: {
          active: boolean | null
          category: string | null
          created_at: string
          created_by: string | null
          html_content: string | null
          id: string
          name: string
          subject: string | null
          text_content: string | null
          updated_at: string
          variables: Json | null
        }
        Insert: {
          active?: boolean | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          html_content?: string | null
          id?: string
          name: string
          subject?: string | null
          text_content?: string | null
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          active?: boolean | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          html_content?: string | null
          id?: string
          name?: string
          subject?: string | null
          text_content?: string | null
          updated_at?: string
          variables?: Json | null
        }
        Relationships: []
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
      faqs: {
        Row: {
          active: boolean | null
          answer: string
          category: string | null
          created_at: string
          helpful_count: number | null
          id: string
          not_helpful_count: number | null
          question: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          answer: string
          category?: string | null
          created_at?: string
          helpful_count?: number | null
          id?: string
          not_helpful_count?: number | null
          question: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          answer?: string
          category?: string | null
          created_at?: string
          helpful_count?: number | null
          id?: string
          not_helpful_count?: number | null
          question?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      final_reports: {
        Row: {
          completion_date: string | null
          created_at: string
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
          updated_at: string
        }
        Insert: {
          completion_date?: string | null
          created_at?: string
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
          updated_at?: string
        }
        Update: {
          completion_date?: string | null
          created_at?: string
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
          updated_at?: string
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
      invoices: {
        Row: {
          amount: number | null
          created_at: string
          currency: string | null
          id: string
          invoice_url: string | null
          paid_at: string | null
          pdf_url: string | null
          period_end: string | null
          period_start: string | null
          status: string | null
          stripe_invoice_id: string | null
          subscription_id: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          invoice_url?: string | null
          paid_at?: string | null
          pdf_url?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string | null
          stripe_invoice_id?: string | null
          subscription_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          invoice_url?: string | null
          paid_at?: string | null
          pdf_url?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string | null
          stripe_invoice_id?: string | null
          subscription_id?: string | null
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
      lessons_learned: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          impact_level: string | null
          phase: string | null
          project_id: string | null
          recommendations: Json | null
          submitted_by: string | null
          submitted_by_name: string | null
          tags: Json | null
          title: string
          type: string | null
          updated_at: string
          votes: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          impact_level?: string | null
          phase?: string | null
          project_id?: string | null
          recommendations?: Json | null
          submitted_by?: string | null
          submitted_by_name?: string | null
          tags?: Json | null
          title: string
          type?: string | null
          updated_at?: string
          votes?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          impact_level?: string | null
          phase?: string | null
          project_id?: string | null
          recommendations?: Json | null
          submitted_by?: string | null
          submitted_by_name?: string | null
          tags?: Json | null
          title?: string
          type?: string | null
          updated_at?: string
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
      marketing_campaigns: {
        Row: {
          audience_filter: Json | null
          channel: string | null
          content: string | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          scheduled_at: string | null
          sent_at: string | null
          stats: Json | null
          status: string | null
          subject: string | null
          template_id: string | null
          type: string | null
          updated_at: string
        }
        Insert: {
          audience_filter?: Json | null
          channel?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          scheduled_at?: string | null
          sent_at?: string | null
          stats?: Json | null
          status?: string | null
          subject?: string | null
          template_id?: string | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          audience_filter?: Json | null
          channel?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          scheduled_at?: string | null
          sent_at?: string | null
          stats?: Json | null
          status?: string | null
          subject?: string | null
          template_id?: string | null
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      meeting_action_items: {
        Row: {
          ai_confidence: number | null
          blocked_by: Json | null
          completed_at: string | null
          created_at: string
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
          blocked_by?: Json | null
          completed_at?: string | null
          created_at?: string
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
          blocked_by?: Json | null
          completed_at?: string | null
          created_at?: string
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
          linked_risks: Json | null
          linked_workstreams: Json | null
          location: string | null
          meeting_link: string | null
          meeting_type: string
          mom_approved: boolean | null
          mom_approved_at: string | null
          mom_approved_by: string | null
          mom_content: string | null
          mom_generated: boolean | null
          mom_template_id: string | null
          project_id: string | null
          purpose_description: string | null
          purpose_type: string | null
          recording_url: string | null
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
          title: string
          transcript_available: boolean | null
          transcript_text: string | null
          updated_at: string
          video_available: boolean | null
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
          linked_risks?: Json | null
          linked_workstreams?: Json | null
          location?: string | null
          meeting_link?: string | null
          meeting_type?: string
          mom_approved?: boolean | null
          mom_approved_at?: string | null
          mom_approved_by?: string | null
          mom_content?: string | null
          mom_generated?: boolean | null
          mom_template_id?: string | null
          project_id?: string | null
          purpose_description?: string | null
          purpose_type?: string | null
          recording_url?: string | null
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
          title: string
          transcript_available?: boolean | null
          transcript_text?: string | null
          updated_at?: string
          video_available?: boolean | null
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
          linked_risks?: Json | null
          linked_workstreams?: Json | null
          location?: string | null
          meeting_link?: string | null
          meeting_type?: string
          mom_approved?: boolean | null
          mom_approved_at?: string | null
          mom_approved_by?: string | null
          mom_content?: string | null
          mom_generated?: boolean | null
          mom_template_id?: string | null
          project_id?: string | null
          purpose_description?: string | null
          purpose_type?: string | null
          recording_url?: string | null
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
          title?: string
          transcript_available?: boolean | null
          transcript_text?: string | null
          updated_at?: string
          video_available?: boolean | null
        }
        Relationships: [
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
        ]
      }
      ml_alerts: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          alert_type: string | null
          created_at: string
          id: string
          message: string | null
          metadata: Json | null
          project_id: string | null
          severity: string | null
          title: string | null
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          alert_type?: string | null
          created_at?: string
          id?: string
          message?: string | null
          metadata?: Json | null
          project_id?: string | null
          severity?: string | null
          title?: string | null
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          alert_type?: string | null
          created_at?: string
          id?: string
          message?: string | null
          metadata?: Json | null
          project_id?: string | null
          severity?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_alerts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
      ml_predictions: {
        Row: {
          confidence_score: number | null
          created_at: string
          id: string
          model_id: string | null
          prediction_data: Json | null
          prediction_type: string | null
          project_id: string | null
          status: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          model_id?: string | null
          prediction_data?: Json | null
          prediction_type?: string | null
          project_id?: string | null
          status?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          model_id?: string | null
          prediction_data?: Json | null
          prediction_type?: string | null
          project_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_predictions_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ml_models"
            referencedColumns: ["id"]
          },
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
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          metrics: Json | null
          model_id: string | null
          started_at: string | null
          status: string | null
          trigger_reason: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          metrics?: Json | null
          model_id?: string | null
          started_at?: string | null
          status?: string | null
          trigger_reason?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          metrics?: Json | null
          model_id?: string | null
          started_at?: string | null
          status?: string | null
          trigger_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_retraining_jobs_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ml_models"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_training_data: {
        Row: {
          created_at: string
          data_quality_score: number | null
          id: string
          project_id: string | null
          snapshot_data: Json | null
          snapshot_date: string
        }
        Insert: {
          created_at?: string
          data_quality_score?: number | null
          id?: string
          project_id?: string | null
          snapshot_data?: Json | null
          snapshot_date?: string
        }
        Update: {
          created_at?: string
          data_quality_score?: number | null
          id?: string
          project_id?: string | null
          snapshot_data?: Json | null
          snapshot_date?: string
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
      notification_preferences: {
        Row: {
          category: string
          channel: string
          created_at: string
          enabled: boolean | null
          id: string
          settings: Json | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          category: string
          channel: string
          created_at?: string
          enabled?: boolean | null
          id?: string
          settings?: Json | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          category?: string
          channel?: string
          created_at?: string
          enabled?: boolean | null
          id?: string
          settings?: Json | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
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
          channel: string | null
          created_at: string
          id: string
          message: string | null
          metadata: Json | null
          read: boolean | null
          read_at: string | null
          title: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          channel?: string | null
          created_at?: string
          id?: string
          message?: string | null
          metadata?: Json | null
          read?: boolean | null
          read_at?: string | null
          title: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          channel?: string | null
          created_at?: string
          id?: string
          message?: string | null
          metadata?: Json | null
          read?: boolean | null
          read_at?: string | null
          title?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      portfolios: {
        Row: {
          created_at: string
          description: string | null
          health: string | null
          id: string
          name: string
          owner_id: string | null
          owner_name: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          health?: string | null
          id?: string
          name: string
          owner_id?: string | null
          owner_name?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          health?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          owner_name?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      programs: {
        Row: {
          budget: number | null
          created_at: string
          description: string | null
          end_date: string | null
          health: string | null
          id: string
          manager_id: string | null
          manager_name: string | null
          name: string
          portfolio_id: string | null
          spent: number | null
          start_date: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          budget?: number | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          health?: string | null
          id?: string
          manager_id?: string | null
          manager_name?: string | null
          name: string
          portfolio_id?: string | null
          spent?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          budget?: number | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          health?: string | null
          id?: string
          manager_id?: string | null
          manager_name?: string | null
          name?: string
          portfolio_id?: string | null
          spent?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "programs_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
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
          actual_amount: number | null
          budgeted_amount: number | null
          category: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          project_id: string | null
          updated_at: string
          variance: number | null
        }
        Insert: {
          actual_amount?: number | null
          budgeted_amount?: number | null
          category?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          project_id?: string | null
          updated_at?: string
          variance?: number | null
        }
        Update: {
          actual_amount?: number | null
          budgeted_amount?: number | null
          category?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          project_id?: string | null
          updated_at?: string
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
          approved_by_name: string | null
          assumptions: Json | null
          budget_summary: Json | null
          constraints: Json | null
          created_at: string
          id: string
          milestones: Json | null
          mission: string | null
          name: string
          objectives: Json | null
          project_id: string | null
          status: string | null
          success_criteria: Json | null
          updated_at: string
          version: string | null
          vision: string | null
        }
        Insert: {
          approval_authorities?: Json | null
          approved_at?: string | null
          approved_by_id?: string | null
          approved_by_name?: string | null
          assumptions?: Json | null
          budget_summary?: Json | null
          constraints?: Json | null
          created_at?: string
          id?: string
          milestones?: Json | null
          mission?: string | null
          name: string
          objectives?: Json | null
          project_id?: string | null
          status?: string | null
          success_criteria?: Json | null
          updated_at?: string
          version?: string | null
          vision?: string | null
        }
        Update: {
          approval_authorities?: Json | null
          approved_at?: string | null
          approved_by_id?: string | null
          approved_by_name?: string | null
          assumptions?: Json | null
          budget_summary?: Json | null
          constraints?: Json | null
          created_at?: string
          id?: string
          milestones?: Json | null
          mission?: string | null
          name?: string
          objectives?: Json | null
          project_id?: string | null
          status?: string | null
          success_criteria?: Json | null
          updated_at?: string
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
      project_evm_snapshots: {
        Row: {
          ac: number | null
          bac: number | null
          cpi: number | null
          created_at: string
          cv: number | null
          eac: number | null
          etc: number | null
          ev: number | null
          id: string
          project_id: string | null
          pv: number | null
          snapshot_date: string
          spi: number | null
          sv: number | null
          tcpi: number | null
          vac: number | null
        }
        Insert: {
          ac?: number | null
          bac?: number | null
          cpi?: number | null
          created_at?: string
          cv?: number | null
          eac?: number | null
          etc?: number | null
          ev?: number | null
          id?: string
          project_id?: string | null
          pv?: number | null
          snapshot_date: string
          spi?: number | null
          sv?: number | null
          tcpi?: number | null
          vac?: number | null
        }
        Update: {
          ac?: number | null
          bac?: number | null
          cpi?: number | null
          created_at?: string
          cv?: number | null
          eac?: number | null
          etc?: number | null
          ev?: number | null
          id?: string
          project_id?: string | null
          pv?: number | null
          snapshot_date?: string
          spi?: number | null
          sv?: number | null
          tcpi?: number | null
          vac?: number | null
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
          amount: number | null
          created_at: string
          due_date: string | null
          id: string
          invoice_number: string
          notes: string | null
          paid_date: string | null
          project_id: string | null
          status: string | null
          updated_at: string
          vendor: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_number: string
          notes?: string | null
          paid_date?: string | null
          project_id?: string | null
          status?: string | null
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_number?: string
          notes?: string | null
          paid_date?: string | null
          project_id?: string | null
          status?: string | null
          updated_at?: string
          vendor?: string | null
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
      projects: {
        Row: {
          budget: number | null
          code: string
          created_at: string
          description: string | null
          end_date: string | null
          health: string
          id: string
          methodology: string
          name: string
          owner_id: string | null
          program_id: string | null
          progress: number | null
          spent: number | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          budget?: number | null
          code: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          health?: string
          id?: string
          methodology?: string
          name: string
          owner_id?: string | null
          program_id?: string | null
          progress?: number | null
          spent?: number | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Update: {
          budget?: number | null
          code?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          health?: string
          id?: string
          methodology?: string
          name?: string
          owner_id?: string | null
          program_id?: string | null
          progress?: number | null
          spent?: number | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          content: Json | null
          created_at: string
          format: string | null
          generated_at: string | null
          generated_by: string | null
          id: string
          project_id: string | null
          recipients: Json | null
          schedule: Json | null
          status: string | null
          title: string
          type: string | null
          updated_at: string
        }
        Insert: {
          content?: Json | null
          created_at?: string
          format?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          project_id?: string | null
          recipients?: Json | null
          schedule?: Json | null
          status?: string | null
          title: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          content?: Json | null
          created_at?: string
          format?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          project_id?: string | null
          recipients?: Json | null
          schedule?: Json | null
          status?: string | null
          title?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
          created_at: string
          description: string | null
          id: string
          name: string
          parameters: Json | null
          project_id: string | null
          results: Json | null
          status: string | null
          type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          parameters?: Json | null
          project_id?: string | null
          results?: Json | null
          status?: string | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          parameters?: Json | null
          project_id?: string | null
          results?: Json | null
          status?: string | null
          type?: string | null
          updated_at?: string
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
      sites: {
        Row: {
          created_at: string
          id: string
          location: string | null
          name: string
          project_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          location?: string | null
          name: string
          project_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          location?: string | null
          name?: string
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sites_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      spreadsheet_sheets: {
        Row: {
          column_widths: Json | null
          created_at: string
          data: Json | null
          frozen_cols: number | null
          frozen_rows: number | null
          id: string
          name: string
          row_heights: Json | null
          sort_order: number | null
          spreadsheet_id: string
          updated_at: string
        }
        Insert: {
          column_widths?: Json | null
          created_at?: string
          data?: Json | null
          frozen_cols?: number | null
          frozen_rows?: number | null
          id?: string
          name?: string
          row_heights?: Json | null
          sort_order?: number | null
          spreadsheet_id: string
          updated_at?: string
        }
        Update: {
          column_widths?: Json | null
          created_at?: string
          data?: Json | null
          frozen_cols?: number | null
          frozen_rows?: number | null
          id?: string
          name?: string
          row_heights?: Json | null
          sort_order?: number | null
          spreadsheet_id?: string
          updated_at?: string
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
      sprints: {
        Row: {
          capacity: number | null
          created_at: string
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
          communication_frequency: string | null
          created_at: string
          email: string | null
          engagement: string | null
          engagement_strategy: string | null
          id: string
          influence: string | null
          interest: string | null
          interest_level: string | null
          is_key_stakeholder: boolean | null
          name: string
          notes: string | null
          organization: string | null
          phone: string | null
          power_level: string | null
          project_id: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          communication_frequency?: string | null
          created_at?: string
          email?: string | null
          engagement?: string | null
          engagement_strategy?: string | null
          id?: string
          influence?: string | null
          interest?: string | null
          interest_level?: string | null
          is_key_stakeholder?: boolean | null
          name: string
          notes?: string | null
          organization?: string | null
          phone?: string | null
          power_level?: string | null
          project_id?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          communication_frequency?: string | null
          created_at?: string
          email?: string | null
          engagement?: string | null
          engagement_strategy?: string | null
          id?: string
          influence?: string | null
          interest?: string | null
          interest_level?: string | null
          is_key_stakeholder?: boolean | null
          name?: string
          notes?: string | null
          organization?: string | null
          phone?: string | null
          power_level?: string | null
          project_id?: string | null
          role?: string | null
          updated_at?: string
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
          created_at: string
          data: Json | null
          id: string
          project_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          project_id?: string | null
          type: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          project_id?: string | null
          type?: string
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
          category: string | null
          created_at: string
          description: string | null
          id: string
          key: string
          name: string
          tiers: Json | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          key: string
          name: string
          tiers?: Json | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          name?: string
          tiers?: Json | null
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
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          metadata: Json | null
          plan_id: string | null
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          billing_cycle?: string | null
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          metadata?: Json | null
          plan_id?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          billing_cycle?: string | null
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          metadata?: Json | null
          plan_id?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string | null
          closed_at: string | null
          created_at: string
          description: string | null
          id: string
          priority: string | null
          resolved_at: string | null
          status: string | null
          subject: string
          updated_at: string
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          closed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string | null
          resolved_at?: string | null
          status?: string | null
          subject: string
          updated_at?: string
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          closed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string | null
          resolved_at?: string | null
          status?: string | null
          subject?: string
          updated_at?: string
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      sync_history: {
        Row: {
          completed_at: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          error_message: string | null
          id: string
          metadata: Json | null
          records_synced: number | null
          started_at: string | null
          status: string | null
          sync_type: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          records_synced?: number | null
          started_at?: string | null
          status?: string | null
          sync_type?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          records_synced?: number | null
          started_at?: string | null
          status?: string | null
          sync_type?: string | null
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
      task_dependencies: {
        Row: {
          created_at: string
          id: string
          lag: number | null
          predecessor_id: string
          task_id: string
          type: Database["public"]["Enums"]["dependency_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          lag?: number | null
          predecessor_id: string
          task_id: string
          type?: Database["public"]["Enums"]["dependency_type"]
        }
        Update: {
          created_at?: string
          id?: string
          lag?: number | null
          predecessor_id?: string
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
            foreignKeyName: "task_dependencies_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          actual_cost: number | null
          actual_work_hours: number | null
          assignee_id: string | null
          baseline_end: string | null
          baseline_start: string | null
          calendar_id: string | null
          child_project_id: string | null
          constraint_date: string | null
          constraint_type: Database["public"]["Enums"]["constraint_type"] | null
          cost: number | null
          created_at: string
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
          name: string
          notes: string | null
          parent_id: string | null
          priority: Database["public"]["Enums"]["priority_level"]
          progress: number
          project_id: string
          remaining_work_hours: number | null
          sort_order: number
          start_date: string
          status: Database["public"]["Enums"]["task_status"]
          total_slack: number | null
          type: Database["public"]["Enums"]["task_type"]
          updated_at: string
          wbs: string
          work_hours: number | null
        }
        Insert: {
          actual_cost?: number | null
          actual_work_hours?: number | null
          assignee_id?: string | null
          baseline_end?: string | null
          baseline_start?: string | null
          calendar_id?: string | null
          child_project_id?: string | null
          constraint_date?: string | null
          constraint_type?:
            | Database["public"]["Enums"]["constraint_type"]
            | null
          cost?: number | null
          created_at?: string
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
          name: string
          notes?: string | null
          parent_id?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          progress?: number
          project_id: string
          remaining_work_hours?: number | null
          sort_order?: number
          start_date?: string
          status?: Database["public"]["Enums"]["task_status"]
          total_slack?: number | null
          type?: Database["public"]["Enums"]["task_type"]
          updated_at?: string
          wbs: string
          work_hours?: number | null
        }
        Update: {
          actual_cost?: number | null
          actual_work_hours?: number | null
          assignee_id?: string | null
          baseline_end?: string | null
          baseline_start?: string | null
          calendar_id?: string | null
          child_project_id?: string | null
          constraint_date?: string | null
          constraint_type?:
            | Database["public"]["Enums"]["constraint_type"]
            | null
          cost?: number | null
          created_at?: string
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
          name?: string
          notes?: string | null
          parent_id?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          progress?: number
          project_id?: string
          remaining_work_hours?: number | null
          sort_order?: number
          start_date?: string
          status?: Database["public"]["Enums"]["task_status"]
          total_slack?: number | null
          type?: Database["public"]["Enums"]["task_type"]
          updated_at?: string
          wbs?: string
          work_hours?: number | null
        }
        Relationships: [
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
            foreignKeyName: "tasks_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          project_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          project_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "ticket_replies_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_activities: {
        Row: {
          color: string | null
          created_at: string
          duration_months: number
          id: string
          label: string
          progress: number | null
          start_month: number
          swimlane_id: string | null
          task_id: string | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          duration_months?: number
          id?: string
          label: string
          progress?: number | null
          start_month: number
          swimlane_id?: string | null
          task_id?: string | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          duration_months?: number
          id?: string
          label?: string
          progress?: number | null
          start_month?: number
          swimlane_id?: string | null
          task_id?: string | null
          updated_at?: string
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
          created_at: string
          dependency_type: string | null
          from_activity_id: string | null
          id: string
          project_id: string | null
          to_activity_id: string | null
        }
        Insert: {
          created_at?: string
          dependency_type?: string | null
          from_activity_id?: string | null
          id?: string
          project_id?: string | null
          to_activity_id?: string | null
        }
        Update: {
          created_at?: string
          dependency_type?: string | null
          from_activity_id?: string | null
          id?: string
          project_id?: string | null
          to_activity_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timeline_dependencies_from_activity_id_fkey"
            columns: ["from_activity_id"]
            isOneToOne: false
            referencedRelation: "timeline_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_dependencies_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_dependencies_to_activity_id_fkey"
            columns: ["to_activity_id"]
            isOneToOne: false
            referencedRelation: "timeline_activities"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_milestones: {
        Row: {
          color: string | null
          created_at: string
          id: string
          label: string
          month: number
          project_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          label: string
          month: number
          project_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          label?: string
          month?: number
          project_id?: string | null
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
      timeline_swimlanes: {
        Row: {
          activities: Json | null
          collapsed: boolean | null
          color: string | null
          created_at: string
          id: string
          label: string
          project_id: string | null
          site_ids: Json | null
          sort_order: number | null
          target_duration: number | null
          team_ids: Json | null
          updated_at: string
        }
        Insert: {
          activities?: Json | null
          collapsed?: boolean | null
          color?: string | null
          created_at?: string
          id?: string
          label: string
          project_id?: string | null
          site_ids?: Json | null
          sort_order?: number | null
          target_duration?: number | null
          team_ids?: Json | null
          updated_at?: string
        }
        Update: {
          activities?: Json | null
          collapsed?: boolean | null
          color?: string | null
          created_at?: string
          id?: string
          label?: string
          project_id?: string | null
          site_ids?: Json | null
          sort_order?: number | null
          target_duration?: number | null
          team_ids?: Json | null
          updated_at?: string
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
      traceability_matrix: {
        Row: {
          created_at: string
          id: string
          link_type: string | null
          project_id: string | null
          source_id: string
          source_name: string | null
          source_type: string
          status: string | null
          target_id: string
          target_name: string | null
          target_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          link_type?: string | null
          project_id?: string | null
          source_id: string
          source_name?: string | null
          source_type: string
          status?: string | null
          target_id: string
          target_name?: string | null
          target_type: string
        }
        Update: {
          created_at?: string
          id?: string
          link_type?: string | null
          project_id?: string | null
          source_id?: string
          source_name?: string | null
          source_type?: string
          status?: string | null
          target_id?: string
          target_name?: string | null
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
      user_preferences: {
        Row: {
          created_at: string
          id: string
          preference_key: string
          preference_value: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          preference_key: string
          preference_value?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          preference_key?: string
          preference_value?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          project_id: string | null
          role: Database["public"]["Enums"]["project_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id?: string | null
          role?: Database["public"]["Enums"]["project_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string | null
          role?: Database["public"]["Enums"]["project_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
      get_user_role: {
        Args: { p_project_id: string; p_user_id: string }
        Returns: Database["public"]["Enums"]["project_role"]
      }
      has_project_role: {
        Args: {
          p_project_id: string
          p_role: Database["public"]["Enums"]["project_role"]
          p_user_id: string
        }
        Returns: boolean
      }
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
      sprint_status: "planning" | "active" | "completed" | "cancelled"
      task_status:
        | "not-started"
        | "in-progress"
        | "completed"
        | "blocked"
        | "on-hold"
      task_type: "task" | "milestone" | "summary"
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
      sprint_status: ["planning", "active", "completed", "cancelled"],
      task_status: [
        "not-started",
        "in-progress",
        "completed",
        "blocked",
        "on-hold",
      ],
      task_type: ["task", "milestone", "summary"],
    },
  },
} as const
