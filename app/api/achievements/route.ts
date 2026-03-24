import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-server'
import { getRank } from '@/lib/classes'

/** Called internally after task completion to check and award achievements */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { player_id, session_id } = await req.json()
  if (!player_id || !session_id) return NextResponse.json({ error: 'player_id and session_id required' }, { status: 400 })

  const admin = createAdminClient()

  // Load context
  const [playerRes, tasksRes, tauntsRes, pomodosRes, existingAchRes] = await Promise.all([
    supabase.from('players').select('*').eq('id', player_id).single(),
    supabase.from('tasks').select('*').eq('player_id', player_id).eq('completed', true),
    supabase.from('taunts').select('id').eq('session_id', session_id).eq('from_name', ''),  // approximate - count by user
    supabase.from('pomodoros').select('id').eq('player_id', player_id).not('completed_at', 'is', null),
    admin.from('achievements').select('achievement_key').eq('user_id', user.id),
  ])

  const player = playerRes.data
  if (!player || !player.user_id) return NextResponse.json({ unlocked: [] })

  const completedTasks = tasksRes.data ?? []
  const pomodoroCount = pomodosRes.data?.length ?? 0
  const existingKeys = new Set((existingAchRes.data ?? []).map((a: { achievement_key: string }) => a.achievement_key))

  const toUnlock: string[] = []
  const check = (key: string, condition: boolean) => {
    if (condition && !existingKeys.has(key)) toUnlock.push(key)
  }

  const hardCount = completedTasks.filter(t => t.difficulty === 'hard').length
  const rank = getRank(player.xp)
  const classAffinityCount = completedTasks.filter(t => {
    const affinityMap: Record<string, string> = {
      warrior: 'combat', mage: 'arcane', rogue: 'stealth', cleric: 'support',
    }
    return t.category === affinityMap[player.class ?? 'warrior']
  }).length

  check('first_blood', completedTasks.length >= 1)
  check('grind_mode', completedTasks.length >= 10)
  check('streak_3', (player.streak ?? 0) >= 3)
  check('streak_7', (player.streak ?? 0) >= 7)
  check('hard_labor', hardCount >= 5)
  check('focus_master', pomodoroCount >= 5)
  check('legend_rank', ['LEGEND', 'MYTHIC'].includes(rank.label))
  check('class_master', classAffinityCount >= 20)

  if (toUnlock.length === 0) return NextResponse.json({ unlocked: [] })

  const rows = toUnlock.map(key => ({ user_id: player.user_id, achievement_key: key }))
  await admin.from('achievements').insert(rows).select()

  return NextResponse.json({ unlocked: toUnlock })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('achievements')
    .select('*')
    .eq('user_id', user.id)
    .order('unlocked_at', { ascending: false })

  return NextResponse.json(data ?? [])
}
