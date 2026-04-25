import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(url, key)

export interface ContactMessage {
  id?: number
  nume: string
  telefon: string
  email?: string
  mesaj?: string
  created_at?: string
}
