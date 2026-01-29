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
          id: string
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
          id?: string
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
          id?: string
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
