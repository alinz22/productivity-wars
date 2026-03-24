import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getXpForTask } from '@/lib/classes'
import { checkAchievements } from '@/lib/checkAchievements'
import type { Difficulty, Category, PlayerClass } from '@/lib/supabase'

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single()

  if (taskError || !task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  if (task.completed) return NextResponse.json({ error: 'Already completed' }, { status: 400 })

  await supabase.from('tasks').update({ completed: true }).eq('id', id)

  const { data: player, error: playerError } = await supabase
    .from('players')
    .select('*')
    .eq('id', task.player_id)
    .single()

  if (playerError || !player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })

  const xpGain = getXpForTask(
    task.difficulty as Difficulty,
    (task.category ?? 'daily') as Category,
    (player.class ?? 'warrior') as PlayerClass
  )

  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  let newStreak = player.streak
  if (player.last_task_date === yesterday) {
    newStreak = player.streak + 1
  } else if (player.last_task_date !== today) {
    newStreak = 1
  }

  const newXp = player.xp + xpGain

  const { data: updatedPlayer, error: updateError } = await supabase
    .from('players')
    .update({ xp: newXp, streak: newStreak, last_task_date: today })
    .eq('id', task.player_id)
    .select()
    .single()

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  // Update user_profiles total_xp if player is linked to an auth user
  if (player.user_id) {
    await supabase
      .from('user_profiles')
      .update({ total_xp: newXp, all_time_streak: newStreak })
      .eq('id', player.user_id)
  }

  // Non-blocking achievement check
  checkAchievements(supabase, task.player_id, task.session_id)

  return NextResponse.json({ task: { ...task, completed: true }, player: updatedPlayer, xpGain })
}
