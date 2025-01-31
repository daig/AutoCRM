export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      agent_skills: {
        Row: {
          agent: string
          created_at: string | null
          proficiency: string
        }
        Insert: {
          agent: string
          created_at?: string | null
          proficiency: string
        }
        Update: {
          agent?: string
          created_at?: string | null
          proficiency?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_skills_agent_fkey"
            columns: ["agent"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_skills_proficiency_fkey"
            columns: ["proficiency"]
            isOneToOne: false
            referencedRelation: "proficiencies"
            referencedColumns: ["id"]
          },
        ]
      }
      proficiencies: {
        Row: {
          description: string | null
          id: string
          name: string
          skill: string
        }
        Insert: {
          description?: string | null
          id?: string
          name: string
          skill: string
        }
        Update: {
          description?: string | null
          id?: string
          name?: string
          skill?: string
        }
        Relationships: [
          {
            foreignKeyName: "proficiencies_skill_fkey"
            columns: ["skill"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          description: string | null
          id: string
          name: string
        }
        Insert: {
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      tag_types: {
        Row: {
          description: string | null
          id: string
          name: string
        }
        Insert: {
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          description: string | null
          id: string
          name: string
          type_id: string
        }
        Insert: {
          description?: string | null
          id?: string
          name: string
          type_id: string
        }
        Update: {
          description?: string | null
          id?: string
          name?: string
          type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "tag_types"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          sender: string | null
          ticket: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          sender?: string | null
          ticket: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          sender?: string | null
          ticket?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_sender_fkey"
            columns: ["sender"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_messages_ticket_fkey"
            columns: ["ticket"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_metadata: {
        Row: {
          created_at: string | null
          field_type: string
          field_value_bool: boolean | null
          field_value_date: string | null
          field_value_float: number | null
          field_value_int: number | null
          field_value_text: string | null
          field_value_ticket: string | null
          field_value_timestamp: string | null
          field_value_user: string | null
          id: string
          ticket: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          field_type: string
          field_value_bool?: boolean | null
          field_value_date?: string | null
          field_value_float?: number | null
          field_value_int?: number | null
          field_value_text?: string | null
          field_value_ticket?: string | null
          field_value_timestamp?: string | null
          field_value_user?: string | null
          id?: string
          ticket: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          field_type?: string
          field_value_bool?: boolean | null
          field_value_date?: string | null
          field_value_float?: number | null
          field_value_int?: number | null
          field_value_text?: string | null
          field_value_ticket?: string | null
          field_value_timestamp?: string | null
          field_value_user?: string | null
          id?: string
          ticket?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_metadata_field_type_fkey"
            columns: ["field_type"]
            isOneToOne: false
            referencedRelation: "ticket_metadata_field_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_metadata_field_value_ticket_fkey"
            columns: ["field_value_ticket"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_metadata_field_value_user_fkey"
            columns: ["field_value_user"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_metadata_ticket_fkey"
            columns: ["ticket"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_metadata_field_types: {
        Row: {
          description: string | null
          id: string
          name: string
          value_type: Database["public"]["Enums"]["metadata_value_type"]
        }
        Insert: {
          description?: string | null
          id?: string
          name: string
          value_type: Database["public"]["Enums"]["metadata_value_type"]
        }
        Update: {
          description?: string | null
          id?: string
          name?: string
          value_type?: Database["public"]["Enums"]["metadata_value_type"]
        }
        Relationships: []
      }
      ticket_tags: {
        Row: {
          created_at: string | null
          tag: string
          ticket: string
        }
        Insert: {
          created_at?: string | null
          tag: string
          ticket: string
        }
        Update: {
          created_at?: string | null
          tag?: string
          ticket?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_tags_tag_fkey"
            columns: ["tag"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_tags_ticket_fkey"
            columns: ["ticket"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          created_at: string | null
          creator: string
          description: string | null
          id: string
          team: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          creator?: string
          description?: string | null
          id?: string
          team?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          creator?: string
          description?: string | null
          id?: string
          team?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_creator_fkey"
            columns: ["creator"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_team_fkey"
            columns: ["team"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          is_team_lead: boolean
          role: "administrator" | "agent" | "customer"
          team_id: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          is_team_lead?: boolean
          role?: "administrator" | "agent" | "customer"
          team_id?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          is_team_lead?: boolean
          role?: "administrator" | "agent" | "customer"
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      gen_namespace_v5: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_triage_team_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      gtrgm_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_in: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_options: {
        Args: {
          "": unknown
        }
        Returns: undefined
      }
      gtrgm_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      set_limit: {
        Args: {
          "": number
        }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: {
          "": string
        }
        Returns: string[]
      }
    }
    Enums: {
      metadata_value_type:
        | "text"
        | "natural number"
        | "fractional number"
        | "boolean"
        | "date"
        | "timestamp"
        | "user"
        | "ticket"
      user_role: "administrator" | "agent" | "customer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
