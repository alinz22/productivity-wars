export type Difficulty = 'easy' | 'medium' | 'hard'
export type Category = 'combat' | 'arcane' | 'stealth' | 'support' | 'daily'
export type PlayerClass = 'warrior' | 'mage' | 'rogue' | 'cleric'

export const XP_VALUES: Record<Difficulty, number> = {
  easy: 10,
  medium: 25,
  hard: 50,
}

export interface UserProfile {
  id: string
  username: string
  class: PlayerClass
  total_xp: number
  all_time_streak: number
  created_at: string
}

export interface Player {
  id: string
  session_id: string
  name: string
  xp: number
  streak: number
  last_task_date: string | null
  user_id: string | null
  class: PlayerClass
  level: number
  in_focus?: boolean
}

export interface Task {
  id: string
  player_id: string
  session_id: string
  title: string
  difficulty: Difficulty
  category: Category
  completed: boolean
  created_at: string
  pomodoro_count: number
}

export interface Taunt {
  id: string
  session_id: string
  from_name: string
  message: string
  created_at: string
}

export interface Session {
  id: string
  created_at: string
  invite_code: string
  expires_at: string | null
}

export interface Achievement {
  id: string
  user_id: string
  achievement_key: string
  unlocked_at: string
}

export interface Friendship {
  id: string
  requester_id: string
  addressee_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
}

export interface Pomodoro {
  id: string
  task_id: string
  player_id: string
  started_at: string
  completed_at: string | null
  is_active: boolean
}
