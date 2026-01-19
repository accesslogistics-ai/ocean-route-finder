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
      access_logs: {
        Row: {
          accessed_at: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accessed_at?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accessed_at?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      destinations: {
        Row: {
          country: string
          created_at: string
          destination: string
          id: string
        }
        Insert: {
          country: string
          created_at?: string
          destination: string
          id?: string
        }
        Update: {
          country?: string
          created_at?: string
          destination?: string
          id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          country: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          language: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          language?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          country?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          language?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      search_logs: {
        Row: {
          carrier: string | null
          id: string
          pod: string | null
          pol: string | null
          results_count: number | null
          searched_at: string
          user_id: string
        }
        Insert: {
          carrier?: string | null
          id?: string
          pod?: string | null
          pol?: string | null
          results_count?: number | null
          searched_at?: string
          user_id: string
        }
        Update: {
          carrier?: string | null
          id?: string
          pod?: string | null
          pol?: string | null
          results_count?: number | null
          searched_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tariffs: {
        Row: {
          carrier: string
          commodity: string | null
          created_at: string
          ens_ams: string | null
          free_time: string | null
          free_time_destination: string | null
          free_time_origin: string | null
          id: string
          pod: string
          pol: string
          price_20dc: number | null
          price_40hc: number | null
          price_40reefer: number | null
          subject_to: string | null
          transit_time: string | null
          updated_at: string
          validity: string | null
        }
        Insert: {
          carrier: string
          commodity?: string | null
          created_at?: string
          ens_ams?: string | null
          free_time?: string | null
          free_time_destination?: string | null
          free_time_origin?: string | null
          id?: string
          pod: string
          pol: string
          price_20dc?: number | null
          price_40hc?: number | null
          price_40reefer?: number | null
          subject_to?: string | null
          transit_time?: string | null
          updated_at?: string
          validity?: string | null
        }
        Update: {
          carrier?: string
          commodity?: string | null
          created_at?: string
          ens_ams?: string | null
          free_time?: string | null
          free_time_destination?: string | null
          free_time_origin?: string | null
          id?: string
          pod?: string
          pol?: string
          price_20dc?: number | null
          price_40hc?: number | null
          price_40reefer?: number | null
          subject_to?: string | null
          transit_time?: string | null
          updated_at?: string
          validity?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_pods_by_country: {
        Args: { p_carrier?: string; p_country: string; p_pol?: string }
        Returns: {
          pod: string
        }[]
      }
      get_tariffs_by_country: {
        Args: { p_country: string }
        Returns: {
          carrier: string
          commodity: string | null
          created_at: string
          ens_ams: string | null
          free_time: string | null
          free_time_destination: string | null
          free_time_origin: string | null
          id: string
          pod: string
          pol: string
          price_20dc: number | null
          price_40hc: number | null
          price_40reefer: number | null
          subject_to: string | null
          transit_time: string | null
          updated_at: string
          validity: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "tariffs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_unique_carriers: {
        Args: never
        Returns: {
          carrier: string
        }[]
      }
      get_unique_countries: {
        Args: never
        Returns: {
          country: string
        }[]
      }
      get_unique_pods: {
        Args: { p_carrier?: string; p_pol?: string }
        Returns: {
          pod: string
        }[]
      }
      get_unique_pols: {
        Args: { p_carrier?: string }
        Returns: {
          pol: string
        }[]
      }
      get_user_activity_summary: {
        Args: { p_month: number; p_year: number }
        Returns: {
          access_count: number
          country: string
          email: string
          full_name: string
          last_access: string
          search_count: number
          user_id: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
