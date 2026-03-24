import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: habitId } = await params
  const today = new Date().toISOString().split('T')[0]

  // Check if already completed today
  const { data: existing } = await supabase
    .from('habit_completions')
    .select('id')
    .eq('habit_id', habitId)
    .eq('user_id', user.id)
    .eq('completed_date', today)
    .maybeSingle()

  if (existing) {
    // Unmark — delete today's completion
    await supabase.from('habit_completions').delete().eq('id', existing.id)
  } else {
    // Mark done — insert today's completion
    await supabase.from('habit_completions').insert({
      habit_id: habitId,
      user_id: user.id,
      completed_date: today,
    })
  }

  // Recalculate streak: count consecutive completed days ending today
  const { data: recent } = await supabase
    .from('habit_completions')
    .select('completed_date')
    .eq('habit_id', habitId)
    .eq('user_id', user.id)
    .order('completed_date', { ascending: false })
    .limit(365)

  const completedDates = new Set((recent ?? []).map(r => r.completed_date))

  let streak = 0
  const check = new Date()
  // If today isn't done (just unmarked), start counting from yesterday
  if (!completedDates.has(today)) check.setDate(check.getDate() - 1)

  while (true) {
    const dateStr = check.toISOString().split('T')[0]
    if (!completedDates.has(dateStr)) break
    streak++
    check.setDate(check.getDate() - 1)
  }

  // Update habit streak
  const { data: habit } = await supabase
    .from('habits')
    .select('longest_streak')
    .eq('id', habitId)
    .single()

  await supabase
    .from('habits')
    .update({
      current_streak: streak,
      longest_streak: Math.max(streak, habit?.longest_streak ?? 0),
    })
    .eq('id', habitId)

  return NextResponse.json({ done: !existing, streak })
}
