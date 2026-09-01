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
      badges: {
        Row: {
          auto_metric: string | null
          auto_param: string | null
          code: string
          color: string
          created_at: string
          description_ca: string
          description_en: string
          description_es: string
          grp: string
          icon: string
          id: string
          is_active: boolean
          kind: Database["public"]["Enums"]["badge_kind"]
          name_ca: string
          name_en: string
          name_es: string
          sort_order: number
          source: Database["public"]["Enums"]["badge_source"]
          tiers: Json
          updated_at: string
        }
        Insert: {
          auto_metric?: string | null
          auto_param?: string | null
          code: string
          color?: string
          created_at?: string
          description_ca?: string
          description_en?: string
          description_es?: string
          grp?: string
          icon?: string
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["badge_kind"]
          name_ca: string
          name_en: string
          name_es: string
          sort_order?: number
          source?: Database["public"]["Enums"]["badge_source"]
          tiers?: Json
          updated_at?: string
        }
        Update: {
          auto_metric?: string | null
          auto_param?: string | null
          code?: string
          color?: string
          created_at?: string
          description_ca?: string
          description_en?: string
          description_es?: string
          grp?: string
          icon?: string
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["badge_kind"]
          name_ca?: string
          name_en?: string
          name_es?: string
          sort_order?: number
          source?: Database["public"]["Enums"]["badge_source"]
          tiers?: Json
          updated_at?: string
        }
        Relationships: []
      }
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
          drawer_letter: Database["public"]["Enums"]["drawer_letter"] | null
          drawer_number: number | null
          duration_minutes: number | null
          families: string[] | null
          id: string
          image_url: string | null
          in_drawer: boolean
          is_active: boolean
          last_synced_at: string | null
          max_players: number | null
          max_playtime: number | null
          max_rental_days: number
          mechanics: string[] | null
          min_age: number | null
          min_players: number | null
          min_playtime: number | null
          notes_admin: string | null
          publishers: string[] | null
          shape: Database["public"]["Enums"]["shelf_shape"] | null
          shelf: Database["public"]["Enums"]["shelf_location"] | null
          shelf_color: Database["public"]["Enums"]["shelf_color"] | null
          slot_number: number | null
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
          drawer_letter?: Database["public"]["Enums"]["drawer_letter"] | null
          drawer_number?: number | null
          duration_minutes?: number | null
          families?: string[] | null
          id?: string
          image_url?: string | null
          in_drawer?: boolean
          is_active?: boolean
          last_synced_at?: string | null
          max_players?: number | null
          max_playtime?: number | null
          max_rental_days?: number
          mechanics?: string[] | null
          min_age?: number | null
          min_players?: number | null
          min_playtime?: number | null
          notes_admin?: string | null
          publishers?: string[] | null
          shape?: Database["public"]["Enums"]["shelf_shape"] | null
          shelf?: Database["public"]["Enums"]["shelf_location"] | null
          shelf_color?: Database["public"]["Enums"]["shelf_color"] | null
          slot_number?: number | null
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
          drawer_letter?: Database["public"]["Enums"]["drawer_letter"] | null
          drawer_number?: number | null
          duration_minutes?: number | null
          families?: string[] | null
          id?: string
          image_url?: string | null
          in_drawer?: boolean
          is_active?: boolean
          last_synced_at?: string | null
          max_players?: number | null
          max_playtime?: number | null
          max_rental_days?: number
          mechanics?: string[] | null
          min_age?: number | null
          min_players?: number | null
          min_playtime?: number | null
          notes_admin?: string | null
          publishers?: string[] | null
          shape?: Database["public"]["Enums"]["shelf_shape"] | null
          shelf?: Database["public"]["Enums"]["shelf_location"] | null
          shelf_color?: Database["public"]["Enums"]["shelf_color"] | null
          slot_number?: number | null
          thumbnail_url?: string | null
          title?: string
          total_copies?: number
          updated_at?: string
          year_published?: number | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_name: string | null
          content_ca: string | null
          content_en: string | null
          content_es: string | null
          cover_image_url: string | null
          created_at: string
          excerpt_ca: string | null
          excerpt_en: string | null
          excerpt_es: string | null
          id: string
          keywords: string[]
          meta_description_ca: string | null
          meta_description_en: string | null
          meta_description_es: string | null
          published_at: string
          reading_time_minutes: number | null
          seo_title_ca: string | null
          seo_title_en: string | null
          seo_title_es: string | null
          slug: string
          status: string
          tags: string[]
          title_ca: string | null
          title_en: string | null
          title_es: string | null
          updated_at: string
          wp_id: number | null
        }
        Insert: {
          author_name?: string | null
          content_ca?: string | null
          content_en?: string | null
          content_es?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt_ca?: string | null
          excerpt_en?: string | null
          excerpt_es?: string | null
          id?: string
          keywords?: string[]
          meta_description_ca?: string | null
          meta_description_en?: string | null
          meta_description_es?: string | null
          published_at?: string
          reading_time_minutes?: number | null
          seo_title_ca?: string | null
          seo_title_en?: string | null
          seo_title_es?: string | null
          slug: string
          status?: string
          tags?: string[]
          title_ca?: string | null
          title_en?: string | null
          title_es?: string | null
          updated_at?: string
          wp_id?: number | null
        }
        Update: {
          author_name?: string | null
          content_ca?: string | null
          content_en?: string | null
          content_es?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt_ca?: string | null
          excerpt_en?: string | null
          excerpt_es?: string | null
          id?: string
          keywords?: string[]
          meta_description_ca?: string | null
          meta_description_en?: string | null
          meta_description_es?: string | null
          published_at?: string
          reading_time_minutes?: number | null
          seo_title_ca?: string | null
          seo_title_en?: string | null
          seo_title_es?: string | null
          slug?: string
          status?: string
          tags?: string[]
          title_ca?: string | null
          title_en?: string | null
          title_es?: string | null
          updated_at?: string
          wp_id?: number | null
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
      content_page_blocks: {
        Row: {
          created_at: string
          created_by: string | null
          data: Json
          hidden: boolean
          id: string
          locale: string
          page_id: string
          position: number
          type: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data?: Json
          hidden?: boolean
          id?: string
          locale: string
          page_id: string
          position?: number
          type: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data?: Json
          hidden?: boolean
          id?: string
          locale?: string
          page_id?: string
          position?: number
          type?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_page_blocks_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "content_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      content_pages: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_builtin: boolean
          is_published: boolean
          page_key: string | null
          path: string
          slug_ca: string | null
          slug_en: string | null
          slug_es: string | null
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
          page_key?: string | null
          path: string
          slug_ca?: string | null
          slug_en?: string | null
          slug_es?: string | null
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
          page_key?: string | null
          path?: string
          slug_ca?: string | null
          slug_en?: string | null
          slug_es?: string | null
          template?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      content_redirects: {
        Row: {
          created_at: string
          created_by: string | null
          from_path: string
          id: string
          locale: string | null
          page_key: string | null
          to_path: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          from_path: string
          id?: string
          locale?: string | null
          page_key?: string | null
          to_path: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          from_path?: string
          id?: string
          locale?: string | null
          page_key?: string | null
          to_path?: string
        }
        Relationships: []
      }
      content_section_history: {
        Row: {
          content: Json
          id: string
          locale: string
          saved_at: string
          saved_by: string | null
          schema_version: number
          section_key: string
        }
        Insert: {
          content: Json
          id?: string
          locale?: string
          saved_at?: string
          saved_by?: string | null
          schema_version: number
          section_key: string
        }
        Update: {
          content?: Json
          id?: string
          locale?: string
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
          locale: string
          schema_version: number
          section_key: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          locale?: string
          schema_version?: number
          section_key: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          locale?: string
          schema_version?: number
          section_key?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      featured_games: {
        Row: {
          created_at: string
          created_by: string | null
          end_date: string
          game_id: string
          id: string
          notified_at: string | null
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          end_date: string
          game_id: string
          id?: string
          notified_at?: string | null
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          end_date?: string
          game_id?: string
          id?: string
          notified_at?: string | null
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "featured_games_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "bgg_games"
            referencedColumns: ["id"]
          },
        ]
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
      karma_categories: {
        Row: {
          code: string
          created_at: string
          description_ca: string
          description_en: string
          description_es: string
          grp: Database["public"]["Enums"]["karma_category_group"]
          id: string
          is_active: boolean
          limit_count: number | null
          limit_period: Database["public"]["Enums"]["karma_limit_period"]
          member_requestable: boolean
          name_ca: string
          name_en: string
          name_es: string
          points: number
          points_max: number | null
          points_min: number | null
          requires_evidence: boolean
          sort_order: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description_ca?: string
          description_en?: string
          description_es?: string
          grp: Database["public"]["Enums"]["karma_category_group"]
          id?: string
          is_active?: boolean
          limit_count?: number | null
          limit_period?: Database["public"]["Enums"]["karma_limit_period"]
          member_requestable?: boolean
          name_ca?: string
          name_en?: string
          name_es: string
          points?: number
          points_max?: number | null
          points_min?: number | null
          requires_evidence?: boolean
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description_ca?: string
          description_en?: string
          description_es?: string
          grp?: Database["public"]["Enums"]["karma_category_group"]
          id?: string
          is_active?: boolean
          limit_count?: number | null
          limit_period?: Database["public"]["Enums"]["karma_limit_period"]
          member_requestable?: boolean
          name_ca?: string
          name_en?: string
          name_es?: string
          points?: number
          points_max?: number | null
          points_min?: number | null
          requires_evidence?: boolean
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      karma_entries: {
        Row: {
          category_id: string | null
          created_at: string
          created_by: string | null
          decided_at: string | null
          decided_by: string | null
          decision_note: string | null
          description: string | null
          event_ref: string | null
          evidence_url: string | null
          game_id: string | null
          id: string
          points: number
          season_id: string | null
          status: Database["public"]["Enums"]["karma_entry_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          description?: string | null
          event_ref?: string | null
          evidence_url?: string | null
          game_id?: string | null
          id?: string
          points?: number
          season_id?: string | null
          status?: Database["public"]["Enums"]["karma_entry_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          description?: string | null
          event_ref?: string | null
          evidence_url?: string | null
          game_id?: string | null
          id?: string
          points?: number
          season_id?: string | null
          status?: Database["public"]["Enums"]["karma_entry_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "karma_entries_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "karma_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "karma_entries_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "bgg_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "karma_entries_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "karma_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      karma_perks: {
        Row: {
          consumed_at: string | null
          created_at: string
          expires_at: string | null
          id: string
          kind: Database["public"]["Enums"]["karma_reward_effect"]
          redemption_id: string | null
          user_id: string
          value: number | null
        }
        Insert: {
          consumed_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          kind: Database["public"]["Enums"]["karma_reward_effect"]
          redemption_id?: string | null
          user_id: string
          value?: number | null
        }
        Update: {
          consumed_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["karma_reward_effect"]
          redemption_id?: string | null
          user_id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "karma_perks_redemption_id_fkey"
            columns: ["redemption_id"]
            isOneToOne: false
            referencedRelation: "karma_redemptions"
            referencedColumns: ["id"]
          },
        ]
      }
      karma_redemptions: {
        Row: {
          created_at: string
          decided_at: string | null
          decided_by: string | null
          id: string
          note: string | null
          points_spent: number
          reward_id: string | null
          season_id: string | null
          status: Database["public"]["Enums"]["karma_redemption_status"]
          target_rental_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          note?: string | null
          points_spent: number
          reward_id?: string | null
          season_id?: string | null
          status?: Database["public"]["Enums"]["karma_redemption_status"]
          target_rental_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          note?: string | null
          points_spent?: number
          reward_id?: string | null
          season_id?: string | null
          status?: Database["public"]["Enums"]["karma_redemption_status"]
          target_rental_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "karma_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "karma_rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "karma_redemptions_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "karma_seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "karma_redemptions_target_rental_id_fkey"
            columns: ["target_rental_id"]
            isOneToOne: false
            referencedRelation: "rentals"
            referencedColumns: ["id"]
          },
        ]
      }
      karma_referrals: {
        Row: {
          created_at: string
          id: string
          loyalty_awarded: boolean
          note: string | null
          referred_name: string
          referred_user_id: string | null
          referrer_id: string
          signup_awarded: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          loyalty_awarded?: boolean
          note?: string | null
          referred_name: string
          referred_user_id?: string | null
          referrer_id: string
          signup_awarded?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          loyalty_awarded?: boolean
          note?: string | null
          referred_name?: string
          referred_user_id?: string | null
          referrer_id?: string
          signup_awarded?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      karma_rewards: {
        Row: {
          code: string
          cost: number
          created_at: string
          description_ca: string
          description_en: string
          description_es: string
          effect: Database["public"]["Enums"]["karma_reward_effect"]
          effect_value: number | null
          id: string
          is_active: boolean
          name_ca: string
          name_en: string
          name_es: string
          sort_order: number
          stock: number | null
          updated_at: string
        }
        Insert: {
          code: string
          cost: number
          created_at?: string
          description_ca?: string
          description_en?: string
          description_es?: string
          effect?: Database["public"]["Enums"]["karma_reward_effect"]
          effect_value?: number | null
          id?: string
          is_active?: boolean
          name_ca?: string
          name_en?: string
          name_es: string
          sort_order?: number
          stock?: number | null
          updated_at?: string
        }
        Update: {
          code?: string
          cost?: number
          created_at?: string
          description_ca?: string
          description_en?: string
          description_es?: string
          effect?: Database["public"]["Enums"]["karma_reward_effect"]
          effect_value?: number | null
          id?: string
          is_active?: boolean
          name_ca?: string
          name_en?: string
          name_es?: string
          sort_order?: number
          stock?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      karma_seasons: {
        Row: {
          carryover_max: number
          closed_at: string | null
          created_at: string
          ends_on: string
          id: string
          is_active: boolean
          name: string
          starts_on: string
          updated_at: string
        }
        Insert: {
          carryover_max?: number
          closed_at?: string | null
          created_at?: string
          ends_on: string
          id?: string
          is_active?: boolean
          name: string
          starts_on: string
          updated_at?: string
        }
        Update: {
          carryover_max?: number
          closed_at?: string | null
          created_at?: string
          ends_on?: string
          id?: string
          is_active?: boolean
          name?: string
          starts_on?: string
          updated_at?: string
        }
        Relationships: []
      }
      karma_settings: {
        Row: {
          carryover_max: number
          id: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          carryover_max?: number
          id?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          carryover_max?: number
          id?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      karma_user_cycles: {
        Row: {
          carryover_in: number
          closed_at: string | null
          created_at: string
          cycle_index: number
          ends_at: string
          id: string
          points_at_close: number | null
          starts_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          carryover_in?: number
          closed_at?: string | null
          created_at?: string
          cycle_index?: number
          ends_at: string
          id?: string
          points_at_close?: number | null
          starts_at: string
          updated_at?: string
          user_id: string
        }
        Update: {
          carryover_in?: number
          closed_at?: string | null
          created_at?: string
          cycle_index?: number
          ends_at?: string
          id?: string
          points_at_close?: number | null
          starts_at?: string
          updated_at?: string
          user_id?: string
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
      media_appearances: {
        Row: {
          created_at: string
          date_label: string | null
          description: string | null
          description_ca: string | null
          description_en: string | null
          description_es: string | null
          display_order: number
          id: string
          image_url: string | null
          is_published: boolean
          month: number
          outlet: string
          title: string
          title_ca: string | null
          title_en: string | null
          title_es: string | null
          updated_at: string
          url: string
          year: number
        }
        Insert: {
          created_at?: string
          date_label?: string | null
          description?: string | null
          description_ca?: string | null
          description_en?: string | null
          description_es?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_published?: boolean
          month: number
          outlet: string
          title: string
          title_ca?: string | null
          title_en?: string | null
          title_es?: string | null
          updated_at?: string
          url: string
          year: number
        }
        Update: {
          created_at?: string
          date_label?: string | null
          description?: string | null
          description_ca?: string | null
          description_en?: string | null
          description_es?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_published?: boolean
          month?: number
          outlet?: string
          title?: string
          title_ca?: string | null
          title_en?: string | null
          title_es?: string | null
          updated_at?: string
          url?: string
          year?: number
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
      member_profiles: {
        Row: {
          attends_alone: string | null
          availability: string[]
          bio: string | null
          created_at: string
          experience_level: string | null
          favorite_games: Json
          game_types: string[]
          goals: string[]
          is_public: boolean
          languages: string[]
          scheduled_games: string | null
          teaches: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attends_alone?: string | null
          availability?: string[]
          bio?: string | null
          created_at?: string
          experience_level?: string | null
          favorite_games?: Json
          game_types?: string[]
          goals?: string[]
          is_public?: boolean
          languages?: string[]
          scheduled_games?: string | null
          teaches?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          attends_alone?: string | null
          availability?: string[]
          bio?: string | null
          created_at?: string
          experience_level?: string | null
          favorite_games?: Json
          game_types?: string[]
          goals?: string[]
          is_public?: boolean
          languages?: string[]
          scheduled_games?: string | null
          teaches?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          read_at: string | null
          title: string
          type: string
          url: string | null
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          title: string
          type: string
          url?: string | null
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          title?: string
          type?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      poll_options: {
        Row: {
          created_at: string
          description: string | null
          description_ca: string | null
          description_en: string | null
          game_image_url: string | null
          game_ref: string | null
          game_year: number | null
          id: string
          label: string
          label_ca: string | null
          label_en: string | null
          poll_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          description_ca?: string | null
          description_en?: string | null
          game_image_url?: string | null
          game_ref?: string | null
          game_year?: number | null
          id?: string
          label: string
          label_ca?: string | null
          label_en?: string | null
          poll_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          description_ca?: string | null
          description_en?: string | null
          game_image_url?: string | null
          game_ref?: string | null
          game_year?: number | null
          id?: string
          label?: string
          label_ca?: string | null
          label_en?: string | null
          poll_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_responses: {
        Row: {
          answers: Json
          created_at: string
          id: string
          poll_id: string
          user_id: string
        }
        Insert: {
          answers?: Json
          created_at?: string
          id?: string
          poll_id: string
          user_id: string
        }
        Update: {
          answers?: Json
          created_at?: string
          id?: string
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_responses_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          created_at: string
          id: string
          option_id: string
          poll_id: string
          user_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          id?: string
          option_id: string
          poll_id: string
          user_id: string
          weight?: number
        }
        Update: {
          created_at?: string
          id?: string
          option_id?: string
          poll_id?: string
          user_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          closes_at: string | null
          created_at: string
          created_by: string | null
          description_ca: string | null
          description_en: string | null
          description_es: string | null
          id: string
          karma_category_id: string | null
          kind: Database["public"]["Enums"]["poll_kind"]
          max_choices: number
          opens_at: string
          questions: Json
          show_results: boolean
          status: Database["public"]["Enums"]["poll_status"]
          title_ca: string | null
          title_en: string | null
          title_es: string
          updated_at: string
        }
        Insert: {
          closes_at?: string | null
          created_at?: string
          created_by?: string | null
          description_ca?: string | null
          description_en?: string | null
          description_es?: string | null
          id?: string
          karma_category_id?: string | null
          kind?: Database["public"]["Enums"]["poll_kind"]
          max_choices?: number
          opens_at?: string
          questions?: Json
          show_results?: boolean
          status?: Database["public"]["Enums"]["poll_status"]
          title_ca?: string | null
          title_en?: string | null
          title_es: string
          updated_at?: string
        }
        Update: {
          closes_at?: string | null
          created_at?: string
          created_by?: string | null
          description_ca?: string | null
          description_en?: string | null
          description_es?: string | null
          id?: string
          karma_category_id?: string | null
          kind?: Database["public"]["Enums"]["poll_kind"]
          max_choices?: number
          opens_at?: string
          questions?: Json
          show_results?: boolean
          status?: Database["public"]["Enums"]["poll_status"]
          title_ca?: string | null
          title_en?: string | null
          title_es?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "polls_karma_category_id_fkey"
            columns: ["karma_category_id"]
            isOneToOne: false
            referencedRelation: "karma_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          date_of_birth: string
          dues_paid: boolean
          dues_paid_at: string | null
          dues_paid_by: string | null
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"]
          id: string
          id_document_encrypted: string
          id_document_nonce: string
          karma_ranking_opt_in: boolean
          ludoya_avatar_url: string | null
          ludoya_display_name: string | null
          ludoya_linked_at: string | null
          ludoya_user_id: string | null
          ludoya_username: string | null
          member_number: number
          preferred_locale: string
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth: string
          dues_paid?: boolean
          dues_paid_at?: string | null
          dues_paid_by?: string | null
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"]
          id: string
          id_document_encrypted: string
          id_document_nonce: string
          karma_ranking_opt_in?: boolean
          ludoya_avatar_url?: string | null
          ludoya_display_name?: string | null
          ludoya_linked_at?: string | null
          ludoya_user_id?: string | null
          ludoya_username?: string | null
          member_number?: number
          preferred_locale?: string
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string
          dues_paid?: boolean
          dues_paid_at?: string | null
          dues_paid_by?: string | null
          full_name?: string
          gender?: Database["public"]["Enums"]["gender_type"]
          id?: string
          id_document_encrypted?: string
          id_document_nonce?: string
          karma_ranking_opt_in?: boolean
          ludoya_avatar_url?: string | null
          ludoya_display_name?: string | null
          ludoya_linked_at?: string | null
          ludoya_user_id?: string | null
          ludoya_username?: string | null
          member_number?: number
          preferred_locale?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      registration_files: {
        Row: {
          created_at: string
          file_name: string
          id: string
          mime_type: string | null
          question_id: string | null
          response_id: string
          size_bytes: number | null
          storage_path: string
        }
        Insert: {
          created_at?: string
          file_name: string
          id?: string
          mime_type?: string | null
          question_id?: string | null
          response_id: string
          size_bytes?: number | null
          storage_path: string
        }
        Update: {
          created_at?: string
          file_name?: string
          id?: string
          mime_type?: string | null
          question_id?: string | null
          response_id?: string
          size_bytes?: number | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "registration_files_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "registration_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registration_files_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "registration_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_forms: {
        Row: {
          closes_at: string | null
          confirmation_message: string | null
          cover_image_url: string | null
          cover_position: string
          created_at: string
          description: string | null
          external_iframe_height: number
          external_mode: string | null
          external_url: string | null
          id: string
          is_published: boolean
          kind: string
          max_responses: number | null
          notify_emails: string[]
          payment_amount_cents: number | null
          payment_currency: string
          payment_instructions: string | null
          payment_required: boolean
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          closes_at?: string | null
          confirmation_message?: string | null
          cover_image_url?: string | null
          cover_position?: string
          created_at?: string
          description?: string | null
          external_iframe_height?: number
          external_mode?: string | null
          external_url?: string | null
          id?: string
          is_published?: boolean
          kind?: string
          max_responses?: number | null
          notify_emails?: string[]
          payment_amount_cents?: number | null
          payment_currency?: string
          payment_instructions?: string | null
          payment_required?: boolean
          slug: string
          title?: string
          updated_at?: string
        }
        Update: {
          closes_at?: string | null
          confirmation_message?: string | null
          cover_image_url?: string | null
          cover_position?: string
          created_at?: string
          description?: string | null
          external_iframe_height?: number
          external_mode?: string | null
          external_url?: string | null
          id?: string
          is_published?: boolean
          kind?: string
          max_responses?: number | null
          notify_emails?: string[]
          payment_amount_cents?: number | null
          payment_currency?: string
          payment_instructions?: string | null
          payment_required?: boolean
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      registration_questions: {
        Row: {
          created_at: string
          form_id: string
          help: string | null
          id: string
          label: string
          options: Json
          position: number
          required: boolean
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          form_id: string
          help?: string | null
          id?: string
          label?: string
          options?: Json
          position?: number
          required?: boolean
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          form_id?: string
          help?: string | null
          id?: string
          label?: string
          options?: Json
          position?: number
          required?: boolean
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "registration_questions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "registration_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_responses: {
        Row: {
          created_at: string
          data: Json
          email_contact: string | null
          form_id: string
          id: string
          internal_notes: string | null
          ip_address: string | null
          payment_status: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          data?: Json
          email_contact?: string | null
          form_id: string
          id?: string
          internal_notes?: string | null
          ip_address?: string | null
          payment_status?: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          data?: Json
          email_contact?: string | null
          form_id?: string
          id?: string
          internal_notes?: string | null
          ip_address?: string | null
          payment_status?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registration_responses_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "registration_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_reminders_sent: {
        Row: {
          rental_id: string
          sent_at: string
        }
        Insert: {
          rental_id: string
          sent_at?: string
        }
        Update: {
          rental_id?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_reminders_sent_rental_id_fkey"
            columns: ["rental_id"]
            isOneToOne: true
            referencedRelation: "rentals"
            referencedColumns: ["id"]
          },
        ]
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
          pickup_date: string | null
          requested_days: number
          return_date: string | null
          status: Database["public"]["Enums"]["rental_request_status"]
          updated_at: string
          user_id: string
          waitlist_position: number | null
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          game_id: string
          id?: string
          message?: string | null
          pickup_date?: string | null
          requested_days?: number
          return_date?: string | null
          status?: Database["public"]["Enums"]["rental_request_status"]
          updated_at?: string
          user_id: string
          waitlist_position?: number | null
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          game_id?: string
          id?: string
          message?: string | null
          pickup_date?: string | null
          requested_days?: number
          return_date?: string | null
          status?: Database["public"]["Enums"]["rental_request_status"]
          updated_at?: string
          user_id?: string
          waitlist_position?: number | null
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
      rental_settings: {
        Row: {
          block_if_overdue: boolean
          cooldown_weeks: number
          game_night_weekday: number
          id: boolean
          monthly_quota: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          block_if_overdue?: boolean
          cooldown_weeks?: number
          game_night_weekday?: number
          id?: boolean
          monthly_quota?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          block_if_overdue?: boolean
          cooldown_weeks?: number
          game_night_weekday?: number
          id?: boolean
          monthly_quota?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
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
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          active: boolean
          bio_ca: string
          bio_en: string
          bio_es: string
          color_ca: string
          color_en: string
          color_es: string
          created_at: string
          emoji: string
          favorite_game: string
          id: string
          lucky_number: string
          name: string
          photo_url: string | null
          role_ca: string
          role_en: string
          role_es: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          bio_ca?: string
          bio_en?: string
          bio_es?: string
          color_ca?: string
          color_en?: string
          color_es?: string
          created_at?: string
          emoji?: string
          favorite_game?: string
          id?: string
          lucky_number?: string
          name: string
          photo_url?: string | null
          role_ca?: string
          role_en?: string
          role_es?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          bio_ca?: string
          bio_en?: string
          bio_es?: string
          color_ca?: string
          color_en?: string
          color_es?: string
          created_at?: string
          emoji?: string
          favorite_game?: string
          id?: string
          lucky_number?: string
          name?: string
          photo_url?: string | null
          role_ca?: string
          role_en?: string
          role_es?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          awarded_by: string | null
          badge_id: string
          created_at: string
          id: string
          note: string | null
          progress: number
          seen_at: string | null
          tier: string | null
          unlocked_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          awarded_by?: string | null
          badge_id: string
          created_at?: string
          id?: string
          note?: string | null
          progress?: number
          seen_at?: string | null
          tier?: string | null
          unlocked_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          awarded_by?: string | null
          badge_id?: string
          created_at?: string
          id?: string
          note?: string | null
          progress?: number
          seen_at?: string | null
          tier?: string | null
          unlocked_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
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
      volunteer_applications: {
        Row: {
          admin_notes: string | null
          answers: Json
          created_at: string
          decided_at: string | null
          email: string
          full_name: string
          id: string
          phone: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          answers?: Json
          created_at?: string
          decided_at?: string | null
          email: string
          full_name: string
          id?: string
          phone?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          answers?: Json
          created_at?: string
          decided_at?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      encrypt_id_document: {
        Args: { _plain: string }
        Returns: {
          ciphertext: string
          nonce: string
        }[]
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
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
      karma_active_season: { Args: never; Returns: string }
      karma_balance: { Args: { _user_id: string }; Returns: number }
      karma_category_usage: {
        Args: { _category_id: string; _user_id: string }
        Returns: number
      }
      karma_lifetime: { Args: { _user_id: string }; Returns: number }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      purge_cron_history: { Args: never; Returns: undefined }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      send_rental_due_reminders: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "super_admin" | "user"
      badge_kind: "tiered" | "unique"
      badge_source: "ludoya" | "karma" | "manual"
      drawer_letter: "a" | "b" | "c" | "d"
      gender_type:
        | "female"
        | "male"
        | "non_binary"
        | "other"
        | "prefer_not_to_say"
      karma_category_group:
        | "ludoteca"
        | "difusion"
        | "referidos"
        | "participacion"
        | "organizacion"
        | "otras"
      karma_entry_status: "pending" | "approved" | "rejected" | "voided"
      karma_limit_period: "none" | "weekly" | "monthly"
      karma_redemption_status:
        | "requested"
        | "approved"
        | "delivered"
        | "rejected"
      karma_reward_effect:
        | "manual"
        | "fee_discount"
        | "raffle_ticket"
        | "extra_rental"
        | "extend_rental"
        | "tournament_discount"
        | "priority_access"
        | "double_vote"
      poll_kind: "survey" | "acquisition"
      poll_status: "draft" | "published" | "closed"
      rental_request_status:
        | "pending"
        | "approved"
        | "rejected"
        | "cancelled"
        | "waitlisted"
      rental_status: "active" | "returned" | "overdue" | "lost"
      shelf_color: "green" | "pink" | "red" | "yellow" | "blue"
      shelf_location:
        | "1"
        | "2"
        | "3"
        | "4"
        | "on_demand"
        | "drawer"
        | "A"
        | "B"
        | "C"
        | "D"
      shelf_shape: "triangle" | "heart" | "square" | "circle" | "star"
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
      badge_kind: ["tiered", "unique"],
      badge_source: ["ludoya", "karma", "manual"],
      drawer_letter: ["a", "b", "c", "d"],
      gender_type: [
        "female",
        "male",
        "non_binary",
        "other",
        "prefer_not_to_say",
      ],
      karma_category_group: [
        "ludoteca",
        "difusion",
        "referidos",
        "participacion",
        "organizacion",
        "otras",
      ],
      karma_entry_status: ["pending", "approved", "rejected", "voided"],
      karma_limit_period: ["none", "weekly", "monthly"],
      karma_redemption_status: [
        "requested",
        "approved",
        "delivered",
        "rejected",
      ],
      karma_reward_effect: [
        "manual",
        "fee_discount",
        "raffle_ticket",
        "extra_rental",
        "extend_rental",
        "tournament_discount",
        "priority_access",
        "double_vote",
      ],
      poll_kind: ["survey", "acquisition"],
      poll_status: ["draft", "published", "closed"],
      rental_request_status: [
        "pending",
        "approved",
        "rejected",
        "cancelled",
        "waitlisted",
      ],
      rental_status: ["active", "returned", "overdue", "lost"],
      shelf_color: ["green", "pink", "red", "yellow", "blue"],
      shelf_location: [
        "1",
        "2",
        "3",
        "4",
        "on_demand",
        "drawer",
        "A",
        "B",
        "C",
        "D",
      ],
      shelf_shape: ["triangle", "heart", "square", "circle", "star"],
    },
  },
} as const
