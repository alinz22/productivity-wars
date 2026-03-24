import { NextRequest, NextResponse } from 'next/server'
import { getSupabase, XP_VALUES, Difficulty } from '@/lib/supabase'

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = getSupabase()
  const { id } = await params

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

  const xpGain = XP_VALUES[task.difficulty as Difficulty] ?? 1
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  let newStreak = player.streak
  if (player.last_task_date === yesterday) {
    newStreak = player.streak + 1
  } else if (player.last_task_date !== today) {
    newStreak = 1
  }

  const { data: updatedPlayer, error: updateError } = await supabase
    .from('players')
    .update({ xp: player.xp + xpGain, streak: newStreak, last_task_date: today })
    .eq('id', task.player_id)
    .select()
    .single()

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json({ task: { ...task, completed: true }, player: updatedPlayer, xpGain })
}
