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
      ad_campaigns: {
        Row: {
          campaign_name: string
          conv_rate: number
          cost_per_lead: number
          cost_per_lpv: number
          cpc: number
          cpm: number
          created_at: string
          created_by: string | null
          ctr: number
          daily_budget: number
          event_id: string | null
          id: string
          landing_page_views: number
          leads: number
          notes: string | null
          oclp: number
          platform: string
          total_clicks: number
          total_impressions: number
          total_spend: number
          updated_at: string
        }
        Insert: {
          campaign_name: string
          conv_rate?: number
          cost_per_lead?: number
          cost_per_lpv?: number
          cpc?: number
          cpm?: number
          created_at?: string
          created_by?: string | null
          ctr?: number
          daily_budget?: number
          event_id?: string | null
          id?: string
          landing_page_views?: number
          leads?: number
          notes?: string | null
          oclp?: number
          platform: string
          total_clicks?: number
          total_impressions?: number
          total_spend?: number
          updated_at?: string
        }
        Update: {
          campaign_name?: string
          conv_rate?: number
          cost_per_lead?: number
          cost_per_lpv?: number
          cpc?: number
          cpm?: number
          created_at?: string
          created_by?: string | null
          ctr?: number
          daily_budget?: number
          event_id?: string | null
          id?: string
          landing_page_views?: number
          leads?: number
          notes?: string | null
          oclp?: number
          platform?: string
          total_clicks?: number
          total_impressions?: number
          total_spend?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_campaigns_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      content_library: {
        Row: {
          event_id: string | null
          file_type: string | null
          file_url: string | null
          id: string
          storage_path: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string | null
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          event_id?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          storage_path?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          event_id?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          storage_path?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_library_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_library_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          start_date: string | null
          status: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          start_date?: string | null
          status?: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          start_date?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string
          data_status: string | null
          date_received: string | null
          domicile: string | null
          event_id: string | null
          follow_up_status: string | null
          id: string
          name: string | null
          payment_amount: number
          profession: string | null
          report_id: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          data_status?: string | null
          date_received?: string | null
          domicile?: string | null
          event_id?: string | null
          follow_up_status?: string | null
          id?: string
          name?: string | null
          payment_amount?: number
          profession?: string | null
          report_id?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          data_status?: string | null
          date_received?: string | null
          domicile?: string | null
          event_id?: string | null
          follow_up_status?: string | null
          id?: string
          name?: string | null
          payment_amount?: number
          profession?: string | null
          report_id?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          language: string | null
          role_id: string | null
          team: string | null
          theme: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          language?: string | null
          role_id?: string | null
          team?: string | null
          theme?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          language?: string | null
          role_id?: string | null
          team?: string | null
          theme?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles_capacity"
            referencedColumns: ["role_id"]
          },
        ]
      }
      reports: {
        Row: {
          event_id: string | null
          file_name: string | null
          file_url: string | null
          id: string
          notes: string | null
          report_type: string | null
          row_count: number | null
          storage_path: string | null
          team: string | null
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          event_id?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          report_type?: string | null
          row_count?: number | null
          storage_path?: string | null
          team?: string | null
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          event_id?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          report_type?: string | null
          row_count?: number | null
          storage_path?: string | null
          team?: string | null
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles_capacity: {
        Row: {
          can_add_task: boolean
          created_at: string
          current_count: number
          display_name: string
          id: string
          max_capacity: number
          role_id: string
          team: string
        }
        Insert: {
          can_add_task?: boolean
          created_at?: string
          current_count?: number
          display_name: string
          id?: string
          max_capacity: number
          role_id: string
          team: string
        }
        Update: {
          can_add_task?: boolean
          created_at?: string
          current_count?: number
          display_name?: string
          id?: string
          max_capacity?: number
          role_id?: string
          team?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_team: string | null
          assigned_to: string[] | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          event_id: string | null
          id: string
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_team?: string | null
          assigned_to?: string[] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          event_id?: string | null
          id?: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_team?: string | null
          assigned_to?: string[] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          event_id?: string | null
          id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: { Args: { _user_id: string }; Returns: string }
      get_user_team: { Args: { _user_id: string }; Returns: string }
      user_can_add_task: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
