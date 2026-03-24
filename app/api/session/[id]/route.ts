import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = getSupabase()
  const { id } = await params

  const [playersRes, tasksRes, tauntsRes] = await Promise.all([
    supabase.from('players').select('*').eq('session_id', id).order('xp', { ascending: false }),
    supabase.from('tasks').select('*').eq('session_id', id).order('created_at', { ascending: true }),
    supabase.from('taunts').select('*').eq('session_id', id).order('created_at', { ascending: false }).limit(10),
  ])

  if (playersRes.error) return NextResponse.json({ error: playersRes.error.message }, { status: 500 })

  return NextResponse.json({
    players: playersRes.data,
    tasks: tasksRes.data ?? [],
    taunts: tauntsRes.data ?? [],
  })
}
