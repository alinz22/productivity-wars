import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = new Date()
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 86400000).toISOString().split('T')[0]

  // User profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('total_xp, all_time_streak, class, username')
    .eq('id', user.id)
    .single()

  // Player IDs for this user
  const { data: players } = await supabase
    .from('players')
    .select('id')
    .eq('user_id', user.id)

  const playerIds = (players ?? []).map((p: { id: string }) => p.id)

  // Tasks created per day (last 30 days)
  let tasksByDay: Record<string, { created: number; completed: number }> = {}
  if (playerIds.length > 0) {
    const { data: tasks } = await supabase
      .from('tasks')
      .select('created_at, completed')
      .in('player_id', playerIds)
      .gte('created_at', thirtyDaysAgo)

    for (const t of tasks ?? []) {
      const day = t.created_at.split('T')[0]
      if (!tasksByDay[day]) tasksByDay[day] = { created: 0, completed: 0 }
      tasksByDay[day].created++
      if (t.completed) tasksByDay[day].completed++
    }
  }

  // Total tasks completed
  let totalCompleted = 0
  if (playerIds.length > 0) {
    const { count } = await supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .in('player_id', playerIds)
      .eq('completed', true)
    totalCompleted = count ?? 0
  }

  // Pomodoro count (last 30 days + total)
  let pomodoroCount = 0
  let pomodoroWeek = 0
  if (playerIds.length > 0) {
    const sevenDaysAgo = new Date(today.getTime() - 7 * 86400000).toISOString()
    const { count: total } = await supabase
      .from('pomodoros')
      .select('id', { count: 'exact', head: true })
      .in('player_id', playerIds)
      .not('completed_at', 'is', null)
    const { count: week } = await supabase
      .from('pomodoros')
      .select('id', { count: 'exact', head: true })
      .in('player_id', playerIds)
      .not('completed_at', 'is', null)
      .gte('completed_at', sevenDaysAgo)
    pomodoroCount = total ?? 0
    pomodoroWeek = week ?? 0
  }

  // Habit completions (last 28 days for 4-week heatmap)
  const twentyEightDaysAgo = new Date(today.getTime() - 28 * 86400000).toISOString().split('T')[0]
  const { data: habitCompletions } = await supabase
    .from('habit_completions')
    .select('completed_date, habit_id')
    .eq('user_id', user.id)
    .gte('completed_date', twentyEightDaysAgo)

  // Map: date -> count of habits completed
  const habitsByDay: Record<string, number> = {}
  for (const hc of habitCompletions ?? []) {
    habitsByDay[hc.completed_date] = (habitsByDay[hc.completed_date] ?? 0) + 1
  }

  // Habits total count (for max normalization)
  const { count: totalHabits } = await supabase
    .from('habits')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  return NextResponse.json({
    profile,
    tasksByDay,
    totalCompleted,
    pomodoroCount,
    pomodoroWeek,
    habitsByDay,
    totalHabits: totalHabits ?? 1,
  })
}
