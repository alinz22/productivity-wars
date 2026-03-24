import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

const POMODORO_XP_BONUS = 5

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { task_id, player_id } = await req.json()
  if (!task_id || !player_id) return NextResponse.json({ error: 'task_id and player_id required' }, { status: 400 })

  // Mark any existing active pomodoro for this player as inactive
  await supabase
    .from('pomodoros')
    .update({ is_active: false })
    .eq('player_id', player_id)
    .eq('is_active', true)

  const { data, error } = await supabase
    .from('pomodoros')
    .insert({ task_id, player_id, is_active: true })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update player's in_focus state via realtime (update a field)
  await supabase
    .from('players')
    .update({ in_focus: true } as Record<string, unknown>)
    .eq('id', player_id)

  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { pomodoro_id, player_id, task_id } = await req.json()
  if (!pomodoro_id || !player_id) return NextResponse.json({ error: 'pomodoro_id and player_id required' }, { status: 400 })

  // Complete the pomodoro
  await supabase
    .from('pomodoros')
    .update({ is_active: false, completed_at: new Date().toISOString() })
    .eq('id', pomodoro_id)

  // Update task pomodoro_count
  if (task_id) {
    const { data: task } = await supabase.from('tasks').select('pomodoro_count').eq('id', task_id).single()
    if (task) {
      await supabase.from('tasks').update({ pomodoro_count: (task.pomodoro_count ?? 0) + 1 }).eq('id', task_id)
    }
  }

  // Award bonus XP
  const { data: player } = await supabase.from('players').select('xp, user_id').eq('id', player_id).single()
  if (player) {
    const newXp = player.xp + POMODORO_XP_BONUS
    await supabase.from('players').update({ xp: newXp, in_focus: false } as Record<string, unknown>).eq('id', player_id)
    if (player.user_id) {
      await supabase.from('user_profiles').update({ total_xp: newXp }).eq('id', player.user_id)
    }
  }

  return NextResponse.json({ xpBonus: POMODORO_XP_BONUS })
}
