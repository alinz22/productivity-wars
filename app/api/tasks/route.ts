import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import type { Difficulty, Category } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { player_id, session_id, title, difficulty, category } = await req.json()

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
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
