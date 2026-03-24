import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = new Date().toISOString().split('T')[0]

  const { data: habits, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: completions } = await supabase
    .from('habit_completions')
    .select('habit_id, completed_date')
    .eq('user_id', user.id)
    .gte('completed_date', new Date(Date.now() - 8 * 86400000).toISOString().split('T')[0])

  const completedToday = new Set(
    (completions ?? []).filter(c => c.completed_date === today).map(c => c.habit_id)
  )

  return NextResponse.json({ habits: habits ?? [], completedToday: [...completedToday] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, icon, target_days } = await req.json()
  if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })

  const { data, error } = await supabase
    .from('habits')
    .insert({
      user_id: user.id,
      title: title.trim(),
      icon: icon ?? '⚡',
      target_days: target_days ?? ['mon', 'tue', 'wed', 'thu', 'fri'],
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
