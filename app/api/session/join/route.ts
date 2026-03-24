import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { invite_code } = await req.json()
  if (!invite_code) return NextResponse.json({ error: 'invite_code required' }, { status: 400 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const { data: session } = await supabase
    .from('sessions')
    .select('*')
    .eq('invite_code', String(invite_code).trim().toUpperCase())
    .single()

  if (!session) return NextResponse.json({ error: 'Invalid invite code — session not found' }, { status: 404 })

  // Already in this session?
  const { data: existing } = await supabase
    .from('players')
    .select('id')
    .eq('session_id', session.id)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    return NextResponse.json({ session_id: session.id, player_id: existing.id })
  }

  const { data: player, error } = await supabase
    .from('players')
    .insert({
      session_id: session.id,
      name: profile.username,
      xp: 0,
      streak: 0,
      last_task_date: null,
      user_id: user.id,
      class: profile.class,
      level: 1,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ session_id: session.id, player_id: player.id })
}
