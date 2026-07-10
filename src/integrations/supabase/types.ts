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
      competency_maps: {
        Row: {
          competency: string
          created_at: string
          current_level: number
          deadline: string | null
          how_evolve: string | null
          id: string
          impact: string
          owner_id: string
          responsible: string | null
          team_id: string | null
          updated_at: string
          why_critical: string | null
        }
        Insert: {
          competency: string
          created_at?: string
          current_level?: number
          deadline?: string | null
          how_evolve?: string | null
          id?: string
          impact?: string
          owner_id: string
          responsible?: string | null
          team_id?: string | null
          updated_at?: string
          why_critical?: string | null
        }
        Update: {
          competency?: string
          created_at?: string
          current_level?: number
          deadline?: string | null
          how_evolve?: string | null
          id?: string
          impact?: string
          owner_id?: string
          responsible?: string | null
          team_id?: string | null
          updated_at?: string
          why_critical?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competency_maps_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_records: {
        Row: {
          created_at: string
          dashboard: Json | null
          ended_at: string | null
          id: string
          minutes: string | null
          owner_id: string
          room_id: string | null
          sentiment: Json | null
          started_at: string | null
          team_id: string | null
          title: string
          transcript: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dashboard?: Json | null
          ended_at?: string | null
          id?: string
          minutes?: string | null
          owner_id: string
          room_id?: string | null
          sentiment?: Json | null
          started_at?: string | null
          team_id?: string | null
          title: string
          transcript?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dashboard?: Json | null
          ended_at?: string | null
          id?: string
          minutes?: string | null
          owner_id?: string
          room_id?: string | null
          sentiment?: Json | null
          started_at?: string | null
          team_id?: string | null
          title?: string
          transcript?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string | null
          plan: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          name?: string | null
          plan?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          plan?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_rooms: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          room_slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          room_slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          room_slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      room_teams: {
        Row: {
          created_at: string
          id: string
          room_id: string
          team_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          room_id: string
          team_id: string
        }
        Update: {
          created_at?: string
          id?: string
          room_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_teams_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "project_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_teams_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_meetings: {
        Row: {
          active: boolean
          created_at: string
          id: string
          next_at: string | null
          owner_id: string
          room_id: string | null
          room_slug: string
          team_id: string | null
          time_of_day: string
          title: string
          updated_at: string
          weekday: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          next_at?: string | null
          owner_id: string
          room_id?: string | null
          room_slug: string
          team_id?: string | null
          time_of_day?: string
          title: string
          updated_at?: string
          weekday?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          next_at?: string | null
          owner_id?: string
          room_id?: string | null
          room_slug?: string
          team_id?: string | null
          time_of_day?: string
          title?: string
          updated_at?: string
          weekday?: number
        }
        Relationships: []
      }
      team_activities: {
        Row: {
          created_at: string
          done: boolean
          due_date: string | null
          id: string
          member_id: string | null
          owner_id: string
          status: string
          team_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          done?: boolean
          due_date?: string | null
          id?: string
          member_id?: string | null
          owner_id?: string
          status?: string
          team_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          done?: boolean
          due_date?: string | null
          id?: string
          member_id?: string | null
          owner_id?: string
          status?: string
          team_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_activities_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_activities_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          activity: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          role: string
          team_id: string
          user_id: string | null
        }
        Insert: {
          activity?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          role?: string
          team_id: string
          user_id?: string | null
        }
        Update: {
          activity?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          role?: string
          team_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
