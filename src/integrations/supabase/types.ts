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
          progress?: number | null
          spent?: number | null
          start_date?: string
          status?: string
          updated_at?: string
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
          calendar_id: string | null
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
          calendar_id?: string | null
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
          calendar_id?: string | null
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
    }
    Enums: {
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
      priority_level: "critical" | "high" | "medium" | "low"
      resource_type: "work" | "material" | "cost"
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
      priority_level: ["critical", "high", "medium", "low"],
      resource_type: ["work", "material", "cost"],
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
