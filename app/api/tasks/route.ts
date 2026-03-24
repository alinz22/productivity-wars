import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import type { Difficulty, Category } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { player_id, session_id, title, difficulty, category, goal_id, description, due_date, priority, subtasks } = await req.json()

  if (!player_id || !session_id || !title || !difficulty) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      player_id,
      session_id,
      title,
      difficulty: difficulty as Difficulty,
      category: (category ?? 'daily') as Category,
      completed: false,
      pomodoro_count: 0,
      goal_id: goal_id ?? null,
      description: description ?? null,
      due_date: due_date ?? null,
      priority: priority ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Create subtasks if provided
  if (subtasks && Array.isArray(subtasks) && subtasks.length > 0 && data) {
    const subtaskRows = (subtasks as string[])
      .filter(t => t.trim())
      .map((t, i) => ({ task_id: data.id, title: t.trim(), completed: false, position: i }))
    if (subtaskRows.length > 0) {
      await supabase.from('task_subtasks').insert(subtaskRows)
    }
  }

  return NextResponse.json(data)
}
