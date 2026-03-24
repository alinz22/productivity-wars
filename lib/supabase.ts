import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    _client = createClient(url, key)
  }
  return _client
}

export type Difficulty = 'easy' | 'medium' | 'hard'

export const XP_VALUES: Record<Difficulty, number> = {
  easy: 1,
  medium: 3,
  hard: 5,
}

export interface Player {
  id: string
  session_id: string
  name: string
  xp: number
  streak: number
  last_task_date: string | null
}

export interface Task {
  id: string
  player_id: string
  session_id: string
  title: string
  difficulty: Difficulty
  completed: boolean
  created_at: string
}

export interface Taunt {
  id: string
  session_id: string
  from_name: string
  message: string
  created_at: string
}
