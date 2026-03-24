import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export async function POST() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found — complete onboarding first' }, { status: 404 })
  }

  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .insert({ invite_code: generateInviteCode() })
    .select()
    .single()

  if (sessionError) return NextResponse.json({ error: sessionError.message }, { status: 500 })

  const { data: player, error: playerError } = await supabase
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

  if (playerError) return NextResponse.json({ error: playerError.message }, { status: 500 })

  return NextResponse.json({ session, player })
}
