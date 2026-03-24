import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import type { PlayerClass } from '@/lib/supabase'

const VALID_CLASSES: PlayerClass[] = ['warrior', 'mage', 'rogue', 'cleric']

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { username, class: playerClass } = await req.json()

  if (!username || !playerClass) {
    return NextResponse.json({ error: 'username and class required' }, { status: 400 })
  }

  if (!VALID_CLASSES.includes(playerClass)) {
    return NextResponse.json({ error: 'Invalid class' }, { status: 400 })
  }

  const clean = String(username).trim().toUpperCase().replace(/[^A-Z0-9_]/g, '')
  if (clean.length < 3 || clean.length > 16) {
    return NextResponse.json({ error: 'Username must be 3-16 alphanumeric chars' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .insert({ id: user.id, username: clean, class: playerClass })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  return NextResponse.json(data)
}
