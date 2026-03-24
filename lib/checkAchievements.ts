import { createAdminClient } from '@/lib/supabase-server'
import { getRank } from '@/lib/classes'
import type { SupabaseClient } from '@supabase/supabase-js'

const AFFINITY: Record<string, string> = {
  warrior: 'combat',
  mage: 'arcane',
  rogue: 'stealth',
  cleric: 'support',
}

/** Non-throwing — safe to await and ignore result */
export async function checkAchievements(
  supabase: SupabaseClient,
  playerId: string,
  sessionId: string
) {
  try {
    const { data: player } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .single()

    if (!player?.user_id) return

    const admin = createAdminClient()

    const [tasksRes, pomosRes, existingRes] = await Promise.all([
      supabase.from('tasks').select('difficulty, category').eq('player_id', playerId).eq('completed', true),
      supabase.from('pomodoros').select('id').eq('player_id', playerId).not('completed_at', 'is', null),
      admin.from('achievements').select('achievement_key').eq('user_id', player.user_id),
    ])

    const completedTasks = tasksRes.data ?? []
    const pomodoroCount = pomosRes.data?.length ?? 0
    const existingKeys = new Set((existingRes.data ?? []).map((a: { achievement_key: string }) => a.achievement_key))

    const rank = getRank(player.xp)
    const hardCount = completedTasks.filter(t => t.difficulty === 'hard').length
    const affinity = AFFINITY[player.class ?? 'warrior'] ?? 'daily'
    const classAffinityCount = completedTasks.filter(t => t.category === affinity).length

    const toUnlock: string[] = []
    const check = (key: string, cond: boolean) => {
      if (cond && !existingKeys.has(key)) toUnlock.push(key)
    }

    check('first_blood', completedTasks.length >= 1)
    check('grind_mode', completedTasks.length >= 10)
    check('streak_3', (player.streak ?? 0) >= 3)
    check('streak_7', (player.streak ?? 0) >= 7)
    check('hard_labor', hardCount >= 5)
    check('focus_master', pomodoroCount >= 5)
    check('legend_rank', ['LEGEND', 'MYTHIC'].includes(rank.label))
    check('class_master', classAffinityCount >= 20)

    if (toUnlock.length > 0) {
      const rows = toUnlock.map(key => ({ user_id: player.user_id as string, achievement_key: key }))
      await admin.from('achievements').insert(rows)
    }
  } catch {
    // Non-critical — don't break task completion
  }
}
