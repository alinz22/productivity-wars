import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  const { player_id, session_id, title, difficulty } = await req.json()

  if (!player_id || !session_id || !title || !difficulty) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert({ player_id, session_id, title, difficulty, completed: false })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
