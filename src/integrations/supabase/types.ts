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
      bgg_games: {
        Row: {
          bgg_id: number | null
          bgg_rank: number | null
          bgg_rating: number | null
          bgg_rating_users: number | null
          bgg_type: string | null
          bgg_url: string | null
          bgg_weight: number | null
          bgg_weight_users: number | null
          categories: string[] | null
          created_at: string
          description: string | null
          designers: string[] | null
          duration_minutes: number | null
          families: string[] | null
          id: string
          image_url: string | null
          is_active: boolean
          last_synced_at: string | null
          max_players: number | null
          max_playtime: number | null
          max_rental_days: number
          mechanics: string[] | null
          min_age: number | null
          min_players: number | null
          min_playtime: number | null
          publishers: string[] | null
          thumbnail_url: string | null
          title: string
          total_copies: number
          updated_at: string
          year_published: number | null
        }
        Insert: {
          bgg_id?: number | null
          bgg_rank?: number | null
          bgg_rating?: number | null
          bgg_rating_users?: number | null
          bgg_type?: string | null
          bgg_url?: string | null
          bgg_weight?: number | null
          bgg_weight_users?: number | null
          categories?: string[] | null
          created_at?: string
          description?: string | null
          designers?: string[] | null
          duration_minutes?: number | null
          families?: string[] | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          last_synced_at?: string | null
          max_players?: number | null
          max_playtime?: number | null
          max_rental_days?: number
          mechanics?: string[] | null
          min_age?: number | null
          min_players?: number | null
          min_playtime?: number | null
          publishers?: string[] | null
          thumbnail_url?: string | null
          title: string
          total_copies?: number
          updated_at?: string
          year_published?: number | null
        }
        Update: {
          bgg_id?: number | null
          bgg_rank?: number | null
          bgg_rating?: number | null
          bgg_rating_users?: number | null
          bgg_type?: string | null
          bgg_url?: string | null
          bgg_weight?: number | null
          bgg_weight_users?: number | null
          categories?: string[] | null
          created_at?: string
          description?: string | null
          designers?: string[] | null
          duration_minutes?: number | null
          families?: string[] | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          last_synced_at?: string | null
          max_players?: number | null
          max_playtime?: number | null
          max_rental_days?: number
          mechanics?: string[] | null
          min_age?: number | null
          min_players?: number | null
          min_playtime?: number | null
          publishers?: string[] | null
          thumbnail_url?: string | null
          title?: string
          total_copies?: number
          updated_at?: string
          year_published?: number | null
        }
        Relationships: []
      }
      content_overrides: {
        Row: {
          element_id: string
          id: string
          locale: string
          page_path: string
          property: string
          status: string
          updated_at: string
          updated_by: string | null
          value: Json | null
        }
        Insert: {
          element_id: string
          id?: string
          locale?: string
          page_path: string
          property: string
          status?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json | null
        }
        Update: {
          element_id?: string
          id?: string
          locale?: string
          page_path?: string
          property?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json | null
        }
        Relationships: []
      }
      content_pages: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_builtin: boolean
          is_published: boolean
          path: string
          template: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_builtin?: boolean
          is_published?: boolean
          path: string
          template?: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_builtin?: boolean
          is_published?: boolean
          path?: string
          template?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      content_section_history: {
        Row: {
          content: Json
          id: string
          saved_at: string
          saved_by: string | null
          schema_version: number
          section_key: string
        }
        Insert: {
          content: Json
          id?: string
          saved_at?: string
          saved_by?: string | null
          schema_version: number
          section_key: string
        }
        Update: {
          content?: Json
          id?: string
          saved_at?: string
          saved_by?: string | null
          schema_version?: number
          section_key?: string
        }
        Relationships: []
      }
      content_sections: {
        Row: {
          content: Json
          created_at: string
          id: string
          schema_version: number
          section_key: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          schema_version?: number
          section_key: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          schema_version?: number
          section_key?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      id_document_audit: {
        Row: {
          accessed_at: string
          accessed_by: string
          id: string
          target_user_id: string
        }
        Insert: {
          accessed_at?: string
          accessed_by: string
          id?: string
          target_user_id: string
        }
        Update: {
          accessed_at?: string
          accessed_by?: string
          id?: string
          target_user_id?: string
        }
        Relationships: []
      }
      invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          revoked_at: string | null
          token_hash: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by: string
          revoked_at?: string | null
          token_hash: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          revoked_at?: string | null
          token_hash?: string
        }
        Relationships: []
      }
      kv_cache: {
        Row: {
          fetched_at: string
          key: string
          value: Json
        }
        Insert: {
          fetched_at?: string
          key: string
          value: Json
        }
        Update: {
          fetched_at?: string
          key?: string
          value?: Json
        }
        Relationships: []
      }
      media_og_cache: {
        Row: {
          error: string | null
          fetched_at: string
          og_description: string | null
          og_image: string | null
          og_site_name: string | null
          og_title: string | null
          url: string
        }
        Insert: {
          error?: string | null
          fetched_at?: string
          og_description?: string | null
          og_image?: string | null
          og_site_name?: string | null
          og_title?: string | null
          url: string
        }
        Update: {
          error?: string | null
          fetched_at?: string
          og_description?: string | null
          og_image?: string | null
          og_site_name?: string | null
          og_title?: string | null
          url?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          date_of_birth: string
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"]
          id: string
          id_document_encrypted: string
          id_document_nonce: string
          member_number: number
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth: string
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"]
          id: string
          id_document_encrypted: string
          id_document_nonce: string
          member_number?: number
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string
          full_name?: string
          gender?: Database["public"]["Enums"]["gender_type"]
          id?: string
          id_document_encrypted?: string
          id_document_nonce?: string
          member_number?: number
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      rental_requests: {
        Row: {
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision_note: string | null
          game_id: string
          id: string
          message: string | null
          requested_days: number
          status: Database["public"]["Enums"]["rental_request_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          game_id: string
          id?: string
          message?: string | null
          requested_days?: number
          status?: Database["public"]["Enums"]["rental_request_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          game_id?: string
          id?: string
          message?: string | null
          requested_days?: number
          status?: Database["public"]["Enums"]["rental_request_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_requests_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "bgg_games"
            referencedColumns: ["id"]
          },
        ]
      }
      rentals: {
        Row: {
          created_at: string
          created_by: string
          due_at: string
          game_id: string
          id: string
          notes: string | null
          request_id: string | null
          returned_at: string | null
          started_at: string
          status: Database["public"]["Enums"]["rental_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          due_at: string
          game_id: string
          id?: string
          notes?: string | null
          request_id?: string | null
          returned_at?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["rental_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          due_at?: string
          game_id?: string
          id?: string
          notes?: string | null
          request_id?: string | null
          returned_at?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["rental_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rentals_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "bgg_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rentals_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "rental_requests"
            referencedColumns: ["id"]
          },
        ]
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
          role: Database["public"]["Enums"]["app_role"]
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
      encrypt_id_document: {
        Args: { _plain: string }
        Returns: {
          ciphertext: string
          nonce: string
        }[]
      }
      get_id_document: { Args: { _target_user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "super_admin" | "user"
      gender_type:
        | "female"
        | "male"
        | "non_binary"
        | "other"
        | "prefer_not_to_say"
      rental_request_status: "pending" | "approved" | "rejected" | "cancelled"
      rental_status: "active" | "returned" | "overdue" | "lost"
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
      app_role: ["super_admin", "user"],
      gender_type: [
        "female",
        "male",
        "non_binary",
        "other",
        "prefer_not_to_say",
      ],
      rental_request_status: ["pending", "approved", "rejected", "cancelled"],
      rental_status: ["active", "returned", "overdue", "lost"],
    },
  },
} as const
