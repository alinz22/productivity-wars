import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  const { playerNames } = await req.json()

  if (!playerNames || !Array.isArray(playerNames) || playerNames.length === 0) {
    return NextResponse.json({ error: 'playerNames required' }, { status: 400 })
  }

  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .insert({})
    .select()
    .single()

  if (sessionError) return NextResponse.json({ error: sessionError.message }, { status: 500 })

  const players = playerNames.map((name: string) => ({
    session_id: session.id,
    name: name.trim(),
    xp: 0,
    streak: 0,
    last_task_date: null,
  }))

  const { data: createdPlayers, error: playersError } = await supabase
    .from('players')
    .insert(players)
    .select()

  if (playersError) return NextResponse.json({ error: playersError.message }, { status: 500 })

  return NextResponse.json({ session, players: createdPlayers })
}
