export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          bio: string | null
          email: string | null
          phone: string | null
          street_1: string | null
          street_2: string | null
          city: string | null
          state_region: string | null
          postal_code: string | null
          country: string | null
          available: boolean
          available_from: string | null
          available_to: string | null
          currency: string
          privacy_settings: Json
          coaching_rate_id: string | null
          default_rate_id: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          bio?: string | null
          email?: string | null
          phone?: string | null
          street_1?: string | null
          street_2?: string | null
          city?: string | null
          state_region?: string | null
          postal_code?: string | null
          country?: string | null
          available?: boolean
          available_from?: string | null
          available_to?: string | null
          currency?: string
          privacy_settings?: Json
          coaching_rate_id?: string | null
          default_rate_id?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          bio?: string | null
          email?: string | null
          phone?: string | null
          street_1?: string | null
          street_2?: string | null
          city?: string | null
          state_region?: string | null
          postal_code?: string | null
          country?: string | null
          available?: boolean
          available_from?: string | null
          available_to?: string | null
          currency?: string
          privacy_settings?: Json
          coaching_rate_id?: string | null
          default_rate_id?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      // Add other table types as needed
      [key: string]: {
        Row: Record<string, unknown>
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
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
  }
}


