import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, username, class, total_xp, all_time_streak, created_at')
    .order('total_xp', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data ?? [])
}
