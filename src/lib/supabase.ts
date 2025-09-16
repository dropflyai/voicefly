import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          avatar_url?: string
          created_at: string
          updated_at: string
        }
      }
      voice_campaigns: {
        Row: {
          id: string
          user_id: string
          name: string
          description?: string
          status: 'draft' | 'active' | 'paused' | 'completed'
          total_leads: number
          completed_calls: number
          success_rate: number
          created_at: string
          updated_at: string
        }
      }
      voice_calls: {
        Row: {
          id: string
          campaign_id: string
          lead_id: string
          status: 'pending' | 'calling' | 'completed' | 'failed'
          duration?: number
          transcript?: string
          sentiment_score?: number
          outcome: 'qualified' | 'not_qualified' | 'callback' | 'no_answer'
          research_data?: any
          recording_url?: string
          created_at: string
          updated_at: string
        }
      }
      leads: {
        Row: {
          id: string
          user_id: string
          company_name: string
          contact_name?: string
          email?: string
          phone?: string
          website?: string
          industry?: string
          company_size?: string
          qualification_score?: number
          research_data?: any
          source: 'manual' | 'leadfly' | 'csv_upload' | 'crm_sync'
          created_at: string
          updated_at: string
        }
      }
    }
  }
}